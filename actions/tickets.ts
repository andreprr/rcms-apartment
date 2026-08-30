'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { formatPhoneNumber } from '@/lib/whatsapp'

// Service Role client - bypasses RLS, untuk aksi publik client (tanpa login).
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

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
  const scheduled_at = formData.get('scheduled_at') as string
  // RR TIDAK menetapkan prioritas saat membuat tiket.
  // Default selalu 'NORMAL'; prioritas dapat dinaikkan ke 'URGENT' oleh ENGINEERING_ADMIN.
  const priority = 'NORMAL'

  if (!unit_code || !resident_name || !phone_number || !problem) {
    return { error: 'Field wajib diisi' }
  }

  const { data, error } = await supabase.from('tickets').insert({
    unit_code,
    resident_name,
    phone_number,
    problem,
    description: description || null,
    scheduled_at: scheduled_at || null,
    priority: priority as 'NORMAL' | 'URGENT',
    // Tiket baru dari RR selalu dimulai sebagai UNASSIGNED (belum ditugaskan).
    status: 'UNASSIGNED' as const,
    created_by: profile.id,
  }).select(`
    id,
    ticket_number,
    unit_code,
    resident_name,
    phone_number,
    problem,
    description,
    status,
    priority,
    scheduled_at,
    created_at
  `).single()

  if (error) {
    console.error('Create ticket error:', error)
    return { error: error.message }
  }

  // Log the created ticket for debugging
  console.log('Ticket created:', data)

  revalidatePath('/rr/task')
  revalidatePath('/api/rr/tickets')

  // Return success with ticket data
  // WhatsApp and PDF will be triggered separately via API call from client
  return {
    success: true,
    ticket: data,
    waSent: false, // Will be updated when WhatsApp is sent
    pdfReady: true, // PDF can be generated on-demand
  }
}

// Assign Engineering (ENGINEERING_ADMIN only)
// Mendukung 1..5 teknisi via checkbox (FormData 'engineering_id' berulang).
// Status tiket -> ASSIGNED ("Ditugaskan"), disimpan ke assigned_technician_ids.
export async function assignTicket(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING_ADMIN' && profile?.role !== 'ADMIN') {
    return { error: 'Hanya Engineering Admin' }
  }

  const ticketId = formData.get('ticket_id') as string

  // Kumpulkan semua teknisi terpilih dari checkbox (bisa 1..5).
  let engineerIds = formData.getAll('engineering_id').filter(Boolean) as string[]
  if (engineerIds.length === 0) {
    const single = formData.get('engineering_id') as string
    const alt = formData.get('engineering_ids') as string
    if (single) engineerIds = [single]
    else if (alt) engineerIds = alt.split(',').map(s => s.trim()).filter(Boolean)
  }

  if (!ticketId) return { error: 'ID tiket tidak valid' }
  if (engineerIds.length === 0) return { error: 'Pilih minimal 1 teknisi' }
  if (engineerIds.length > 5) return { error: 'Maksimal 5 teknisi' }

  const { data: techNames } = await supabase
    .from('users')
    .select('full_name')
    .in('id', engineerIds)
  const names = techNames?.map(t => t.full_name).join(', ') || engineerIds.join(', ')

  // Hapus assignment lama, simpan list baru.
  await supabase.from('ticket_assignments').delete().eq('ticket_id', ticketId)
  const rows = engineerIds.map(id => ({
    ticket_id: ticketId,
    engineering_user_id: id,
    assigned_by: profile.id,
    is_current: true,
  }))
  await supabase.from('ticket_assignments').insert(rows)

  // Status -> ASSIGNED ("Ditugaskan"), simpan array teknisi.
  await supabase.from('tickets').update({
    status: 'ASSIGNED',
    assigned_technician_ids: engineerIds,
    current_assignee_id: engineerIds[0],
  }).eq('id', ticketId)

  // Log assignment
  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'ASSIGN_ENGINEERING',
    new_value: { assigned_technician_ids: engineerIds },
    description: `Ditugaskan ke ${engineerIds.length} teknisi: ${names}, status menjadi Ditugaskan (ASSIGNED)`,
  })

  revalidatePath('/engineering-admin/tasks')
  revalidatePath('/engineering-admin/dashboard')
  return { success: true }
}

