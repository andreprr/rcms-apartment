'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Ticket,
  Star,
  Award,
  Briefcase,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  TrendingUp,
  TrendingDown,
  FileText,
  FileSpreadsheet,
  Timer,
  Loader2,
  BarChart3,
  Layers,
  Zap,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts'
import type { UserRole } from '@/types/database'

interface Ticket {
  id: string
  ticket_number: string
  unit_code: string
  resident_name: string
  problem: string
  status: string
  created_at: string
  started_at?: string | null
  submitted_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
  current_assignee_id?: string | null
  is_archived: boolean
}

interface AppUser {
  id: string
  full_name: string
  role: string
  division: string
  is_active: boolean
}

interface DailyLog {
  id: string
  ticket_id: string
  engineering_id: string
  day_number: number
  duration_minutes?: number | null
  action_type: string
  created_at: string
}

interface Confirmation {
  id: string
  ticket_id: string
  rating?: number | null
  comment?: string | null
  is_visible: boolean
  confirmed_at: string
}

interface UserProfile {
  full_name: string
  division: string
  avatar_url?: string
  role: UserRole
}

type RangeKey = 'today' | 'weekly' | 'monthly' | 'yearly'

const RANGE_LABEL: Record<RangeKey, string> = {
  today: 'Hari Ini',
  weekly: '7 Hari',
  monthly: '30 Hari',
  yearly: '12 Bulan',
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Baru', color: '#D2F377' },
  ASSIGNED: { label: 'Ditugaskan', color: '#E9E2FE' },
  ON_PROGRESS: { label: 'Diproses', color: '#FFEAA5' },
  WAITING_CONFIRMATION: { label: 'Menunggu', color: '#C5B4FC' },
  COMPLETED: { label: 'Selesai', color: '#D2F377' },
  REWORK: { label: 'Rework', color: '#FFC2BD' },
  ON_HOLD: { label: 'Ditahan', color: '#94A3B8' },
  CANCELLED: { label: 'Dibatalkan', color: '#FFC2BD' },
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'AC': ['ac', 'air conditioner', 'pendingin', 'cooling'],
  'Plumbing': ['pipa', 'bocor', 'plumbing', 'toilet', 'air', 'pompa', 'mampet', 'saluran', 'kran'],
  'Listrik': ['listrik', 'lampu', 'stop kontak', 'breaker', 'mati listrik', 'ganti lampu'],
  'Sipil': ['dinding', 'cat', 'plester', 'retak', 'sipil', 'lantai', 'keramik', 'pintu', 'jendela'],
  'Intercom': ['intercom', 'telepon', 'bel', 'gauge', 'akses'],
}

function classifyCategory(problem: string): string {
  const p = (problem || '').toLowerCase()
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some(w => p.includes(w))) return cat
  }
  return 'Lainnya'
}

function parseBuilding(unit: string): { building: string; floor: string } {
  const u = (unit || '').toUpperCase().trim()
  const match = u.match(/^([A-Z]+)[-.]?(\d+)/)
  const building = match ? match[1] : (u.split('-')[0] || 'U/M')
  const floor = match ? match[2] : '-'
  return { building, floor }
}

function hoursFrom(a: string | null | undefined, b: string | null | undefined): number | null {
  if (!a || !b) return null
  const diff = new Date(b).getTime() - new Date(a).getTime()
  if (diff <= 0) return null
  return diff / 3600000
}

function inRange(ts: string | null | undefined, rangeInDays: number): boolean {
  if (!ts) return false
  const t = new Date(ts).getTime()
  const cutoff = new Date().getTime() - rangeInDays * 86400000
  return t >= cutoff
}

const SLA_HOURS = 72

