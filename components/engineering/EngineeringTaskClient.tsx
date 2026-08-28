'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Ticket,
  Loader2,
  Play,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  Calendar,
  Building2,
  ArrowLeft,
  ImageIcon,
  Plus,
} from 'lucide-react'
import Image from 'next/image'
import type { UserRole, TicketStage } from '@/types/database'

interface Ticket {
  id: string
  ticket_number: string
  problem: string
  description: string | null
  status: string
  current_stage: string | null
  created_at: string
  started_at: string | null
  submitted_at: string | null
  unit_code: string
  resident_name: string
}

interface DailyLog {
  id: string
  day_number: number
  work_description: string
  action_type: string
  created_at: string
}

interface UserProfile {
  full_name: string
  division: string
  avatar_url?: string
  role: UserRole
}

const STAGES: { value: TicketStage; label: string; color: string; bgColor: string }[] = [
  { value: 'INSPECTION', label: 'Inspection', color: 'text-blue-600', bgColor: 'bg-blue-500' },
  { value: 'DIAGNOSIS', label: 'Diagnosis', color: 'text-amber-600', bgColor: 'bg-amber-500' },
  { value: 'REPAIR', label: 'Repair', color: 'text-orange-600', bgColor: 'bg-orange-500' },
  { value: 'FINISHING', label: 'Finishing', color: 'text-emerald-600', bgColor: 'bg-emerald-500' },
]

const PHOTO_TYPES = [
  { value: 'BEFORE', label: 'Sebelum', color: 'text-rose-600', bg: 'bg-rose-100' },
  { value: 'PROGRESS', label: 'Proses', color: 'text-amber-600', bg: 'bg-amber-100' },
  { value: 'AFTER', label: 'Sesudah', color: 'text-emerald-600', bg: 'bg-emerald-100' },
]