// Mulai Investigasi (ENGINEERING only) - ASSIGNED -> INVESTIGATION
export async function startInvestigation(ticketId: string) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role, full_name').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING') return { error: 'Hanya Teknisi' }

  const { data: ticket } = await supabase.from('tickets').select('status').eq('id', ticketId).single()
  if (ticket?.status !== 'ASSIGNED') return { error: 'Tiket harus berstatus Ditugaskan terlebih dahulu' }

  await supabase.from('tickets').update({ status: 'INVESTIGATION' }).eq('id', ticketId)
  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'START_INVESTIGATION',
    description: `Investigasi dimulai oleh ${profile.full_name} (Sedang Investigasi)`,
  })

  revalidatePath('/engineering/task')
  return { success: true }
}

// Reschedule oleh Teknisi (ENGINEERING only) - Mohon foto bukti + alasan
export async function rescheduleTicket(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role, full_name').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING') return { error: 'Hanya Teknisi' }

  const ticketId = formData.get('ticket_id') as string
  const reason = (formData.get('reason') as string) || ''

  if (!ticketId) return { error: 'ID tiket tidak valid' }
  if (!reason.trim()) return { error: 'Alasan reschedule wajib diisi' }

  // Upload foto bukti (client sedang tidak ada / tidak bisa ditemui).
  const photoPaths: string[] = []
  const fileKeys = Array.from(formData.keys()).filter(k => k.startsWith('file_'))
  for (const key of fileKeys) {
    const file = formData.get(key) as File
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `reschedule/${ticketId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const { error: upErr } = await supabase.storage.from('ticket-attachments').upload(fileName, file)
      if (!upErr) photoPaths.push(fileName)
    }
  }

  await supabase.from('tickets').update({
    status: 'RESCHEDULED',
    reschedule_reason: reason,
    reschedule_photo_paths: photoPaths.length ? photoPaths : null,
    rescheduled_at: new Date().toISOString(),
    rescheduled_by: profile.id,
  }).eq('id', ticketId)

  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'RESCHEDULED',
    new_value: { reason, photos: photoPaths.length },
    description: `Reschedule oleh teknisi: ${reason}`,
  })

  revalidatePath('/engineering/task')
  revalidatePath('/engineering-admin/tasks')
  return { success: true }
}

// Submit Laporan Investigasi (ENGINEERING only) - INVESTIGATION -> NEEDS_ANALYSIS
export async function submitInvestigation(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role, full_name').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING') return { error: 'Hanya Teknisi' }

  const ticketId = formData.get('ticket_id') as string
  const report = (formData.get('investigation_report') as string) || ''
  const materialsRaw = (formData.get('required_materials') as string) || ''

  if (!ticketId) return { error: 'ID tiket tidak valid' }
  if (!report.trim()) return { error: 'Detail laporan kerusakan wajib diisi' }
  if (!materialsRaw.trim()) return { error: 'Daftar bahan/material wajib diisi' }

  const materials = materialsRaw.split('\n').map(s => s.trim()).filter(Boolean)

  // Upload foto detail kerusakan.
  const photoPaths: string[] = []
  const fileKeys = Array.from(formData.keys()).filter(k => k.startsWith('file_'))
  for (const key of fileKeys) {
    const file = formData.get(key) as File
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `investigation/${ticketId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const { error: upErr } = await supabase.storage.from('ticket-attachments').upload(fileName, file)
      if (!upErr) photoPaths.push(fileName)
    }
  }

  await supabase.from('tickets').update({
    status: 'NEEDS_ANALYSIS',
    investigation_report: report,
    investigation_photo_paths: photoPaths.length ? photoPaths : null,
    required_materials: materials,
    investigation_completed_at: new Date().toISOString(),
    investigation_completed_by: profile.id,
  }).eq('id', ticketId)

  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'INVESTIGATION_SUBMITTED',
    new_value: { materials, photo_count: photoPaths.length },
    description: `Laporan investigasi dikirim oleh ${profile.full_name} (Butuh Analisis)`,
  })

  revalidatePath('/engineering/task')
  revalidatePath('/engineering-admin/tasks')
  return { success: true }
}

