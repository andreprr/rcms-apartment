'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTransition } from 'react'
import { Loader2, X, Calendar, AlertTriangle, Check, Clock, AlertCircle } from 'lucide-react'
import { updateScheduledTime, updateTicketPriority } from '@/actions/tickets'

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  ticketNumber: string
  currentScheduledAt: string | null
  currentPriority: 'NORMAL' | 'URGENT'
  onSuccess?: () => void
}

export default function RescheduleModal({
  isOpen,
  onClose,
  ticketId,
  ticketNumber,
  currentScheduledAt,
  currentPriority,
  onSuccess
}: RescheduleModalProps) {
  const [scheduledAt, setScheduledAt] = useState(currentScheduledAt || '')
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>(currentPriority)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      // Update scheduled time
      const formData = new FormData()
      formData.append('ticket_id', ticketId)
      formData.append('scheduled_at', scheduledAt)

      const result = await updateScheduledTime(formData)

      if (result?.error) {
        setError(result.error)
        return
      }

      // Update priority if changed
      if (priority !== currentPriority) {
        const priorityFormData = new FormData()
        priorityFormData.append('ticket_id', ticketId)
        priorityFormData.append('priority', priority)
        await updateTicketPriority(priorityFormData)
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1000)
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
            className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-white/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Ubah Jadwal & Prioritas</h3>
                  <p className="text-sm text-slate-500">Tiket #{ticketNumber}</p>
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
            <div className="p-6 space-y-6">
              {success ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4"
                  >
                    <Check className="w-8 h-8 text-emerald-600" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-slate-800">Berhasil!</h3>
                  <p className="text-sm text-slate-500 mt-1">Jadwal berhasil diperbarui</p>
                </div>
              ) : (
                <>
                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-3 bg-red-50/80 border border-red-200/60 text-red-700 px-4 py-3 rounded-xl text-sm">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Scheduled Date & Time */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      Jadwal Pengerjaan
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-400 transition-all outline-none"
                    />
                    <p className="text-xs text-slate-400">
                      {scheduledAt
                        ? `Jadwal: ${new Date(scheduledAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}`
                        : 'Tiket dapat dikerjakan kapan saja'}
                    </p>
                  </div>

                  {/* Priority Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-slate-400" />
                      Prioritas
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Normal Option */}
                      <button
                        type="button"
                        onClick={() => setPriority('NORMAL')}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          priority === 'NORMAL'
                            ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {priority === 'NORMAL' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2"
                          >
                            <Check className="w-4 h-4 text-blue-500" />
                          </motion.div>
                        )}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          priority === 'NORMAL' ? 'bg-blue-100' : 'bg-slate-100'
                        }`}>
                          <Clock className={`w-5 h-5 ${priority === 'NORMAL' ? 'text-blue-600' : 'text-slate-500'}`} />
                        </div>
                        <span className="font-semibold text-sm">Normal</span>
                        <span className="text-xs text-center opacity-75">Selesai 1 Hari</span>
                      </button>

                      {/* Urgent Option */}
                      <button
                        type="button"
                        onClick={() => setPriority('URGENT')}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          priority === 'URGENT'
                            ? 'border-red-500 bg-red-50/50 text-red-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {priority === 'URGENT' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2"
                          >
                            <Check className="w-4 h-4 text-red-500" />
                          </motion.div>
                        )}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          priority === 'URGENT' ? 'bg-red-100' : 'bg-slate-100'
                        }`}>
                          <AlertTriangle className={`w-5 h-5 ${priority === 'URGENT' ? 'text-red-600' : 'text-slate-500'}`} />
                        </div>
                        <span className="font-semibold text-sm">Urgent</span>
                        <span className="text-xs text-center opacity-75">Multi-Day</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div className="px-6 py-5 border-t border-slate-100/80 bg-slate-50/30 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isPending}
                  className="flex-1 px-4 py-3 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-semibold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Simpan
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
