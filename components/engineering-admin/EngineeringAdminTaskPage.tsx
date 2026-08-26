'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Ticket,
  Wrench,
  CheckCircle2,
  X,
  Loader2,
  Search,
} from 'lucide-react'

interface Ticket {
  id: string
  ticket_number: string
  problem: string
  status: string
  created_at: string
  unit_code: string
  resident_name: string
  current_assignee_id?: string
}

interface Engineer {
  id: string
  full_name: string
  avatar_url?: string
}

export default function EngineeringAdminTaskPage({ engineers }: { engineers: Engineer[] }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAssign, setShowAssign] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => { fetchTickets() }, [])

  async function fetchTickets() {
    setLoading(true)
    try {
      const r = await fetch('/api/engineering-admin/tickets')
      const d = await r.json()
      if (d.tickets) setTickets(d.tickets)
    } finally { setLoading(false) }
  }

  async function assign(ticketId: string, engineerId: string) {
    setAssigning(true)
    try {
      await fetch('/api/engineering-admin/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId, assignee_id: engineerId }),
      })
      await fetchTickets()
      setShowAssign(false)
    } finally { setAssigning(false) }
  }

  const filtered = tickets.filter(t => !search || t.ticket_number.toLowerCase().includes(search.toLowerCase()) || t.problem.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Task Management</h1>
            <p className="text-sm text-slate-500">{tickets.filter(t => t.status === 'NEW').length} tiket baru menunggu ditugaskan</p>
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari tiket..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-purple-100 p-12 text-center">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Tidak ada tiket</p>
          </div>
        ) : (
          filtered.map((ticket, i) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800">{ticket.ticket_number}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">{ticket.status}</span>
                  </div>
                  <p className="text-slate-700 font-medium mb-2">{ticket.problem}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{ticket.unit_code}</span>
                    <span>•</span>
                    <span>{ticket.resident_name}</span>
                    <span>•</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedTicket(ticket); setShowAssign(true) }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <Wrench className="w-4 h-4" />
                  Tugaskan
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {showAssign && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAssign(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-purple-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Pilih Teknisi</h3>
                <p className="text-sm text-slate-500">{selectedTicket.ticket_number}</p>
              </div>
              <button onClick={() => setShowAssign(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-2">
              {engineers.map(e => (
                <button
                  key={e.id}
                  onClick={() => assign(selectedTicket.id, e.id)}
                  disabled={assigning}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold">{e.full_name.charAt(0)}</div>
                  <span className="flex-1 text-left font-medium text-slate-700">{e.full_name}</span>
                  {assigning && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
