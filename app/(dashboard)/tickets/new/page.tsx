export const dynamic = 'force-dynamic'

import CreateTicketForm from '@/components/forms/CreateTicketForm'
import { ArrowLeft, TicketPlus } from 'lucide-react'
import Link from 'next/link'

export default async function NewTicketPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar
        </Link>

        <div className="flex items-center gap-4 mt-2">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 shrink-0">
            <TicketPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Formulir Tiket Baru</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Lengkapi data di bawah ini untuk membuat laporan keluhan dari warga
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <CreateTicketForm />
    </div>
  )
}
