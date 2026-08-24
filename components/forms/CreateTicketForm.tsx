'use client'

import { createTicket } from '@/actions/tickets'
import { useState, useTransition } from 'react'
import { Loader2, AlertCircle, Building2, Tag, Heading, AlignLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateTicketForm({ units, categories }: { units: any[], categories: any[] }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createTicket(formData)
      if (res?.error) {
        setError(res.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
      {/* Notifikasi Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dropdown Unit */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" /> Unit Warga <span className="text-red-500">*</span>
            </label>
            <select name="unit_id" required className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none">
              <option value="">-- Pilih Unit Warga --</option>
              {units?.map((u) => (
                <option key={u.id} value={u.id}>{u.unit_code} (Lantai {u.floor})</option>
              ))}
            </select>
          </div>

          {/* Dropdown Kategori */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400" /> Kategori Keluhan <span className="text-red-500">*</span>
            </label>
            <select name="category_id" required className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none">
              <option value="">-- Pilih Kategori --</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Judul Keluhan */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Heading className="w-4 h-4 text-slate-400" /> Judul Keluhan <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="problem" 
            required 
            placeholder="Contoh: Pipa wastafel di kamar mandi bocor" 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none"
          />
        </div>

        {/* Deskripsi Lengkap */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-slate-400" /> Deskripsi Lengkap <span className="text-slate-400 font-normal">(Opsional)</span>
          </label>
          <textarea 
            name="description" 
            rows={5} 
            placeholder="Jelaskan detail masalah yang dialami warga, lokasi spesifik, atau informasi tambahan lainnya..." 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none resize-none"
          ></textarea>
        </div>
      </div>

      {/* Area Tombol */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
        <Link href="/tickets" className="px-6 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 font-semibold rounded-xl transition-colors text-center">
          Batal
        </Link>
        <button 
          type="submit" 
          disabled={isPending}
          className="flex-1 flex justify-center items-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Sedang Memproses...</> : 'Kirim & Buat Tiket'}
        </button>
      </div>
    </form>
  )
}