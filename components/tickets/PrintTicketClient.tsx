'use client'

import React, { useRef, useSyncExternalStore } from 'react'
import {
  Printer,
  Building2,
  Tag,
  FileText,
  User,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useReactToPrint } from 'react-to-print'

// CATATAN SKEMA:
// Tabel `tickets` proyek ini TIDAK memiliki relasi units / complaint_categories.
// Kolom nyata: unit_code, resident_name, problem, description, status, priority,
// scheduled_at, created_at, dan FK created_by -> users (users.full_name).
interface Ticket {
  id: string
  ticket_number: string
  unit_code: string
  resident_name: string
  problem: string
  description?: string | null
  status: string
  priority?: 'NORMAL' | 'URGENT' | string | null
  scheduled_at?: string | null
  created_at: string
  users?: { full_name: string }
}

export default function PrintTicketClient({ ticket }: { ticket: Ticket }) {
  const contentRef = useRef<HTMLDivElement>(null)

  // Mencegah Hydration Error Mismatch antara Server (SSR) & Client (Browser)
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // Generate tracking URL untuk QR Code hanya setelah mounted di client
  const publicUrl =
    isMounted && typeof window !== 'undefined'
      ? `${window.location.origin}/public/ticket?number=${encodeURIComponent(ticket.ticket_number)}`
      : `/public/ticket?number=${encodeURIComponent(ticket.ticket_number)}`

  // Safe date formatting (jangan sampai crash -> blank)
  const safeDate = (d?: string | null) => {
    if (!d) return null
    const date = new Date(d)
    return isNaN(date.getTime()) ? null : date
  }
  const createdDate = safeDate(ticket.created_at)
  const formattedDate = createdDate
    ? createdDate.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-'
  const scheduledDate = safeDate(ticket.scheduled_at)
  const formattedScheduled = scheduledDate
    ? scheduledDate.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Secepatnya'

  const isUrgent = ticket.priority === 'URGENT'

  // react-to-print: menyalin node targeted ke iframe khusus cetak
  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `Struk_Tiket_${ticket.ticket_number}`,
    pageStyle: `
      body * { visibility: visible !important; }
      @page { size: 80mm auto; margin: 0; }
    `,
  })

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col items-center justify-center print:p-0 print:m-0 print:bg-white print:min-h-0">
      {/* Top Action Bar - Hanya Tombol Cetak Resi */}
      <div className="w-full max-w-md flex items-center justify-end mb-6 print:hidden">
        <button
          type="button"
          onClick={() => handlePrint()}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Cetak Resi
        </button>
      </div>

      {/* Target Printable Receipt Container */}
      <div
        ref={contentRef}
        className="bg-white w-full max-w-md p-6 rounded-2xl border border-slate-200 shadow-lg text-slate-800"
      >
        {/* Header */}
        <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
          <div className="flex justify-center items-center gap-2 mb-1">
            <Building2 className="w-6 h-6 text-purple-600" />
            <h1 className="text-base font-bold uppercase tracking-wider text-slate-900">
              RESIDENT COMPLAINT RECEIPT
            </h1>
          </div>
          <p className="text-xs text-slate-500">Gateway Apartment Management System</p>
        </div>

        {/* Ticket Badge */}
        <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100 mb-4">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Nomor Tiket</span>
          <span className="text-lg font-extrabold text-purple-600 tracking-wider block my-0.5">
            {ticket.ticket_number}
          </span>
          <div className="mt-1 flex justify-center items-center gap-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              Prioritas: {ticket.priority || 'NORMAL'}
            </span>
            {isUrgent && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                <AlertTriangle className="w-3 h-3" /> URGENT
              </span>
            )}
          </div>
        </div>

        {/* Information Grid */}
        <div className="space-y-2 text-xs border-b border-dashed border-slate-300 pb-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Unit Warga:</span>
            <span className="font-bold text-slate-900">{ticket.unit_code || '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Nama Warga:</span>
            <span className="font-semibold text-slate-900">{ticket.resident_name || '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Tgl Dibuat:</span>
            <span className="font-semibold text-slate-900">{formattedDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Jadwal Pengerjaan:</span>
            <span className="font-semibold text-slate-900">{formattedScheduled}</span>
          </div>
          {ticket.users?.full_name && (
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1 text-slate-500">
                <User className="w-3 h-3" /> Dibuat oleh:
              </span>
              <span className="font-semibold text-slate-900">{ticket.users.full_name}</span>
            </div>
          )}
        </div>

        {/* Complaint */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 block mb-0.5 uppercase">
            <Tag className="w-3 h-3" /> Judul Keluhan:
          </span>
          <p className="font-bold text-slate-900 text-xs mb-1">{ticket.problem}</p>
          {ticket.description && (
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 block mb-0.5 uppercase">
                <FileText className="w-3 h-3" /> Deskripsi Lengkap:
              </span>
              <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          )}
          {scheduledDate && (
            <div className="mt-1">
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                <Calendar className="w-3 h-3 inline mr-1" />
                Jadwal: {formattedScheduled} WIB
              </p>
            </div>
          )}
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center justify-center pt-3 border-t border-dashed border-slate-300">
          <div className="bg-white p-2 rounded-lg border border-slate-200 min-h-[116px] min-w-[116px] flex items-center justify-center">
            {isMounted ? (
              <QRCodeSVG value={publicUrl} size={100} level="M" includeMargin={false} />
            ) : (
              <div className="w-[100px] h-[100px] bg-slate-100 animate-pulse rounded" />
            )}
          </div>
          <p className="text-[9px] text-slate-500 mt-2 text-center">
            Scan QR Code ini untuk mengecek status perbaikan dari HP
          </p>
        </div>
      </div>
    </div>
  )
}