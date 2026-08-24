import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Building2, Calendar, Tag, Clock, AlertCircle, Printer, ArrowLeft, FileText } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PrintTicketPage({ params }: PageProps) {
  const resolvedParams = await params
  const supabase = await createClient()

  // Fetch ticket data with related info
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      units(unit_code, floor, unit_number),
      complaint_categories(name, code),
      users(full_name)
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (error || !ticket) {
    notFound()
  }

  // Format date
  const formattedDate = new Date(ticket.created_at).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const formattedTime = new Date(ticket.created_at).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      {/* Action Buttons */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between">
        <Link
          href={`/tickets/${ticket.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Detail
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          <Printer className="w-4 h-4" />
          Cetak Tiket
        </button>
      </div>

      {/* Ticket Receipt */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 opacity-80" />
                <span className="text-sm font-medium opacity-80">TICKET ADUAN</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{ticket.ticket_number}</h1>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80 mb-1">Tanggal Dibuat</p>
              <p className="text-sm font-semibold">{formattedDate}</p>
              <p className="text-sm font-semibold">{formattedTime} WIB</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Unit Info */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Informasi Unit
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Kode Unit</p>
                <p className="text-lg font-bold text-slate-800">{ticket.units?.unit_code}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Nomor Unit</p>
                <p className="text-lg font-bold text-slate-800">{ticket.units?.unit_number}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Lantai</p>
                <p className="text-lg font-bold text-slate-800">{ticket.units?.floor}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Dibuat Oleh</p>
                <p className="text-lg font-bold text-slate-800">{ticket.users?.full_name}</p>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Kategori Keluhan
            </h3>
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold">
                {ticket.complaint_categories?.name}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">{ticket.complaint_categories?.code}</span>
            </div>
          </div>

          {/* Problem */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Judul Keluhan
            </h3>
            <p className="text-lg font-semibold text-slate-800">{ticket.problem}</p>
          </div>

          {/* Description */}
          {ticket.description && (
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Deskripsi Lengkap
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          {/* Status */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Status Saat Ini
            </h3>
            <StatusBadge status={ticket.status} />
          </div>

          {/* QR Code Placeholder */}
          <div className="flex items-center justify-center pt-4 border-t border-slate-100">
            <div className="text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3 border-2 border-dashed border-slate-300">
                <span className="text-xs text-slate-400">QR Code</span>
              </div>
              <p className="text-xs text-slate-500">Scan untuk melihat status tiket</p>
              <p className="text-xs text-slate-400 mt-1">ID: {ticket.id.slice(0, 8)}...</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Resident Complaint Management System (RCMS)
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Printed at {new Date().toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    NEW: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'BARU' },
    ASSIGNED: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'DITUGASKAN' },
    ON_PROGRESS: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'SEDANG DIPROSES' },
    WAITING_CONFIRMATION: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'MENUNGGU KONFIRMASI' },
    COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'SELESAI' },
    REWORK: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'REVISI' },
    ON_HOLD: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'DIHENTIKAN' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'DIBATALKAN' },
  }

  const style = styles[status] || styles.NEW

  return (
    <span className={`inline-flex items-center px-4 py-2 rounded-lg font-bold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}
