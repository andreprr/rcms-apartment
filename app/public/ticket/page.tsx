export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PublicTicketStatusClient from '@/components/tickets/PublicTicketStatusClient'

interface PageProps {
  searchParams: Promise<{ number?: string }>
}

export default async function PublicTicketPage({ searchParams }: PageProps) {
  const params = await searchParams
  const ticketNumber = params.number

  if (!ticketNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-2">QR Code Invalid</h1>
          <p className="text-slate-500">Nomor tiket tidak ditemukan dalam QR code.</p>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  // Fetch ticket by ticket_number (public endpoint - no auth required)
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      id,
      ticket_number,
      unit_code,
      resident_name,
      problem,
      description,
      status,
      priority,
      scheduled_at,
      created_at,
      submitted_at,
      completed_at,
      initial_inspection_notes,
      inspection_completed_at,
      inspection_approved_at,
      finish_notes,
      before_photo_paths,
      process_photo_paths,
      after_photo_paths,
      rework_reason,
      rework_count,
      is_rework,
      client_feedback
    `)
    .eq('ticket_number', ticketNumber)
    .single()

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Tiket Tidak Ditemukan</h1>
          <p className="text-slate-500 text-sm">
            Tiket dengan nomor <span className="font-mono font-semibold">{ticketNumber}</span> tidak ditemukan dalam sistem.
          </p>
        </div>
      </div>
    )
  }

  // Resolve photo storage paths into full public URLs agar bisa ditampilkan di modal review client.
  const toPublicUrls = (paths: string[] | null | undefined) =>
    (paths || []).map(p => supabase.storage.from('ticket-attachments').getPublicUrl(p).data.publicUrl)

  return (
    <PublicTicketStatusClient
      ticket={{
        ...ticket,
        before_photo_paths: toPublicUrls((ticket as any).before_photo_paths),
        process_photo_paths: toPublicUrls((ticket as any).process_photo_paths),
        after_photo_paths: toPublicUrls((ticket as any).after_photo_paths),
      } as any}
    />
  )
}
