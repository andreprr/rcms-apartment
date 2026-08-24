export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { Building2, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Ambil profil user yang login
  const { data: { user } } = await supabase.auth.getUser()
  let profile = null
  if (user) {
    const { data } = await supabase.from('users').select('*').eq('auth_user_id', user.id).single()
    profile = data
  }

  // 2. Ambil data statistik lengkap dari Supabase
  const { count: totalTickets } = await supabase.from('tickets').select('*', { count: 'exact', head: true })
  const { count: newTickets } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'NEW')
  const { count: progressTickets } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'ON_PROGRESS')
  const { count: waitingTickets } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'WAITING_CONFIRMATION')
  const { count: completedTickets } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED')
  const { count: reworkTickets } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'REWORK')
  const { count: onHoldTickets } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'ON_HOLD')

  // 3. Ambil 5 Tiket Terbaru untuk Tabel Pantauan
  const { data: recentTickets } = await supabase
    .from('tickets')
    .select('id, ticket_number, status, problem, created_at, units(unit_code)')
    .order('created_at', { ascending: false })
    .limit(5)

  // 4. Data ringkasan untuk dipasok ke Grafik Modern DashboardClient
  const initialStats = {
    total: totalTickets || 0,
    newCount: newTickets || 0,
    onProgress: progressTickets || 0,
    waitingConfirmation: waitingTickets || 0,
    completed: completedTickets || 0,
    rework: reworkTickets || 0,
    onHold: onHoldTickets || 0,
  }

  const statusData = [
    { name: 'NEW', value: newTickets || 0 },
    { name: 'ON_PROGRESS', value: progressTickets || 0 },
    { name: 'WAITING_CONFIRMATION', value: waitingTickets || 0 },
    { name: 'COMPLETED', value: completedTickets || 0 },
    { name: 'REWORK', value: reworkTickets || 0 },
    { name: 'ON_HOLD', value: onHoldTickets || 0 },
  ]

  // Placeholder data grafik (bisa diintegrasikan dengan RPC query agregat Supabase nantinya)
  const trendData = [
    { date: 'Hari Ini', total: totalTickets || 0 }
  ]

  const categoryData = [
    { category: 'Kebocoran', count: 0 },
    { category: 'Plumbing', count: 0 },
    { category: 'Kelistrikan', count: 0 },
    { category: 'AC', count: 0 },
  ]

  const workloadData = [
    { engineer: 'Teknisi Field', assigned: progressTickets || 0, completed: completedTickets || 0 }
  ]

  // Role check untuk hak melihat tabel ringkasan tiket (ADMIN, RR, ENGINEERING_ADMIN, MANAGEMENT)
  const canViewRecentTable = ['ADMIN', 'RR', 'ENGINEERING_ADMIN', 'MANAGEMENT'].includes(profile?.role || '')

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6">
      {/* Banner Ucapan Selamat Datang */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Selamat datang, {profile?.full_name || 'Pengguna'}!</h1>
          <p className="text-blue-100 text-lg">
            Anda login sebagai 
            <span className="font-semibold bg-white/20 px-3 py-1 rounded-full text-sm ml-2 backdrop-blur-sm">
              {profile?.role || 'ENGINEERING'}
            </span>
          </p>
        </div>
        <Building2 className="absolute right-8 -bottom-8 w-48 h-48 text-white/10 pointer-events-none" />
      </div>

      {/* Komponen Grafik Modern Interaktif & Filter Tanggal */}
      <DashboardClient
        initialStats={initialStats}
        trendData={trendData}
        statusData={statusData}
        categoryData={categoryData}
        workloadData={workloadData}
      />

      {/* Ringkasan Tiket Terbaru (Sesuai Hak Akses Role V1.2) */}
      {canViewRecentTable && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" /> Pantauan Tiket Terbaru
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">No. Tiket</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Keluhan</th>
                  <th className="px-4 py-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTickets && recentTickets.length > 0 ? (
                  recentTickets.map((ticket: any) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 font-semibold text-slate-800">{ticket.ticket_number}</td>
                      <td className="px-4 py-4 text-slate-600">{ticket.units?.unit_code || '-'}</td>
                      <td className="px-4 py-4 text-slate-600 truncate max-w-xs">{ticket.problem}</td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      Belum ada tiket pengaduan terbaru.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}