// Admin Analisis: set prioritas + opsional tambah teknisi - status tetap NEEDS_ANALYSIS.
// Kemudian "Start Progress" -> ON_PROGRESS.
export async function saveAnalysis(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role, full_name').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING_ADMIN' && profile?.role !== 'ADMIN') return { error: 'Hanya Engineering Admin' }

  const ticketId = formData.get('ticket_id') as string
  const priority = (formData.get('priority') as string) || 'NORMAL'
  if (priority !== 'NORMAL' && priority !== 'URGENT') return { error: 'Prioritas harus NORMAL atau URGENT' }

  const patch: Record<string, unknown> = { priority }

  // Opsional menambah teknisi (URGENT) - gabungkan dengan yang sudah ada.
  const extraIds = formData.getAll('engineering_id').filter(Boolean) as string[]
  if (extraIds.length) {
    const { data: ticket } = await supabase.from('tickets').select('assigned_technician_ids').eq('id', ticketId).single()
    const existing: string[] = ticket?.assigned_technician_ids || []
    const merged = Array.from(new Set([...existing, ...extraIds])).slice(0, 5)
    patch.assigned_technician_ids = merged
    await supabase.from('ticket_assignments').delete().eq('ticket_id', ticketId)
    await supabase.from('ticket_assignments').insert(
      merged.map(id => ({ ticket_id: ticketId, engineering_user_id: id, assigned_by: profile.id, is_current: true }))
    )
    await supabase.from('tickets').update({ current_assignee_id: merged[0] }).eq('id', ticketId)
  }

  const { error } = await supabase.from('tickets').update(patch).eq('id', ticketId)
  if (error) return { error: error.message }

  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'ANALYSIS_SAVED',
    new_value: { priority, extra_technicians: extraIds },
    description: `Analisis disimpan - prioritas ${priority === 'URGENT' ? 'Urgent (Multi-Day)' : 'Normal (1 Hari)'}`,
  })

  revalidatePath('/engineering-admin/tasks')
  revalidatePath('/engineering-admin/dashboard')
  return { success: true }
}

// Admin: Start Progress (NEEDS_ANALYSIS -> ON_PROGRESS)
export async function startProgress(ticketId: string) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role, full_name').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING_ADMIN' && profile?.role !== 'ADMIN') return { error: 'Hanya Engineering Admin' }

  const { data: ticket } = await supabase.from('tickets').select('status').eq('id', ticketId).single()
  if (ticket?.status !== 'NEEDS_ANALYSIS') return { error: 'Tiket harus berstatus Butuh Analisis' }

  await supabase.from('tickets').update({
    status: 'ON_PROGRESS',
    analysis_started_at: new Date().toISOString(),
    analysis_started_by: profile.id,
    started_at: new Date().toISOString(),
  }).eq('id', ticketId)

  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'ANALYSIS_APPROVED',
    description: `Analisis disetujui, pekerjaan dimulai (ON_PROGRESS) oleh ${profile.full_name}`,
  })

  revalidatePath('/engineering-admin/tasks')
  revalidatePath('/engineering-admin/dashboard')
  return { success: true }
}

// Teknisi klaim Finish (ON_PROGRESS -> REVIEW_FINISH)
// Menunggu review & persetujuan Engineering Admin sebelum dikirim ke client.
export async function finishTicket(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role, full_name').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING') return { error: 'Hanya Teknisi' }

  const ticketId = formData.get('ticket_id') as string
  const summary = (formData.get('work_description') as string) || ''
  if (!ticketId) return { error: 'ID tiket tidak valid' }

  await supabase.from('tickets').update({
    status: 'REVIEW_FINISH',
    submitted_at: new Date().toISOString(),
  }).eq('id', ticketId)

  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'SUBMITTED_COMPLETION',
    new_value: { summary },
    description: `Teknisi telah menyelesaikan pengerjaan. Menunggu review & persetujuan Engineering Admin oleh ${profile.full_name}`,
  })

  revalidatePath('/engineering/task')
  revalidatePath('/engineering-admin/tasks')
  return { success: true, newStatus: 'REVIEW_FINISH' }
}

