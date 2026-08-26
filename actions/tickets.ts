'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Create Ticket (RR only)
export async function createTicket(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'RR' && profile?.role !== 'ADMIN') {
    return { error: 'Hanya RR yang boleh buat tiket' }
  }

  const unit_code = formData.get('unit_code') as string
  const resident_name = formData.get('resident_name') as string
  const phone_number = formData.get('phone_number') as string
  const problem = formData.get('problem') as string
  const description = formData.get('description') as string

  if (!unit_code || !resident_name || !phone_number || !problem) {
    return { error: 'Field wajib diisi' }
  }

  const { data, error } = await supabase.from('tickets').insert({
    unit_code,
    resident_name,
    phone_number,
    problem,
    description: description || null,
    created_by: profile.id,
  }).select().single()

  if (error) return { error: error.message }
  revalidatePath('/rr/tasks')
  return { success: true, ticket: data }
}

// Assign Engineering (ENGINEERING_ADMIN only)
export async function assignTicket(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING_ADMIN' && profile?.role !== 'ADMIN') {
    return { error: 'Hanya Engineering Admin' }
  }

  const ticketId = formData.get('ticket_id') as string
  const engineeringId = formData.get('engineering_id') as string

  if (!ticketId || !engineeringId) return { error: 'Data tidak lengkap' }

  // Update assignee
  await supabase.from('tickets').update({
    current_assignee_id: engineeringId,
    status: 'ASSIGNED',
  }).eq('id', ticketId)

  // Log assignment
  await supabase.from('ticket_assignments').insert({
    ticket_id: ticketId,
    engineering_user_id: engineeringId,
    assigned_by: profile.id,
    is_current: true,
  })

  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'ASSIGN_ENGINEERING',
    description: `Ditugaskan ke teknisi`,
  })

  revalidatePath('/engineering-admin/tasks')
  return { success: true }
}

// Start Working (ENGINEERING only)
export async function startWorking(ticketId: string) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING') return { error: 'Hanya Teknisi' }

  await supabase.from('tickets').update({
    status: 'ON_PROGRESS',
    started_at: new Date().toISOString(),
  }).eq('id', ticketId)

  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'START_WORK',
    description: 'Teknisi mulai bekerja',
  })

  revalidatePath('/engineering/tickets')
  return { success: true }
}

// Add Daily Log (ENGINEERING only)
export async function addDailyLog(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING') return { error: 'Hanya Teknisi' }

  const ticketId = formData.get('ticket_id') as string
  const dayNumber = parseInt(formData.get('day_number') as string) || 1
  const workDesc = formData.get('work_description') as string
  const actionType = formData.get('action_type') as string

  if (!ticketId || !workDesc) return { error: 'Data tidak lengkap' }

  const { data: log } = await supabase.from('ticket_daily_logs').insert({
    ticket_id: ticketId,
    engineering_id: profile.id,
    day_number: dayNumber,
    work_description: workDesc,
    action_type: actionType || 'EXTEND',
  }).select().single()

  if (actionType === 'SUBMIT_FINISH') {
    await supabase.from('tickets').update({ status: 'WAITING_CONFIRMATION' }).eq('id', ticketId)
  }

  revalidatePath('/engineering/tickets')
  return { success: true, log }
}

// Confirm Ticket (RR/WARGA)
export async function confirmTicket(formData: FormData) {
  const supabase = await createClient()
  const ticketId = formData.get('ticket_id') as string
  const rating = parseInt(formData.get('rating') as string)
  const comment = formData.get('comment') as string
  const action = formData.get('action') as string

  if (!ticketId) return { error: 'ID tidak valid' }

  if (action === 'REWORK') {
    await supabase.from('tickets').update({ status: 'REWORK' }).eq('id', ticketId)
    await supabase.from('ticket_history').insert({
      ticket_id: ticketId,
      action: 'REWORK',
      description: comment || 'Warga menolak pekerjaan',
    })
    revalidatePath('/rr/tasks')
    return { success: true }
  }

  // COMPLETED
  await supabase.from('tickets').update({
    status: 'COMPLETED',
    completed_at: new Date().toISOString(),
  }).eq('id', ticketId)

  if (rating) {
    await supabase.from('ticket_confirmations').insert({
      ticket_id: ticketId,
      rating,
      comment,
    })
  }

  revalidatePath('/rr/tasks')
  return { success: true }
}

// Auto-Finish after 72h (ENGINEERING_ADMIN)
export async function autoFinishTicket(ticketId: string) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING_ADMIN' && profile?.role !== 'ADMIN') {
    return { error: 'Hanya Engineering Admin' }
  }

  await supabase.from('tickets').update({
    status: 'COMPLETED',
    completed_at: new Date().toISOString(),
  }).eq('id', ticketId)

  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'AUTO_FINISH',
    description: 'Auto-finish 72 jam tanpa respon warga',
  })

  revalidatePath('/engineering-admin/status')
  return { success: true }
}

// Cancel Ticket (ADMIN)
export async function cancelTicket(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ADMIN') return { error: 'Hanya Admin' }

  const ticketId = formData.get('ticket_id') as string
  const reason = formData.get('cancellation_reason') as string

  await supabase.from('tickets').update({
    status: 'CANCELLED',
    cancelled_at: new Date().toISOString(),
    cancelled_by: profile.id,
    cancellation_reason: reason,
  }).eq('id', ticketId)

  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'CANCELLED',
    description: `Dibatalkan: ${reason}`,
  })

  revalidatePath('/admin/tickets')
  return { success: true }
}

// Archive Ticket (ADMIN)
export async function archiveTicket(ticketId: string) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ADMIN') return { error: 'Hanya Admin' }

  await supabase.from('tickets').update({
    is_archived: true,
    archived_at: new Date().toISOString(),
    archived_by: profile.id,
  }).eq('id', ticketId)

  revalidatePath('/admin/tickets')
  return { success: true }
}

// Toggle Rating Visibility (ADMIN)
export async function toggleRating(ratingId: string, isVisible: boolean) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ADMIN') return { error: 'Hanya Admin' }

  await supabase.from('ticket_confirmations').update({ is_visible: isVisible }).eq('id', ratingId)
  return { success: true }
}

// Update Ticket Status (ENGINEERING)
export async function updateTicketStatus(formData: FormData) {
  const supabase = await createClient()
  const ticketId = formData.get('ticket_id') as string
  const newStatus = formData.get('status') as string

  await supabase.from('tickets').update({ status: newStatus }).eq('id', ticketId)
  revalidatePath(`/tickets/${ticketId}`)
  return { success: true }
}
