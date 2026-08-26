'use client'

import { motion } from 'framer-motion'
import { HelpCircle, Book, MessageCircle, Mail, ExternalLink, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function HelpPage() {
  const guides = [
    {
      title: 'Cara Membuat Tiket Baru',
      desc: 'Pelajari cara membuat tiket komplain baru untuk warga',
      href: '/help/ticket-guide',
    },
    {
      title: 'Mengelola Tiket',
      desc: 'Update status danFollow-up tiket yang sedang diproses',
      href: '/help/ticket-guide',
    },
    {
      title: 'Menggunakan Kalender',
      desc: 'Lihat jadwal tiket per tanggal',
      href: '/help/calendar-guide',
    },
    {
      title: 'Melihat Analytics',
      desc: 'Analisis tren komplain dan performa tim',
      href: '/help/analytics-guide',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Help Center</h1>
            <p className="text-sm text-slate-500">Dokumentasi dan panduan penggunaan RCMS</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="mailto:support@gateway.co.id"
          className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Mail className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800">Hubungi Support</p>
            <p className="text-sm text-slate-500">support@gateway.co.id</p>
          </div>
        </a>
        <div className="flex items-center gap-4 p-5 bg-purple-50 rounded-2xl border border-purple-100">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Book className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Dokumentasi API</p>
            <p className="text-sm text-slate-500">REST API reference</p>
          </div>
        </div>
      </div>

      {/* Guides List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-purple-50 bg-purple-50/30">
          <h2 className="font-semibold text-slate-800">Panduan Pengguna</h2>
        </div>
        <div className="divide-y divide-purple-50">
          {guides.map((guide) => (
            <a
              key={guide.href}
              href={guide.href}
              className="flex items-center gap-4 px-5 py-4 hover:bg-purple-50/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Book className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{guide.title}</p>
                <p className="text-sm text-slate-500">{guide.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          ))}
        </div>
      </motion.div>

      {/* Version Info */}
      <p className="text-center text-xs text-slate-400">
        RCMS v3.2 — Gateway System
      </p>
    </div>
  )
}
