export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Ticket, Clock, Wrench, CheckCircle2, TrendingUp, Building2 } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Ambil profil user yang login
  const { data: { user } } = await supabase.auth.getUser()
  let profile = null
  if (user) {
    const { data } = await supabase.from('users').select('*').eq('auth_user_id', user.id).single()
    profile = data
  }

  // 2. Ambil data statistik dari database
  // Total Tiket
  const { count: totalTickets } = await supabase.from('tickets').select('*', { count: 'exact', head: true })
  // Tiket Baru
  const { count: newTickets } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'NEW')
  // Tiket Dikerjakan
  const { count: progressTickets } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).in('status', ['ON_PROGRESS', 'WAITING_CONFIRMATION'])
  // Tiket Selesai
  const { count: completedTickets } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED')

  // Data 5 Tiket Terbaru untuk tabel ringkasan
  const { data: recentTickets } = await supabase
    .from('tickets')
    .select('id, ticket_number, status, problem, created_at, units(unit_code)')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Ucapan Selamat Datang */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Selamat datang, {profile?.full_name || 'Karyawan'}!</h1>
          <p className="text-blue-100 text-lg">Anda login sebagai <span className="font-semibold bg-white/20 px-3 py-1 rounded-full text-sm ml-1">{profile?.role}</span></p>
        </div>
        <Building2 className="absolute right-8 -bottom-8 w-48 h-48 text-white/10" />
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Ticket className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Laporan</p>
            <p className="text-2xl font-bold text-slate-800">{totalTickets || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Laporan Baru</p>
            <p className="text-2xl font-bold text-slate-800">{newTickets || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Wrench className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Sedang Dikerjakan</p>
            <p className="text-2xl font-bold text-slate-800">{progressTickets || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Telah Selesai</p>
            <p className="text-2xl font-bold text-slate-800">{completedTickets || 0}</p>
          </div>
        </div>
      </div>

      {/* Ringkasan Tiket Terbaru (Hanya Muncul untuk ADMIN, BM, SPV) */}
      {(profile?.role === 'ADMIN' || profile?.role === 'BM' || profile?.role === 'SPV' || profile?.role === 'BUILDING_MANAGER') && (
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
                {recentTickets?.map((ticket: any) => (
                  <tr key={ticket.id}>
                    <td className="px-4 py-4 font-semibold text-slate-800">{ticket.ticket_number}</td>
                    <td className="px-4 py-4 text-slate-600">{ticket.units?.unit_code}</td>
                    <td className="px-4 py-4 text-slate-600 truncate max-w-xs">{ticket.problem}</td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}