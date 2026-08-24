'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  X
} from 'lucide-react'
import Link from 'next/link'
import { updateTicketStage, submitCompletion, uploadTicketAttachment } from '@/actions/engineering-work'

interface TicketAssignment {
  id: string
  status: string
}

interface Ticket {
  id: string
  ticket_number: string
  problem: string
  description: string | null
  status: string
  current_stage: string | null
  created_at: string
  units: { unit_code: string; floor: number } | null
  complaint_categories: { name: string } | null
  ticket_assignments: TicketAssignment[]
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

export default function EngineeringDashboardClient() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Ticket className="w-5 h-5 text-blue-600" />}
          value={tickets.length}
          label="Ditugaskan"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<Wrench className="w-5 h-5 text-amber-600" />}
          value={tickets.filter(t => t.status === 'ON_PROGRESS').length}
          label="Sedang Dikerjakan"
          bgColor="bg-amber-50"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-purple-600" />}
          value={tickets.filter(t => t.status === 'ASSIGNED').length}
          label="Menunggu"
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          value={tickets.filter(t => t.status === 'WAITING_CONFIRMATION').length}
          label="Menunggu Konfirmasi"
          bgColor="bg-emerald-50"
        />
      </div>

      {/* Ticket List */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-white/50">
          <h2 className="text-lg font-bold text-slate-800">Tiket Saya</h2>
          <p className="text-sm text-slate-500 mt-0.5">{tickets.length} tiket ditugaskan</p>
        </div>

        <div className="divide-y divide-slate-100/80">
          {tickets.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">Tidak ada tiket</p>
              <p className="text-sm text-slate-400 mt-1">Belum ada tiket yang ditugaskan</p>
            </div>
          ) : (
            tickets.map((ticket, index) => (
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
                      <span>{ticket.units?.unit_code}</span>
                      <span>•</span>
                      <span>{ticket.complaint_categories?.name}</span>
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
                        <Wrench className="w-4 h-4" />
                        Mulai Kerjakan
                      </button>
                    )}

                    {ticket.status === 'ON_PROGRESS' && (
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
                    )}

                    {ticket.status === 'ON_PROGRESS' && (
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
      </div>

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
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, value, label, bgColor }: { icon: React.ReactNode, value: number, label: string, bgColor: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </motion.div>
  )
}

// Status Badge
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

// Stage Badge
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
      // Update stage first
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

      // If submitting completion
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
