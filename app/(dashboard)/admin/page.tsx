export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminUserManagementClient from '@/components/admin/AdminUserManagementClient'
import type { UserRole } from '@/types/database'

export default async function AdminPage() {
  const supabase = await createClient()

  // Check user auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check admin role
  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name, division, avatar_url')
    .eq('auth_user_id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Fetch all users for table
  const { data: allUsersData } = await supabase
    .from('users')
    .select('id, auth_user_id, full_name, username, email, role, is_active, created_at')
    .order('created_at', { ascending: false })

  const userProfile = {
    full_name: profile.full_name,
    division: profile.division || 'Admin',
    avatar_url: profile.avatar_url,
    role: profile.role as UserRole
  }

  return (
    <AdminUserManagementClient
      initialUsers={(allUsersData || []) as any}
      userProfile={userProfile}
    />
  )
}
