'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createTicket(formData: FormData) {
  const supabase = await createClient()

  // 1. Cek User & Role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login terlebih dahulu.' }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()

  // Hanya RR dan ADMIN yang boleh membuat tiket
  if (!profile || (profile.role !== 'RR' && profile.role !== 'ADMIN')) {
    return { error: 'Anda tidak memiliki hak akses untuk membuat tiket.' }
  }

  // 2. Ambil data dari Form
  const unit_id = formData.get('unit_id') as string
  const category_id = formData.get('category_id') as string
  const problem = formData.get('problem') as string
  const description = formData.get('description') as string

  if (!unit_id || !category_id || !problem) {
    return { error: 'Mohon lengkapi semua kolom yang wajib diisi (*).' }
  }

  // 3. Panggil fungsi PostgreSQL yang sudah kita buat di SQL Editor
  const { data, error } = await supabase.rpc('create_ticket_transaction', {
    p_unit_id: unit_id,
    p_category_id: category_id,
    p_problem: problem,
    p_description: description,
    p_created_by: profile.id
  })

  if (error) {
    console.error('Database Error:', error)
    return { error: 'Gagal membuat tiket. Silakan coba lagi.' }
  }

  // 4. Jika sukses, perbarui data halaman tiket
  revalidatePath('/tickets')
  revalidatePath('/dashboard')

  // 5. Kembalikan data tiket untuk modal
  return {
    success: true,
    ticket: {
      id: data.id,
      ticket_number: data.ticket_number
    }
  }
}

export async function updateTicketStatus(formData: FormData) {
  const supabase = await createClient()

  const ticketId = formData.get('ticket_id') as string
  const newStatus = formData.get('status') as string
  const description = formData.get('description') as string

  // 1. Cek User & Role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi Anda telah berakhir.' }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name')
    .eq('auth_user_id', user.id)
    .single()

  // Hanya ENGINEERING dan ADMIN yang boleh mengubah status
  if (!profile || (profile.role !== 'ENGINEERING' && profile.role !== 'ADMIN')) {
    return { error: 'Anda tidak memiliki hak akses untuk mengubah status tiket.' }
  }

  // 2. Update Status Tiket di Database
  const { error: updateError } = await supabase
    .from('tickets')
    .update({ status: newStatus })
    .eq('id', ticketId)

  if (updateError) {
    console.error('Update Error:', updateError)
    return { error: 'Gagal memperbarui status tiket.' }
  }

  // 3. Catat Riwayat (History)
  const historyText = description ? description : `Status diperbarui menjadi ${newStatus.replace('_', ' ')} oleh ${profile.full_name}`

  await supabase.from('ticket_history').insert({
    ticket_id: ticketId,
    action: newStatus,
    description: historyText,
    created_by: profile.id
  })

  // 4. Refresh Halaman Detail
  revalidatePath(`/tickets/${ticketId}`)
  return { success: true }
}
