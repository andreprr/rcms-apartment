export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RRDashboardClient from '@/components/rr/RRDashboardClient'
import { Building2, User, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function RRDashboardPage() {
  const supabase = await createClient()

  // Check user auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check RR or Admin role
  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || (profile.role !== 'RR' && profile.role !== 'ADMIN')) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Dashboard RR</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Welcome, {profile.full_name}
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/tickets/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          Buat Tiket Baru
        </Link>
      </div>

      {/* Client Component */}
      <RRDashboardClient />
    </div>
  )
}
