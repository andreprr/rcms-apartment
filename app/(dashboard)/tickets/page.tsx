import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, Ticket as TicketIcon, Filter, Clock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'

export default async function TicketsPage() {
  const supabase = await createClient()

  const { data: tickets } = await supabase
    .from('tickets')
    .select(`
      id,
      ticket_number,
      ticket_date,
      problem,
      status,
      units(unit_code),
      complaint_categories(name)
    `)
    .order('created_at', { ascending: false })

  // Fungsi pembantu untuk warna status
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daftar Tiket</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau dan kelola laporan keluhan warga.</p>
        </div>
        <Link 
          href="/tickets/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Buat Tiket Baru
        </Link>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar (Search & Filter) */}
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
                <th className="px-6 py-4">Kategori</th>
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
                          Unit <strong className="text-slate-700">{ticket.units?.unit_code}</strong> • {new Date(ticket.ticket_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {ticket.complaint_categories?.name}
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
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all group-hover:shadow-sm"
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
  )
}