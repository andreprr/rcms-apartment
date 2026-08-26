export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EngineeringAdminTeamPage from '@/components/engineering-admin/TeamPage'

export default async function TeamPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || profile.role !== 'ENGINEERING_ADMIN') {
    redirect('/dashboard')
  }

  return <EngineeringAdminTeamPage />
}
