export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdministratorsAnalyticsClient from '@/components/pengurus/PengurusAnalyticsClient'
import type { UserRole } from '@/types/database'

export default async function AdministratorsAnalyticsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name, division, avatar_url')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || profile.role !== 'PENGURUS') {
    redirect('/dashboard')
  }

  const userProfile = {
    full_name: profile.full_name || 'Pengurus',
    division: profile.division || 'Executive',
    avatar_url: profile.avatar_url,
    role: profile.role as UserRole
  }

  return <AdministratorsAnalyticsClient userProfile={userProfile} />
}
