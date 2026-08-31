'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Ticket,
  Wrench,
  X,
  Loader2,
  Search,
  ChevronDown,
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Circle,
  Flag,
  Users,
  FileText,
  CheckCircle2,
  RefreshCcw,
} from 'lucide-react'
import AssignTechniciansModal from '@/components/engineering-admin/AssignTechniciansModal'
import { startProgress, saveAnalysis } from '@/actions/tickets'

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

interface Ticket {
  id: string
  ticket_number: string
  problem: string
  status: string
  created_at: string
  unit_code: string
  resident_name: string
  phone_number?: string
  current_assignee_id?: string
  assigned_technician_ids?: string[] | null
  priority?: string
  scheduled_at?: string | null
  investigation_report?: string | null
  required_materials?: string[] | string | null
  reschedule_reason?: string | null
  finish_notes?: string | null
  rework_reason?: string | null
  rework_count?: number | null
  is_rework?: boolean | null
  client_feedback?: string | null
  photos?: {
    id: string
    storage_path: string
    photo_type: string
    file_name: string
  }[] | null
  investigation_photo_paths?: string[] | null
  reschedule_photo_paths?: string[] | null
  before_photo_paths?: string[] | null
  process_photo_paths?: string[] | null
  after_photo_paths?: string[] | null
  before_photos?: string[] | null
  process_photos?: string[] | null
  after_photos?: string[] | null
  completion_photo_paths?: string[] | null
  photo_paths?: string[] | null
  daily_logs?: {
    day_number?: number
    work_description?: string | null
    photo_paths?: string[] | null
    photos?: string[] | null
  }[] | null
}

interface Engineer {
  id: string
  full_name: string
  avatar_url?: string
}

// Pipeline alur Engineering Admin <-> Teknisi.
interface Bucket {
  key: string
  label: string
  icon: typeof Ticket
  statuses: string[]
  badge: string
}

