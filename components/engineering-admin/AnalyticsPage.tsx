'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle2, Loader2, RefreshCw, Users } from 'lucide-react'
import { AnalyticsCard, WeeklyBarChart, ChartLegend } from '@/components/dashboard/AnalyticsWidgets'
import { ReminderCard, DonutCard } from '@/components/dashboard/RightWidgets'

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

interface Ticket {
  id: string
  ticket_number: string
  problem: string
  status: string
  created_at: string
  submitted_at: string | null
  unit_code: string
  resident_name: string
  current_assignee_id: string | null
}

export default function EngineeringAdminAnalyticsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const r = await fetch('/api/engineering-admin/tickets')
        const d = await safeJson(r)
        if (d.tickets) setTickets(d.tickets)
      } catch (e) {
        console.error('Failed to fetch:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [refreshKey])

  const stats = useMemo(() => ({
    total: tickets.length,
    new: tickets.filter(t => t.status === 'NEW').length,
    assigned: tickets.filter(t => t.status === 'ASSIGNED').length,
    inProgress: tickets.filter(t => t.status === 'ON_PROGRESS').length,
    waiting: tickets.filter(t => t.status === 'WAITING_CONFIRMATION').length,
  }), [tickets])

  // Technician performance chart data (derived from actual assignment data)
  const chartData = useMemo(() => {
    // Group tickets by status to show workload distribution
    const statuses = ['NEW', 'ASSIGNED', 'ON_PROGRESS', 'WAITING_CONFIRMATION', 'COMPLETED']
    return statuses.map(status => ({
      day: status.replace('_', ' '),
      value: tickets.filter(t => t.status === status).length,
    }))
  }, [tickets])

  // Critical queue items (tickets waiting too long)
  const criticalQueue = useMemo(() => {
    return tickets
      .filter(t => t.status === 'WAITING_CONFIRMATION' && t.submitted_at)
      .map(t => {
        const submitted = new Date(t.submitted_at!).getTime()
        const hours = Math.floor((Date.now() - submitted) / (1000 * 60 * 60))
        return { ...t, hoursWaiting: hours }
      })
      .sort((a, b) => b.hoursWaiting - a.hoursWaiting)
      .slice(0, 5)
  }, [tickets])

  // Auto-finish reminders
  const autoFinishReminders = useMemo(() => {
    return tickets
      .filter(t => t.status === 'WAITING_CONFIRMATION' && t.submitted_at)
      .map(t => {
        const submitted = new Date(t.submitted_at!).getTime()
        const remaining = (72 * 60 * 60 * 1000) - (Date.now() - submitted)
        const hours = Math.max(0, Math.floor(remaining / (1000 * 60 * 60)))
        const minutes = Math.max(0, Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)))
        return {
          ...t,
          isExpired: remaining <= 0,
          timeRemaining: remaining <= 0 ? 'EXPIRED' : `${hours}j ${minutes}m`,
        }
      })
      .sort((a, b) => a.isExpired === b.isExpired ? 0 : a.isExpired ? -1 : 1)
  }, [tickets])

  const statusDistribution = [
    { label: 'Baru', value: stats.new, color: '#D2F377' },
    { label: 'Ditugaskan', value: stats.assigned, color: '#C5B4FC' },
    { label: 'Diproses', value: stats.inProgress, color: '#FFEAA5' },
    { label: 'Pending', value: stats.waiting, color: '#EC4899' },
  ]

  const kpiStats = [
    {
      title: 'Total Aktif',
      value: stats.total,
      icon: <BarChart3 className="w-5 h-5 text-white" />,
      variant: 'primary' as const,
    },
    {
      title: 'Baru',
      value: stats.new,
      subtitle: 'Belum ditugaskan',
      icon: <AlertTriangle className="w-5 h-5 text-blue-600" />,
    },
    {
      title: 'On Progress',
      value: stats.inProgress + stats.assigned,
      subtitle: 'Sedang dikerjakan',
      icon: <Users className="w-5 h-5 text-amber-600" />,
    },
    {
      title: 'Auto-Finish',
      value: criticalQueue.filter(t => t.hoursWaiting > 72).length,
      subtitle: 'Siap di-force',
      icon: <Clock className="w-5 h-5 text-rose-600" />,
    },
  ]

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
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Analytics</h1>
              <p className="text-sm text-slate-500">Analisis performa teknisi</p>
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

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`relative rounded-2xl p-5 shadow-sm ${
              stat.variant === 'primary'
                ? 'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white'
                : 'bg-white border border-slate-100'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-medium ${stat.variant === 'primary' ? 'text-blue-100' : 'text-slate-500'}`}>
                {stat.title}
              </span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                stat.variant === 'primary' ? 'bg-white/20' : 'bg-slate-50'
              }`}>
                {stat.icon}
              </div>
            </div>
            <p className={`text-2xl font-bold ${stat.variant === 'primary' ? '' : 'text-slate-800'}`}>
              {stat.value}
            </p>
            {stat.subtitle && (
              <span className={`text-xs ${stat.variant === 'primary' ? 'text-blue-200' : 'text-slate-400'}`}>
                {stat.subtitle}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Split Layout: Bar Chart (~68%) + Panel (~32%) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Bar Chart */}
        <div className="flex-[2_1_0%]">
          <AnalyticsCard
            title="Performa Teknisi"
            subtitle="Jumlah tiket yang ditangani per teknisi"
          >
            <WeeklyBarChart data={chartData} height={280} />
            <div className="mt-4">
              <ChartLegend items={[{ color: '#D2F377', label: 'Tiket Ditangani' }]} />
            </div>
          </AnalyticsCard>

          {/* Status Distribution */}
          <div className="mt-6">
            <DonutCard
              title="Distribusi Status Tiket"
              segments={statusDistribution}
              total={stats.total}
              centerLabel="Total"
            />
          </div>
        </div>

        {/* Right: Queue Panel + Auto-Finish Reminder */}
        <div className="flex-[1_1_0%] space-y-4">
          {/* Critical Queue */}
          <ReminderCard
            title="Antrean Kritis"
            items={criticalQueue.map(t => ({
              id: t.id,
              time: `${t.hoursWaiting}j`,
              label: t.ticket_number,
              description: `${t.problem} — ${t.unit_code}`,
              priority: t.hoursWaiting > 72 ? 'high' as const : t.hoursWaiting > 48 ? 'medium' as const : 'low' as const,
              action: {
                label: 'Detail',
                onClick: () => window.location.href = `/tickets/${t.id}`,
              },
            }))}
            emptyText="Tidak ada antrean kritis"
          />

          {/* Auto-Finish Reminders */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                <h3 className="text-base font-semibold text-slate-800">Auto-Finish Reminder</h3>
              </div>
            </div>
            <div className="p-4">
              {autoFinishReminders.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Semua dalam batas waktu</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {autoFinishReminders.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        t.isExpired ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        t.isExpired ? 'bg-rose-100' : 'bg-amber-100'
                      }`}>
                        {t.isExpired ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{t.ticket_number}</p>
                        <p className="text-xs text-slate-400">{t.unit_code}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        t.isExpired ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {t.timeRemaining}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