function TaskPageContent({ userProfile }: { userProfile: UserProfile }) {
  const searchParams = useSearchParams()
  const initialTicketId = searchParams.get('ticket')

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showWorkModal, setShowWorkModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<'assigned' | 'inProgress' | 'waiting'>('assigned')
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  // Guard against undefined userProfile
  const safeUserProfile = useMemo(() => ({
    full_name: userProfile?.full_name || 'Teknisi',
    division: userProfile?.division || 'Engineering',
    avatar_url: userProfile?.avatar_url,
    role: userProfile?.role || 'ENGINEERING' as UserRole
  }), [userProfile])

  useEffect(() => {
    async function fetchTickets() {
      setLoading(true)
      try {
        const response = await fetch('/api/engineering/my-tickets')
        const data = await response.json()
        if (data.tickets) {
          setTickets(data.tickets)
          if (initialTicketId) {
            const ticket = data.tickets.find((t: Ticket) => t.id === initialTicketId)
            if (ticket) {
              setSelectedTicket(ticket)
              setShowWorkModal(true)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
      setLoading(false)
    }
    fetchTickets()
  }, [initialTicketId, refreshKey])

  useEffect(() => {
    if (selectedTicket) {
      fetchDailyLogs(selectedTicket.id)
    }
  }, [selectedTicket])

  async function fetchDailyLogs(ticketId: string) {
    try {
      const response = await fetch(`/api/engineering/daily-logs?ticket_id=${ticketId}`)
      const data = await response.json()
      if (data.logs) {
        setDailyLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to fetch daily logs:', error)
    }
  }

  const handleRefresh = () => setRefreshKey(k => k + 1)

  const filteredTickets = useMemo(() => {
    switch (activeTab) {
      case 'assigned':
        return tickets.filter(t => t.status === 'ASSIGNED')
      case 'inProgress':
        return tickets.filter(t => t.status === 'ON_PROGRESS')
      case 'waiting':
        return tickets.filter(t => t.status === 'WAITING_CONFIRMATION')
      default:
        return tickets
    }
  }, [tickets, activeTab])

  async function startWork(ticket: Ticket) {
    setSelectedTicket(ticket)
    setShowWorkModal(true)
  }

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

  function openPhotoModal(ticket: Ticket) {
    setSelectedTicket(ticket)
    fetchTicketPhotos(ticket.id)
    setShowPhotoModal(true)
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      ASSIGNED: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'DITUGASKAN' },
      ON_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'DIPROSES' },
      WAITING_CONFIRMATION: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'MENUNGGU KONFIRMASI' },
      COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'SELESAI' },
      REWORK: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'REWORK' },
    }
    return styles[status] || { bg: 'bg-slate-50', text: 'text-slate-700', label: status }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Task Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Kelola dan kerjakan tiket perbaikan Anda.</p>
          </div>
          <Link
            href="/engineering"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-purple-200 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      >
        <div className="flex border-b border-purple-100">
          {[
            { key: 'assigned', label: 'Ditugaskan', count: tickets.filter(t => t.status === 'ASSIGNED').length },
            { key: 'inProgress', label: 'Diproses', count: tickets.filter(t => t.status === 'ON_PROGRESS').length },
            { key: 'waiting', label: 'Menunggu Konfirmasi', count: tickets.filter(t => t.status === 'WAITING_CONFIRMATION').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.key
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Tidak ada tiket</p>
            </div>
          ) : (
            filteredTickets.map((ticket, index) => {
              const badge = getStatusBadge(ticket.status)
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-slate-50/50 rounded-xl border border-slate-100 p-4 hover:border-purple-200 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-slate-800">{ticket.ticket_number}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
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
                    <div className="flex items-center gap-2">
                      {ticket.status === 'ASSIGNED' && (
                        <button
                          onClick={() => startWork(ticket)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Mulai Bekerja
                        </button>
                      )}
                      {ticket.status === 'ON_PROGRESS' && (
                        <button
                          onClick={() => startWork(ticket)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Lanjutkan
                        </button>
                      )}
                      {(ticket.status === 'COMPLETED' || ticket.status === 'WAITING_CONFIRMATION') && (
                        <button
                          onClick={() => openPhotoModal(ticket)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-sm font-medium rounded-xl transition-colors border border-emerald-200"
                        >
                          <ImageIcon className="w-4 h-4" />
                          Lihat Foto
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
            })
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showWorkModal && selectedTicket && (
          <WorkModal
            ticket={selectedTicket}
            dailyLogs={dailyLogs}
            onClose={() => {
              setShowWorkModal(false)
              setSelectedTicket(null)
            }}
            onSuccess={() => {
              handleRefresh()
              setShowWorkModal(false)
              setSelectedTicket(null)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPhotoModal && selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowPhotoModal(false)
              setSelectedTicket(null)
              setPhotoUrls([])
            }}
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
                  <h3 className="text-lg font-bold text-slate-800">Foto {selectedTicket.ticket_number}</h3>
                  <p className="text-sm text-slate-500">{selectedTicket.problem}</p>
                </div>
                <button
                  onClick={() => {
                    setShowPhotoModal(false)
                    setSelectedTicket(null)
                    setPhotoUrls([])
                  }}
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

interface WorkModalProps {
  ticket: Ticket
  dailyLogs: DailyLog[]
  onClose: () => void
  onSuccess: () => void
}

function WorkModal({ ticket, dailyLogs, onClose, onSuccess }: WorkModalProps) {
  const [stage, setStage] = useState<TicketStage>(ticket.current_stage as TicketStage || 'INSPECTION')
  const [workDescription, setWorkDescription] = useState('')
  const [photoType, setPhotoType] = useState<'BEFORE' | 'PROGRESS' | 'AFTER'>('BEFORE')
  const [files, setFiles] = useState<File[]>([])
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<'update' | 'extend' | 'finish'>('update')

  const dayNumber = dailyLogs.length > 0 ? Math.max(...dailyLogs.map(l => l.day_number)) + 1 : 1

  async function handleSubmit() {
    setIsPending(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('ticket_id', ticket.id)
      formData.append('stage', stage)
      formData.append('work_description', workDescription)
      formData.append('action_type', action === 'update' ? 'EXTEND' : action.toUpperCase())
      formData.append('day_number', String(dayNumber))

      files.forEach((file, i) => {
        formData.append(`file_${i}`, file)
        formData.append(`file_type_${i}`, photoType)
      })

      const response = await fetch('/api/engineering/work-action', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setError(result.error || 'Terjadi kesalahan')
        setIsPending(false)
        return
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    }
    setIsPending(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
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
        className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-5 border-b border-slate-100/80 bg-gradient-to-r from-purple-50/50 to-white/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Lembar Kerja</h3>
            <p className="text-sm text-slate-500">{ticket.ticket_number} - Day {dayNumber}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 bg-purple-50/30 border-b border-purple-100/50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{ticket.problem}</p>
              <p className="text-sm text-slate-500">{ticket.unit_code} - {ticket.resident_name}</p>
            </div>
          </div>
        </div>

        {dailyLogs.length > 0 && (
          <div className="px-6 py-4 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Riwayat Progress</h4>
            <div className="space-y-2">
              {dailyLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                    D{log.day_number}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{log.work_description}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-3 bg-red-50/80 border border-red-200/60 text-red-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-3 block">Work Stage</label>
            <div className="grid grid-cols-4 gap-2">
              {STAGES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStage(s.value)}
                  className={`px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                    stage === s.value
                      ? `${s.bgColor} text-white border-transparent`
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">
              Deskripsi Progress {dayNumber === 1 ? 'Day 1' : `Day ${dayNumber}`}
            </label>
            <textarea
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              rows={4}
              placeholder={
                dayNumber === 1
                  ? "Contoh: Melakukan inspeksi awal, menemukan masalah pada pipa... (Wajib upload foto BEFORE)"
                  : "Contoh: Melanjutkan perbaikan valve, masih menunggu spare part... (Opsional upload foto PROGRESS)"
              }
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all outline-none resize-none text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Upload Foto
              <span className="text-xs font-normal text-slate-400">(Wajib untuk Day 1: foto BEFORE)</span>
            </label>
            <div className="flex gap-2 mb-2">
              {PHOTO_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setPhotoType(type.value as typeof photoType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    photoType === type.value
                      ? `${type.bg} ${type.color}`
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
              multiple
              onChange={handleFileChange}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            {files.length > 0 && (
              <p className="text-xs text-slate-500 mt-2">{files.length} file dipilih</p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100/80 bg-slate-50/30 flex flex-col gap-3">
          <div className="flex gap-3">
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

          <div className="flex gap-3">
            <button
              onClick={() => { setAction('extend'); handleSubmit() }}
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Extend / Lanjut Day {dayNumber + 1}
            </button>
            <button
              onClick={() => { setAction('finish'); handleSubmit() }}
              disabled={isPending || files.length === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Klaim Finish
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function EngineeringTaskClient({ userProfile }: { userProfile: UserProfile }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    }>
      <TaskPageContent userProfile={userProfile} />
    </Suspense>
  )
}
