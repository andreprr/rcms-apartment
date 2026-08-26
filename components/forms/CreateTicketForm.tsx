'use client'

import { createTicket } from '@/actions/tickets'
import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, Building2, Heading, AlignLeft, Printer, CheckCircle2, User, Phone } from 'lucide-react'
import Link from 'next/link'

export default function CreateTicketForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdTicket, setCreatedTicket] = useState<{ id: string; ticket_number: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createTicket(formData)
      if (res?.error) {
        setError(res.error)
      } else if (res?.success) {
        setCreatedTicket(res.ticket)
        setShowSuccessModal(true)
      }
    })
  }

  return (
    <>
      <form action={handleSubmit} className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-white/50">
          <h2 className="text-lg font-bold text-slate-800">Detail Keluhan</h2>
          <p className="text-sm text-slate-500 mt-1">Lengkapi informasi keluhan warga di bawah ini</p>
        </div>

        {/* Form Content */}
        <div className="p-8 space-y-6">
          {/* Notifikasi Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 bg-red-50/80 border border-red-200/60 text-red-700 px-5 py-4 rounded-xl text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unit Code & Resident Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unit Code */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                Kode Unit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="unit_code"
                required
                placeholder="Contoh: SA.2-12"
                className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 py-3.5 px-4 rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-600/10 focus:border-purple-400 transition-all outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Resident Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Nama Warga <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="resident_name"
                required
                placeholder="Contoh: Ridwan"
                className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 py-3.5 px-4 rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-600/10 focus:border-purple-400 transition-all outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              No. Telepon Warga <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone_number"
              required
              placeholder="Contoh: 081234567890"
              className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 py-3.5 px-4 rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-600/10 focus:border-purple-400 transition-all outline-none placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-400">Nomor telepon tersimpan untuk notifikasi WA, tidak muncul di cetakan tiket.</p>
          </div>

          {/* Problem Title */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Heading className="w-4 h-4 text-slate-400" />
              Keluhan Singkat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="problem"
              required
              placeholder="Contoh: Pipa wastafel di kamar mandi utama bocor"
              className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 py-3.5 px-4 rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-600/10 focus:border-purple-400 transition-all outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-slate-400" />
              Deskripsi Lengkap <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              name="description"
              rows={4}
              placeholder="Jelaskan detail masalah yang dialami warga, lokasi spesifik, atau informasi tambahan lainnya..."
              className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 py-3.5 px-4 rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-600/10 focus:border-purple-400 transition-all outline-none resize-none placeholder:text-slate-400"
            ></textarea>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-slate-100/80 bg-slate-50/30 flex flex-col sm:flex-row gap-3">
          <Link
            href="/tickets"
            className="px-6 py-3 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-semibold rounded-xl transition-all text-center"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 flex justify-center items-center gap-2 bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 focus:ring-4 focus:ring-purple-600/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Buat Tiket
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && createdTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setShowSuccessModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 w-full max-w-md overflow-hidden"
            >
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Tiket Berhasil Dibuat!</h3>
                <p className="text-slate-500 mb-2">Nomor tiket Anda adalah:</p>
                <p className="text-2xl font-bold text-purple-600 mb-6">{createdTicket.ticket_number}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl transition-colors"
                  >
                    Kembali
                  </button>
                  <Link
                    href={`/tickets/${createdTicket.id}/print`}
                    className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Cetak Tiket
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
