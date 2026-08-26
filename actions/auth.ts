'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function registerUser(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } = {} } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('users').select('role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ADMIN') return { error: 'Hanya Admin' }

  const fullName = formData.get('full_name') as string
  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const division = formData.get('division') as string
  const role = formData.get('role') as string

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName, role }
  })
  if (authErr) return { error: authErr.message }

  const { error: profileErr } = await supabase.from('users').insert({
    auth_user_id: authData.user?.id,
    full_name: fullName,
    username, email, division, role
  })
  if (profileErr) return { error: profileErr.message }
  return { success: true }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } = {} } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('users').select('role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ADMIN') return { error: 'Hanya Admin' }

  const { error } = await supabase.from('users').update({ is_active: isActive }).eq('id', userId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient()
  const { data: { user } = {} } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('users').select('role').eq('auth_user_id', user.id).single()
  if (profile?.role !== 'ADMIN') return { error: 'Hanya Admin' }

  const { error } = await supabase.from('users').update({ role }).eq('id', userId)
  if (error) return { error: error.message }
  return { success: true }
}
