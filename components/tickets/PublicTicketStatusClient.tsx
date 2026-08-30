'use client'

import { useState } from 'react'
import {
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  MapPin,
  User,
  Calendar,
  Star,
  RefreshCcw,
  X,
  ThumbsUp,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { clientFinishWithRating, clientRequestRework } from '@/actions/tickets'

interface Ticket {
  id: string
  ticket_number: string
  unit_code: string
  resident_name: string
  problem: string
  description?: string | null
  status: string
  priority: 'NORMAL' | 'URGENT'
  scheduled_at?: string | null
  created_at: string
  submitted_at?: string | null
  completed_at?: string | null
  initial_inspection_notes?: string | null
  inspection_completed_at?: string | null
  inspection_approved_at?: string | null
  finish_notes?: string | null
  before_photo_paths?: string[] | null
  process_photo_paths?: string[] | null
  after_photo_paths?: string[] | null
  rework_reason?: string | null
  rework_count?: number | null
  is_rework?: boolean | null
  client_feedback?: string | null
}

interface PublicTicketStatusClientProps {
  ticket: Ticket
}

export default function PublicTicketStatusClient({ ticket }: PublicTicketStatusClientProps) {
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [reworkReason, setReworkReason] = useState('')
  const [showRatingCard, setShowRatingCard] = useState(false)
  const [showReworkModal, setShowReworkModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [thankYou, setThankYou] = useState<'FINISHED' | 'REWORK' | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const canAct = ticket.status === 'WAITING_CLIENT_CONFIRMATION' || ticket.status === 'REVIEW_FINISH'
  const isRework = !!ticket.is_rework || (ticket.rework_count ?? 0) > 0

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; bg: string; text: string; icon: any; description: string }> = {
      NEW: {
        label: 'BARU',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: AlertCircle,
        description: 'Pengaduan sudah diterima dan sedang dalam antrean.'
      },
      ASSIGNED: {
        label: 'DITUGASKAN',
        bg: 'bg-indigo-100',
        text: 'text-indigo-700',
        icon: User,
        description: 'Teknisi sedang bersiap untuk melakukan pengecekan.'
      },
      INVESTIGATION: {
        label: 'DALAM INVESTIGASI',
        bg: 'bg-cyan-100',
        text: 'text-cyan-700',
        icon: MapPin,
        description: 'Tim engineering sedang mengecek penyebab masalah.'
      },
      NEEDS_ANALYSIS: {
        label: 'ANALISIS RUSAK',
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        icon: FileText,
        description: 'Hasil investigasi sedang direview tim engineering.'
      },
      RESCHEDULED: {
        label: 'JADWAL ULANG',
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        icon: Calendar,
        description: 'Pengerjaan dijadwalkan ulang sesuai kesepakatan.'
      },
      ON_PROGRESS: {
        label: 'SEDANG DIPROSES',
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        icon: Clock,
        description: 'Tim engineering sedang bekerja memperbaiki masalah Anda.'
      },
      REVIEW_FINISH: {
        label: 'MENUNGGU KONFIRMASI',
        bg: 'bg-teal-100',
        text: 'text-teal-700',
        icon: CheckCircle,
        description: 'Pengerjaan telah selesai. Mohon tinjau hasil dan konfirmasi penyelesaian.'
      },
      WAITING_CLIENT_CONFIRMATION: {
        label: 'MENUNGGU KONFIRMASI',
        bg: 'bg-teal-100',
        text: 'text-teal-700',
        icon: CheckCircle,
        description: 'Pengerjaan telah selesai. Mohon tinjau hasil dan konfirmasi penyelesaian.'
      },
      REWORK_REQ: {
        label: 'PENGAJUAN REVISI',
        bg: 'bg-rose-100',
        text: 'text-rose-700',
        icon: RefreshCcw,
        description: 'Pengajuan perbaikan ulang Anda telah dikirim. Admin Engineering akan segera memproses.'
      },
      WAITING_CONFIRMATION: {
        label: 'MENUNGGU KONFIRMASI',
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        icon: CheckCircle,
        description: 'Pekerjaan selesai. Mohon konfirmasi untuk menyelesaikan tiket.'
      },
      COMPLETED: {
        label: 'SELESAI',
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        icon: CheckCircle,
        description: 'Pekerjaan telah selesai dan dikonfirmasi.'
      },
      FINISHED: {
        label: 'SELESAI',
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        icon: CheckCircle,
        description: 'Pekerjaan telah selesai dan dikonfirmasi. Terima kasih atas penilaian Anda.'
      },
      REWORK: {
        label: 'REVISI',
        bg: 'bg-rose-100',
        text: 'text-rose-700',
        icon: AlertTriangle,
        description: 'Pekerjaan perlu direvisi. Tim engineering akan segera menangani.'
      },
      ON_HOLD: {
        label: 'DIHENTIKAN',
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        icon: Clock,
        description: 'Pengerjaan sementara dihentikan.'
      },
      CANCELLED: {
        label: 'DIBATALKAN',
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: AlertCircle,
        description: 'Tiket ini telah dibatalkan.'
      }
    }
    return statusMap[status] || statusMap.NEW
  }

  const statusInfo = getStatusInfo(ticket.status)
  const isUrgent = ticket.priority === 'URGENT'

  const beforePhotos = ticket.before_photo_paths || []
  const processPhotos = ticket.process_photo_paths || []
  const afterPhotos = ticket.after_photo_paths || []

  async function handleFinishWithRating() {
    setSubmitting(true)
    setError(null)
    const fd = new FormData()
    fd.set('ticket_id', ticket.id)
    fd.set('rating', String(rating))
    fd.set('client_feedback', feedback)
    const res = await clientFinishWithRating(fd)
    setSubmitting(false)
    if (res?.error) {
      setError(res.error)
      return
    }
    setThankYou('FINISHED')
    setShowRatingCard(false)
  }

  async function handleRework() {
    setSubmitting(true)
    setError(null)
    const fd = new FormData()
    fd.set('ticket_id', ticket.id)
    fd.set('rework_reason', reworkReason)
    const res = await clientRequestRework(fd)
    setSubmitting(false)
    if (res?.error) {
      setError(res.error)
      return
    }
    setThankYou('REWORK')
    setShowReworkModal(false)
  }

  const renderGallery = (title: string, items: string[], emptyText: string) => (
    <div className="bg-white rounded-2xl shadow-lg p-5">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((src, i) => (
            <button
              key={i}
              onClick={() => setLightboxUrl(src)}
              className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <img src={src} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  if (thankYou === 'FINISHED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white rounded-3xl shadow-xl p-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <ThumbsUp className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Terima Kasih!</h1>
          <p className="text-slate-500 mb-2">
            Konfirmasi Anda telah kami terima. Pekerjaan untuk tiket <span className="font-mono font-semibold">{ticket.ticket_number}</span> resmi ditutup.
          </p>
          {rating > 0 && (
            <p className="flex items-center justify-center gap-1 text-amber-500 my-3">
              {Array.from({ length: rating }).map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            </p>
          )}
          <p className="text-sm text-slate-400">Terima kasih atas feedback Anda 🙏</p>
        </div>
      </div>
    )
  }

  if (thankYou === 'REWORK') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white rounded-3xl shadow-xl p-8">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <RefreshCcw className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Pengajuan Terkirim</h1>
          <p className="text-slate-500">
            Pengajuan perbaikan ulang telah dikirim ke Admin Engineering. Tim akan segera mengerjakan ulang masalah Anda.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className={`${isUrgent ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-slate-800 to-slate-900'} text-white`}>
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold tracking-wider opacity-80">RESIDENT COMPLAINT</span>
            {isUrgent && (
              <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                URGENT
              </span>
            )}
            {isRework && (
              <span className="px-2 py-0.5 bg-rose-500/80 rounded text-[10px] font-bold flex items-center gap-1">
                <RefreshCcw className="w-3 h-3" />
                REWORK {(ticket.rework_count ?? 0) > 1 ? `x${ticket.rework_count}` : ''}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{ticket.ticket_number}</h1>
          <p className="text-sm opacity-90 mt-1">{ticket.problem}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${statusInfo.bg} ${statusInfo.text} flex items-center justify-center`}>
                <statusInfo.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                <p className={`text-lg font-bold ${statusInfo.text}`}>{statusInfo.label}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{statusInfo.description}</p>
          </div>
        </div>

        {/* Worker Notes (Catatan Pengerjaan Teknisi) */}
        <div className="bg-teal-50 rounded-2xl shadow-lg p-5 border border-teal-100">
          <h3 className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Catatan Pengerjaan
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {ticket.finish_notes || 'Belum ada catatan pengerjaan dari teknisi.'}
          </p>
        </div>

        {/* Rework reason display (after client submitted rework) */}
        {!canAct && ticket.rework_reason && isRework && (
          <div className="bg-rose-50 rounded-2xl shadow-lg p-5 border border-rose-100">
            <h3 className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-2">
              <RefreshCcw className="w-4 h-4" />
              Alasan Perbaikan Ulang
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ticket.rework_reason}</p>
          </div>
        )}

        {/* Action buttons only when awaiting client confirmation */}
        {canAct && (
          <div className="space-y-3">
            <button
              onClick={() => setShowRatingCard(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition-all"
            >
              <ThumbsUp className="w-5 h-5" />
              Selesai & Beri Rating
            </button>
            <button
              onClick={() => setShowReworkModal(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 bg-white border border-rose-300 hover:bg-rose-50 text-rose-600 text-sm font-bold rounded-2xl shadow-sm transition-all"
            >
              <RefreshCcw className="w-5 h-5" />
              Ajukan Perbaikan Ulang
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Rating card */}
        {showRatingCard && (
          <div className="bg-white rounded-2xl shadow-lg p-5 border-2 border-emerald-100">
            <h3 className="text-base font-bold text-slate-800 mb-1">Beri Rating</h3>
            <p className="text-sm text-slate-500 mb-4">Seberapa puas Anda dengan hasil pengerjaan?</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-1 rounded-lg transition-transform ${rating >= star ? 'scale-110' : ''}`}
                >
                  <Star className={`w-8 h-8 ${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Feedback opsional..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingCard(false)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleFinishWithRating}
                disabled={submitting || rating === 0}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                Konfirmasi
              </button>
            </div>
          </div>
        )}

        {/* Rework modal inline */}
        {showReworkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setShowReworkModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <RefreshCcw className="w-5 h-5 text-rose-500" />
                  Ajukan Perbaikan Ulang
                </h3>
                <button onClick={() => setShowReworkModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-3">
                Mohon ceritakan keluhan / alasan perbaikan ulang agar tim engineering dapat memperbaikinya.
              </p>
              <textarea
                value={reworkReason}
                onChange={e => setReworkReason(e.target.value)}
                placeholder="Contoh: kebocoran masih muncul di sudut ruangan..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 mb-4"
              />
              <button
                onClick={handleRework}
                disabled={submitting || !reworkReason.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                Kirim Pengajuan
              </button>
            </div>
          </div>
        )}

        {/* Photo galleries */}
        {renderGallery('📸 Foto Sebelum (Before)', beforePhotos, 'Belum ada foto Sebelum.')}
        {processPhotos.length > 0 && renderGallery('📸 Foto Proses', processPhotos, '')}
        {renderGallery('📸 Foto Sesudah (After)', afterPhotos, 'Belum ada foto Sesudah.')}

        {/* Unit Info */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Informasi Unit
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Unit</p>
              <p className="text-base font-bold text-slate-800">{ticket.unit_code}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Nama</p>
              <p className="text-base font-bold text-slate-800">{ticket.resident_name}</p>
            </div>
          </div>
        </div>

        {/* Scheduled Date */}
        {ticket.scheduled_at && (
          <div className="bg-amber-50 rounded-2xl shadow-lg p-5 border border-amber-100">
            <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Jadwal Pengerjaan
            </h3>
            <p className="text-base font-semibold text-amber-700">
              {new Date(ticket.scheduled_at).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} WIB
            </p>
          </div>
        )}

        {/* Inspection Notes */}
        {ticket.initial_inspection_notes && (
          <div className="bg-blue-50 rounded-2xl shadow-lg p-5 border border-blue-100">
            <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Hasil Pengecekan
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {ticket.initial_inspection_notes}
            </p>
            {ticket.inspection_completed_at && (
              <p className="text-xs text-slate-400 mt-2">
                Dicek: {new Date(ticket.inspection_completed_at).toLocaleString('id-ID')}
              </p>
            )}
          </div>
        )}

        {/* Description */}
        {ticket.description && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Deskripsi Keluhan
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Riwayat</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Dibuat</span>
              <span className="font-medium text-slate-700">
                {new Date(ticket.created_at).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            {ticket.inspection_approved_at && (
              <div className="flex justify-between">
                <span className="text-slate-500">Pengerjaan Dimulai</span>
                <span className="font-medium text-slate-700">
                  {new Date(ticket.inspection_approved_at).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
            {ticket.completed_at && (
              <div className="flex justify-between">
                <span className="text-slate-500">Selesai</span>
                <span className="font-medium text-emerald-600">
                  {new Date(ticket.completed_at).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
            {ticket.rework_count !== null && ticket.rework_count !== undefined && ticket.rework_count > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Revisi</span>
                <span className="font-medium text-rose-600">{ticket.rework_count}x pengajuan</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">
            Resident Complaint Management System (RCMS)
          </p>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={() => setLightboxUrl(null)}>
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Foto high-res"
            className="max-w-full max-h-[85vh] object-contain rounded-xl"
          />
        </div>
      )}
    </div>
  )
}