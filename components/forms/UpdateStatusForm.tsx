'use client'

import { updateTicketStatus } from '@/actions/tickets'
import { useState, useTransition } from 'react'
import { Loader2, Wrench, AlertCircle } from 'lucide-react'

export default function UpdateStatusForm({ ticketId, currentStatus }: { ticketId: string, currentStatus: string }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await updateTicketStatus(formData) as { error?: string } | undefined
      if (res?.error) {
        setError(res.error)
      } else {
        (document.getElementById('update-status-form') as HTMLFormElement).reset()
      }
    })
  }

  // Jika tiket sudah selesai, hilangkan form update
  if (currentStatus === 'COMPLETED') return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Wrench className="w-5 h-5 text-amber-600" /> Tindakan Teknisi
      </h2>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
          <AlertCircle className="w-4 h-4" />
          <p>{error}</p>
        </div>
      )}

      <form id="update-status-form" action={handleSubmit} className="space-y-4">
        <input type="hidden" name="ticket_id" value={ticketId} />
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ubah Status Menjadi:</label>
          <select name="status" required className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none">
            <option value="">-- Pilih Status --</option>
            <option value="ON_PROGRESS">ON PROGRESS (Sedang Dikerjakan)</option>
            <option value="WAITING_CONFIRMATION">WAITING CONFIRMATION (Menunggu Alat/Persetujuan)</option>
            <option value="COMPLETED">COMPLETED (Selesai)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Catatan Pekerjaan:</label>
          <textarea 
            name="description" 
            rows={3} 
            required
            placeholder="Contoh: Sedang membongkar pipa saluran yang tersumbat..." 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none resize-none"
          ></textarea>
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full flex justify-center items-center gap-2 bg-amber-500 text-white font-semibold py-2.5 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  )
}