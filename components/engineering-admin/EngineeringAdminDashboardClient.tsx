'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import TaskoDashboard from '@/components/dashboard/TaskoDashboard'
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  ChevronRight,
  Loader2,
  RefreshCw,
  Users,
  Plus,
  Filter,
  Search,
  Eye,
  Edit3,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileSearch,
  Camera
} from 'lucide-react'
import Link from 'next/link'
import { WeeklyBarChart, ChartLegend, AnalyticsCard } from '@/components/dashboard/AnalyticsWidgets'
import { ReminderCard, DonutCard } from '@/components/dashboard/RightWidgets'
import AssignTechniciansModal from '@/components/engineering-admin/AssignTechniciansModal'
import AutoFinishTimer from '@/components/engineering-admin/AutoFinishTimer'
import RescheduleModal from '@/components/engineering-admin/RescheduleModal'
import InspectionReviewModal from '@/components/engineering-admin/InspectionReviewModal'
import type { UserRole } from '@/types/database'

async function safeJson(res: Response) {
  const type = res.headers.get('content-type') || ''
  if (!type.includes('application/json')) return {}
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

interface Ticket {
  id: string
  ticket_number: string
  problem: string
  status: string
  created_at: string
  submitted_at: string | null
  unit_code: string
  resident_name: string
  phone_number?: string
  description?: string
  current_assignee_id: string | null
  assigned_technician_ids?: string[] | null
  priority: 'NORMAL' | 'URGENT'
  scheduled_at: string | null
  initial_inspection_notes: string | null
  inspection_completed_at: string | null
  inspection_approved_at?: string | null
  investigation_report?: string | null
  required_materials?: string[] | null
}

interface Stats {
  total: number
  new: number
  assigned: number
  waitingAnalysis: number
  inProgress: number
  waitingConfirmation: number
}

interface EngineeringAdminDashboardClientProps {
  userProfile: {
    full_name: string
    division: string
    avatar_url?: string
    role: UserRole
  }
}

export default function EngineeringAdminDashboardClient({ userProfile }: EngineeringAdminDashboardClientProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'waiting-analysis' | 'pending'>('incoming')
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch tickets
  useEffect(() => {
    async function fetchTickets() {
      setLoading(true)
      try {
        const response = await fetch('/api/engineering-admin/tickets')
        const data = await safeJson(response)
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

  // Calculate stats
  const stats: Stats = useMemo(() => ({
    total: tickets.length,
    new: tickets.filter(t => t.status === 'UNASSIGNED').length,
    assigned: tickets.filter(t => t.status === 'ASSIGNED').length,
    waitingAnalysis: tickets.filter(t => t.status === 'NEEDS_ANALYSIS').length,
    inProgress: tickets.filter(t => t.status === 'ON_PROGRESS').length,
    waitingConfirmation: tickets.filter(t => t.status === 'WAITING_CLIENT_CONFIRMATION').length
  }), [tickets])

  // Generate chart data - technician performance
  const chartData = useMemo(() => {
    // Simulate technician performance data
    const technicians = ['Andi', 'Budi', 'Dewi', 'Eko']
    return technicians.map(name => ({
      day: name,
      value: Math.floor(Math.random() * 10) + 3
    }))
  }, [])

  // Get technician queue for reminder panel
  const technicianQueue = useMemo(() => {
    const activeTickets = tickets.filter(t =>
      t.status === 'ASSIGNED' || t.status === 'ON_PROGRESS' || t.status === 'NEEDS_ANALYSIS'
    )
    return activeTickets.slice(0, 5).map((ticket, i) => ({
      id: ticket.id,
      time: `${9 + i}:00`,
      label: ticket.ticket_number,
      description: `${ticket.problem} - ${ticket.unit_code}`,
      priority: ticket.priority === 'URGENT' ? 'high' as const : 'medium' as const,
      action: {
        label: 'Detail',
        onClick: () => window.location.href = `/tickets/${ticket.id}`
      }
    }))
  }, [tickets])

  // Filter tickets by tab
  const filteredTickets = useMemo(() => {
    let filtered = tickets
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.ticket_number.toLowerCase().includes(query) ||
        t.problem.toLowerCase().includes(query) ||
        t.unit_code.toLowerCase().includes(query)
      )
    }
    if (activeTab === 'incoming') return filtered.filter(t => t.status === 'UNASSIGNED')
    if (activeTab === 'active') return filtered.filter(t => ['ASSIGNED', 'ON_PROGRESS', 'INVESTIGATION'].includes(t.status))
    if (activeTab === 'waiting-analysis') return filtered.filter(t => t.status === 'NEEDS_ANALYSIS')
    if (activeTab === 'pending') return filtered.filter(t => t.status === 'WAITING_CLIENT_CONFIRMATION')
    return filtered
  }, [tickets, activeTab, searchQuery])

  // Status distribution for donut
  const statusDistribution = [
    { label: 'Baru', value: stats.new, color: '#D2F377' },
    { label: 'Ditugaskan', value: stats.assigned, color: '#C5B4FC' },
    { label: 'Menunggu Analisis', value: stats.waitingAnalysis, color: '#FFEAA5' },
    { label: 'Diproses', value: stats.inProgress, color: '#FFC2BD' },
    { label: 'Pending', value: stats.waitingConfirmation, color: '#EC4899' },
  ]

  // KPI Stats
  const kpiStats = [
    {
      title: 'Total Tiket',
      value: stats.total,
      icon: <Ticket className="w-5 h-5 text-white" />,
      variant: 'primary' as const,
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Ditugaskan',
      value: stats.assigned,
      subtitle: 'Siap dikerjakan',
      icon: <Users className="w-5 h-5 text-indigo-600" />
    },
    {
      title: 'Menunggu Analisis',
      value: stats.waitingAnalysis,
      subtitle: 'Review inspeksi awal',
      icon: <FileSearch className="w-5 h-5 text-amber-600" />
    },
    {
      title: 'Sedang Diproses',
      value: stats.inProgress,
      subtitle: 'Pengerjaan aktif',
      icon: <Wrench className="w-5 h-5 text-red-600" />
    }
  ]

  // Get status style
  function getStatusStyle(status: string) {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      UNASSIGNED: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'BARU / UNASSIGNED' },
      ASSIGNED: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'DITUGASKAN' },
      INVESTIGATION: { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'INVESTIGASI' },
      NEEDS_ANALYSIS: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'ANALISIS KERUSAKAN' },
      RESCHEDULED: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'RESCHEDULE' },
      ON_PROGRESS: { bg: 'bg-red-50', text: 'text-red-700', label: 'DIPROSES' },
      REVIEW_FINISH: { bg: 'bg-teal-50', text: 'text-teal-700', label: 'REVIEW FINISH' },
      WAITING_CLIENT_CONFIRMATION: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'MENUNGGU TANGGAPAN CLIENT' },
      FINISHED: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'SELESAI' },
      CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'DIBATALKAN' },
    }
    return styles[status] || { bg: 'bg-slate-50', text: 'text-slate-700', label: status }
  }

  // Get priority style
  function getPriorityStyle(priority: string) {
    return priority === 'URGENT'
      ? { bg: 'bg-red-100', text: 'text-red-700', label: 'URGENT' }
      : { bg: 'bg-slate-100', text: 'text-slate-600', label: 'NORMAL' }
  }

  // Open reschedule modal
  function openRescheduleModal(ticket: Ticket) {
    setSelectedTicket(ticket)
    setShowRescheduleModal(true)
  }

  // Open inspection review modal
  function openInspectionModal(ticket: Ticket) {
    setSelectedTicket(ticket)
    setShowInspectionModal(true)
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

  // Left content - Analytics
  const leftContent = (
    <AnalyticsCard
      title="Performa Teknisi"
      subtitle="Jumlah tiket yang diselesaikan per teknisi"
    >
      <WeeklyBarChart data={chartData} height={260} />
      <div className="mt-4">
        <ChartLegend
          items={[
            { color: '#D2F377', label: 'Tiket Selesai' }
          ]}
        />
      </div>
    </AnalyticsCard>
  )

  // Right content - Reminders & Progress
  const rightContent = (
    <div className="space-y-4">
      <ReminderCard
        title="Antrean Teknisi"
        items={technicianQueue}
        emptyText="Tidak ada antrean"
      />
      <DonutCard
        title="Distribusi Tiket"
        segments={statusDistribution}
        total={stats.total}
        centerLabel="Total"
      />
    </div>
  )

  return (
    <TaskoDashboard
      pageTitle="Dashboard Engineering Admin"
      pageSubtitle="Kelola penugasan teknisi dan pantau progress pekerjaan."
      actions={{
        secondary: [
          {
            label: 'Refresh',
            icon: <RefreshCw className="w-4 h-4" />,
            onClick: handleRefresh
          }
        ]
      }}
      stats={kpiStats}
      leftContent={leftContent}
      rightContent={rightContent}
      isLoading={loading}
    >
      {/* Tabs + Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        {/* Tabs */}
        <div className="flex border-b border-slate-100/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`px-4 md:px-6 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
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
            className={`px-4 md:px-6 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'active'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Active ({stats.assigned + stats.inProgress})
          </button>
          <button
            onClick={() => setActiveTab('waiting-analysis')}
            className={`px-4 md:px-6 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'waiting-analysis'
                ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/30'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileSearch className="w-4 h-4" />
            Review Inspeksi ({stats.waitingAnalysis})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 md:px-6 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'pending'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Pending ({stats.waitingConfirmation})
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
                const priorityStyle = getPriorityStyle(ticket.priority)

                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-slate-50/50 rounded-xl border border-slate-100 p-5 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Ticket Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-bold text-slate-800">{ticket.ticket_number}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                            {statusStyle.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityStyle.bg} ${priorityStyle.text}`}>
                            {priorityStyle.label}
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium mb-1">{ticket.problem}</p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span>{ticket.unit_code}</span>
                          <span>&bull;</span>
                          <span>{ticket.resident_name}</span>
                          <span>&bull;</span>
                          <span>{new Date(ticket.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                        {ticket.scheduled_at && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Jadwal: {new Date(ticket.scheduled_at).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions & Timer */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Reschedule Button for all non-completed tickets */}
                        {!['FINISHED', 'CANCELLED'].includes(ticket.status) && (
                          <button
                            onClick={() => openRescheduleModal(ticket)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 bg-white border border-slate-200 rounded-xl hover:border-blue-200 transition-colors"
                          >
                            <Calendar className="w-4 h-4" />
                            <span className="hidden sm:inline">Jadwal</span>
                          </button>
                        )}

                        {/* Auto Finish Timer for Pending */}
                        {ticket.status === 'WAITING_CLIENT_CONFIRMATION' && ticket.submitted_at && (
                          <div className="hidden md:block">
                            <AutoFinishTimer
                              ticketId={ticket.id}
                              submittedAt={ticket.submitted_at}
                              onComplete={handleRefresh}
                            />
                          </div>
                        )}

                        {/* Assign Button */}
                        {ticket.status === 'UNASSIGNED' && (
                          <button
                            onClick={() => openAssignModal(ticket)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                          >
                            <Wrench className="w-4 h-4" />
                            Tugaskan
                          </button>
                        )}

                        {/* Review Inspection Button */}
                        {ticket.status === 'NEEDS_ANALYSIS' && (
                          <button
                            onClick={() => openInspectionModal(ticket)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
                          >
                            <FileSearch className="w-4 h-4" />
                            Review Inspeksi
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

                    {/* Investigation Report Preview for NEEDS_ANALYSIS */}
                    {ticket.status === 'NEEDS_ANALYSIS' && ticket.investigation_report && (
                      <div className="mt-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Camera className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-semibold text-amber-700">Laporan Investigasi</span>
                        </div>
                        <p className="text-sm text-slate-600">{ticket.investigation_report}</p>
                      </div>
                    )}

                    {/* Auto Finish Timer for Pending (Mobile) */}
                    {ticket.status === 'WAITING_CLIENT_CONFIRMATION' && ticket.submitted_at && (
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
      </motion.div>

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

      {/* Reschedule Modal */}
      {selectedTicket && (
        <RescheduleModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false)
            setSelectedTicket(null)
          }}
          ticketId={selectedTicket.id}
          ticketNumber={selectedTicket.ticket_number}
          currentScheduledAt={selectedTicket.scheduled_at}
          currentPriority={selectedTicket.priority}
          onSuccess={handleRefresh}
        />
      )}

      {/* Inspection Review Modal */}
      {selectedTicket && (
        <InspectionReviewModal
          isOpen={showInspectionModal}
          onClose={() => {
            setShowInspectionModal(false)
            setSelectedTicket(null)
          }}
          ticket={selectedTicket}
          onSuccess={handleRefresh}
        />
      )}
    </TaskoDashboard>
  )
}
