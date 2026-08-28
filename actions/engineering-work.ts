'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Start working on a ticket (ASSIGNED -> ON_PROGRESS)
export async function startWork(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login.' }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || (profile.role !== 'ENGINEERING' && profile.role !== 'ADMIN')) {
    return { error: 'Anda tidak memiliki hak akses.' }
  }

  const ticketId = formData.get('ticket_id') as string

  if (!ticketId) {
    return { error: 'ID Tiket tidak valid.' }
  }

  // Update status to ON_PROGRESS and set started_at
  const { error } = await supabase
    .from('tickets')
    .update({
      status: 'ON_PROGRESS',
      started_at: new Date().toISOString()
    })
    .eq('id', ticketId)

  if (error) {
    return { error: 'Gagal memulai pekerjaan.' }
  }

  // Add history
  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'START_WORK',
    description: `Pekerjaan dimulai oleh ${profile.full_name}`
  })

  revalidatePath('/engineering')
  revalidatePath('/engineering/task')
  revalidatePath(`/tickets/${ticketId}`)

  return { success: true }
}

// Extend work to next day
export async function extendWork(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login.' }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || (profile.role !== 'ENGINEERING' && profile.role !== 'ADMIN')) {
    return { error: 'Anda tidak memiliki hak akses.' }
  }

  const ticketId = formData.get('ticket_id') as string
  const description = formData.get('description') as string
  const dayNumber = parseInt(formData.get('day_number') as string) || 1

  if (!ticketId) {
    return { error: 'ID Tiket tidak valid.' }
  }

  // Create daily log entry with EXTEND action
  await supabase.from('ticket_daily_logs').insert({
    ticket_id: ticketId,
    engineering_id: profile.id,
    day_number: dayNumber + 1,
    work_description: description || '',
    action_type: 'EXTEND',
  })

  // Add history
  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'EXTEND_WORK',
    description: `Pekerjaan dilanjutkan ke hari ${dayNumber + 1} oleh ${profile.full_name}`
  })

  revalidatePath('/engineering/task')
  revalidatePath(`/tickets/${ticketId}`)

  return { success: true, nextDay: dayNumber + 1 }
}

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

  const { error: uploadError } = await supabase.storage
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
    photo_type: attachmentType,
    storage_path: fileName,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
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




