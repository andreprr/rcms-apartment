export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'
import type { UserRole } from '@/types/database'

export default async function AdminDashboardPage() {
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

  // Fetch stats
  const { data: users } = await supabase
    .from('users')
    .select('id, role, is_active')

  const { data: tickets } = await supabase
    .from('tickets')
    .select('status')

  const userProfile = {
    full_name: profile.full_name || 'Admin',
    division: profile.division || 'Super Admin',
    avatar_url: profile.avatar_url,
    role: profile.role as UserRole
  }

  const stats = {
    totalUsers: users?.length || 0,
    activeTickets: tickets?.filter(t => ['NEW', 'ASSIGNED', 'ON_PROGRESS', 'WAITING_CONFIRMATION'].includes(t.status)).length || 0,
    completedTickets: tickets?.filter(t => t.status === 'COMPLETED').length || 0,
    cancelledTickets: tickets?.filter(t => t.status === 'CANCELLED').length || 0,
  }

  return <AdminDashboardClient userProfile={userProfile} stats={stats} />
}
