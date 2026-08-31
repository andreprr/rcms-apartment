'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Ticket,
  Loader2,
  Play,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  X,
  Calendar,
  Building2,
  ArrowLeft,
  ImageIcon,
  Plus,
} from 'lucide-react'
import type { UserRole, TicketStage } from '@/types/database'
import {
  startInvestigation,
  rescheduleTicket,
  submitInvestigation,
} from '@/actions/tickets'

// ============================================================================
// SAFE JSON PARSING
// Mencegah crash "Unexpected end of JSON input" saat response kosong/rustak.
// ============================================================================
async function safeJson(res: Response) {
  const type = res.headers.get('content-type') || ''
  if (!type.includes('application/json')) return {}
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

// ============================================================================
// CLIENT-SIDE IMAGE COMPRESSION
// Mengubah foto menjadi JPEG terkompresi (< ~500 KB) sebelum dikirim ke server
// action, agar tidak memicu "Body exceeded 1 MB limit".
// ============================================================================

// Resize + compress gambar menjadi base64 JPEG.
const compressImageFile = (file: File, maxWidth = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
        const img = new window.Image()
        img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        // Compress to JPEG with quality 0.7
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

// Konversi dataURL base64 -> File (JPEG) siap dikirim via FormData.
const base64ToFile = (dataUrl: string, filename: string): File => {
  const [meta, data] = dataUrl.split(',')
  const mime = meta.match(/data:(.*?);/)?.[1] || 'image/jpeg'
  const bin = atob(data)
  const len = bin.length
  const buf = new Uint8Array(len)
  for (let i = 0; i < len; i++) buf[i] = bin.charCodeAt(i)
  return new File([buf], filename, { type: mime })
}

// Proses seluruh file terpilih -> array File JPEG terkompresi.
const compressFiles = async (input: FileList | File[], maxWidth = 1200, quality = 0.7): Promise<File[]> => {
  const files = Array.from(input)
  const out: File[] = []
  for (const file of files) {
    try {
      const base = await compressImageFile(file, maxWidth, quality)
      const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '')
      const name = file.name.replace(/\.\w+$/, '') + '.' + (ext === 'jpeg' ? 'jpg' : ext)
      out.push(base64ToFile(base, name))
    } catch {
      // Fallback: kirim file asli jika kompresi gagal.
      out.push(file)
    }
  }
  return out
}


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
  priority?: string
  assigned_technician_ids?: string[] | null
  required_materials?: string[] | null
  investigation_report?: string | null
  finish_notes?: string | null
  rework_reason?: string | null
  rework_count?: number | null
  is_rework?: boolean | null
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

function TaskPageContent({ userProfile }: { userProfile: UserProfile }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTicketId = searchParams.get('ticket')

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showWorkModal, setShowWorkModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<'assigned' | 'investigation' | 'onprogress' | 'waiting'>('assigned')
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<{ id: string; storage_path: string; photo_type: string; file_name: string }[]>([])
  const [photoLightbox, setPhotoLightbox] = useState<string | null>(null)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleTicketSel, setRescheduleTicketSel] = useState<Ticket | null>(null)
  const [showInvestigationModal, setShowInvestigationModal] = useState(false)
  const [investigationTicket, setInvestigationTicket] = useState<Ticket | null>(null)
  const [pendingStage, setPendingStage] = useState(false)

  useEffect(() => {
    async function fetchTickets() {
      setLoading(true)
      try {
        const response = await fetch('/api/engineering/my-tickets')
        const data = await safeJson(response)
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
    if (!selectedTicket) return
    let active = true
    fetch(`/api/engineering/daily-logs?ticket_id=${selectedTicket.id}`)
      .then(r => safeJson(r))
      .then(d => { if (active && d.logs) setDailyLogs(d.logs) })
      .catch(() => {})
    return () => { active = false }
  }, [selectedTicket])

  const handleRefresh = () => setRefreshKey(k => k + 1)

  const filteredTickets = useMemo(() => {
    switch (activeTab) {
      case 'assigned':
        return tickets.filter(t => t.status === 'ASSIGNED')
      case 'investigation':
        return tickets.filter(t => t.status === 'INVESTIGATION' || t.status === 'NEEDS_ANALYSIS')
      case 'onprogress':
        // "Diproses"/"On Progress": aktif dikerjakan (ON_PROGRESS / INVESTIGATION).
        // TIDAK pernah memuat REVIEW_FINISH (yang masuk ke tab "Menunggu").
        return tickets.filter(t => t.status === 'ON_PROGRESS' || t.status === 'INVESTIGATION')
      case 'waiting':
        return tickets.filter(t => t.status === 'REVIEW_FINISH' || t.status === 'WAITING_CLIENT_CONFIRMATION' || t.status === 'RESCHEDULED')
      default:
        return tickets
    }
  }, [tickets, activeTab])

  async function startWork(ticket: Ticket) {
    setSelectedTicket(ticket)
    setShowWorkModal(true)
  }

  async function runInvestigation(ticket: Ticket) {
    setPendingStage(true)
    const res = await startInvestigation(ticket.id)
    setPendingStage(false)
    if (res?.error) {
      console.error(res.error)
    } else {
      handleRefresh()
    }
  }

  function openReschedule(ticket: Ticket) {
    setRescheduleTicketSel(ticket)
    setShowRescheduleModal(true)
  }

  function openInvestigation(ticket: Ticket) {
    setInvestigationTicket(ticket)
    setShowInvestigationModal(true)
  }

  async function fetchTicketPhotos(ticketId: string) {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/photos`)
      const data = await safeJson(response)
      if (data.photos) {
        setPhotoUrls(data.photos.map((p: any) => ({
          id: p.id,
          storage_path: p.storage_path,
          photo_type: p.photo_type,
          file_name: p.file_name,
        })))
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
      INVESTIGATION: { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'SEDANG INVESTIGASI' },
      NEEDS_ANALYSIS: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'BUTUH ANALISIS' },
      RESCHEDULED: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'RESCHEDULE' },
      ON_PROGRESS: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'DIPROSES' },
      REVIEW_FINISH: { bg: 'bg-teal-50', text: 'text-teal-700', label: 'MENUNGGU REVIEW ADMIN' },
      WAITING_CLIENT_CONFIRMATION: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'MENUNGGU TANGGAPAN CLIENT' },
      REWORK_REQ: { bg: 'bg-red-50', text: 'text-red-700', label: 'PERMINTAAN REWORK CLIENT' },
      WAITING_CONFIRMATION: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'MENUNGGU KONFIRMASI' },
      COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'SELESAI' },
      FINISHED: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'SELESAI' },
      REWORK: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'REWORK' },
    }
    return styles[status] || { bg: 'bg-slate-50', text: 'text-slate-700', label: status }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-[#FCFBFB] rounded-2xl border border-[#F7D794]/20 p-5 shadow-sm animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#192A56]/10 border-2 border-[#F7D794]/20" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-48 rounded-lg bg-[#192A56]/10" />
              <div className="h-4 w-72 max-w-full rounded-md bg-[#192A56]/5" />
              <div className="inline-flex h-6 w-24 rounded-full bg-[#192A56]/10" />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F7D794]" /></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#FCFBFB] rounded-2xl border border-[#F7D794]/20 p-5 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-2xl font-extrabold shadow-sm overflow-hidden border-2 border-primary/20 ${
              userProfile?.avatar_url
                ? 'bg-purple-100'
                : 'bg-gradient-to-br from-purple-200 to-purple-300 text-purple-700'
            }`}>
              {userProfile?.avatar_url ? (
                <Image
                  src={userProfile.avatar_url}
                  alt={userProfile.full_name}
                  width={96}
                  height={96}
                  unoptimized
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover"
                />
              ) : (
                (userProfile?.full_name || 'T').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Task Management</h1>
              <p className="text-sm text-slate-500 mt-0.5">Kelola dan kerjakan tiket perbaikan Anda, {userProfile?.full_name || 'Teknisi'}.</p>
              <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {userProfile?.division || userProfile?.role}
              </span>
            </div>
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
            { key: 'investigation', label: 'Investigasi', count: tickets.filter(t => t.status === 'INVESTIGATION' || t.status === 'NEEDS_ANALYSIS').length },
            { key: 'onprogress', label: 'Diproses', count: tickets.filter(t => t.status === 'ON_PROGRESS' || t.status === 'INVESTIGATION').length },
            { key: 'waiting', label: 'Menunggu', count: tickets.filter(t => t.status === 'REVIEW_FINISH' || t.status === 'WAITING_CLIENT_CONFIRMATION' || t.status === 'RESCHEDULED').length },
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
                        {(ticket.is_rework || (ticket.rework_count ?? 0) > 0) && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EDA6A3] text-[#192A56] animate-pulse">
                            ⚠️ Dikerjakan Ulang (Rework)
                          </span>
                        )}
                        {ticket.current_stage && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                            {ticket.current_stage}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 font-medium mb-2">{ticket.problem}</p>
                      {(ticket.is_rework || (ticket.rework_count ?? 0) > 0) && ticket.rework_reason && (
                        <div className="mb-2 p-3 bg-red-50/70 border border-red-200 rounded-xl text-sm">
                          <p className="font-semibold text-red-700 mb-0.5 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" /> Komplain Client:
                          </p>
                          <p className="text-slate-600 whitespace-pre-wrap">{ticket.rework_reason}</p>
                        </div>
                      )}
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
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {ticket.status === 'ASSIGNED' && (
                        <>
                          <button
                            onClick={() => runInvestigation(ticket)}
                            disabled={pendingStage}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                          >
                            {pendingStage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            Mulai Investigasi
                          </button>
                          <button
                            onClick={() => openReschedule(ticket)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7D794] hover:bg-[#EDA6A3] text-[#192A56] text-sm font-semibold rounded-xl transition-colors"
                          >
                            <Calendar className="w-4 h-4" />
                            Reschedule
                          </button>
                        </>
                      )}
                      {ticket.status === 'INVESTIGATION' && (
                        <button
                          onClick={() => openInvestigation(ticket)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Kirim Laporan Investigasi
                        </button>
                      )}
                      {ticket.status === 'NEEDS_ANALYSIS' && (
                        <span className="px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl">
                          Menunggu Analisis Admin
                        </span>
                      )}
                      {ticket.status === 'ON_PROGRESS' && (
                        <button
                          onClick={() => startWork(ticket)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Lanjutkan / Finish
                        </button>
                      )}
                      {ticket.status === 'REVIEW_FINISH' && (
                        <>
                          <span className="px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl">
                            Menunggu Review Admin
                          </span>
                          <button
                            onClick={() => openPhotoModal(ticket)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-sm font-medium rounded-xl transition-colors border border-emerald-200"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Lihat Foto
                          </button>
                        </>
                      )}
                      {ticket.status === 'WAITING_CLIENT_CONFIRMATION' && (
                        <>
                          <span className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                            Menunggu Tanggapan Client
                          </span>
                          <button
                            onClick={() => openPhotoModal(ticket)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-sm font-medium rounded-xl transition-colors border border-emerald-200"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Lihat Foto
                          </button>
                        </>
                      )}
                      {(ticket.status === 'COMPLETED' || ticket.status === 'FINISHED' || ticket.status === 'RESCHEDULED') && (
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
            onSuccess={(status) => {
              // Instan update status lokal agar UI langsung berubah (mis. "Menunggu")
              if (status && selectedTicket) {
                setTickets(prev =>
                  prev.map(t => (t.id === selectedTicket.id ? { ...t, status } : t))
                )
              }
              router.refresh()
              handleRefresh()
              setShowWorkModal(false)
              setSelectedTicket(null)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRescheduleModal && rescheduleTicketSel && (
          <RescheduleModal
            ticket={rescheduleTicketSel}
            onClose={() => { setShowRescheduleModal(false); setRescheduleTicketSel(null) }}
            onSuccess={() => { handleRefresh(); setShowRescheduleModal(false); setRescheduleTicketSel(null) }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInvestigationModal && investigationTicket && (
          <InvestigationModal
            ticket={investigationTicket}
            onClose={() => { setShowInvestigationModal(false); setInvestigationTicket(null) }}
            onSuccess={() => { handleRefresh(); setShowInvestigationModal(false); setInvestigationTicket(null) }}
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
              setPhotoLightbox(null)
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
                    setPhotoLightbox(null)
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
                  <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                    {(['BEFORE', 'PROGRESS', 'AFTER', 'OTHER'] as const).map(type => {
                      const items = photoUrls.filter(p => p.photo_type === type)
                      if (items.length === 0) return null
                      const label =
                        type === 'BEFORE' ? 'Foto Sebelum (Before)'
                        : type === 'PROGRESS' ? 'Foto Proses'
                        : type === 'AFTER' ? 'Foto Sesudah (After)'
                        : type
                      return (
                        <div key={type}>
                          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                            📸 {label} <span className="text-slate-300">({items.length})</span>
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {items.map(p => (
                              <button
                                key={p.id}
                                onClick={() => setPhotoLightbox(p.storage_path)}
                                className="group aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:scale-105 transition-transform"
                              >
                                <img
                                  src={p.storage_path}
                                  alt={`${label} - ${p.file_name}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Lightbox tampilan ukuran penuh — resolusi penuh tanpa distorsi */}
        {photoLightbox && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={() => setPhotoLightbox(null)}>
            <button
              onClick={() => setPhotoLightbox(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              aria-label="Tutup preview"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={photoLightbox}
              alt="Preview foto resolusi penuh"
              onClick={e => e.stopPropagation()}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface WorkModalProps {
  ticket: Ticket
  dailyLogs: DailyLog[]
  onClose: () => void
  onSuccess: (status?: string) => void
}

function WorkModal({ ticket, dailyLogs, onClose, onSuccess }: WorkModalProps) {
  const [stage, setStage] = useState<TicketStage>(ticket.current_stage as TicketStage || 'INSPECTION')
  const [workDescription, setWorkDescription] = useState('')
  // Upload foto dikategorikan: Sebelum (wajib Day 1), Proses (opsional), Sesudah (wajib Klaim Finish)
  const [beforeFiles, setBeforeFiles] = useState<File[]>([])
  const [processFiles, setProcessFiles] = useState<File[]>([])
  const [afterFiles, setAfterFiles] = useState<File[]>([])
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

      const appendCategorizedFiles = () => {
        let fileIdx = 0
        const append = (bucket: File[], type: string) => {
          bucket.forEach(file => {
            formData.append(`file_${fileIdx}`, file)
            formData.append(`file_type_${fileIdx}`, type)
            fileIdx++
          })
        }
        append(beforeFiles, 'BEFORE')
        append(processFiles, 'PROGRESS')
        append(afterFiles, 'AFTER')
      }
      appendCategorizedFiles()

      const response = await fetch('/api/engineering/work-action', {
        method: 'POST',
        body: formData,
      })

      const result = await safeJson(response)

      if (!response.ok || result.error) {
        setError(result.error || 'Terjadi kesalahan')
        setIsPending(false)
        return
      }

      // "Simpan Progress" / "Extend" -> status tetap ON_PROGRESS (tidak ada perubahan).
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    }
    setIsPending(false)
  }

  // Handler terpisah khusus "Klaim Finish" — TIDAK memakai jalur simpan progress.
  // Update status di DB langsung ke REVIEW_FINISH ("Menunggu Review Admin").
  async function handleFinish() {
    if (afterFiles.length === 0) {
      setError('Foto sesudah (After) wajib dilampirkan untuk Klaim Finish.')
      return
    }
    setIsPending(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('ticket_id', ticket.id)
      formData.append('stage', stage)
      formData.append('work_description', workDescription)
      formData.append('action_type', 'FINISH')
      formData.append('day_number', String(dayNumber))

      const appendCategorizedFiles = () => {
        let fileIdx = 0
        const append = (bucket: File[], type: string) => {
          bucket.forEach(file => {
            formData.append(`file_${fileIdx}`, file)
            formData.append(`file_type_${fileIdx}`, type)
            fileIdx++
          })
        }
        append(beforeFiles, 'BEFORE')
        append(processFiles, 'PROGRESS')
        append(afterFiles, 'AFTER')
      }
      appendCategorizedFiles()

      const response = await fetch('/api/engineering/work-action', {
        method: 'POST',
        body: formData,
      })

      const result = await safeJson(response)

      if (!response.ok || result.error) {
        setError(result.error || 'Terjadi kesalahan')
        setIsPending(false)
        return
      }

      // Langsung pindahkan tiket ke "Menunggu" (REVIEW_FINISH) di UI.
      onSuccess('REVIEW_FINISH')
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    }
    setIsPending(false)
  }

  async function handleBucketChange(bucket: 'BEFORE' | 'PROGRESS' | 'AFTER', e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    const compressed = await compressFiles(e.target.files)
    if (bucket === 'BEFORE') setBeforeFiles(compressed)
    else if (bucket === 'PROGRESS') setProcessFiles(compressed)
    else setAfterFiles(compressed)
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

          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Upload Foto (dikategorikan)
            </label>

            {/* Foto Sebelum (wajib Day 1 / awal kerja) */}
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/40">
              <label className="text-xs font-bold text-rose-700 uppercase tracking-wide block mb-2">
                📸 Foto Sebelum (Before)
                <span className="ml-2 text-[10px] font-medium text-rose-400 normal-case">Wajib Day 1 / awal kerja</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={e => handleBucketChange('BEFORE', e)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200"
              />
              {beforeFiles.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">{beforeFiles.length} file dipilih</p>
              )}
            </div>

            {/* Foto Proses (opsional) */}
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40">
              <label className="text-xs font-bold text-amber-700 uppercase tracking-wide block mb-2">
                📸 Foto Proses <span className="ml-2 text-[10px] font-medium text-amber-400 normal-case">Opsional</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={e => handleBucketChange('PROGRESS', e)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
              />
              {processFiles.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">{processFiles.length} file dipilih</p>
              )}
            </div>

            {/* Foto Sesudah (wajib Klaim Finish) */}
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <label className="text-xs font-bold text-emerald-700 uppercase tracking-wide block mb-2">
                📸 Foto Sesudah (After)
                <span className="ml-2 text-[10px] font-medium text-emerald-400 normal-case">Wajib saat Klaim Finish</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={e => handleBucketChange('AFTER', e)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200"
              />
              {afterFiles.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">{afterFiles.length} file dipilih</p>
              )}
            </div>
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
              onClick={handleFinish}
              disabled={isPending || afterFiles.length === 0}
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

// Modal Reschedule (Teknisi) - butuh foto bukti + alasan -> status RESCHEDULED
function RescheduleModal({ ticket, onClose, onSuccess }: { ticket: Ticket; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!reason.trim()) { setError('Alasan reschedule wajib diisi.'); return }
    setIsPending(true)
    setError(null)
    const fd = new FormData()
    fd.set('ticket_id', ticket.id)
    fd.set('reason', reason)
    files.forEach((f, i) => fd.append(`file_${i}`, f))
    const res = await rescheduleTicket(fd)
    setIsPending(false)
    if (res?.error) { setError(res.error); return }
    onSuccess()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/60 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-100/80 bg-gradient-to-r from-purple-50/50 to-white/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Reschedule Jadwal</h3>
            <p className="text-sm text-slate-500">{ticket.ticket_number}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
              <Camera className="w-4 h-4" /> Foto Bukti (client tidak ada / tidak bisa ditemui)
            </label>
            <input type="file" accept="image/*" multiple onChange={async e => { setFiles(await compressFiles(e.target.files || [])) }} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
            {files.length > 0 && <p className="text-xs text-slate-500 mt-2">{files.length} file dipilih</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Alasan Reschedule</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Contoh: Client sedang di luar kota"
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all outline-none resize-none text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} disabled={isPending} className="flex-1 px-4 py-3 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-semibold rounded-xl transition-colors">Batal</button>
            <button onClick={handleSubmit} disabled={isPending} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#F7D794] hover:bg-[#EDA6A3] text-[#192A56] font-semibold rounded-xl transition-colors disabled:opacity-50">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Ajukan Reschedule
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Modal Laporan Investigasi (Teknisi) - foto detail + deskripsi + bahan -> NEEDS_ANALYSIS
function InvestigationModal({ ticket, onClose, onSuccess }: { ticket: Ticket; onClose: () => void; onSuccess: () => void }) {
  const [report, setReport] = useState('')
  const [materials, setMaterials] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!report.trim()) { setError('Detail laporan kerusakan wajib diisi.'); return }
    if (!materials.trim()) { setError('Daftar bahan/material wajib diisi.'); return }
    setIsPending(true)
    setError(null)
    const fd = new FormData()
    fd.set('ticket_id', ticket.id)
    fd.set('investigation_report', report)
    fd.set('required_materials', materials)
    files.forEach((f, i) => fd.append(`file_${i}`, f))
    const res = await submitInvestigation(fd)
    setIsPending(false)
    if (res?.error) { setError(res.error); return }
    onSuccess()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/60 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-100/80 bg-gradient-to-r from-amber-50/50 to-white/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Laporan Investigasi</h3>
            <p className="text-sm text-slate-500">{ticket.ticket_number}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
              <Camera className="w-4 h-4" /> Foto Detail Kerusakan
            </label>
            <input type="file" accept="image/*" multiple onChange={async e => { setFiles(await compressFiles(e.target.files || [])) }} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
            {files.length > 0 && <p className="text-xs text-slate-500 mt-2">{files.length} file dipilih</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Detail Deskripsi Kerusakan</label>
            <textarea
              value={report}
              onChange={e => setReport(e.target.value)}
              rows={4}
              placeholder="Deskripsi detail kondisi kerusakan..."
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all outline-none resize-none text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Bahan / Material yang Dibutuhkan</label>
            <textarea
              value={materials}
              onChange={e => setMaterials(e.target.value)}
              rows={3}
              placeholder="Satu per baris. Contoh:&#10;Pipa PVC 1/2 inch&#10;Lem pipa&#10;Selotip"
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all outline-none resize-none text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} disabled={isPending} className="flex-1 px-4 py-3 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-semibold rounded-xl transition-colors">Batal</button>
            <button onClick={handleSubmit} disabled={isPending} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Kirim Laporan
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F7D794]"></div>
      </div>
    }>
      <TaskPageContent userProfile={userProfile} />
    </Suspense>
  )
}
