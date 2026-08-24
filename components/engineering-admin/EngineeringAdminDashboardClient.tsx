'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  UserCheck,
  ChevronRight,
  Loader2,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import AssignTechniciansModal from '@/components/engineering-admin/AssignTechniciansModal'
import AutoFinishTimer from '@/components/engineering-admin/AutoFinishTimer'

interface Ticket {
  id: string
  ticket_number: string
  problem: string
  status: string
  created_at: string
  submitted_at: string | null
  units: { unit_code: string; floor: number; unit_number: string } | null
  complaint_categories: { name: string } | null
  ticket_assignments: Array<{
    users: { full_name: string } | null
  }> | null
}

interface Stats {
  total: number
  new: number
  assigned: number
  inProgress: number
  waitingConfirmation: number
}

export default function EngineeringAdminDashboardClient() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'pending'>('incoming')
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch tickets
  useEffect(() => {
    async function fetchTickets() {
      setLoading(true)
      try {
        const response = await fetch('/api/engineering-admin/tickets')
        const data = await response.json()
        if (data.tickets) {
          setTickets(data.tickets)
        }
      } catch (error) {
        console.error('Failed to fetch tickets:', error)
      }
      setLoading(false)
    }

    fetchTickets()
  }, [refreshKey])

  // Filter tickets by tab
  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'incoming') return t.status === 'NEW'
    if (activeTab === 'active') return ['ASSIGNED', 'ON_PROGRESS'].includes(t.status)
    if (activeTab === 'pending') return t.status === 'WAITING_CONFIRMATION'
    return false
  })

  // Calculate stats
  const stats: Stats = {
    total: tickets.length,
    new: tickets.filter(t => t.status === 'NEW').length,
    assigned: tickets.filter(t => t.status === 'ASSIGNED').length,
    inProgress: tickets.filter(t => t.status === 'ON_PROGRESS').length,
    waitingConfirmation: tickets.filter(t => t.status === 'WAITING_CONFIRMATION').length
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

  // Open assign modal
  function openAssignModal(ticket: Ticket) {
    setSelectedTicket(ticket)
    setShowAssignModal(true)
  }

  // Refresh handler
  function handleRefresh() {
    setRefreshKey(k => k + 1)
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          <p className="text-sm text-slate-500">Total</p>
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
          <p className="text-sm text-slate-500">Baru</p>
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
          <p className="text-2xl font-bold text-slate-800">{stats.assigned + stats.inProgress}</p>
          <p className="text-sm text-slate-500">Aktif</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.waitingConfirmation}</p>
          <p className="text-sm text-slate-500">Pending</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {tickets.filter(t => t.status === 'COMPLETED').length}
          </p>
          <p className="text-sm text-slate-500">Selesai</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-100/80">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'incoming'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Incoming ({stats.new})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'active'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Active ({stats.assigned + stats.inProgress})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'pending'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Pending Review ({stats.waitingConfirmation})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">Tidak ada tiket</p>
              <p className="text-sm text-slate-400 mt-1">Tidak ada tiket dalam kategori ini</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket, index) => {
                const statusStyle = getStatusStyle(ticket.status)
                const assignedNames = ticket.ticket_assignments
                  ?.map(a => a.users?.full_name)
                  .filter(Boolean)
                  .join(', ') || null

                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-slate-50/50 rounded-xl border border-slate-100 p-5 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Ticket Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-slate-800">{ticket.ticket_number}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                            {statusStyle.label}
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium mb-1">{ticket.problem}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>{ticket.units?.unit_code}</span>
                          <span>•</span>
                          <span>{ticket.complaint_categories?.name}</span>
                          <span>•</span>
                          <span>{new Date(ticket.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                        {assignedNames && (
                          <div className="flex items-center gap-2 mt-2">
                            <UserCheck className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">{assignedNames}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions & Timer */}
                      <div className="flex items-center gap-3">
                        {/* Auto Finish Timer for Pending */}
                        {ticket.status === 'WAITING_CONFIRMATION' && ticket.submitted_at && (
                          <div className="hidden md:block">
                            <AutoFinishTimer
                              ticketId={ticket.id}
                              submittedAt={ticket.submitted_at}
                              onComplete={handleRefresh}
                            />
                          </div>
                        )}

                        {/* Assign Button */}
                        {ticket.status === 'NEW' && (
                          <button
                            onClick={() => openAssignModal(ticket)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                          >
                            <Wrench className="w-4 h-4" />
                            Tugaskan
                          </button>
                        )}

                        {/* View Detail */}
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 bg-white border border-slate-200 rounded-xl hover:border-blue-200 transition-colors"
                        >
                          Detail
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Auto Finish Timer for Pending (Mobile) */}
                    {ticket.status === 'WAITING_CONFIRMATION' && ticket.submitted_at && (
                      <div className="mt-4 md:hidden">
                        <AutoFinishTimer
                          ticketId={ticket.id}
                          submittedAt={ticket.submitted_at}
                          onComplete={handleRefresh}
                        />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {selectedTicket && (
        <AssignTechniciansModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedTicket(null)
          }}
          ticketId={selectedTicket.id}
          ticketNumber={selectedTicket.ticket_number}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  )
}
