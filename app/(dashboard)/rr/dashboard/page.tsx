export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RRDashboardContent from '@/components/rr/RRDashboardContent'
import type { UserRole } from '@/types/database'

export default async function RRDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name, division, avatar_url')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || (profile.role !== 'RR' && profile.role !== 'ADMIN')) {
    redirect('/dashboard')
  }

  const userProfile = {
    full_name: profile.full_name,
    division: profile.division || 'RR',
    avatar_url: profile.avatar_url,
    role: profile.role as UserRole
  }

  return <RRDashboardContent userProfile={userProfile} />
}