const BUCKETS: Bucket[] = [
  {
    key: 'unassigned',
    label: 'Baru / Unassigned',
    icon: Circle,
    statuses: ['UNASSIGNED', '__null__'],
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    key: 'assigned',
    label: 'Ditugaskan',
    icon: Users,
    statuses: ['ASSIGNED'],
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    key: 'investigation',
    label: 'Investigasi',
    icon: AlertTriangle,
    statuses: ['INVESTIGATION'],
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  {
    key: 'analysis',
    label: 'Analisis Kerusakan',
    icon: ClipboardList,
    statuses: ['NEEDS_ANALYSIS'],
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    key: 'reschedule',
    label: 'Reschedule',
    icon: CalendarClock,
    statuses: ['RESCHEDULED'],
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    key: 'onprogress',
    label: 'On Progress',
    icon: Wrench,
    statuses: ['ON_PROGRESS'],
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  {
    key: 'review',
    label: 'Review Finish',
    icon: FileText,
    statuses: ['REVIEW_FINISH'],
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    key: 'waiting',
    label: 'Menunggu Tanggapan Client',
    icon: CalendarClock,
    statuses: ['WAITING_CLIENT_CONFIRMATION'],
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    key: 'rework',
    label: 'Rework / Komplain Client',
    icon: RefreshCcw,
    statuses: ['REWORK_REQ'],
    badge: 'bg-red-50 text-red-700 border-red-200',
  },
  {
    key: 'done',
    label: 'Selesai & Dibatalkan',
    icon: Flag,
    statuses: ['FINISHED', 'CANCELLED'],
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
]

const STATUS_LABELS: Record<string, string> = {
  UNASSIGNED: 'Baru / Unassigned',
  ASSIGNED: 'Ditugaskan',
  INVESTIGATION: 'Sedang Investigasi',
  NEEDS_ANALYSIS: 'Analisis Kerusakan',
  RESCHEDULED: 'Reschedule',
  ON_PROGRESS: 'On Progress',
  REVIEW_FINISH: 'Menunggu Review Admin',
  WAITING_CLIENT_CONFIRMATION: 'Menunggu Tanggapan Client',
  REWORK_REQ: 'Rework / Komplain Client',
  FINISHED: 'Selesai',
  CANCELLED: 'Dibatalkan',
}

export default function EngineeringAdminTaskPage({ engineers }: { engineers: Engineer[] }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeBucket, setActiveBucket] = useState('unassigned')
  const [showAssign, setShowAssign] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [openActionsFor, setOpenActionsFor] = useState<string | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  // Analisis modal state
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisTicket, setAnalysisTicket] = useState<Ticket | null>(null)
  const [analysisPriority, setAnalysisPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL')
  const [extraTechs, setExtraTechs] = useState<string[]>([])
  const [analysisPending, setAnalysisPending] = useState(false)

  // Review Finish -> Kirim Konfirmasi ke Client
  const [reviewSendingId, setReviewSendingId] = useState<string | null>(null)
  const [reviewWaLink, setReviewWaLink] = useState<{ id: string; link: string } | null>(null)

  // Approve rework dari client -> kirim kembali ke investigasi
  const [reworkApprovingId, setReworkApprovingId] = useState<string | null>(null)

  // Review Finish photo modal (Before/After + lightbox)
  const [showReview, setShowReview] = useState(false)
  const [reviewTicket, setReviewTicket] = useState<Ticket | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  async function handleSendConfirmation(ticket: Ticket) {
    setReviewSendingId(ticket.id)
    try {
      const r = await fetch('/api/engineering-admin/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticket.id, status: 'WAITING_CLIENT_CONFIRMATION' }),
      })
      const d = await safeJson(r)
      if (d.error) {
        console.error(d.error)
      } else if (d.waLink) {
        setReviewWaLink({ id: ticket.id, link: d.waLink })
      }
      await fetchTickets(true)
    } finally {
      setReviewSendingId(null)
    }
  }

  async function handleApproveRework(ticket: Ticket) {
    setReworkApprovingId(ticket.id)
    try {
      const r = await fetch('/api/engineering-admin/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticket.id, status: 'INVESTIGATION' }),
      })
      const d = await safeJson(r)
      if (d.error) {
        console.error(d.error)
      }
      await fetchTickets(true)
    } finally {
      setReworkApprovingId(null)
    }
  }

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const r = await fetch('/api/engineering-admin/tickets')
      const d = await safeJson(r)
      if (d.tickets) setTickets(d.tickets)
    } catch (err) {
      console.error('Failed to fetch tickets:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    fetch('/api/engineering-admin/tickets')
      .then(r => safeJson(r))
      .then(d => { if (active && d.tickets) setTickets(d.tickets) })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function transition(ticket: Ticket, status: string) {
    if (transitioning) return
    setTransitioning(true)
    setOpenActionsFor(null)
    try {
      const r = await fetch('/api/engineering-admin/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticket.id, status }),
      })
      const d = await safeJson(r)
      if (d.error) console.error(d.error)
      await fetchTickets(true)
    } finally { setTransitioning(false) }
  }

  function openAnalysis(ticket: Ticket) {
    setAnalysisTicket(ticket)
    setAnalysisPriority((ticket.priority === 'URGENT' ? 'URGENT' : 'NORMAL') as 'NORMAL' | 'URGENT')
    setExtraTechs([])
    setShowAnalysis(true)
  }

  async function saveAndStart() {
    if (!analysisTicket) return
    setAnalysisPending(true)
    const fd = new FormData()
    fd.set('ticket_id', analysisTicket.id)
    fd.set('priority', analysisPriority)
    extraTechs.forEach(id => fd.append('engineering_id', id))
    await saveAnalysis(fd)
    await startProgress(analysisTicket.id)
    setAnalysisPending(false)
    setShowAnalysis(false)
    await fetchTickets(true)
  }

  const activeBucketDef = BUCKETS.find(b => b.key === activeBucket) || BUCKETS[0]

  const inBucket = (t: Ticket, statuses: string[]) => {
    const s = t.status || '__null__'
    return statuses.includes(s)
  }

  const filtered = tickets.filter(t => {
    if (!inBucket(t, activeBucketDef.statuses)) return false
    if (!search) return true
    return (
      t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      t.problem.toLowerCase().includes(search.toLowerCase())
    )
  })

  // Transisi yang tersedia berdasarkan status saat ini.
  function availableTransitions(status: string): { to: string; label: string }[] {
    switch (status) {
      case 'ASSIGNED':
        return [{ to: 'RESCHEDULED', label: '→ Reschedule' }]
      case 'INVESTIGATION':
        return []
      case 'NEEDS_ANALYSIS':
        return []
      case 'RESCHEDULED':
        return [
          { to: 'ASSIGNED', label: '→ Tugaskan Ulang' },
          { to: 'CANCELLED', label: '→ Batal' },
        ]
      case 'ON_PROGRESS':
        return [
          { to: 'RESCHEDULED', label: '→ Reschedule' },
          { to: 'FINISHED', label: '→ Selesai (force)' },
          { to: 'CANCELLED', label: '→ Batal' },
        ]
      case 'WAITING_CLIENT_CONFIRMATION':
        return [{ to: 'FINISHED', label: '→ Selesai' }]
      default:
        return []
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Task Management</h1>
            <p className="text-sm text-slate-500">
              Pipeline: Baru → Ditugaskan → Investigasi → Analisis Kerusakan → On Progress → Review Finish → Menunggu Tanggapan Client → Selesai
            </p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari tiket..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
            />
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {BUCKETS.map(b => {
          const count = tickets.filter(t => inBucket(t, b.statuses)).length
          const active = activeBucket === b.key
          return (
            <button
              key={b.key}
              onClick={() => setActiveBucket(b.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer border ${
                active
                  ? 'bg-purple-600 text-white border-purple-600 shadow'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
              }`}
            >
              <b.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{b.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-purple-100 p-12 text-center">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Tidak ada tiket pada {activeBucketDef.label}</p>
          </div>
        ) : (
          filtered.map((ticket, i) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-slate-800">{ticket.ticket_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${BUCKETS.find(b => b.statuses.includes(ticket.status))?.badge || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {STATUS_LABELS[ticket.status] || ticket.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${ticket.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {ticket.priority === 'URGENT' ? 'URGENT' : 'Normal'}
                    </span>
                    {ticket.assigned_technician_ids?.length ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">
                        {ticket.assigned_technician_ids.length} teknisi
                      </span>
                    ) : null}
                  </div>
                  <p className="text-slate-700 font-medium mb-2">{ticket.problem}</p>

                  {ticket.status === 'NEEDS_ANALYSIS' && ticket.investigation_report && (
                    <div className="mt-2 p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-sm">
                      <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-600" /> Laporan Investigasi
                      </p>
                      <p className="text-slate-600 mb-1">{ticket.investigation_report}</p>
                      {ticket.required_materials ? (
                        <p className="text-slate-500 text-xs">
                          <span className="font-semibold">Bahan:</span>{' '}
                          {Array.isArray(ticket.required_materials)
                            ? ticket.required_materials.join(', ')
                            : ticket.required_materials}
                        </p>
                      ) : null}
                    </div>
                  )}
                  {ticket.status === 'RESCHEDULED' && ticket.reschedule_reason && (
                    <div className="mt-2 p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">Alasan: </span>{ticket.reschedule_reason}
                    </div>
                  )}

                  {ticket.status === 'REWORK_REQ' && ticket.rework_reason && (
                    <div className="mt-2 p-3 bg-red-50/60 border border-red-200 rounded-xl text-sm">
                      <p className="font-semibold text-red-700 mb-1 flex items-center gap-1.5">
                        <RefreshCcw className="w-4 h-4" /> Komplain Client (Rework {ticket.rework_count ?? 1}x)
                      </p>
                      <p className="text-slate-600 whitespace-pre-wrap">{ticket.rework_reason}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap mt-2">
                    <span>{ticket.unit_code}</span>
                    <span>•</span>
                    <span>{ticket.resident_name}</span>
                    <span>•</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {(ticket.status === 'UNASSIGNED' || ticket.status === 'ASSIGNED') && (
                    <button
                      onClick={() => { setSelectedTicket(ticket); setShowAssign(true) }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      <Wrench className="w-4 h-4" />
                      Tugaskan
                    </button>
                  )}

                  {ticket.status === 'NEEDS_ANALYSIS' && (
                    <button
                      onClick={() => openAnalysis(ticket)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      <ClipboardList className="w-4 h-4" />
                      Analisis & Start Progress
                    </button>
                  )}

                  {ticket.status === 'REVIEW_FINISH' && (
                    <>
                      <button
                        onClick={() => { setReviewTicket(ticket); setShowReview(true) }}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:text-teal-600 text-sm font-semibold rounded-xl transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Tinjau Foto & Log Kerja
                      </button>
                      <button
                        onClick={() => handleSendConfirmation(ticket)}
                        disabled={reviewSendingId === ticket.id}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {reviewSendingId === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Konfirmasi & Kirim ke Client
                      </button>
                    </>
                  )}

                  {ticket.status === 'REWORK_REQ' && (
                    <>
                      <button
                        onClick={() => { setReviewTicket(ticket); setShowReview(true) }}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:text-teal-600 text-sm font-semibold rounded-xl transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Tinjau Foto & Log Kerja
                      </button>
                      <button
                        onClick={() => handleApproveRework(ticket)}
                        disabled={reworkApprovingId === ticket.id}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {reworkApprovingId === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                        Setujui Rework & Kirim ke Investigasi
                      </button>
                    </>
                  )}

                  {availableTransitions(ticket.status).length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenActionsFor(openActionsFor === ticket.id ? null : ticket.id)}
                        disabled={transitioning}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                      >
                        Ubah Status
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {openActionsFor === ticket.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenActionsFor(null)} />
                          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 min-w-[200px]">
                            {availableTransitions(ticket.status).map((t, idx) => (
                              <button
                                key={idx}
                                onClick={() => transition(ticket, t.to)}
                                disabled={transitioning}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-purple-50 transition-colors disabled:opacity-50"
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AssignTechniciansModal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        ticketId={selectedTicket?.id || ''}
        ticketNumber={selectedTicket?.ticket_number || ''}
        currentAssignments={selectedTicket?.assigned_technician_ids || []}
        onSuccess={() => {
          setShowAssign(false)
          fetchTickets(true)
        }}
      />

      {/* Analysis Modal */}
      {showAnalysis && analysisTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAnalysis(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-amber-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Analisis Kerusakan</h3>
                <p className="text-sm text-slate-500">{analysisTicket.ticket_number}</p>
              </div>
              <button onClick={() => setShowAnalysis(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {analysisTicket.investigation_report && (
                <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">Laporan: </span>
                  {analysisTicket.investigation_report}
                </div>
              )}
              {analysisTicket.required_materials ? (
                <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">Bahan dibutuhkan: </span>
                  {Array.isArray(analysisTicket.required_materials)
                    ? analysisTicket.required_materials.join(', ')
                    : analysisTicket.required_materials}
                </div>
              ) : null}

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Kategori Prioritas</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAnalysisPriority('NORMAL')}
                    className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${analysisPriority === 'NORMAL' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}
                  >
                    Normal (1 Hari)
                  </button>
                  <button
                    onClick={() => setAnalysisPriority('URGENT')}
                    className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${analysisPriority === 'URGENT' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500'}`}
                  >
                    Urgent (Multi-Day)
                  </button>
                </div>
              </div>

              {analysisPriority === 'URGENT' && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Tambah Teknisi Ekstra (opsional, untuk semua atau menambah personel)
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {engineers.map(e => {
                      const on = extraTechs.includes(e.id)
                      return (
                        <button
                          key={e.id}
                          onClick={() => setExtraTechs(prev => on ? prev.filter(x => x !== e.id) : [...prev, e.id])}
                          className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left transition-colors ${on ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                          <input type="checkbox" readOnly checked={on} className="accent-blue-600" />
                          <span className="text-sm font-medium text-slate-700">{e.full_name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={saveAndStart}
                disabled={analysisPending}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {analysisPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
                Simpan Analisis & Start Progress
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* WA link untuk mengirim konfirmasi ke client */}
      {reviewWaLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setReviewWaLink(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Konfirmasi Dikirim</h3>
                  <p className="text-xs text-slate-500">Admin memverifikasi pengerjaan. Tiket kini Menunggu Tanggapan Client</p>
                </div>
              </div>
              <button onClick={() => setReviewWaLink(null)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Buka tautan WhatsApp di bawah untuk mengirim notifikasi penyelesaian ke client agar meninjau & mengonfirmasi hasil pekerjaan.
            </p>
            <a
              href={reviewWaLink.link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Buka WhatsApp & Kirim
            </a>
          </motion.div>
        </div>
      )}

      {/* Modal Review Foto (Before/After) — Admin meninjau hasil teknisi */}
      {showReview && reviewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => { setShowReview(false); setLightboxUrl(null) }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" /> Tinjau Foto & Log Kerja
                </h3>
                <p className="text-sm text-slate-500">{reviewTicket.ticket_number} — {reviewTicket.resident_name}</p>
              </div>
              <button onClick={() => { setShowReview(false); setLightboxUrl(null) }} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(() => {
                const t = reviewTicket
                const norm = (xs: any): { src: string; type: string }[] => (xs || []).map((x: any) =>
                  typeof x === 'string'
                    ? { src: x, type: 'OTHER' }
                    : { src: x?.storage_path || x?.url || '', type: x?.photo_type || 'OTHER' }
                ).filter((p: any) => p.src)

                const sec = (title: string, items: { src: string; type: string }[]) => (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {items.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setLightboxUrl(p.src)}
                        className="group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:scale-105 transition-transform"
                      >
                        <img src={p.src} alt={title} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )

                const emptyBox = (text: string) => (
                  <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 px-4 py-6 text-center">
                    <p className="text-sm text-slate-500">{text}</p>
                  </div>
                )

                const photoSection = (title: string, items: { src: string; type: string }[], emptyText: string) => (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                      📸 {title} <span className="text-slate-300">({items.length})</span>
                    </h4>
                    {items.length > 0 ? sec(title, items) : emptyBox(emptyText)}
                  </div>
                )

                // Sumber utama: kolom terkategori (before_photo_paths / process_photo_paths / after_photo_paths)
                // yang diisi saat teknisi submit "Klaim Finish".
                const colBefore = (t.before_photo_paths || []).map((src: string) => ({ src, type: 'BEFORE' }))
                const colProcess = (t.process_photo_paths || []).map((src: string) => ({ src, type: 'PROGRESS' }))
                const colAfter = (t.after_photo_paths || []).map((src: string) => ({ src, type: 'AFTER' }))

                // Fallback: agregasi sumber lain untuk tiket lama yang belum punya kolom terkategori.
                const byType = (type: string) => norm(t.photos).filter((p: any) => p.type === type)
                const dl: any[] = Array.isArray(t.daily_logs) ? t.daily_logs : []
                const firstLogPhotos = dl.length > 0 ? [...(dl[0]?.photo_paths || []), ...(dl[0]?.photos || [])] : []
                const lastLogPhotos = dl.length > 0 ? [...(dl[dl.length - 1]?.photo_paths || []), ...(dl[dl.length - 1]?.photos || [])] : []
                const midLogPhotos = dl.slice(1, -1).flatMap((log: any) => [...(log?.photo_paths || []), ...(log?.photos || [])])

                const beforePhotos = [
                  ...norm(t.investigation_photo_paths).map(p => ({ ...p, type: 'BEFORE' })),
                  ...norm(t.before_photos).map(p => ({ ...p, type: 'BEFORE' })),
                  ...byType('BEFORE'),
                  ...norm(firstLogPhotos).map(p => ({ ...p, type: 'BEFORE' })),
                ].filter((p: any) => p.src)

                const processPhotos = [
                  ...norm(t.process_photos).map(p => ({ ...p, type: 'PROGRESS' })),
                  ...norm(t.reschedule_photo_paths).map(p => ({ ...p, type: 'PROGRESS' })),
                  ...byType('PROGRESS'),
                  ...norm(midLogPhotos).map(p => ({ ...p, type: 'PROGRESS' })),
                ].filter((p: any) => p.src)

                const afterPhotos = [
                  ...norm(t.after_photos).map(p => ({ ...p, type: 'AFTER' })),
                  ...norm(t.completion_photo_paths).map(p => ({ ...p, type: 'AFTER' })),
                  ...byType('AFTER'),
                  ...norm(lastLogPhotos).map(p => ({ ...p, type: 'AFTER' })),
                ].filter((p: any) => p.src)

                const beforeItems = colBefore.length > 0 ? colBefore : beforePhotos
                const processItems = colProcess.length > 0 ? colProcess : processPhotos
                const afterItems = colAfter.length > 0 ? colAfter : afterPhotos

                // Deskripsi pengerjaan dari teknisi: catatan finish / log harian terakhir / laporan investigasi.
                const latestLog = dl.length > 0 ? dl[dl.length - 1] : null
                const finishNotes = (t as any).finish_notes || ''
                const descText = finishNotes ||
                  latestLog?.work_description ||
                  latestLog?.description ||
                  t.investigation_report ||
                  ''

                return (
                  <div className="space-y-6">
                    <div className="rounded-xl bg-teal-50/60 border border-teal-100 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-teal-700 mb-2">
                        📝 Deskripsi Pengerjaan Lapangan
                      </h4>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {descText.trim() || 'Tidak ada deskripsi catatan tambahan dari teknisi.'}
                      </p>
                    </div>

                    {photoSection('Foto Sebelum (Before)', beforeItems, 'Belum ada foto Sebelum.')}

                    {processItems.length > 0 && photoSection('Foto Proses', processItems, 'Belum ada foto Proses.')}

                    {photoSection('Foto Sesudah (After)', afterItems, 'Belum ada foto Sesudah.')}
                  </div>
                )
              })()}

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleSendConfirmation(reviewTicket)}
                  disabled={reviewSendingId === reviewTicket.id}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {reviewSendingId === reviewTicket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Konfirmasi & Kirim ke Client
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lightbox tampilan ukuran penuh — resolusi penuh tanpa distorsi */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={() => setLightboxUrl(null)}>
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            aria-label="Tutup preview"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Preview foto resolusi penuh"
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}
