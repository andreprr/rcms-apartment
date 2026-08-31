'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Loader2, RefreshCw, Filter, Search, X } from 'lucide-react'

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

interface HistoryEntry {
  id: string
  ticket_id: string
  ticket_number: string
  ticket_status: string
  action: string
  description: string
  old_value: Record<string, any> | null
  new_value: Record<string, any> | null
  user_name: string
  user_division: string
  created_at: string
}

export default function EngineeringAdminHistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/engineering-admin/history')
      const d = await safeJson(r)
      setEntries(d.entries || [])
    } catch (e) {
      console.error('Failed to fetch history:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const filtered = entries.filter(e => {
    const matchSearch = !search ||
      e.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      e.user_name?.toLowerCase().includes(search.toLowerCase())
    const matchAction = !actionFilter || e.action === actionFilter
    return matchSearch && matchAction
  })

  const uniqueActions = [...new Set(entries.map(e => e.action))].sort()

  function getActionBadge(action: string) {
    const map: Record<string, { bg: string; text: string }> = {
      CREATE_TICKET: { bg: 'bg-blue-100', text: 'text-blue-700' },
      ASSIGN_ENGINEERING: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
      START_WORK: { bg: 'bg-amber-100', text: 'text-amber-700' },
      STAGE_INSPECTION: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
      STAGE_DIAGNOSIS: { bg: 'bg-sky-100', text: 'text-sky-700' },
      STAGE_REPAIR: { bg: 'bg-orange-100', text: 'text-orange-700' },
      STAGE_FINISHING: { bg: 'bg-teal-100', text: 'text-teal-700' },
      SUBMITTED_COMPLETION: { bg: 'bg-purple-100', text: 'text-purple-700' },
      AUTO_FINISHED: { bg: 'bg-rose-100', text: 'text-rose-700' },
      AUTO_FINISH: { bg: 'bg-rose-100', text: 'text-rose-700' },
      REWORK: { bg: 'bg-orange-100', text: 'text-orange-700' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
    }
    const style = map[action] || { bg: 'bg-slate-100', text: 'text-slate-700' }
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${style.bg} ${style.text}`}>
        {action.replace(/_/g, ' ')}
      </span>
    )
  }

  async function exportPDF() {
    setExporting('pdf')
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF('l', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()

      // Header - Kop Surat
      doc.setFillColor(124, 58, 237)
      doc.rect(0, 0, pageWidth, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('RCMS - Resident Complaint Management System', 14, 12)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Laporan Audit Trail Engineering Admin', 14, 19)
      doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 25)

      // Table Header
      let y = 36
      doc.setFillColor(248, 250, 252)
      doc.rect(10, y - 5, pageWidth - 20, 8, 'F')
      doc.setTextColor(100, 116, 139)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      const cols = [14, 50, 95, 130, 165, 230]
      const headers = ['WAKTU', 'TIKET', 'PENGGUNA', 'AKSI', 'DESKRIPSI', 'DIVISI']
      headers.forEach((h, i) => doc.text(h, cols[i], y))

      // Table Body
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(51, 65, 85)

      for (const entry of filtered.slice(0, 80)) {
        if (y > 190) {
          doc.addPage()
          y = 20
        }

        const date = new Date(entry.created_at).toLocaleString('id-ID')
        const desc = (entry.description || '').substring(0, 45)
        const action = entry.action.replace(/_/g, ' ')

        doc.text(date.substring(0, 20), cols[0], y)
        doc.text(entry.ticket_number.substring(0, 30), cols[1], y)
        doc.text((entry.user_name || '-').substring(0, 25), cols[2], y)
        doc.text(action.substring(0, 20), cols[3], y)
        doc.text(desc.substring(0, 30), cols[4], y)
        doc.text((entry.user_division || '-').substring(0, 15), cols[5], y)

        y += 5

        // Subtle line
        doc.setDrawColor(226, 232, 240)
        doc.line(10, y - 2, pageWidth - 10, y - 2)
      }

      // Footer
      doc.setTextColor(148, 163, 184)
      doc.setFontSize(7)
      doc.text(
        `Total: ${filtered.length} record | RCMS Engineering Admin`,
        14,
        doc.internal.pageSize.getHeight() - 10
      )

      doc.save(`RCMS_AuditTrail_${new Date().toISOString().split('T')[0]}.pdf`)
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

      const data = filtered.map(e => ({
        'Waktu': new Date(e.created_at).toLocaleString('id-ID'),
        'No. Tiket': e.ticket_number,
        'Status Tiket': e.ticket_status?.replace(/_/g, ' ') || '',
        'Pengguna': e.user_name || '-',
        'Divisi': e.user_division || '-',
        'Aksi': e.action.replace(/_/g, ' '),
        'Deskripsi': e.description || '',
      }))

      const ws = XLSX.utils.json_to_sheet(data)

      // Auto-fit column widths
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length + 2, ...data.map(row => String((row as Record<string, string>)[key] || '').length + 2)),
      }))
      ws['!cols'] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Audit Trail')

      XLSX.writeFile(wb, `RCMS_AuditTrail_${new Date().toISOString().split('T')[0]}.xlsx`)
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
        className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">History & Export</h1>
              <p className="text-sm text-slate-500">{filtered.length} record audit trail</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportExcel}
              disabled={exporting === 'excel' || filtered.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors disabled:opacity-50"
            >
              {exporting === 'excel' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export Excel
            </button>
            <button
              onClick={exportPDF}
              disabled={exporting === 'pdf' || filtered.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors disabled:opacity-50"
            >
              {exporting === 'pdf' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Export PDF
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari tiket, pengguna, atau deskripsi..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 appearance-none"
          >
            <option value="">Semua Aksi</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-100 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Tidak ada data</p>
          <p className="text-sm text-slate-400 mt-1">
            {search || actionFilter ? 'Coba ubah filter pencarian' : 'Belum ada history audit trail'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-50/80">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Waktu</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tiket</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Pengguna</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Aksi</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Deskripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-purple-50/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800 whitespace-nowrap">
                    {entry.ticket_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {entry.user_name || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {getActionBadge(entry.action)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                    {entry.description || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
