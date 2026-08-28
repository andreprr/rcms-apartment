'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Ticket,
  Loader2,
  Search,
  XCircle,
  Archive,
  Building2,
  User,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import type { UserRole } from '@/types/database'

interface Ticket {
  id: string
  ticket_number: string
  problem: string
  status: string
  unit_code: string
  resident_name: string
  created_at: string
  is_archived: boolean
  cancelled_at?: string
  cancellation_reason?: string
  creator?: { full_name: string }
  assignee?: { full_name: string }
}

interface UserProfile {
  full_name: string
  division: string
  avatar_url?: string
  role: UserRole
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'BARU', color: 'text-blue-600', bg: 'bg-blue-50' },
  ASSIGNED: { label: 'DITUGASKAN', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ON_PROGRESS: { label: 'DIPROSES', color: 'text-amber-600', bg: 'bg-amber-50' },
  WAITING_CONFIRMATION: { label: 'MENUNGGU', color: 'text-purple-600', bg: 'bg-purple-50' },
  COMPLETED: { label: 'SELESAI', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  REWORK: { label: 'REWORK', color: 'text-rose-600', bg: 'bg-rose-50' },
  CANCELLED: { label: 'DIBATALKAN', color: 'text-slate-600', bg: 'bg-slate-100' },
}

export default function AdminTicketsClient({
  initialTickets
}: {
  initialTickets: Ticket[]
  userProfile: UserProfile
}) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = !searchQuery ||
        ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.unit_code.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [tickets, searchQuery, statusFilter])

  const openCancelModal = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setCancelReason('')
    setShowCancelModal(true)
  }

  const handleCancel = async () => {
    if (!selectedTicket || !cancelReason.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancellation_reason: cancelReason,
        }),
      })

      if (response.ok) {
        setTickets(tickets.map(t =>
          t.id === selectedTicket.id
            ? { ...t, status: 'CANCELLED', cancelled_at: new Date().toISOString(), cancellation_reason: cancelReason }
            : t
        ))
        setShowCancelModal(false)
      }
    } catch (err) {
      console.error('Failed to cancel ticket:', err)
    }
    setIsSubmitting(false)
  }

  const handleArchive = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: true }),
      })

      if (response.ok) {
        setTickets(tickets.map(t =>
          t.id === ticketId ? { ...t, is_archived: true } : t
        ))
      }
    } catch (err) {
      console.error('Failed to archive ticket:', err)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Ticket Control</h1>
        <p className="text-sm text-slate-500 mt-0.5">Batalkan dan arsip tiket masalah.</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tiket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none"
        >
          <option value="all">Semua Status</option>
          <option value="NEW">Baru</option>
          <option value="ASSIGNED">Ditugaskan</option>
          <option value="ON_PROGRESS">Diproses</option>
          <option value="WAITING_CONFIRMATION">Menunggu</option>
          <option value="COMPLETED">Selesai</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
      </div>

      {/* Tickets List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tiket</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Lokasi</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tanggal</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map((ticket) => {
                const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.NEW
                return (
                  <tr key={ticket.id} className={`hover:bg-slate-50/50 transition-colors ${ticket.is_archived ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">{ticket.ticket_number}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{ticket.problem}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                      {ticket.is_archived && (
                        <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-600">
                          ARCHIVED
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {ticket.unit_code}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        {ticket.resident_name}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {new Date(ticket.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {ticket.status !== 'CANCELLED' && !ticket.is_archived && (
                          <button
                            onClick={() => openCancelModal(ticket)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Batalkan Tiket"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                        {!ticket.is_archived && (
                          <button
                            onClick={() => handleArchive(ticket.id)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Arsipkan"
                          >
                            <Archive className="w-5 h-5" />
                          </button>
                        )}
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 bg-red-50 rounded-t-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Batalkan Tiket</h3>
                  <p className="text-sm text-slate-500">{selectedTicket.ticket_number}</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alasan Pembatalan</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none resize-none"
                    placeholder="Jelaskan alasan pembatalan..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSubmitting || !cancelReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Konfirmasi Batal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