export default function AdminAnalyticsClient({
  userProfile,
  initialTickets,
  initialUsers,
  initialDailyLogs,
  initialConfirmations,
}: {
  userProfile: UserProfile
  initialTickets: Ticket[]
  initialUsers: AppUser[]
  initialDailyLogs: DailyLog[]
  initialConfirmations: Confirmation[]
}) {
  const [range, setRange] = useState<RangeKey>('monthly')
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)

  const safeUserProfile = useMemo(() => ({
    full_name: userProfile?.full_name || 'Admin',
    division: userProfile?.division || 'Super Admin',
    avatar_url: userProfile?.avatar_url,
    role: userProfile?.role || 'ADMIN' as UserRole,
  }), [userProfile])

  const rangeDays = range === 'today' ? 1 : range === 'weekly' ? 7 : range === 'monthly' ? 30 : 365

  const userMap = useMemo(() => {
    const map: Record<string, AppUser> = {}
    for (const u of initialUsers || []) map[u.id] = u
    return map
  }, [initialUsers])

  const raw = useMemo(() => {
    const tickets = (initialTickets || []).filter(t => inRange(t.created_at, rangeDays))
    const confirmations = (initialConfirmations || []).filter(c => inRange(c.confirmed_at, rangeDays))
    const logs = (initialDailyLogs || []).filter(l => inRange(l.created_at, rangeDays))
    return { tickets, confirmations, logs }
  }, [initialTickets, initialConfirmations, initialDailyLogs, rangeDays])

  // ---- Executive KPIs ----
  const kpis = useMemo(() => {
    const tickets = raw.tickets
    const total = tickets.length
    const completed = tickets.filter(t => t.status === 'COMPLETED').length
    const cancelled = tickets.filter(t => t.status === 'CANCELLED').length
    const active = tickets.filter(t => ['NEW', 'ASSIGNED', 'ON_PROGRESS', 'WAITING_CONFIRMATION', 'REWORK', 'ON_HOLD'].includes(t.status)).length

    // SLA: completed within SLA_HOURS of creation
    let slaOk = 0
    let slaTotal = 0
    const durations: number[] = []
    for (const t of tickets) {
      const dur = hoursFrom(t.created_at, t.completed_at)
      if (dur !== null) {
        durations.push(dur)
        slaTotal++
        if (dur <= SLA_HOURS) slaOk++
      }
    }
    const slaRate = slaTotal > 0 ? Math.round((slaOk / slaTotal) * 100) : 0
    const mttr = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0

    // Cost / Resource index: weighted by active tickets + logged hours
    const loggedHours = (raw.logs || []).reduce((s, l) => s + (l.duration_minutes || 0), 0) / 60
    const resourceIndex = active + Math.round(loggedHours / 8)

    return { total, completed, cancelled, active, slaRate, slaTotal, mttr, loggedHours, resourceIndex }
  }, [raw])

  // ---- Status distribution ----
  const statusData = useMemo(() => {
    return Object.entries(STATUS_META).map(([key, meta]) => ({
      name: meta.label,
      key,
      value: raw.tickets.filter(t => t.status === key).length,
      color: meta.color,
    })).filter(d => d.value > 0)
  }, [raw])

  // ---- RR Insights: categories ----
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of raw.tickets) {
      const c = classifyCategory(t.problem)
      counts[c] = (counts[c] || 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [raw])

  // ---- RR Insights: building/floor ----
  const buildingData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of raw.tickets) {
      const { building } = parseBuilding(t.unit_code)
      counts[building] = (counts[building] || 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [raw])

  const floorData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of raw.tickets) {
      const { floor } = parseBuilding(t.unit_code)
      counts[floor] = (counts[floor] || 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({ name: `Lt ${name}`, value })).filter(d => d.name !== 'Lt -').sort((a, b) => b.value - a.value)
  }, [raw])

  // ---- Engineering performance: leaderboard ----
  const techLeaderboard = useMemo(() => {
    const map: Record<string, { id: string; total: number; minutes: number; firstTimeFix: number; count: number; multiDay: number }> = {}
    for (const t of raw.tickets) {
      const engId = t.current_assignee_id
      if (!engId || !userMap[engId]) continue
      const rec = map[engId] || { id: engId, total: 0, minutes: 0, firstTimeFix: 0, count: 0, multiDay: 0 }
      rec.total++
      map[engId] = rec
    }
    for (const l of raw.logs) {
      if (!map[l.engineering_id]) map[l.engineering_id] = { id: l.engineering_id, total: 0, minutes: 0, firstTimeFix: 0, count: 0, multiDay: 0 }
      map[l.engineering_id].minutes += l.duration_minutes || 0
    }
    const rows = Object.values(map).map(r => {
      const user = userMap[r.id]
      return {
        id: r.id,
        name: user?.full_name || 'Teknisi',
        total: r.total,
        hours: r.minutes / 60,
        firstTimeFixRate: r.total > 0 ? 100 : 0,
      }
    })
    return rows.sort((a, b) => b.total - a.total || b.hours - a.hours)
  }, [raw, userMap])

  // ---- Bottleneck indicators ----
  const bottlenecks = useMemo(() => {
    const autoFinish = raw.tickets.filter(t => {
      if (t.status !== 'COMPLETED') return false
      const dur = hoursFrom(t.created_at, t.completed_at)
      return dur !== null && dur > 72
    })
    const multiDay = new Set(raw.logs.filter(l => l.day_number > 1).map(l => l.ticket_id))
    const overdueActive = raw.tickets.filter(t =>
      ['NEW', 'ASSIGNED', 'ON_PROGRESS'].includes(t.status)
    )
    return { autoFinish: autoFinish.length, multiDay: multiDay.size, overdueActive: overdueActive.length }
  }, [raw])

  // ---- CSAT ----
  const csat = useMemo(() => {
    const withRating = raw.confirmations.filter(c => c.rating != null)
    const ratings = withRating.map(c => c.rating as number)
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
    const sangatPuas = withRating.filter(r => (r.rating || 0) >= 4).length
    const netral = withRating.filter(r => r.rating === 3).length
    const buruk = withRating.filter(r => (r.rating || 0) <= 2).length
    const visible = raw.confirmations.filter(c => c.is_visible).length
    const hidden = raw.confirmations.length - visible
    return {
      avg,
      sangatPuas,
      netral,
      buruk,
      total: withRating.length,
      visible,
      hidden,
      moderationTotal: raw.confirmations.length,
    }
  }, [raw])

  // ---- Time series (monthly buckets for chart) ----
  const timeSeries = useMemo(() => {
    const buckets: Record<string, { created: number; completed: number }> = {}
    const ts = (t: string) => {
      const d = new Date(t)
      const key = range === 'yearly'
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return key
    }
    for (const t of raw.tickets) {
      const k = ts(t.created_at)
      buckets[k] = buckets[k] || { created: 0, completed: 0 }
      buckets[k].created++
    }
    for (const t of raw.tickets) {
      if (t.completed_at) {
        const k = ts(t.completed_at)
        buckets[k] = buckets[k] || { created: 0, completed: 0 }
        buckets[k].completed++
      }
    }
    return Object.entries(buckets).map(([date, v]) => ({
      date: range === 'yearly' ? date.slice(0, 7) : date.slice(5),
      created: v.created,
      completed: v.completed,
    })).sort((a, b) => a.date.localeCompare(b.date))
  }, [raw, range])

  const csatGauge = useMemo(() => [
    { name: 'Sangat Puas', value: csat.sangatPuas, fill: '#D2F377' },
    { name: 'Netral', value: csat.netral, fill: '#FFEAA5' },
    { name: 'Buruk', value: csat.buruk, fill: '#FFC2BD' },
  ], [csat])

  // ================= EXPORTS =================
  async function exportPDF() {
    setExporting('pdf')
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF('l', 'mm', 'a4')
      const w = doc.internal.pageSize.getWidth()

      doc.setFillColor(124, 58, 237)
      doc.rect(0, 0, w, 32, 'F')
      doc.setFillColor(245, 158, 11)
      doc.rect(0, 32, w, 1.5, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text('GATEWAY CORPORATE - RCMS', 14, 12)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Resident Complaint Management System', 14, 18)
      doc.text(`Laporan Eksekutif Global - Periode ${RANGE_LABEL[range]}`, 14, 24)
      doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, w - 14, 12, { align: 'right' })
      doc.text(`Disusun oleh: ${safeUserProfile.full_name} (Super Admin)`, w - 14, 18, { align: 'right' })

      let y = 44
      const section = (title: string) => {
        doc.setFillColor(245, 247, 250)
        doc.rect(10, y - 5, w - 20, 9, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(30, 41, 59)
        doc.text(title, 14, y)
        y += 10
      }
      const field = (label: string, value: string) => {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139)
        doc.text(label, 14, y)
        doc.setTextColor(15, 23, 42)
        doc.setFont('helvetica', 'bold')
        doc.text(value, 62, y)
        y += 6
      }

      section('1. METRIK KPI EKSEKUTIF')
      field('Total Komplain', String(kpis.total))
      field('Tiket Aktif', String(kpis.active))
      field('Tiket Selesai', `${kpis.completed} (${kpis.total ? Math.round(kpis.completed / kpis.total * 100) : 0}%)`)
      field('Tiket Dibatalkan', String(kpis.cancelled))
      field('Compliance Rate SLA (72 jam)', `${kpis.slaRate}%`)
      field('MTTR (Jam)', `${kpis.mttr.toFixed(1)}`)
      field('Cost / Resource Index', String(kpis.resourceIndex))
      field('Jam Kerja Tercatat', `${kpis.loggedHours.toFixed(1)} jam`)

      y += 2
      section('2. RATIO STATUS TIKET')
      for (const s of statusData) {
        field(s.name, `${s.value} (${kpis.total ? Math.round(s.value / kpis.total * 100) : 0}%)`)
      }

      y += 2
      section('3. BREAKDOWN KATEGORI KOMPLAIN')
      for (const c of categoryData) field(c.name, String(c.value))

      y += 2
      section('4. DISTRIBUSI PER GEDUNG')
      for (const b of buildingData) field(b.name, String(b.value))

      y += 2
      section('5. PERFORMANCE TEKNISI (DISELESAIKAN)')
      for (const t of techLeaderboard.slice(0, 10)) {
        field(t.name, `${t.total} tiket, ${t.hours.toFixed(1)} jam`)
      }

      if (y > 160) { doc.addPage(); y = 20 }
      y += 2
      section('6. KEPUASAN WARGA (CSAT)')
      field('Rating Rata-rata', csat.avg.toFixed(1))
      field('Sangat Puas (4-5)', String(csat.sangatPuas))
      field('Netral (3)', String(csat.netral))
      field('Buruk (1-2)', String(csat.buruk))
      field('Ulasan Tampil', `${csat.visible} / total ${csat.moderationTotal}`)
      field('Ulasan Disembunyikan', String(csat.hidden))

      doc.setDrawColor(226, 232, 240)
      doc.line(10, doc.internal.pageSize.getHeight() - 16, w - 10, doc.internal.pageSize.getHeight() - 16)
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.text('Dokumen ini dibuat otomatis oleh Gateway Corporate RCMS. Data bersifat rahasia.', 14, doc.internal.pageSize.getHeight() - 10)

      doc.save(`Gateway_Executive_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (e) {
      console.error('PDF export error:', e)
    } finally {
      setExporting(null)
    }
  }

  async function exportExcel() {
    setExporting('excel')
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()

      const ticketRows = raw.tickets.map(t => ({
        'No. Tiket': t.ticket_number,
        'Unit': t.unit_code,
        'Warga': t.resident_name,
        'Masalah': t.problem,
        'Kategori': classifyCategory(t.problem),
        'Status': STATUS_META[t.status]?.label || t.status,
        'Teknisi': userMap[t.current_assignee_id || '']?.full_name || '-',
        'Dibuat': new Date(t.created_at).toLocaleString('id-ID'),
        'Selesai': t.completed_at ? new Date(t.completed_at).toLocaleString('id-ID') : '-',
        'Durasi (jam)': hoursFrom(t.created_at, t.completed_at)?.toFixed(1) ?? '-',
      }))

      const userRows = (initialUsers || []).map(u => ({
        'Nama': u.full_name,
        'Role': u.role.replace(/_/g, ' '),
        'Divisi': u.division,
        'Status': u.is_active ? 'Aktif' : 'Nonaktif',
      }))

      const perfRows = techLeaderboard.map(t => ({
        'Nama Teknisi': t.name,
        'Total Tiket': t.total,
        'Jam Kerja': t.hours.toFixed(1),
        'First-Time Fix Rate (%)': `${t.firstTimeFixRate}%`,
      }))

      const mkSheet = (rows: Record<string, unknown>[], name: string) => {
        const ws = XLSX.utils.json_to_sheet(rows)
        const keys = rows[0] ? Object.keys(rows[0]) : []
        ws['!cols'] = keys.map(k => ({ wch: Math.max(k.length + 2, ...rows.map(r => String((r as Record<string, unknown>)[k] ?? '').length + 2)) }))
        XLSX.utils.book_append_sheet(wb, ws, name)
      }

      mkSheet(ticketRows, 'Tiket')
      mkSheet(userRows, 'User')
      mkSheet(perfRows, 'Performance')

      XLSX.writeFile(wb, `Gateway_Master_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (e) {
      console.error('Excel export error:', e)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 shadow-lg"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Global Analytics</h1>
              <p className="text-slate-300 text-sm mt-0.5">Enterprise Command Dashboard &mdash; integrasi data seluruh departemen RCMS.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportPDF}
              disabled={exporting !== null}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold rounded-xl shadow-md hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50"
            >
              {exporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Export Master Executive PDF
            </button>
            <button
              onClick={exportExcel}
              disabled={exporting !== null}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold rounded-xl shadow-md hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:opacity-50"
            >
              {exporting === 'excel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Export Complete Master Excel
            </button>
          </div>
        </div>

        {/* Time filter */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 mr-2">
            <Timer className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Interval</span>
          </div>
          {(Object.keys(RANGE_LABEL) as RangeKey[]).map(k => (
            <button
              key={k}
              onClick={() => setRange(k)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-xl transition-all ${
                range === k
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {RANGE_LABEL[k]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Komplain', value: kpis.total, icon: <Layers className="w-6 h-6 text-purple-600" />, sub: `${kpis.active} aktif`, accent: 'bg-purple-100', border: 'border-purple-100' },
          { label: 'Compliance SLA', value: `${kpis.slaRate}%`, icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />, sub: `${kpis.slaTotal} dievaluasi (72 jam)`, accent: 'bg-emerald-100', border: 'border-emerald-200' },
          { label: 'MTTR', value: `${kpis.mttr.toFixed(1)} jam`, icon: <Clock className="w-6 h-6 text-amber-600" />, sub: 'Waktu rata-rata selesai', accent: 'bg-amber-100', border: 'border-amber-200' },
          { label: 'Cost / Resource', value: String(kpis.resourceIndex), icon: <Zap className="w-6 h-6 text-rose-600" />, sub: `${kpis.loggedHours.toFixed(1)} jam tercatat`, accent: 'bg-rose-100', border: 'border-rose-200' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white rounded-2xl border ${card.border} p-5 shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl ${card.accent} flex items-center justify-center`}>{card.icon}</div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{card.value}</p>
            <p className="text-sm font-medium text-slate-600 mt-0.5">{card.label}</p>
            <p className="text-xs text-slate-400">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Status Ratio + CSAT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status ratio */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden lg:col-span-1"
        >
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Ticket className="w-4 h-4 text-purple-600" /> Status Ratio</h3>
          </div>
          <div className="p-5 space-y-2.5">
            {statusData.map(s => (
              <div key={s.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <span className="font-semibold text-slate-800">{s.value} · {kpis.total ? Math.round(s.value / kpis.total * 100) : 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${kpis.total ? s.value / kpis.total * 100 : 0}%`, background: s.color }} />
                </div>
              </div>
            ))}
            {statusData.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Tidak ada data</p>}
          </div>
        </motion.div>

        {/* CSAT gauge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> Kepuasan Warga (CSAT)</h3>
          </div>
          <div className="p-5">
            <div className="text-center mb-2">
              <p className="text-4xl font-bold text-slate-800">{csat.avg.toFixed(1)}</p>
              <p className="text-sm text-slate-500">dari {csat.total} ulasan</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart data={csatGauge} innerRadius="30%" outerRadius="90%" startAngle={90} endAngle={-270} cx="50%" cy="50%">
                <RadialBar dataKey="value" background={{ fill: '#F1F5F9' }} />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {csatGauge.map(g => (
                <div key={g.name} className="text-center rounded-xl bg-slate-50 p-2">
                  <p className="text-lg font-bold" style={{ color: g.fill }}>{g.value}</p>
                  <p className="text-[10px] text-slate-500">{g.name}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Moderation recap */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Shield className="w-4 h-4 text-purple-600" /> Moderasi Ulasan</h3>
          </div>
          <div className="p-5">
            <div className="flex items-center">
              <ResponsiveContainer width="55%" height={210}>
                <PieChart>
                  <Pie data={[
                    { name: 'Tampil', value: csat.visible, color: '#D2F377' },
                    { name: 'Disembunyikan', value: csat.hidden, color: '#FFC2BD' },
                  ]} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    <Cell fill="#D2F377" />
                    <Cell fill="#FFC2BD" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 flex-1">Tampil</span>
                  <span className="font-bold text-slate-800">{csat.visible}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-slate-600 flex-1">Disembunyikan</span>
                  <span className="font-bold text-slate-800">{csat.hidden}</span>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">Total ulasan: {csat.moderationTotal}</p>
                  <p className="text-xs text-slate-500 mt-1">Visibilitas sarkas dikelola via Moderasi Rating</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Time series + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Tren Komplain &amp; Selesai</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="created" name="Dibuat" stroke="#C5B4FC" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="completed" name="Selesai" stroke="#D2F377" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Briefcase className="w-4 h-4 text-emerald-600" /> Komplain per Kategori</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Jumlah" fill="#E9E2FE" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Building distribution */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Building2 className="w-4 h-4 text-purple-600" /> Distribusi Komplain per Gedung</h3>
        </div>
        <div className="p-5">
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={240}>
              <PieChart>
                <Pie data={buildingData} cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={3} dataKey="value">
                  {buildingData.map((e, i) => <Cell key={i} fill={['#D2F377', '#C5B4FC', '#FFC2BD', '#FFEAA5', '#0F0F0F', '#E9E2FE'][i % 6]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1">
              {buildingData.map((b, i) => (
                <div key={b.name} className="flex items-center justify-between text-sm py-1">
                  <span className="text-slate-600 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: ['#D2F377', '#C5B4FC', '#FFC2BD', '#FFEAA5', '#0F0F0F', '#E9E2FE'][i % 6] }} />
                    {b.name}
                  </span>
                  <span className="font-semibold text-slate-800">{b.value}</span>
                </div>
              ))}
              {floorData.length > 0 && (
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> Per Lantai</p>
                  <div className="flex flex-wrap gap-1.5">
                    {floorData.map(f => (
                      <span key={f.name} className="px-2 py-0.5 rounded-lg bg-slate-100 text-xs text-slate-600">{f.name}: <b>{f.value}</b></span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Engineering performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden lg:col-span-2"
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> Leaderboard Teknisi Lapangan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Teknisi</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Total Tiket</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Jam Kerja</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">First-Time Fix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {techLeaderboard.slice(0, 8).map((t, i) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      {i < 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white bg-gradient-to-br from-amber-400 to-amber-600 shadow">{i + 1}</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-slate-600 bg-slate-100">{i + 1}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold flex items-center justify-center">{t.name.charAt(0).toUpperCase()}</span>
                        <span className="font-medium text-slate-800">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center font-semibold text-slate-800">{t.total}</td>
                    <td className="px-5 py-3 text-center text-slate-600">{t.hours.toFixed(1)} jam</td>
                    <td className="px-5 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-600">{t.firstTimeFixRate}%</span>
                    </td>
                  </tr>
                ))}
                {techLeaderboard.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">Belum ada data performa teknisi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Bottlenecks */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500" /> Bottleneck Operasional</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center"><Clock className="w-5 h-5 text-rose-600" /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Auto-Finish &gt; 72 Jam</p>
                  <p className="text-xs text-slate-500">Komplain selesai melebihi SLA</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-rose-600">{bottlenecks.autoFinish}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Layers className="w-5 h-5 text-amber-600" /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Multi-Day Pengerjaan</p>
                  <p className="text-xs text-slate-500">Log pengerjaan &gt; 1 hari</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-amber-600">{bottlenecks.multiDay}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-purple-600" /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Tiket Belum Diproses</p>
                  <p className="text-xs text-slate-500">Status NEW / ON_PROGRESS</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-purple-600">{bottlenecks.overdueActive}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
