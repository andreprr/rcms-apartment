export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EngineeringDashboardClient from '@/components/engineering/EngineeringDashboardClient'
import { Wrench } from 'lucide-react'

export default async function EngineeringPage() {
  const supabase = await createClient()

  // Check user auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check user role
  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || (profile.role !== 'ENGINEERING' && profile.role !== 'ADMIN')) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Wrench className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Tickets</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Welcome, {profile.full_name}
          </p>
        </div>
      </div>

      {/* Client Component */}
      <EngineeringDashboardClient />
    </div>
  )
}
