'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Search,
  Ticket,
  Printer,
  Clock,
  AlertCircle,
  CheckCircle2,
  Building2,
  FileText,
  Loader2,
  X
} from 'lucide-react'
import Link from 'next/link'

interface Ticket {
  id: string
  ticket_number: string
  problem: string
  status: string
  created_at: string
  units: { unit_code: string; floor: number; unit_number: string } | null
  complaint_categories: { name: string } | null
}

interface DateRange {
  start: string
  end: string
}

interface Stats {
  total: number
  new: number
  inProgress: number
  completed: number
}

export default function RRDashboardClient() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, new: 0, inProgress: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [printLoading, setPrintLoading] = useState(false)

  // Preset date ranges
  const presets = [
    { label: 'Hari Ini', getValue: () => {
      const today = new Date()
      return { start: today.toISOString().split('T')[0], end: today.toISOString().split('T')[0] }
    }},
    { label: '7 Hari Terakhir', getValue: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 7)
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
    }},
    { label: '30 Hari Terakhir', getValue: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
    }},
    { label: 'Bulan Ini', getValue: () => {
      const now = new Date()
      return { start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, end: now.toISOString().split('T')[0] }
    }},
  ]

  // Fetch tickets from API
  useEffect(() => {
    async function fetchTickets() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (dateRange?.start) params.append('startDate', dateRange.start)
        if (dateRange?.end) params.append('endDate', dateRange.end)
        if (statusFilter) params.append('status', statusFilter)

        const response = await fetch(`/api/rr/tickets?${params.toString()}`)
        const result = await response.json()

        if (result.tickets) {
          setTickets(result.tickets)
          setStats(result.stats)
        }
      } catch (error) {
        console.error('Failed to fetch tickets:', error)
      }
      setLoading(false)
    }

    fetchTickets()
  }, [dateRange, statusFilter])

  // Filter tickets locally for search
  const filteredTickets = tickets.filter(ticket => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      ticket.ticket_number.toLowerCase().includes(query) ||
      ticket.problem.toLowerCase().includes(query) ||
      ticket.units?.unit_code.toLowerCase().includes(query)
    )
  })

  // Toggle ticket selection
  function toggleTicket(id: string) {
    setSelectedTickets(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : [...prev, id]
    )
  }

  // Toggle all tickets
  function toggleAllTickets() {
    if (selectedTickets.length === filteredTickets.length) {
      setSelectedTickets([])
    } else {
      setSelectedTickets(filteredTickets.map(t => t.id))
    }
  }

  // Print selected tickets
  function printSelectedTickets() {
    setPrintLoading(true)
    // Open print page for first selected ticket
    if (selectedTickets.length > 0) {
      window.open(`/tickets/${selectedTickets[0]}/print`, '_blank')
    }
    setPrintLoading(false)
  }

  // Get status style
  function getStatusStyle(status: string) {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
      NEW: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      ON_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      WAITING_CONFIRMATION: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      ON_HOLD: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
      REWORK: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    }
    return styles[status] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-sm text-slate-500">Total Tiket</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.new}</p>
          <p className="text-sm text-slate-500">Tiket Baru</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.inProgress}</p>
          <p className="text-sm text-slate-500">Sedang Diproses</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.completed}</p>
          <p className="text-sm text-slate-500">Selesai</p>
        </motion.div>
      </div>

      {/* Main Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-white/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Daftar Tiket RR</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {filteredTickets.length} tiket ditemukan
                {dateRange && ` (${dateRange.start} s/d ${dateRange.end})`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Date Range Button */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all border ${
                    dateRange
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {dateRange ? `${dateRange.start} - ${dateRange.end}` : 'Pilih Tanggal'}
                  {dateRange && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDateRange(null)
                      }}
                      className="ml-1 hover:bg-blue-100 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </button>

                {/* Date Picker Dropdown */}
                <AnimatePresence>
                  {showDatePicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200/60 shadow-xl p-4 z-50 min-w-72"
                    >
                      {/* Presets */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {presets.map(preset => (
                          <button
                            key={preset.label}
                            onClick={() => {
                              setDateRange(preset.getValue())
                              setShowDatePicker(false)
                            }}
                            className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      {/* Custom Range */}
                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-slate-500 mb-1 block">Dari</label>
                            <input
                              type="date"
                              value={dateRange?.start || ''}
                              onChange={(e) => setDateRange(prev => ({ ...prev!, start: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-slate-500 mb-1 block">Sampai</label>
                            <input
                              type="date"
                              value={dateRange?.end || ''}
                              onChange={(e) => setDateRange(prev => ({ ...prev!, end: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="w-full px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          Terapkan
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-xl text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
              >
                <option value="">Semua Status</option>
                <option value="NEW">Baru</option>
                <option value="ON_PROGRESS">Sedang Diproses</option>
                <option value="WAITING_CONFIRMATION">Menunggu Konfirmasi</option>
                <option value="COMPLETED">Selesai</option>
                <option value="ON_HOLD">Dihentikan</option>
                <option value="REWORK">Revisi</option>
              </select>

              {/* Print Button */}
              <button
                onClick={printSelectedTickets}
                disabled={selectedTickets.length === 0 || printLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {printLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                Cetak Laporan ({selectedTickets.length})
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor tiket, keluhan, atau unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                    onChange={toggleAllTickets}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiket</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                        <Ticket className="w-7 h-7 text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-medium">Tidak ada tiket ditemukan</p>
                      <p className="text-sm text-slate-400 mt-1">Coba ubah filter atau tanggal pencarian</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket, index) => {
                  const statusStyle = getStatusStyle(ticket.status)
                  return (
                    <motion.tr
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className={`group hover:bg-slate-50/50 transition-colors ${selectedTickets.includes(ticket.id) ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTickets.includes(ticket.id)}
                          onChange={() => toggleTicket(ticket.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{ticket.ticket_number}</span>
                          <span className="text-sm text-slate-500 max-w-xs truncate">{ticket.problem}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-700">{ticket.units?.unit_code || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {ticket.complaint_categories?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(ticket.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/tickets/${ticket.id}/print`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Cetak
                          </Link>
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Detail
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
