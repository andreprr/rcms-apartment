'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Ticket,
  Loader2,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ExternalLink,
  MessageCircle,
  X,
  FileText,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { createTicket } from '@/actions/tickets'
import { getWhatsAppShareUrl } from '@/lib/whatsapp'
import type { UserRole } from '@/types/database'

interface UserProfile {
  full_name: string
  division: string
  avatar_url?: string
  role: UserRole
}

// Hasil createTicket yang dikembalikan oleh Server Action
interface CreatedTicket {
  id: string
  ticket_number: string
  unit_code: string
  resident_name: string
  phone_number: string
  problem: string
  description?: string | null
  status: string
  priority?: 'NORMAL' | 'URGENT'
  scheduled_at?: string | null
  created_at: string
}

// Normalisasi hasil Server Action (jaga-jaga bila field tidak ada)
function normalizeTicket(t: any): CreatedTicket | null {
  if (!t) return null
  return {
    id: t.id || '',
    ticket_number: t.ticket_number || '',
    unit_code: t.unit_code || '',
    resident_name: t.resident_name || '',
    phone_number: t.phone_number || '',
    problem: t.problem || '',
    description: t.description || null,
    status: t.status || 'NEW',
    priority: t.priority || 'NORMAL',
    scheduled_at: t.scheduled_at || null,
    created_at: t.created_at || new Date().toISOString(),
  }
}

