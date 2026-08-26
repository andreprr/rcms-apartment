'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Ticket,
  Printer,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  QrCode,
  Calendar,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { createTicket } from '@/actions/tickets'
import type { UserRole } from '@/types/database'

interface UserProfile {
  full_name: string
  division: string
  avatar_url?: string
  role: UserRole
}

export default function RRTicketMakerPage({ userProfile }: { userProfile: UserProfile }) {
  const [formData, setFormData] = useState({
    unit_code: '',
    resident_name: '',
    phone_number: '',
    problem: '',
    description: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ ticket_number: string; id: string } | null>(null)
  const [showPrintModal, setShowPrintModal] = useState(false)

  // Generate ticket preview number (simulated)
  const previewTicketNumber = formData.unit_code && formData.resident_name
    ? `TKT_${formData.unit_code.toUpperCase().replace(/\s+/g, '')}_${formData.resident_name.toUpperCase().replace(/\s+/g, '')}_0001`
    : 'TKT_UNIT_NAMA_0001'

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Handle form submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const form = new FormData()
      form.append('unit_code', formData.unit_code)
      form.append('resident_name', formData.resident_name)
      form.append('phone_number', formData.phone_number)
      form.append('problem', formData.problem)
      form.append('description', formData.description)

      const result = await createTicket(form)

      if (result?.error) {
        setError(result.error)
      } else if (result?.success && result?.ticket) {
        setSuccess({
          ticket_number: result.ticket.ticket_number || 'N/A',
          id: result.ticket.id || '',
        })
        setShowPrintModal(true)
        // Reset form
        setFormData({
          unit_code: '',
          resident_name: '',
          phone_number: '',
          problem: '',
          description: '',
        })
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Ticket Maker</h1>
          <p className="text-sm text-slate-500 mt-0.5">Buat tiket complain baru untuk warga.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-purple-100 p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Form Tiket Baru</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Unit Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.unit_code}
                  onChange={(e) => setFormData({ ...formData, unit_code: e.target.value })}
                  placeholder="cth: SA.2-12"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Warga <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.resident_name}
                  onChange={(e) => setFormData({ ...formData, resident_name: e.target.value })}
                  placeholder="cth: Budi Santoso"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                No. Telepon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="cth: 081234567890"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
              />
              <p className="text-xs text-slate-400 mt-1">*Tidak akan tampil di struk cetak</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Keluhan Utama <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                placeholder="cth: Keran air kamar mandi mati"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Deskripsi (Opsional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detail keluhan tambahan..."
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4" />
                    Buat Tiket
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Live Preview */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-purple-100 p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Preview Tiket</h2>

          {/* Ticket Preview (Thermal 80mm style) */}
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-lg p-4 max-w-[280px] mx-auto">
            <div className="text-center border-b-2 border-dashed border-slate-200 pb-3 mb-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">RC</span>
                </div>
                <span className="font-bold text-slate-800">RCMS</span>
              </div>
              <p className="text-xs text-slate-500">Resident Complaint System</p>
            </div>

            <div className="text-center mb-4">
              <p className="text-2xl font-bold text-purple-600">{previewTicketNumber}</p>
            </div>

            <div className="space-y-2 text-xs border-b-2 border-dashed border-slate-200 pb-3 mb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span className="font-medium text-slate-700">{currentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jam:</span>
                <span className="font-medium text-slate-700">{currentTime} WIB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unit:</span>
                <span className="font-medium text-slate-700">{formData.unit_code || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama:</span>
                <span className="font-medium text-slate-700">{formData.resident_name || '-'}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-1">Keluhan:</p>
              <p className="text-sm font-semibold text-slate-800">{formData.problem || '-'}</p>
              {formData.description && (
                <p className="text-xs text-slate-500 mt-1">{formData.description}</p>
              )}
            </div>

            {/* QR Code placeholder */}
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center">
                <QrCode className="w-10 h-10 text-slate-400" />
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-400">Scan untuk info lengkap</p>

            <div className="mt-4 text-center text-[10px] text-slate-400 border-t pt-2">
              Powered by Gateway System v3.2
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center mt-4">
            * No. Telepon disembunyikan di struk cetak
          </p>
        </motion.div>
      </div>

      {/* Success Modal */}
      {success && showPrintModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowPrintModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Tiket Berhasil Dibuat!</h3>
              <p className="text-slate-500 mb-4">No. Tiket: <span className="font-bold text-purple-600">{success.ticket_number}</span></p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
