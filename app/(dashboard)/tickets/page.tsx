import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Ticket as TicketIcon, Clock, AlertCircle, CheckCircle2, ChevronRight, Search, Filter } from 'lucide-react'
import type { UserRole } from '@/types/database'

export const dynamic = 'force-dynamic'

interface TicketsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const supabase = await createClient()

  // Get user profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, division, avatar_url, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: tickets } = await supabase
    .from('tickets')
    .select(`
      id,
      ticket_number,
      ticket_date,
      problem,
      status,
      unit_code,
      resident_name
    `)
    .order('created_at', { ascending: false })

  // Calculate stats
  const stats = {
    total: tickets?.length || 0,
    new: tickets?.filter(t => t.status === 'NEW').length || 0,
    onProgress: tickets?.filter(t => t.status === 'ON_PROGRESS').length || 0,
    completed: tickets?.filter(t => t.status === 'COMPLETED').length || 0
  }

  // Functions for status styling
  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'NEW': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'ON_PROGRESS': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'WAITING_CONFIRMATION': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'ON_HOLD': return 'bg-rose-50 text-rose-700 border-rose-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'NEW': return <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
      case 'ON_PROGRESS': return <Clock className="w-3.5 h-3.5 mr-1.5" />
      case 'COMPLETED': return <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
      default: return null
    }
  }

  const userProfile = {
    full_name: profile.full_name,
    division: profile.division || profile.role,
    avatar_url: profile.avatar_url,
    role: profile.role as UserRole
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search task..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Right Side - Notifications & Profile */}
            <div className="flex items-center gap-4">
              <Link
                href="/tickets/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                Buat Tiket Baru
              </Link>
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daftar Tiket</h1>
              <p className="text-sm text-slate-500 mt-0.5">Pantau dan kelola laporan keluhan warga.</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
            <p className="text-blue-100 text-sm font-medium">Total Tiket</p>
            <p className="text-3xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-slate-500 text-sm">Baru</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.new}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-slate-500 text-sm">Diproses</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.onProgress}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-slate-500 text-sm">Selesai</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.completed}</p>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari no. tiket, unit, atau keluhan..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filter Status
            </button>
          </div>

          {/* Table Area */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Informasi Tiket</th>
                  <th className="px-6 py-4">Nama Warga</th>
                  <th className="px-6 py-4">Keluhan Utama</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!tickets || tickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <TicketIcon className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-700">Tidak ada tiket</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-sm">Belum ada keluhan yang terdaftar di dalam sistem saat ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket: any) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{ticket.ticket_number}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            Unit <strong className="text-slate-700">{ticket.unit_code}</strong> &bull; {new Date(ticket.ticket_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {ticket.resident_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-700 max-w-xs truncate font-medium">
                          {ticket.problem}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                          title="Lihat Detail"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
