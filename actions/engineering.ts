'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function assignTechnicians(formData: FormData) {
  const supabase = await createClient()

  // 1. Cek User & Role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login terlebih dahulu.' }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name')
    .eq('auth_user_id', user.id)
    .single()

  // Hanya ENGINEERING_ADMIN dan ADMIN yang boleh assign
  if (!profile || (profile.role !== 'ENGINEERING_ADMIN' && profile.role !== 'ADMIN')) {
    return { error: 'Anda tidak memiliki hak akses untuk menugaskan teknisi.' }
  }

  // 2. Ambil data dari Form
  const ticketId = formData.get('ticket_id') as string
  const technicianIds = formData.getAll('technician_ids') as string[]

  if (!ticketId) {
    return { error: 'ID Tiket tidak valid.' }
  }

  if (technicianIds.length === 0) {
    return { error: 'Pilih minimal 1 teknisi.' }
  }

  if (technicianIds.length > 5) {
    return { error: 'Maksimal 5 teknisi.' }
  }

  // 3. Hapus assignment lama (jika ada)
  await supabase
    .from('ticket_assignments')
    .delete()
    .eq('ticket_id', ticketId)

  // 4. Insert assignment baru
  const assignments = technicianIds.map(techId => ({
    ticket_id: ticketId,
    engineering_user_id: techId,
    assigned_by: profile.id,
    is_current: true,
  }))

  const { error: assignError } = await supabase
    .from('ticket_assignments')
    .insert(assignments)

  if (assignError) {
    console.error('Assignment Error:', assignError)
    return { error: 'Gagal menugaskan teknisi.' }
  }

  // 5. Update status tiket menjadi ASSIGNED & simpan array teknisi multi-assign
  const { error: updateError } = await supabase
    .from('tickets')
    .update({
      status: 'ASSIGNED',
      assigned_technician_ids: technicianIds,
      current_assignee_id: technicianIds[0],
    })
    .eq('id', ticketId)

  if (updateError) {
    console.error('Update Error:', updateError)
    return { error: 'Gagal memperbarui status tiket.' }
  }

  // 6. Catat history
  const { data: technicians } = await supabase
    .from('users')
    .select('full_name')
    .in('id', technicianIds)

  const techNames = technicians?.map(t => t.full_name).join(', ') || ''

  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'ASSIGN_ENGINEERING',
    description: `Tiket ditugaskan ke teknisi: ${techNames} oleh ${profile.full_name}`,
    new_value: { assigned_to: technicianIds }
  })

  // 7. Refresh halaman
  revalidatePath('/engineering-admin/dashboard')
  revalidatePath(`/tickets/${ticketId}`)

  return { success: true }
}

export async function forceCompleteTicket(formData: FormData) {
  const supabase = await createClient()

  // 1. Cek User & Role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login terlebih dahulu.' }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name')
    .eq('auth_user_id', user.id)
    .single()

  // Hanya ENGINEERING_ADMIN dan ADMIN yang boleh force complete
  if (!profile || (profile.role !== 'ENGINEERING_ADMIN' && profile.role !== 'ADMIN')) {
    return { error: 'Anda tidak memiliki hak akses.' }
  }

  const ticketId = formData.get('ticket_id') as string
  const description = formData.get('description') as string || 'Force complete oleh sistem (auto-finish)'

  if (!ticketId) {
    return { error: 'ID Tiket tidak valid.' }
  }

  // 2. Update status menjadi COMPLETED
  const { error } = await supabase
    .from('tickets')
    .update({
      status: 'COMPLETED',
      completed_at: new Date().toISOString()
    })
    .eq('id', ticketId)

  if (error) {
    console.error('Force Complete Error:', error)
    return { error: 'Gagal menyelesaikan tiket.' }
  }

  // 3. Catat history
  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'AUTO_FINISHED',
    description: `${description} oleh ${profile.full_name}`
  })

  // 4. Refresh
  revalidatePath('/engineering-admin/dashboard')
  revalidatePath(`/tickets/${ticketId}`)

  return { success: true }
}

export async function updateTicketStatus(formData: FormData) {
  const supabase = await createClient()

  const ticketId = formData.get('ticket_id') as string
  const newStatus = formData.get('status') as string
  const description = formData.get('description') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi Anda telah berakhir.' }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || (profile.role !== 'ENGINEERING_ADMIN' && profile.role !== 'ENGINEERING' && profile.role !== 'ADMIN')) {
    return { error: 'Anda tidak memiliki hak akses.' }
  }

  const { error } = await supabase
    .from('tickets')
    .update({ status: newStatus })
    .eq('id', ticketId)

  if (error) {
    return { error: 'Gagal memperbarui status.' }
  }

  const historyText = description || `Status diubah menjadi ${newStatus.replace('_', ' ')} oleh ${profile.full_name}`

  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: newStatus,
    description: historyText
  })

  revalidatePath('/engineering-admin/dashboard')
  revalidatePath(`/tickets/${ticketId}`)

  return { success: true }
}