// Kirim Konfirmasi ke Client (ENGINEERING_ADMIN only)
// -> WAITING_CLIENT_CONFIRMATION.
// Admin men-review hasil kerja teknisi; tiket dikirim ke client (via WA) untuk
// disetujui/dikonfirmasi. Jika status belum REVIEW_FINISH (mis. masih ON_PROGRESS /
// setelah Klaim Finish belum ter-render), tiket otomatis dinormalisasi ke REVIEW_FINISH
// terlebih dahulu agar tautan WA dapat dibuat tanpa terblokir status ketat.
export async function sendClientConfirmation(ticketId: string) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role, full_name').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING_ADMIN' && profile?.role !== 'ADMIN') {
    return { error: 'Hanya Engineering Admin' }
  }

  if (!ticketId) return { error: 'ID tiket tidak valid' }

  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, status, ticket_number, phone_number, resident_name, problem')
    .eq('id', ticketId)
    .single()

  if (!ticket) return { error: 'Tiket tidak ditemukan' }

  // Relaxed guard: bila status belum REVIEW_FINISH, otomatis promosikan terlebih dahulu
  // (mis. ON_PROGRESS / SUBMITTED / SUBMITTED_COMPLETION) agar flows tidak terblokir.
  if (ticket.status !== 'REVIEW_FINISH') {
    await supabase.from('tickets').update({
      status: 'REVIEW_FINISH',
      submitted_at: new Date().toISOString(),
    }).eq('id', ticketId)
  }

  await supabase.from('tickets').update({ status: 'WAITING_CLIENT_CONFIRMATION' }).eq('id', ticketId)

  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'SENT_CLIENT_CONFIRMATION',
    description: 'Admin telah memverifikasi pengerjaan dan mengirim konfirmasi ke client.',
  })

  // Buat tautan WA deeplink agar admin mengirim notifikasi konfirmasi ke client.
  const headerStore = await headers()
  const host = headerStore.get('host') || ''
  const origin = host ? `https://${host}` : ''
  const formattedPhone = formatPhoneNumber(ticket.phone_number || '')
  const confirmUrl = `${origin}/public/ticket?number=${encodeURIComponent(ticket.ticket_number)}`
  const text =
    `Halo Bpk/Ibu ${ticket.resident_name || ''},%0A%0A` +
    `Pengerjaan untuk pengaduan *No. Tiket ${ticket.ticket_number}* (${ticket.problem}) telah diselesaikan oleh tim teknis.%0A%0A` +
    `Mohon tinjau hasil pekerjaan dan konfirmasi penyelesaian melalui tautan berikut:%0A` +
    `${confirmUrl}%0A%0A` +
    `Terima kasih,%0AManagement Gateway Apartment`
  const waLink = formattedPhone ? `https://wa.me/${formattedPhone}?text=${text}` : confirmUrl

  revalidatePath('/engineering-admin/tasks')
  revalidatePath('/engineering-admin/dashboard')
  return { success: true, waLink }
}

// Client (Publik) - Aksi A: "Selesai & Beri Rating"
// WAITING_CLIENT_CONFIRMATION / REVIEW_FINISH -> FINISHED. Simpan rating + feedback client.
// Menggunakan service-role client agar dapat diakses tanpa login melalui halaman publik.
export async function clientFinishWithRating(formData: FormData) {
  const service = getServiceClient()
  const ticketId = formData.get('ticket_id') as string
  const rating = parseInt(formData.get('rating') as string)
  const feedback = (formData.get('client_feedback') as string) || null

  if (!ticketId) return { error: 'ID tiket tidak valid' }

  const { data: ticket } = await service
    .from('tickets')
    .select('id, status, rework_count')
    .eq('id', ticketId)
    .single()

  if (!ticket) return { error: 'Tiket tidak ditemukan' }
  if (ticket.status !== 'WAITING_CLIENT_CONFIRMATION' && ticket.status !== 'REVIEW_FINISH') {
    return { error: 'Tiket tidak dalam status menunggu konfirmasi' }
  }

  await service.from('tickets').update({
    status: 'FINISHED',
    completed_at: new Date().toISOString(),
    client_feedback: feedback,
  }).eq('id', ticketId)

  if (rating) {
    await service.from('ticket_confirmations').insert({
      ticket_id: ticketId,
      rating,
      comment: feedback,
    })
  }

  await service.from('ticket_history').insert({
    ticket_id: ticketId,
    action: 'FINISHED',
    description: `Client mengonfirmasi pekerjaan selesai${rating ? ` dengan rating ${rating} bintang` : ''}`,
  })

  revalidatePath('/public/ticket')
  revalidatePath('/engineering-admin/tasks')
  revalidatePath('/engineering-admin/dashboard')
  return { success: true }
}

