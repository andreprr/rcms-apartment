'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTransition } from 'react'
import { Loader2, X, FileSearch, Check, XCircle, AlertCircle, Camera, Calendar, Clock, User } from 'lucide-react'
import { approveInspection, rejectInspection } from '@/actions/tickets'
import Link from 'next/link'

interface Ticket {
  id: string
  ticket_number: string
  problem: string
  unit_code: string
  resident_name: string
  phone_number?: string
  description?: string
  initial_inspection_notes: string | null
  inspection_completed_at: string | null
  scheduled_at: string | null
  priority: 'NORMAL' | 'URGENT'
  created_at: string
}

interface InspectionReviewModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: Ticket
  onSuccess?: () => void
}

export default function InspectionReviewModal({
  isOpen,
  onClose,
  ticket,
  onSuccess
}: InspectionReviewModalProps) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successAction, setSuccessAction] = useState<'approve' | 'reject' | null>(null)

  const handleApprove = () => {
    setError(null)
    startTransition(async () => {
      const result = await approveInspection(ticket.id)

      if (result?.error) {
        setError(result.error)
        return
      }

      setSuccessAction('approve')
      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    })
  }

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setError('Alasan penolakan wajib diisi')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await rejectInspection(ticket.id, rejectReason)

      if (result?.error) {
        setError(result.error)
        return
      }

      setSuccessAction('reject')
      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100/80 bg-gradient-to-r from-amber-50/50 to-white/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <FileSearch className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Review Inspeksi Awal</h3>
                  <p className="text-sm text-slate-500">Tiket #{ticket.ticket_number}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {success ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                      successAction === 'approve' ? 'bg-emerald-100' : 'bg-red-100'
                    }`}
                  >
                    {successAction === 'approve' ? (
                      <Check className="w-10 h-10 text-emerald-600" />
                    ) : (
                      <XCircle className="w-10 h-10 text-red-600" />
                    )}
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {successAction === 'approve' ? 'Disetujui!' : 'Ditolak'}
                  </h3>
                  <p className="text-slate-500 mt-2">
                    {successAction === 'approve'
                      ? 'Inspeksi disetujui. Teknisi dapat memulai pekerjaan.'
                      : 'Inspeksi ditolak. Teknisi akan memperbaiki hasil inspeksi.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-3 bg-red-50/80 border border-red-200/60 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Ticket Info Summary */}
                  <div className="bg-slate-50/50 rounded-xl p-4 mb-6">
                    <h4 className="font-semibold text-slate-800 mb-2">{ticket.problem}</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-500">
                        <User className="w-4 h-4" />
                        <span>{ticket.resident_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                          {ticket.unit_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span>Prioritas: {ticket.priority === 'URGENT' ? 'Urgent (Multi-Day)' : 'Normal (1 Hari)'}</span>
                      </div>
                      {ticket.scheduled_at && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar className="w-4 h-4" />
                          <span>Jadwal: {new Date(ticket.scheduled_at).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inspection Notes */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-amber-600" />
                      Catatan Inspeksi Awal
                    </h4>

                    {ticket.initial_inspection_notes ? (
                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {ticket.initial_inspection_notes}
                        </p>
                        {ticket.inspection_completed_at && (
                          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Diselesaikan: {new Date(ticket.inspection_completed_at).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-100 rounded-xl p-8 text-center">
                        <p className="text-slate-500">Belum ada catatan inspeksi</p>
                      </div>
                    )}
                  </div>

                  {/* Reject Form */}
                  {showRejectForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 space-y-3"
                    >
                      <label className="text-sm font-semibold text-slate-700">
                        Alasan Penolakan <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Jelaskan mengapa inspeksi perlu diperbaiki..."
                        rows={3}
                        className="w-full bg-white border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:ring-4 focus:ring-red-600/10 focus:border-red-400 transition-all outline-none resize-none"
                      />
                    </motion.div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div className="px-6 py-5 border-t border-slate-100/80 bg-slate-50/30 flex gap-3 shrink-0">
                {!showRejectForm ? (
                  <>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={isPending}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl transition-colors border border-red-200"
                    >
                      <XCircle className="w-4 h-4" />
                      Tolak
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={isPending}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Setujui & Mulai Kerja
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowRejectForm(false)
                        setRejectReason('')
                        setError(null)
                      }}
                      disabled={isPending}
                      className="flex-1 px-4 py-3 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-semibold rounded-xl transition-colors"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isPending}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Tolak Inspeksi
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
