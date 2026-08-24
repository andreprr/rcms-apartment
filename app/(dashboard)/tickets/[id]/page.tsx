export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Building2, Tag, Clock, FileText, Activity, AlertTriangle } from 'lucide-react'
import UpdateStatusForm from '@/components/forms/UpdateStatusForm'

// PERUBAHAN NEXT.JS 15: params sekarang berbentuk Promise
export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  
  // Wajib gunakan 'await' untuk membaca ID dari URL di Next.js 15
  const resolvedParams = await params
  const ticketId = resolvedParams.id
  
  // Mengambil profil user yang sedang login untuk mengecek Role
  const { data: { user } } = await supabase.auth.getUser()
  let userProfile = null
  if (user) {
    const { data } = await supabase.from('users').select('role').eq('auth_user_id', user.id).single()
    userProfile = data
  }

  // Mengambil data tiket spesifik
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      units(unit_code, floor),
      complaint_categories(name)
    `)
    .eq('id', ticketId)
    .single()

  // Mode Detektif tetap kita pasang buat jaga-jaga
  if (error || !ticket) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-3 text-red-700 font-bold mb-4">
          <AlertTriangle className="w-6 h-6" />
          <h2>Gagal Memuat Tiket!</h2>
        </div>
        <p className="text-sm text-red-600 mb-2">Pesan Error dari Database:</p>
        <pre className="bg-white p-4 rounded-lg text-xs text-slate-800 overflow-auto border border-red-100">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    )
  }

  // Mengambil jejak rekam (history) tiket
  const { data: history } = await supabase
    .from('ticket_history')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'NEW': return 'bg-blue-100 text-blue-700'
      case 'ON_PROGRESS': return 'bg-amber-100 text-amber-700'
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/tickets" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{ticket.ticket_number}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">Dibuat pada {new Date(ticket.created_at).toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: Informasi Keluhan & Form Update Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Informasi Keluhan
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 font-medium mb-1 flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Unit Warga</p>
                <p className="text-base font-bold text-slate-800">{ticket.units?.unit_code} <span className="text-sm font-normal text-slate-500">(Lantai {ticket.units?.floor})</span></p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 font-medium mb-1 flex items-center gap-1.5"><Tag className="w-4 h-4" /> Kategori</p>
                <p className="text-base font-bold text-slate-800">{ticket.complaint_categories?.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Judul Masalah:</h3>
                <p className="text-slate-800 font-medium text-lg">{ticket.problem}</p>
              </div>
              <hr className="border-slate-100" />
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Deskripsi Lengkap:</h3>
                <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm leading-relaxed border border-slate-100 min-h-[100px]">
                  {ticket.description || <span className="text-slate-400 italic">Tidak ada deskripsi tambahan yang diberikan.</span>}
                </div>
              </div>
            </div>
          </div>

          {/* MENAMPILKAN FORM UPDATE JIKA USER ADALAH ENGINEERING ATAU ADMIN */}
          {(userProfile?.role === 'ENGINEERING' || userProfile?.role === 'ADMIN') && (
            <UpdateStatusForm ticketId={ticket.id} currentStatus={ticket.status} />
          )}

        </div>

        {/* KOLOM KANAN: Riwayat Tiket */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" /> Riwayat Tiket
            </h2>
            
            <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
              {history?.map((item: any) => (
                <div key={item.id} className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-blue-600 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                  <p className="text-sm font-bold text-slate-800">{item.action.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleString('id-ID')}
                  </p>
                  {item.description && (
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}