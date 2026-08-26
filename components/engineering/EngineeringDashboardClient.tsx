'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TaskoDashboard from '@/components/dashboard/TaskoDashboard'
import {
  Ticket,
  Wrench,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Camera,
  FileText,
  AlertCircle,
  X,
  Play,
  Star,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { WeeklyBarChart, ChartLegend, AnalyticsCard } from '@/components/dashboard/AnalyticsWidgets'
import { ReminderCard, ProgressRing } from '@/components/dashboard/RightWidgets'
import { updateTicketStage, submitCompletion } from '@/actions/engineering-work'
import type { UserRole } from '@/types/database'

interface Ticket {
  id: string
  ticket_number: string
  problem: string
  description: string | null
  status: string
  current_stage: string | null
  created_at: string
  unit_code: string
  resident_name: string
  current_assignee_id: string | null
}

interface StageOption {
  value: string
  label: string
  color: string
}

const STAGES: StageOption[] = [
  { value: 'INSPECTION', label: 'Inspection', color: 'bg-blue-500' },
  { value: 'DIAGNOSIS', label: 'Diagnosis', color: 'bg-amber-500' },
  { value: 'REPAIR', label: 'Repair', color: 'bg-orange-500' },
  { value: 'FINISHING', label: 'Finishing', color: 'bg-emerald-500' },
]

const ATTACHMENT_TYPES = [
  { value: 'BEFORE', label: 'Sebelum Kerja', color: 'text-rose-600' },
  { value: 'PROGRESS', label: 'Proses Kerja', color: 'text-amber-600' },
  { value: 'AFTER', label: 'Setelah Selesai', color: 'text-emerald-600' },
]

interface EngineeringDashboardClientProps {
  userProfile: {
    full_name: string
    division: string
    avatar_url?: string
    role: UserRole
  }
}

export default function EngineeringDashboardClient({ userProfile }: EngineeringDashboardClientProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch tickets
  useEffect(() => {
    async function fetchMyTickets() {
      setLoading(true)
      try {
        const response = await fetch('/api/engineering/my-tickets')
        const data = await response.json()
        if (data.tickets) {
          setTickets(data.tickets)
        }
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
      setLoading(false)
    }
    fetchMyTickets()
  }, [refreshKey])

  const handleRefresh = () => setRefreshKey(k => k + 1)

  // Calculate stats
  const stats = useMemo(() => ({
    total: tickets.length,
    inProgress: tickets.filter(t => t.status === 'ON_PROGRESS').length,
    waiting: tickets.filter(t => t.status === 'ASSIGNED').length,
    pendingConfirm: tickets.filter(t => t.status === 'WAITING_CONFIRMATION').length
  }), [tickets])

  // Generate chart data - daily work hours
  const chartData = useMemo(() => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    return days.map((day, i) => ({
      day,
      value: Math.floor(Math.random() * 4) + 4 // 4-8 hours
    }))
  }, [])

  // Get today's tasks for reminder
  const todayTasks = useMemo(() => {
    return tickets
      .filter(t => t.status === 'ASSIGNED' || t.status === 'ON_PROGRESS')
      .slice(0, 4)
      .map((ticket, i) => ({
        id: ticket.id,
        time: `${8 + i}:00`,
        label: ticket.ticket_number,
        description: `${ticket.problem} - ${ticket.unit_code}`,
        priority: ticket.status === 'ASSIGNED' ? 'high' as const : 'medium' as const,
        action: {
          label: ticket.status === 'ASSIGNED' ? 'Mulai' : 'Update',
          onClick: () => {
            setSelectedTicket(ticket)
            setShowUpdateModal(true)
          }
        }
      }))
  }, [tickets])

  // Calculate completion rate
  const completionRate = useMemo(() => {
    const completed = tickets.filter(t => t.status === 'COMPLETED').length
    return stats.total > 0 ? Math.round((completed / (completed + stats.pendingConfirm)) * 100) : 0
  }, [tickets, stats])

  // KPI Stats
  const kpiStats = [
    {
      title: 'Tugas Personal',
      value: stats.total,
      icon: <Ticket className="w-5 h-5 text-white" />,
      variant: 'primary' as const,
      trend: { value: 5, isPositive: true }
    },
    {
      title: 'Sedang Dikerjakan',
      value: stats.inProgress,
      subtitle: 'Aktif saat ini',
      icon: <Wrench className="w-5 h-5 text-amber-600" />
    },
    {
      title: 'Menunggu',
      value: stats.waiting,
      subtitle: 'Belum dimulai',
      icon: <Clock className="w-5 h-5 text-indigo-600" />
    },
    {
      title: 'Rating',
      value: '4.8',
      subtitle: 'dari warga',
      icon: <Star className="w-5 h-5 text-yellow-500" />
    }
  ]

  // Left content - Work Hours Chart
  const leftContent = (
    <AnalyticsCard
      title="Jam Kerja Harian"
      subtitle="Rata-rata jam kerja per hari"
    >
      <WeeklyBarChart data={chartData} height={240} />
      <div className="mt-4 flex items-center justify-between">
        <ChartLegend
          items={[
            { color: '#10B981', label: 'Jam Kerja' }
          ]}
        />
        <div className="text-right">
          <p className="text-lg font-bold text-slate-800">6.5 jam</p>
          <p className="text-xs text-slate-400">Rata-rata/hari</p>
        </div>
      </div>
    </AnalyticsCard>
  )

  // Right content - Tasks & Progress
  const rightContent = (
    <div className="space-y-4">
      <ReminderCard
        title="Tugas Hari Ini"
        items={todayTasks}
        emptyText="Tidak ada tugas hari ini"
      />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <ProgressRing
          value={completionRate}
          label="Tingkat Penyelesaian"
          subtitle="Bulan ini"
          color="#10B981"
        />
      </div>
    </div>
  )

  // Filter tickets
  const filteredTickets = useMemo(() => {
    if (!searchQuery) return tickets
    const query = searchQuery.toLowerCase()
    return tickets.filter(t =>
      t.ticket_number.toLowerCase().includes(query) ||
      t.problem.toLowerCase().includes(query) ||
      t.unit_code.toLowerCase().includes(query)
    )
  }, [tickets, searchQuery])

  return (
    <TaskoDashboard
      pageTitle="Dashboard Engineering"
      pageSubtitle="Kelola dan kerjakan tugas perbaikan Anda."
      actions={{
        primary: {
          label: 'Mulai Kerja',
          icon: <Play className="w-4 h-4" />,
          onClick: () => {
            const assigned = tickets.find(t => t.status === 'ASSIGNED')
            if (assigned) {
              setSelectedTicket(assigned)
              setShowUpdateModal(true)
            }
          }
        }
      }}
      stats={kpiStats}
      leftContent={leftContent}
      rightContent={rightContent}
      isLoading={loading}
    >
      {/* Ticket List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-white/50">
          <h2 className="text-lg font-bold text-slate-800">Tiket Saya</h2>
          <p className="text-sm text-slate-500 mt-0.5">{filteredTickets.length} tiket ditugaskan</p>
        </div>

        <div className="divide-y divide-slate-100/80">
          {filteredTickets.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">Tidak ada tiket</p>
              <p className="text-sm text-slate-400 mt-1">Belum ada tiket yang ditugaskan</p>
            </div>
          ) : (
            filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-6 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-slate-800">{ticket.ticket_number}</span>
                      <StatusBadge status={ticket.status} />
                      {ticket.current_stage && (
                        <StageBadge stage={ticket.current_stage} />
                      )}
                    </div>
                    <p className="text-slate-700 font-medium mb-1">{ticket.problem}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{ticket.unit_code}</span>
                      <span>&bull;</span>
                      <span>{ticket.resident_name}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {ticket.status === 'ASSIGNED' && (
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket)
                          setShowUpdateModal(true)
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Mulai Kerjakan
                      </button>
                    )}

                    {ticket.status === 'ON_PROGRESS' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setShowUpdateModal(true)
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          <Wrench className="w-4 h-4" />
                          Update Progress
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setShowUpdateModal(true)
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Ajukan Selesai
                        </button>
                      </>
                    )}

                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 bg-white border border-slate-200 rounded-xl hover:border-blue-200 transition-colors"
                    >
                      Detail
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Update Modal */}
      <AnimatePresence>
        {showUpdateModal && selectedTicket && (
          <UpdateProgressModal
            ticket={selectedTicket}
            onClose={() => {
              setShowUpdateModal(false)
              setSelectedTicket(null)
            }}
            onSuccess={handleRefresh}
          />
        )}
      </AnimatePresence>
    </TaskoDashboard>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ASSIGNED: 'bg-indigo-50 text-indigo-700',
    ON_PROGRESS: 'bg-amber-50 text-amber-700',
    WAITING_CONFIRMATION: 'bg-purple-50 text-purple-700',
    COMPLETED: 'bg-emerald-50 text-emerald-700',
  }
  const labels: Record<string, string> = {
    ASSIGNED: 'DITUGASKAN',
    ON_PROGRESS: 'DIPROSES',
    WAITING_CONFIRMATION: 'MENUNGGU KONFIRMASI',
    COMPLETED: 'SELESAI',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {labels[status] || status}
    </span>
  )
}

// Stage Badge Component
function StageBadge({ stage }: { stage: string }) {
  const stageIndex = STAGES.findIndex(s => s.value === stage)
  const stageColor = stageIndex >= 0 ? STAGES[stageIndex].color : 'bg-slate-400'
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${stageColor}`}>
      {stage}
    </span>
  )
}

// Update Progress Modal
function UpdateProgressModal({ ticket, onClose, onSuccess }: { ticket: Ticket, onClose: () => void, onSuccess: () => void }) {
  const [stage, setStage] = useState(ticket.current_stage || 'INSPECTION')
  const [note, setNote] = useState('')
  const [attachmentType, setAttachmentType] = useState('PROGRESS')
  const [file, setFile] = useState<File | null>(null)
  const [action, setAction] = useState<'update' | 'submit'>('update')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setIsPending(true)
    setError(null)

    try {
      const stageForm = new FormData()
      stageForm.append('ticket_id', ticket.id)
      stageForm.append('stage', stage)
      stageForm.append('note', note)

      const stageResult = await updateTicketStage(stageForm)

      if (stageResult?.error) {
        setError(stageResult.error)
        setIsPending(false)
        return
      }

      if (action === 'submit') {
        const completionForm = new FormData()
        completionForm.append('ticket_id', ticket.id)
        completionForm.append('completion_note', note)
        await submitCompletion(completionForm)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    }
    setIsPending(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 w-full max-w-lg max-h-[85vh] overflow-y-auto"
      >
        <div className="px-6 py-5 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-white/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Update Progress</h3>
            <p className="text-sm text-slate-500">#{ticket.ticket_number}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-3 bg-red-50/80 border border-red-200/60 text-red-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Stage Selector */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-3 block">Work Stage</label>
            <div className="grid grid-cols-2 gap-2">
              {STAGES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStage(s.value)}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    stage === s.value
                      ? `${s.color} text-white border-transparent`
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Catatan Harian</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Contoh: Pipa berhasil diperbaiki, menunggu penggantian valve..."
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 transition-all outline-none resize-none text-sm"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Upload Foto
            </label>
            <div className="flex gap-2 mb-2">
              {ATTACHMENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setAttachmentType(type.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    attachmentType === type.value
                      ? `${type.color} bg-current/10`
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>

        <div className="px-6 py-5 border-t border-slate-100/80 bg-slate-50/30 flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 px-4 py-3 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-semibold rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => { setAction('update'); handleSubmit() }}
            disabled={isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Simpan Progress
          </button>
        </div>

        {ticket.status === 'ON_PROGRESS' && (
          <div className="px-6 py-4 border-t border-slate-100/80">
            <button
              onClick={() => { setAction('submit'); handleSubmit() }}
              disabled={isPending}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Ajukan Selesai & Konfirmasi Resident
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
