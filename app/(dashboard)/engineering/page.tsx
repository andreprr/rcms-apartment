export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EngineeringDashboardClient from '@/components/engineering/EngineeringDashboard'
import type { UserRole } from '@/types/database'

export default async function EngineeringDashboardPage() {
  const supabase = await createClient()

  // Check user auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name, division, avatar_url')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || (profile.role !== 'ENGINEERING' && profile.role !== 'ADMIN')) {
    redirect('/dashboard')
  }

  const userProfile = {
    full_name: profile.full_name || 'Teknisi',
    division: profile.division || 'Engineering',
    avatar_url: profile.avatar_url,
    role: profile.role as UserRole
  }

  return <EngineeringDashboardClient userProfile={userProfile} />
}
