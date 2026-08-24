'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Update ticket stage and add daily note
export async function updateTicketStage(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login terlebih dahulu.' }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || (profile.role !== 'ENGINEERING' && profile.role !== 'ADMIN')) {
    return { error: 'Anda tidak memiliki hak akses.' }
  }

  const ticketId = formData.get('ticket_id') as string
  const stage = formData.get('stage') as string
  const note = formData.get('note') as string

  if (!ticketId || !stage) {
    return { error: 'Data tidak lengkap.' }
  }

  // Update ticket stage
  const { error } = await supabase
    .from('tickets')
    .update({ current_stage: stage })
    .eq('id', ticketId)

  if (error) {
    return { error: 'Gagal memperbarui stage.' }
  }

  // Add history note
  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: `STAGE_${stage}`,
    description: note || `Stage diperbarui ke ${stage}`
  })

  revalidatePath('/engineering/dashboard')
  revalidatePath(`/tickets/${ticketId}`)

  return { success: true }
}

// Upload attachment and record
export async function uploadTicketAttachment(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login.' }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || profile.role !== 'ENGINEERING') {
    return { error: 'Anda tidak memiliki hak akses.' }
  }

  const ticketId = formData.get('ticket_id') as string
  const attachmentType = formData.get('attachment_type') as string // BEFORE, PROGRESS, AFTER
  const file = formData.get('file') as File

  if (!ticketId || !attachmentType || !file) {
    return { error: 'Data tidak lengkap.' }
  }

  // Upload file to storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${ticketId}/${Date.now()}.${fileExt}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('ticket-attachments')
    .upload(fileName, file)

  if (uploadError) {
    return { error: 'Gagal mengupload file.' }
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('ticket-attachments')
    .getPublicUrl(fileName)

  // Save attachment record
  await supabase.from('ticket_attachments').insert({
    ticket_id: ticketId,
    uploaded_by: profile.id,
    attachment_type: attachmentType,
    file_url: urlData.publicUrl,
    file_name: file.name
  })

  revalidatePath(`/tickets/${ticketId}`)

  return { success: true, url: urlData.publicUrl }
}

// Submit completion - set to WAITING_CONFIRMATION
export async function submitCompletion(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login.' }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || profile.role !== 'ENGINEERING') {
    return { error: 'Anda tidak memiliki hak akses.' }
  }

  const ticketId = formData.get('ticket_id') as string
  const completionNote = formData.get('completion_note') as string

  if (!ticketId) {
    return { error: 'ID Tiket tidak valid.' }
  }

  // Update status to WAITING_CONFIRMATION
  const { error } = await supabase
    .from('tickets')
    .update({
      status: 'WAITING_CONFIRMATION',
      submitted_at: new Date().toISOString()
    })
    .eq('id', ticketId)

  if (error) {
    return { error: 'Gagal mengajukan completion.' }
  }

  // Record history
  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'SUBMITTED_COMPLETION',
    description: completionNote || `Pekerjaan selesai dan menunggu konfirmasi resident oleh ${profile.full_name}`
  })

  revalidatePath('/engineering/dashboard')
  revalidatePath(`/tickets/${ticketId}`)

  return { success: true }
}

// Public: Confirm ticket as COMPLETED
export async function publicConfirmCompletion(formData: FormData) {
  const supabase = await createClient()

  const ticketNumber = formData.get('ticket_number') as string
  const action = formData.get('action') as string // COMPLETED or REWORK
  const reason = formData.get('reason') as string

  if (!ticketNumber || !action) {
    return { error: 'Data tidak valid.' }
  }

  // Find ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, status')
    .eq('ticket_number', ticketNumber)
    .single()

  if (ticketError || !ticket) {
    return { error: 'Tiket tidak ditemukan.' }
  }

  if (ticket.status !== 'WAITING_CONFIRMATION') {
    return { error: 'Tiket ini tidak dalam status menunggu konfirmasi.' }
  }

  const newStatus = action === 'confirm' ? 'COMPLETED' : 'REWORK'
  const description = action === 'confirm'
    ? 'Resident mengkonfirmasi pekerjaan selesai'
    : `Resident meminta perbaikan: ${reason || 'Tidak ada keterangan'}`

  // Update status
  const { error } = await supabase
    .from('tickets')
    .update({
      status: newStatus,
      completed_at: newStatus === 'COMPLETED' ? new Date().toISOString() : null
    })
    .eq('id', ticket.id)

  if (error) {
    return { error: 'Gagal mengkonfirmasi.' }
  }

  // Record history (without user_id for public)
  await supabase.from('ticket_history').insert({
    ticket_id: ticket.id,
    action: newStatus,
    description
  })

  return { success: true, status: newStatus }
}

// Get public ticket info
export async function getPublicTicket(ticketNumber: string) {
  const supabase = await createClient()

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      id,
      ticket_number,
      problem,
      description,
      status,
      current_stage,
      created_at,
      submitted_at,
      completed_at,
      units(unit_code, floor, unit_number),
      complaint_categories(name)
    `)
    .eq('ticket_number', ticketNumber)
    .single()

  if (error || !ticket) {
    return { error: 'Tiket tidak ditemukan.' }
  }

  // Get history
  const { data: history } = await supabase
    .from('ticket_history')
    .select(`
      action,
      description,
      created_at,
      users(full_name)
    `)
    .eq('ticket_id', ticket.id)
    .order('created_at', { ascending: true })

  // Get attachments (only AFTER photos for public)
  const { data: attachments } = await supabase
    .from('ticket_attachments')
    .select('*')
    .eq('ticket_id', ticket.id)
    .eq('attachment_type', 'AFTER')

  return {
    ticket,
    history: history || [],
    attachments: attachments || []
  }
}
