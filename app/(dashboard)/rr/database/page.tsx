'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database as DatabaseIcon,
  Search,
  Filter,
  Download,
  Printer,
  Building2,
  User,
  Phone,
  ChevronRight,
  Loader2,
  X,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { Loader2 as LoaderIcon } from 'lucide-react'

interface Ticket {
  id: string
  ticket_number: string
  unit_code: string
  resident_name: string
  phone_number: string
  problem: string
  status: string
  created_at: string
}

export default function RRDatabasePage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [unitFilter, setUnitFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch tickets
  useEffect(() => {
    async function fetchTickets() {
      setLoading(true)
      try {
        const response = await fetch('/api/rr/tickets')
        const result = await response.json()
        if (result.tickets) {
          setTickets(result.tickets)
        }
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
      setLoading(false)
    }
    fetchTickets()
  }, [])

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchQuery ||
      ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.unit_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.resident_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.problem.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !statusFilter || ticket.status === statusFilter
    const matchesUnit = !unitFilter || ticket.unit_code.toLowerCase().includes(unitFilter.toLowerCase())

    return matchesSearch && matchesStatus && matchesUnit
  })

  // Get unique units for filter dropdown
  const uniqueUnits = [...new Set(tickets.map(t => t.unit_code))]

  // Get status style
  function getStatusStyle(status: string) {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      NEW: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'BARU' },
      ASSIGNED: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'DITUGASKAN' },
      ON_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'DIPROSES' },
      WAITING_CONFIRMATION: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'MENUNGGU KONFIRMASI' },
      COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'SELESAI' },
      ON_HOLD: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'DIHENTIKAN' },
      CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', label: 'DIBATALKAN' },
    }
    return styles[status] || { bg: 'bg-slate-50', text: 'text-slate-700', label: status }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Database Arsip</h1>
            <p className="text-sm text-slate-500 mt-0.5">Arsip lengkap pengaduan warga. {filteredTickets.length} data ditemukan.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      >
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari no. tiket, unit, nama, keluhan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
                showFilters || statusFilter || unitFilter
                  ? 'bg-purple-50 border-purple-200 text-purple-600'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Unit Code</label>
                  <input
                    type="text"
                    placeholder="cth: SA.2"
                    value={unitFilter}
                    onChange={(e) => setUnitFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="">Semua Status</option>
                    <option value="NEW">Baru</option>
                    <option value="ASSIGNED">Ditugaskan</option>
                    <option value="ON_PROGRESS">Diproses</option>
                    <option value="WAITING_CONFIRMATION">Menunggu Konfirmasi</option>
                    <option value="COMPLETED">Selesai</option>
                    <option value="ON_HOLD">Dihentikan</option>
                    <option value="CANCELLED">Dibatalkan</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => {
                      setStatusFilter('')
                      setUnitFilter('')
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tiket</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Warga</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Telepon</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tanggal</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <LoaderIcon className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <DatabaseIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Tidak ada data ditemukan</p>
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
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800">{ticket.ticket_number}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{ticket.unit_code}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{ticket.resident_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{ticket.phone_number}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(ticket.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/tickets/${ticket.id}/print`}
                            target="_blank"
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Cetak Ulang"
                          >
                            <Printer className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
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
