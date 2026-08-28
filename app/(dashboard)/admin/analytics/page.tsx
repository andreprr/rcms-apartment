export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminAnalyticsClient from '@/components/admin/AdminAnalyticsClient'
import type { UserRole } from '@/types/database'

export default async function AdminAnalyticsPage() {
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
    .select(
      'id, ticket_number, unit_code, resident_name, problem, status, ' +
      'created_at, started_at, submitted_at, completed_at, cancelled_at, ' +
      'current_assignee_id, is_archived'
    )

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, role, division, is_active')

  const { data: dailyLogs } = await supabase
    .from('ticket_daily_logs')
    .select('id, ticket_id, engineering_id, day_number, duration_minutes, action_type, created_at')

  const { data: confirmations } = await supabase
    .from('ticket_confirmations')
    .select('id, ticket_id, rating, comment, is_visible, confirmed_at')

  const userProfile = {
    full_name: profile.full_name || 'Admin',
    division: profile.division || 'Super Admin',
    avatar_url: profile.avatar_url,
    role: profile.role as UserRole,
  }

  return (
    <AdminAnalyticsClient
      userProfile={userProfile}
      initialTickets={(tickets || []) as any}
      initialUsers={(users || []) as any}
      initialDailyLogs={(dailyLogs || []) as any}
      initialConfirmations={(confirmations || []) as any}
    />
  )
}
