export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Dashboard from '@/components/pengurus/Dashboard'
import type { UserRole } from '@/types/database'

export default async function PengurusDashboardPage() {
  const supabase = await createClient()

  // Check user auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check Pengurus role
  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name, division, avatar_url')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || (profile.role !== 'PENGURUS' && profile.role !== 'ADMIN')) {
    redirect('/dashboard')
  }

  const userProfile = {
    full_name: profile.full_name,
    division: profile.division || 'Management',
    avatar_url: profile.avatar_url,
    role: profile.role as UserRole
  }

  return (
    <Dashboard userProfile={userProfile} />
  )
}
