export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EngineeringAdminTaskPage from '@/components/engineering-admin/EngineeringAdminTaskPage'

export default async function TasksPage() {
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

  const { data: engineers } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .eq('role', 'ENGINEERING')
    .eq('is_active', true)
    .order('full_name')

  return <EngineeringAdminTaskPage engineers={engineers || []} />
}
