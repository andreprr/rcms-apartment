'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { forceCompleteTicket } from '@/actions/engineering'

interface AutoFinishTimerProps {
  ticketId: string
  submittedAt: string
  onComplete?: () => void
}

export default function AutoFinishTimer({ ticketId, submittedAt, onComplete }: AutoFinishTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    isExpired: boolean
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false })

  const [isForceComplete, setIsForceComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate auto finish date (submitted_at + 3 days)
  const autoFinishDate = new Date(submittedAt)
  autoFinishDate.setDate(autoFinishDate.getDate() + 3)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const target = autoFinishDate.getTime()
      const difference = target - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [submittedAt])

  const handleForceComplete = async () => {
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('ticket_id', ticketId)
    formData.append('description', 'Auto-finish: Waktu konfirmasi melebihi 3x24 jam')

    const result = await forceCompleteTicket(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      onComplete?.()
    }

    setIsLoading(false)
  }

  // Format the auto finish date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            timeLeft.isExpired
              ? 'bg-rose-100'
              : timeLeft.days === 0 && timeLeft.hours < 1
                ? 'bg-amber-100'
                : 'bg-blue-50'
          }`}>
            {timeLeft.isExpired ? (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            ) : (
              <Clock className={`w-5 h-5 ${
                timeLeft.days === 0 && timeLeft.hours < 1 ? 'text-amber-600' : 'text-blue-600'
              }`} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Batas Waktu Konfirmasi</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {timeLeft.isExpired
                ? 'Waktu habis - bisa di-force complete'
                : `Habis pada ${formatDate(autoFinishDate)}`
              }
            </p>
          </div>
        </div>

        {/* Countdown Badge */}
        {timeLeft.isExpired ? (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-xl text-xs font-bold"
          >
            EXPIRED
          </motion.div>
        ) : (
          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-xl">
            {timeLeft.days > 0 && (
              <span className="text-sm font-bold text-slate-700">
                {timeLeft.days}d
              </span>
            )}
            <span className="text-sm font-bold text-slate-700">
              {String(timeLeft.hours).padStart(2, '0')}:
              {String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Force Complete Button */}
      {timeLeft.isExpired && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          {error && (
            <p className="text-xs text-red-600 mb-3">{error}</p>
          )}
          <button
            onClick={() => setIsForceComplete(true)}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Force Complete (Auto-Finish)
              </>
            )}
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {isForceComplete && !isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={() => setIsForceComplete(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/60 w-full max-w-sm p-6"
          >
            <div className="text-center">
              <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Force Complete Tiket?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Waktu konfirmasi telah habis. Apakah Anda yakin ingin menyelesaikan tiket ini secara paksa?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsForceComplete(false)}
                  className="flex-1 px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleForceComplete}
                  disabled={isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Ya, Selesaikan
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