// Client (Publik) - Aksi B: "Ajukan Perbaikan Ulang" (Rework Request)
// WAITING_CLIENT_CONFIRMATION / REVIEW_FINISH -> REWORK_REQ.
// Menyimpan rework_reason, increment rework_count, dan tanda is_rework.
export async function clientRequestRework(formData: FormData) {
  const service = getServiceClient()
  const ticketId = formData.get('ticket_id') as string
  const reason = (formData.get('rework_reason') as string) || ''

  if (!ticketId) return { error: 'ID tiket tidak valid' }
  if (!reason.trim()) return { error: 'Alasan perbaikan ulang wajib diisi' }

  const { data: ticket } = await service
    .from('tickets')
    .select('id, status, rework_count')
    .eq('id', ticketId)
    .single()

  if (!ticket) return { error: 'Tiket tidak ditemukan' }
  if (ticket.status !== 'WAITING_CLIENT_CONFIRMATION' && ticket.status !== 'REVIEW_FINISH') {
    return { error: 'Tiket tidak dalam status menunggu konfirmasi' }
  }

  const nextCount = (Number(ticket.rework_count) || 0) + 1

  await service.from('tickets').update({
    status: 'REWORK_REQ',
    is_rework: true,
    rework_count: nextCount,
    rework_reason: reason,
  }).eq('id', ticketId)

  await service.from('ticket_history').insert({
    ticket_id: ticketId,
    action: 'REWORK_REQ',
    description: `Client mengajukan perbaikan ulang. Alasan: ${reason}. Total rework: ${nextCount}x`,
  })

  revalidatePath('/public/ticket')
  revalidatePath('/engineering-admin/tasks')
  revalidatePath('/engineering-admin/dashboard')
  return { success: true }
}

// Admin (Engineering Admin) - Setujui Rework & Kirim ke Investigasi.
// REWORK_REQ -> INVESTIGATION. Tiket otomatis kembali ke aplikasi Teknisi.
export async function approveRework(ticketId: string) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role, full_name').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING_ADMIN' && profile?.role !== 'ADMIN') {
    return { error: 'Hanya Engineering Admin' }
  }

  if (!ticketId) return { error: 'ID tiket tidak valid' }

  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, status, rework_reason')
    .eq('id', ticketId)
    .single()

  if (!ticket) return { error: 'Tiket tidak ditemukan' }
  if (ticket.status !== 'REWORK_REQ') {
    return { error: 'Tiket harus berstatus Rework Request terlebih dahulu' }
  }

  await supabase.from('tickets').update({
    status: 'INVESTIGATION',
    current_stage: 'DIAGNOSIS',
  }).eq('id', ticketId)

  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'REWORK_APPROVED',
    description: `Rework disetujui oleh ${profile.full_name}. Dikirim kembali ke investigasi untuk dikerjakan ulang.`,
  })

  revalidatePath('/engineering-admin/tasks')
  revalidatePath('/engineering-admin/dashboard')
  revalidatePath('/engineering/task')
  revalidatePath('/engineering')
  return { success: true, newStatus: 'INVESTIGATION' }
}

