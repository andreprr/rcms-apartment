export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminTicketsClient from '@/components/admin/AdminTicketsClient'
import type { UserRole } from '@/types/database'

export default async function AdminTicketsPage() {
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

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, creator:users!tickets_created_by_fkey(full_name), assignee:users!tickets_current_assignee_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const userProfile = {
    full_name: profile.full_name || 'Admin',
    division: profile.division || 'Super Admin',
    avatar_url: profile.avatar_url,
    role: profile.role as UserRole
  }

  return <AdminTicketsClient initialTickets={(tickets || []) as any} userProfile={userProfile} />
}
