'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Image as ImageIcon,
  X,
  User,
  Building2,
  Calendar,
  ChevronRight,
  Loader2,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { UserRole } from '@/types/database'

interface Ticket {
  id: string
  ticket_number: string
  problem: string
  status: string
  created_at: string
  unit_code: string
  resident_name: string
  current_assignee_id?: string
  current_stage?: string
  assignments?: {
    engineering?: {
      full_name: string
      avatar_url?: string
    }
  }
}

interface UserProfile {
  full_name: string
  division: string
  avatar_url?: string
  role: UserRole
}

export default function RRTasksPage({ userProfile }: { userProfile: UserProfile }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'onProgress' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

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
      ticket.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.unit_code.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === 'onProgress') {
      return matchesSearch && ['ASSIGNED', 'ON_PROGRESS'].includes(ticket.status)
    }
    if (activeTab === 'completed') {
      return matchesSearch && ticket.status === 'COMPLETED'
    }
    return matchesSearch
  })

  // Fetch photo URLs for a ticket
  async function fetchTicketPhotos(ticketId: string) {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/photos`)
      const data = await response.json()
      if (data.photos) {
        setPhotoUrls(data.photos.map((p: any) => p.storage_path))
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    }
  }

  // Get status style
  function getStatusStyle(status: string) {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      NEW: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'BARU' },
      ASSIGNED: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'DITUGASKAN' },
      ON_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'DIPROSES' },
      WAITING_CONFIRMATION: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'MENUNGGU KONFIRMASI' },
      COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'SELESAI' },
    }
    return styles[status] || { bg: 'bg-slate-50', text: 'text-slate-700', label: status }
  }

  // Open photo modal
  async function openPhotoModal(ticket: Ticket) {
    setSelectedTicket(ticket)
    await fetchTicketPhotos(ticket.id)
    setShowPhotoModal(true)
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
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Task Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Kelola dan pantau progress tiket pekerjaan.</p>
          </div>
          <Link
            href="/rr/ticket-maker"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <Ticket className="w-4 h-4" />
            Buat Tiket Baru
          </Link>
        </div>
      </motion.div>

      {/* Tab Switcher */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      >
        <div className="flex border-b border-purple-100">
          {[
            { key: 'all', label: 'Total Tickets', count: tickets.length, icon: Ticket },
            { key: 'onProgress', label: 'On Progress', count: tickets.filter(t => ['ASSIGNED', 'ON_PROGRESS'].includes(t.status)).length, icon: Clock },
            { key: 'completed', label: 'Selesai', count: tickets.filter(t => t.status === 'COMPLETED').length, icon: CheckCircle2 },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.key
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label} ({tab.count})
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="p-4 border-b border-purple-50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tiket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
            />
          </div>
        </div>

        {/* Ticket List */}
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Tidak ada tiket ditemukan</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredTickets.map((ticket, index) => {
                const statusStyle = getStatusStyle(ticket.status)
                const engineer = ticket.assignments?.engineering

                return (
                  <motion.div
                    key={ticket.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-slate-50/50 rounded-xl border border-slate-100 p-4 hover:border-purple-200 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Ticket Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-slate-800">{ticket.ticket_number}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                            {statusStyle.label}
                          </span>
                          {ticket.current_stage && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                              {ticket.current_stage}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 font-medium mb-2">{ticket.problem}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {ticket.unit_code}
                          </span>
                          <span>{ticket.resident_name}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Engineer Info (for On Progress) */}
                      {engineer && ['ASSIGNED', 'ON_PROGRESS'].includes(ticket.status) && (
                        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-100">
                          {engineer.avatar_url ? (
                            <Image
                              src={engineer.avatar_url}
                              alt={engineer.full_name}
                              width={36}
                              height={36}
                              className="w-9 h-9 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                              {engineer.full_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-slate-400">Teknisi</p>
                            <p className="text-sm font-medium text-slate-700">{engineer.full_name}</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {ticket.status === 'COMPLETED' && (
                          <button
                            onClick={() => openPhotoModal(ticket)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-sm font-medium rounded-xl transition-colors border border-emerald-200"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Foto After
                          </button>
                        )}
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-purple-200 hover:text-purple-600 transition-colors"
                        >
                          Detail
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Photo Modal */}
      <AnimatePresence>
        {showPhotoModal && selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPhotoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Foto After Perbaikan</h3>
                  <p className="text-sm text-slate-500">{selectedTicket.ticket_number}</p>
                </div>
                <button
                  onClick={() => setShowPhotoModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6">
                {photoUrls.length === 0 ? (
                  <div className="text-center py-8">
                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Tidak ada foto tersedia</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {photoUrls.map((url, i) => (
                      <div key={i} className="aspect-video bg-slate-100 rounded-xl overflow-hidden">
                        <Image
                          src={url}
                          alt={`Foto ${i + 1}`}
                          width={400}
                          height={225}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