// Konfirmasi Client (RR/WARGA) - WAITING_CLIENT_CONFIRMATION -> FINISHED
export async function finishConfirmation(formData: FormData) {
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

  // FINISHED
  await supabase.from('tickets').update({
    status: 'FINISHED',
    completed_at: new Date().toISOString(),
  }).eq('id', ticketId)

  if (rating) {
    await supabase.from('ticket_confirmations').insert({
      ticket_id: ticketId,
      rating,
      comment,
    })
  }

  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    action: 'FINISHED',
    description: 'Client mengonfirmasi pekerjaan selesai',
  })

  revalidatePath('/rr/tasks')
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
    await supabase.from('tickets').update({ status: 'REVIEW_FINISH' }).eq('id', ticketId)
    await supabase.from('ticket_history').insert({
      ticket_id: ticketId,
      user_id: profile.id,
      action: 'SUBMITTED_COMPLETION',
      description: 'Teknisi telah menyelesaikan pengerjaan. Menunggu review & persetujuan Engineering Admin.',
    })
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

  // COMPLETED / FINISHED (sesuaikan dengan state sebelum konfirmasi)
  const { data: cur } = await supabase.from('tickets').select('status').eq('id', ticketId).single()
  const targetStatus = cur?.status === 'WAITING_CLIENT_CONFIRMATION' ? 'FINISHED' : 'COMPLETED'

  await supabase.from('tickets').update({
    status: targetStatus,
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
// Update Ticket Status (ENGINEERING_ADMIN / ADMIN only)
//
// Pipeline 5-status Engineering Admin (dipetakan ke nilai enum yang tersedia):
//   1. Baru / Menunggu Penugasan  -> NEW, ASSIGNED
//   2. Dalam Pengerjaan           -> ON_PROGRESS   (otomatis setelah "Tugaskan")
//   3. Butuh Analisis/Lapangan    -> WAITING_ANALYSIS  (opsional prioritas)
//   4. Reschedule / Pergeseran    -> ON_HOLD
//   5. Selesai / Dibatalkan       -> COMPLETED, CANCELLED
const ENGINEERING_ADMIN_TRANSITION_STATUSES = [
  'ON_PROGRESS',
  'WAITING_ANALYSIS',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
  'ASSIGNED',
  'REWORK',
] as const

export async function updateTicketStatus(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } = { user: null } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()
  if (profile?.role !== 'ENGINEERING_ADMIN' && profile?.role !== 'ADMIN') {
    return { error: 'Hanya Engineering Admin' }
  }

  const ticketId = formData.get('ticket_id') as string
  const newStatus = formData.get('status') as string
  const priority = (formData.get('priority') as string) || null

  if (!ticketId || !newStatus) return { error: 'Data tidak lengkap' }

  if (!(ENGINEERING_ADMIN_TRANSITION_STATUSES as readonly string[]).includes(newStatus)) {
    return { error: `Status tidak valid: ${newStatus}` }
  }

  // Prioritas hanya boleh NORMAL / URGENT (nilai yang valid di enum).
  if (priority && priority !== 'NORMAL' && priority !== 'URGENT') {
    return { error: 'Prioritas harus NORMAL atau URGENT' }
  }

  const patch: Record<string, unknown> = { status: newStatus }
  if (priority) patch.priority = priority

  const { error } = await supabase.from('tickets').update(patch).eq('id', ticketId)
  if (error) return { error: error.message }

  const statusLabels: Record<string, string> = {
    ON_PROGRESS: 'Dalam Pengerjaan (ON_PROGRESS)',
    WAITING_ANALYSIS: 'Butuh Analisis (WAITING_ANALYSIS)',
    ON_HOLD: 'Reschedule / Ditahan (ON_HOLD)',
    COMPLETED: 'Selesai (COMPLETED)',
    CANCELLED: 'Dibatalkan (CANCELLED)',
    ASSIGNED: 'Ditugaskan (ASSIGNED)',
    REWORK: 'Revisi (REWORK)',
  }

  const descriptionParts = [
    `Status diubah ke ${statusLabels[newStatus] || newStatus}`,
    priority ? `, prioritas: ${priority === 'URGENT' ? 'Urgent (Multi-Day)' : 'Normal (1 Hari)'}` : '',
  ]
  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'STATUS_UPDATE',
    new_value: { status: newStatus, priority: priority || undefined },
    description: descriptionParts.join(''),
  })

  revalidatePath('/engineering-admin/tasks')
  revalidatePath('/engineering-admin/dashboard')
  revalidatePath(`/tickets/${ticketId}`)
  return { success: true }
}

// ============================================================================
// PHASE 1: SITE INSPECTION WORKFLOW
// ============================================================================

