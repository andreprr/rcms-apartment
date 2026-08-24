'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Ticket,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Camera,
  ChevronRight
} from 'lucide-react'
import { publicConfirmCompletion } from '@/actions/engineering-work'

interface Ticket {
  id: string
  ticket_number: string
  problem: string
  description: string | null
  status: string
  current_stage: string | null
  created_at: string
  submitted_at: string | null
  units: { unit_code: string; floor: number } | null
  complaint_categories: { name: string } | null
}

interface History {
  id: string
  action: string
  description: string | null
  created_at: string
  users: { full_name: string } | null
}

interface Attachment {
  id: string
  file_url: string
  file_name: string
  attachment_type: string
}

export default function PublicTicketPage() {
  const [ticketNumber, setTicketNumber] = useState('')
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [history, setHistory] = useState<History[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<'confirm' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketNumber.trim()) return

    setLoading(true)
    setError(null)
    setTicket(null)

    try {
      const response = await fetch(`/api/public/ticket?number=${encodeURIComponent(ticketNumber.trim())}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setTicket(data.ticket)
        setHistory(data.history || [])
        setAttachments(data.attachments || [])
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }

    setLoading(false)
  }

  const handleConfirm = async () => {
    if (!ticket) return

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('ticket_number', ticket.ticket_number)
    formData.append('action', 'confirm')

    const result = await publicConfirmCompletion(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      setSubmitSuccess('COMPLETED')
      setTicket({ ...ticket, status: 'COMPLETED' })
    }

    setIsSubmitting(false)
    setConfirmAction(null)
  }

  const handleReject = async () => {
    if (!ticket) return

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('ticket_number', ticket.ticket_number)
    formData.append('action', 'reject')
    formData.append('reason', rejectReason)

    const result = await publicConfirmCompletion(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      setSubmitSuccess('REWORK')
      setTicket({ ...ticket, status: 'REWORK' })
    }

    setIsSubmitting(false)
    setConfirmAction(null)
    setRejectReason('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Portal Konfirmasi Tiket</h1>
            <p className="text-slate-500 mt-2">Cek status dan konfirmasi penyelesaian keluhan Anda</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
            <input
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="Masukkan nomor tiket (contoh: TKT_SA.2-10_0001)"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cari'}
            </button>
          </form>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex items-start gap-3 bg-red-50/80 border border-red-200/60 text-red-700 px-5 py-4 rounded-2xl"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-6 bg-emerald-50/80 border border-emerald-200/60 rounded-2xl text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </motion.div>
              <h3 className="text-lg font-bold text-emerald-800">
                {submitSuccess === 'COMPLETED' ? 'Terima Kasih!' : 'Request Diterima'}
              </h3>
              <p className="text-emerald-600 mt-2">
                {submitSuccess === 'COMPLETED'
                  ? 'Konfirmasi Anda telah tercatat. Pekerjaan dianggap selesai.'
                  : 'Request perbaikan Anda telah dikirim ke tim teknisi.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ticket Result */}
        {ticket && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden"
          >
            {/* Ticket Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-50/50 to-white border-b border-slate-100/80">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{ticket.ticket_number}</h2>
                  <p className="text-sm text-slate-500 mt-1">{ticket.problem}</p>
                </div>
                <StatusBadge status={ticket.status} />
              </div>
            </div>

            {/* Ticket Info */}
            <div className="px-6 py-5 border-b border-slate-100/80">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50/50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Unit</p>
                  <p className="font-bold text-slate-800">{ticket.units?.unit_code || '-'}</p>
                </div>
                <div className="bg-slate-50/50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Kategori</p>
                  <p className="font-bold text-slate-800">{ticket.complaint_categories?.name || '-'}</p>
                </div>
                <div className="bg-slate-50/50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Stage</p>
                  <p className="font-bold text-slate-800">{ticket.current_stage || 'N/A'}</p>
                </div>
                <div className="bg-slate-50/50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Tanggal</p>
                  <p className="font-bold text-slate-800">
                    {new Date(ticket.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="px-6 py-5 border-b border-slate-100/80">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Riwayat Tiket
              </h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div key={item.id} className="relative pl-10">
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 bg-white ${
                        index === history.length - 1 ? 'border-blue-500' : 'border-slate-300'
                      }`} />
                      <div className="bg-slate-50/50 rounded-xl p-4">
                        <p className="font-semibold text-slate-800">{item.action.replace('_', ' ')}</p>
                        {item.description && (
                          <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                          {new Date(item.created_at).toLocaleString('id-ID')}
                          {item.users && ` • ${item.users.full_name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Photos */}
            {attachments.length > 0 && (
              <div className="px-6 py-5 border-b border-slate-100/80">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Foto Setelah Selesai
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-blue-300 transition-colors"
                    >
                      <img
                        src={att.file_url}
                        alt={att.file_name}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmation Actions */}
            {ticket.status === 'WAITING_CONFIRMATION' && !submitSuccess && (
              <div className="px-6 py-6 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 mb-4 text-center">
                  Apakah pekerjaan sudah selesai dengan baik?
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setConfirmAction('confirm')}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Ya, Selesai
                  </button>
                  <button
                    onClick={() => setConfirmAction('reject')}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-2xl transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Tidak, Perlu Perbaikan
                  </button>
                </div>
              </div>
            )}

            {/* Confirmation Modal */}
            <AnimatePresence>
              {confirmAction && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setConfirmAction(null)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 w-full max-w-md p-6"
                  >
                    {confirmAction === 'confirm' ? (
                      <>
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-800">Konfirmasi Penyelesaian</h3>
                          <p className="text-slate-500 mt-2">
                            Apakah Anda yakin pekerjaan sudah selesai dengan baik?
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setConfirmAction(null)}
                            className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                          >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Selesai'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-rose-600" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-800">Request Perbaikan</h3>
                          <p className="text-slate-500 mt-2">
                            Jelaskan masalah yang masih perlu diperbaiki
                          </p>
                        </div>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                          placeholder="Contoh: Pipa masih bocor, perlu penggantian valve..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-400 transition-all resize-none mb-4"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => setConfirmAction(null)}
                            className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleReject}
                            disabled={isSubmitting}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                          >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Request'}
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!ticket && !error && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">Masukkan nomor tiket untuk melihat status</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-sm text-slate-400">
        Resident Complaint Management System
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    NEW: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'BARU' },
    ASSIGNED: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'DITUGASKAN' },
    ON_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'DIPROSES' },
    WAITING_CONFIRMATION: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'MENUNGGU KONFIRMASI' },
    COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'SELESAI' },
    REWORK: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'REVISI' },
  }
  const style = styles[status] || styles.NEW
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}
