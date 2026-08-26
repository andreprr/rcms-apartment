export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from '@/components/SettingsClient'
import type { UserRole } from '@/types/database'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, division, avatar_url, username, email, role, is_active')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <SettingsClient
      profile={{
        id: profile.id,
        full_name: profile.full_name,
        division: profile.division,
        avatar_url: profile.avatar_url,
        username: profile.username,
        email: profile.email,
        role: profile.role as UserRole,
        is_active: profile.is_active,
      }}
    />
  )
}
