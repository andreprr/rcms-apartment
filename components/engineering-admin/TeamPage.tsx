'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, Loader2, RefreshCw, Mail, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react'
import Image from 'next/image'

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

interface Engineer {
  id: string
  full_name: string
  email: string
  is_active: boolean
  avatar_url?: string
}

interface Ticket {
  id: string
  status: string
  current_assignee_id: string | null
}

export default function EngineeringAdminTeamPage() {
  const [engineers, setEngineers] = useState<Engineer[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [engRes, ticketRes] = await Promise.all([
          fetch('/api/engineers'),
          fetch('/api/engineering-admin/tickets'),
        ])
        const engData = await safeJson(engRes)
        const ticketData = await safeJson(ticketRes)
        if (engData.engineers) setEngineers(engData.engineers)
        if (ticketData.tickets) setTickets(ticketData.tickets)
      } catch (e) {
        console.error('Failed to fetch data:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [refreshKey])

  const engineerStats = useMemo(() => {
    return engineers.map(eng => {
      const assigned = tickets.filter(t => t.current_assignee_id === eng.id).length
      const inProgress = tickets.filter(t => t.current_assignee_id === eng.id && t.status === 'ON_PROGRESS').length
      const waiting = tickets.filter(t => t.current_assignee_id === eng.id && t.status === 'WAITING_CONFIRMATION').length
      return { ...eng, assigned, inProgress, waiting }
    })
  }, [engineers, tickets])

  const totalAssigned = engineers.length > 0
    ? tickets.filter(t => t.current_assignee_id).length
    : 0

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Tim Teknisi</h1>
              <p className="text-sm text-slate-500">{engineers.length} teknisi aktif &bull; {totalAssigned} tiket ditugaskan</p>
            </div>
          </div>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Engineer Cards */}
      {engineerStats.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-100 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Belum ada teknisi</p>
          <p className="text-sm text-slate-400 mt-1">Hubungi admin untuk menambahkan teknisi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {engineerStats.map((eng, i) => (
            <motion.div
              key={eng.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Profile */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-200 to-purple-300 flex items-center justify-center text-purple-700 font-bold text-lg shadow-sm overflow-hidden">
                  {eng.avatar_url ? (
                    <Image src={eng.avatar_url} alt={eng.full_name} width={48} height={48} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    eng.full_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 truncate">{eng.full_name}</h3>
                    {eng.is_active ? (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">AKTIF</span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">NONAKTIF</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{eng.email}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-blue-700">{eng.assigned}</p>
                  <p className="text-[10px] font-medium text-blue-500">Ditugaskan</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-amber-700">{eng.inProgress}</p>
                  <p className="text-[10px] font-medium text-amber-500">Proses</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-purple-700">{eng.waiting}</p>
                  <p className="text-[10px] font-medium text-purple-500">Pending</p>
                </div>
              </div>

              {/* Workload bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-slate-400">Beban kerja</span>
                  <span className="text-[10px] font-bold text-slate-600">{eng.assigned} tiket</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      eng.assigned > 5 ? 'bg-rose-500' : eng.assigned > 2 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (eng.assigned / 8) * 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
