export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminUsersClient from '@/components/admin/AdminUsersClient'
import type { UserRole } from '@/types/database'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name, division, avatar_url')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const { data: allUsers } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  const userProfile = {
    full_name: profile.full_name || 'Admin',
    division: profile.division || 'Super Admin',
    avatar_url: profile.avatar_url,
    role: profile.role as UserRole
  }

  return <AdminUsersClient initialUsers={(allUsers || []) as any} userProfile={userProfile} />
}