// Complete Site Inspection (ENGINEERING only)
export async function completeSiteInspection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING') return { error: 'Hanya Teknisi' }

  const ticketId = formData.get('ticket_id') as string
  const inspectionNotes = formData.get('inspection_notes') as string

  if (!ticketId) return { error: 'ID tiket tidak valid' }
  if (!inspectionNotes) return { error: 'Catatan inspeksi wajib diisi' }

  // Update ticket with inspection notes and change status
  const { error } = await supabase.from('tickets').update({
    status: 'WAITING_ANALYSIS',
    initial_inspection_notes: inspectionNotes,
    inspection_completed_at: new Date().toISOString(),
    current_stage: 'INSPECTION',
  }).eq('id', ticketId)

  if (error) return { error: error.message }

  // Log history
  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'INSPECTION_COMPLETE',
    description: 'Pengecekan lokasi selesai, menunggu analisis',
  })

  revalidatePath('/engineering/tickets')
  revalidatePath('/engineering/dashboard')
  return { success: true }
}

// Approve Inspection (ENGINEERING_ADMIN only)
export async function approveInspection(ticketId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING_ADMIN' && profile?.role !== 'ADMIN') {
    return { error: 'Hanya Engineering Admin' }
  }

  if (!ticketId) return { error: 'ID tiket tidak valid' }

  // Approve and move to ON_PROGRESS
  const { error } = await supabase.from('tickets').update({
    status: 'ON_PROGRESS',
    inspection_approved_at: new Date().toISOString(),
    inspection_approved_by: profile.id,
    started_at: new Date().toISOString(),
    current_stage: 'REPAIR',
  }).eq('id', ticketId)

  if (error) return { error: error.message }

  // Log history
  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'INSPECTION_APPROVED',
    description: 'Analisis disetujui, pekerjaan diperbolehkan dimulai',
  })

  revalidatePath('/engineering-admin/dashboard')
  revalidatePath('/engineering-admin/tasks')
  return { success: true }
}

// Reject Inspection & Request Rework (ENGINEERING_ADMIN only)
export async function rejectInspection(ticketId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING_ADMIN' && profile?.role !== 'ADMIN') {
    return { error: 'Hanya Engineering Admin' }
  }

  if (!ticketId) return { error: 'ID tiket tidak valid' }

  // Move back to ASSIGNED for rework
  const { error } = await supabase.from('tickets').update({
    status: 'ASSIGNED',
    initial_inspection_notes: null,
    inspection_completed_at: null,
  }).eq('id', ticketId)

  if (error) return { error: error.message }

  // Log history
  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'INSPECTION_REJECTED',
    description: `Analisis ditolak: ${reason || 'Mohon perbaiki hasil inspeksi'}`,
  })

  revalidatePath('/engineering-admin/dashboard')
  return { success: true }
}

// Update Scheduled Time (ENGINEERING_ADMIN only)
export async function updateScheduledTime(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING_ADMIN' && profile?.role !== 'ADMIN') {
    return { error: 'Hanya Engineering Admin' }
  }

  const ticketId = formData.get('ticket_id') as string
  const scheduledAt = formData.get('scheduled_at') as string

  if (!ticketId) return { error: 'ID tiket tidak valid' }

  const { error } = await supabase.from('tickets').update({
    scheduled_at: scheduledAt || null,
  }).eq('id', ticketId)

  if (error) return { error: error.message }

  // Log history
  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'RESCHEDULE',
    description: `Jadwal diubah ke ${scheduledAt ? new Date(scheduledAt).toLocaleString('id-ID') : 'dihilangkan'}`,
  })

  revalidatePath('/engineering-admin/dashboard')
  return { success: true }
}

// Update Ticket Priority (ENGINEERING_ADMIN only)
export async function updateTicketPriority(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login dulu' }

  const { data: profile } = await supabase.from('users').select('id, role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ENGINEERING_ADMIN' && profile?.role !== 'ADMIN') {
    return { error: 'Hanya Engineering Admin' }
  }

  const ticketId = formData.get('ticket_id') as string
  const priority = formData.get('priority') as string

  if (!ticketId || !priority) return { error: 'Data tidak lengkap' }

  const { error } = await supabase.from('tickets').update({
    priority: priority as 'NORMAL' | 'URGENT',
  }).eq('id', ticketId)

  if (error) return { error: error.message }

  // Log history
  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    user_id: profile.id,
    action: 'PRIORITY_CHANGE',
    description: `Prioritas diubah ke ${priority === 'URGENT' ? 'Urgent (Multi-Day)' : 'Normal (1 Hari)'}`,
  })

  revalidatePath('/engineering-admin/dashboard')
  return { success: true }
}