export default function RRTicketMakerPage({ userProfile }: { userProfile: UserProfile }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    unit_code: '',
    resident_name: '',
    phone_number: '',
    problem: '',
    description: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Simpan SELURUH data tiket hasil dari Server Action agar struk tidak pernah blank
  const [success, setSuccess] = useState<CreatedTicket | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

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
        // Simpan SELURUH data tiket (bukan hanya id & nomor) agar struk tidak blank
        const ticketData = normalizeTicket(result.ticket)
        setSuccess(ticketData)
        setShowSuccessModal(true)
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

  // Kirim via WhatsApp: buka deeplink wa.me di tab baru
  function handleSendWhatsAppLink() {
    if (!success?.phone_number) return
    const url = getWhatsAppShareUrl(
      success.phone_number,
      success.ticket_number,
      success.resident_name,
      success.problem
    )
    window.open(url, '_blank')
  }

  // Cetak Struk: langsung memicu window.print() setelah data sepenuhnya normalisasi.
  // Struk dirender di dalam modal (#printable-receipt) dengan isolasi @media print
  // (position: fixed) sehingga aman dari pembungkus animasi/transform.
  function handlePrintTicket() {
    if (!success || !success.ticket_number) {
      console.error("Cannot print: Ticket data is incomplete")
      return
    }
    window.print()
  }

  // Navigate to view ticket details
  function handleViewTicket() {
    if (success?.id) {
      setShowSuccessModal(false)
      router.push(`/tickets/${success.id}`)
    }
  }

  // Navigate to print page (opens in new tab)
  function handleOpenPrintPage() {
    if (success?.id) {
      window.open(`/tickets/${success.id}/print`, '_blank')
    }
  }

  // Reset for new ticket
  function handleNewTicket() {
    setSuccess(null)
    setShowSuccessModal(false)
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

      {/* Success Modal - dengan WhatsApp status */}
      {success && showSuccessModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={() => {}}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 my-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Tiket Berhasil Dibuat!</h3>
                  <p className="text-sm text-slate-500">{success.ticket_number}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* STRUK ASLI (visible di layar & dicetak oleh tombol "Cetak Struk") */}
            <PrintReceipt ticket={success} />

            {/* Action Buttons */}
            <div className="space-y-2 mt-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSendWhatsAppLink}
                  disabled={!success.phone_number}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="w-4 h-4" />
                  Kirim via WhatsApp
                </button>
                <button
                  onClick={handleOpenPrintPage}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  Cetak Resi
                </button>
              </div>
              {!success.phone_number && (
                <p className="text-[11px] text-amber-600 text-center">
                  Nomor telepon tidak tersedia, tombol WhatsApp dinonaktifkan.
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleNewTicket}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
                >
                  <Ticket className="w-4 h-4" />
                  Buat Tiket Baru
                </button>
                <button
                  onClick={handleViewTicket}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Detail
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Strict Print Container Isolation: saat print hanya struk (#printable-receipt)
          yang tampil. Pakai position: fixed untuk mengeluarkan struk dari pengaruh
          transform/containing-block modal sehingga tidak blank saat dicetak. */}
      <style jsx global>{`
        @media print {
          /* 1. Hide everything on the page by default */
          html, body, body * {
            visibility: hidden !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* 2. Make only the target receipt container and its children visible */
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }

          /* 3. Re-position the target receipt to fill the printable page */
          #printable-receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 16px !important;
            background: white !important;
            color: black !important;
            z-index: 999999 !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* 4. Hide buttons or non-printable controls specifically */
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

// Komponen struk asli yang dirender di dalam modal sukses.
// id="printable-receipt" dijadikan target eksklusif untuk @media print.
function PrintReceipt({ ticket }: { ticket: CreatedTicket }) {
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/public/ticket?number=${encodeURIComponent(ticket.ticket_number)}`
    : ''

  // Format tanggal secara aman agar tidak pernah crash (mencegah blank/putih)
  const safeDate = (d?: string | null): Date | null => {
    if (!d) return null
    const date = new Date(d)
    return isNaN(date.getTime()) ? null : date
  }
  const createdDate = safeDate(ticket.created_at)
  const formattedDate = createdDate ? createdDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) : '-'
  const formattedTime = createdDate ? createdDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }) : '-'
  const isUrgent = ticket.priority === 'URGENT'
  const hasScheduledDate = !!ticket.scheduled_at

  return (
    <div
      id="printable-receipt"
      className="bg-white w-full rounded-2xl border border-slate-200 overflow-hidden text-slate-800 print:border-none print:rounded-none print:shadow-none"
    >
      {/* Header */}
      <div className={`px-5 py-4 ${isUrgent ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-slate-800 to-slate-900'} text-white print:bg-transparent print:text-black print:border-b print:border-black`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold tracking-wider opacity-90 print:opacity-100">TIKET ADUAN</span>
              {isUrgent && (
                <span className="px-2 py-0.5 bg-white/20 print:bg-transparent rounded text-[10px] font-bold">URGENT</span>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight">{ticket.ticket_number}</h1>
          </div>
          <div className="text-right text-xs opacity-90 print:opacity-100">
            <p>{formattedDate}</p>
            <p className="font-semibold">{formattedTime} WIB</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 print:bg-transparent print:border print:border-black rounded-lg p-3">
            <p className="text-[10px] text-slate-400 print:text-black uppercase">Kode Unit</p>
            <p className="text-sm font-bold text-slate-800 print:text-black">{ticket.unit_code || '-'}</p>
          </div>
          <div className="bg-slate-50 print:bg-transparent print:border print:border-black rounded-lg p-3">
            <p className="text-[10px] text-slate-400 print:text-black uppercase">Nama Warga</p>
            <p className="text-sm font-bold text-slate-800 print:text-black">{ticket.resident_name || '-'}</p>
          </div>
        </div>

        <div className="bg-slate-50 print:bg-transparent print:border print:border-black rounded-lg p-3">
          <p className="text-[10px] text-slate-400 print:text-black uppercase mb-1">Keluhan</p>
          <p className="text-sm font-semibold text-slate-800 print:text-black">{ticket.problem || '-'}</p>
        </div>

        {ticket.description && (
          <div className="bg-slate-50 print:bg-transparent print:border print:border-black rounded-lg p-3">
            <p className="text-[10px] text-slate-400 print:text-black uppercase mb-1">Detail</p>
            <p className="text-xs text-slate-600 print:text-black whitespace-pre-wrap">{ticket.description}</p>
          </div>
        )}

        {hasScheduledDate && (() => {
          const sd = safeDate(ticket.scheduled_at)
          if (!sd) return null
          return (
            <div className="bg-amber-50 print:bg-transparent print:border print:border-black rounded-lg p-3">
              <p className="text-[10px] text-amber-600 print:text-black uppercase mb-1">Jadwal Pengerjaan</p>
              <p className="text-xs font-semibold text-amber-700 print:text-black">
                {sd.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })} WIB
              </p>
            </div>
          )
        })()}

        {/* QR Code */}
        {publicUrl && (
          <div className="flex flex-col items-center pt-3 border-t border-dashed border-slate-300 print:border-black">
            <QRCodeSVG
              value={publicUrl}
              size={120}
              level="M"
              includeMargin={false}
              bgColor="transparent"
              fgColor="#1e293b"
            />
            <p className="text-[10px] text-slate-500 mt-2 text-center print:text-black">
              Scan QR Code untuk cek status perbaikan
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
