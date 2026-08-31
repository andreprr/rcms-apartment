'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TaskoDashboard from '@/components/dashboard/TaskoDashboard'
import {
  Ticket,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { WeeklyBarChart, ChartLegend, AnalyticsCard } from '@/components/dashboard/AnalyticsWidgets'
import { DonutCard, ReminderCard } from '@/components/dashboard/RightWidgets'

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
  unit_code: string
  resident_name: string
}

interface Stats {
  total: number
  new: number
  inProgress: number
  completed: number
}

interface UserProfile {
  full_name: string
  division: string
  avatar_url?: string
  role: string
}

export default function RRDashboardClient({ userProfile }: { userProfile: UserProfile }) {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, new: 0, inProgress: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  // Fetch tickets
  useEffect(() => {
    async function fetchTickets() {
      setLoading(true)
      try {
        const response = await fetch('/api/rr/tickets')
        const result = await safeJson(response)
        if (result.tickets) {
          setTickets(result.tickets)
          setStats(result.stats || { total: 0, new: 0, inProgress: 0, completed: 0 })
        }
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
      setLoading(false)
    }
    fetchTickets()
  }, [])

  // Chart data
  const chartData = useMemo(() => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    const counts = new Array(7).fill(0)
    tickets.forEach(ticket => {
      const dayIndex = new Date(ticket.created_at).getDay()
      counts[dayIndex]++
    })
    return days.map((day, i) => ({ day, value: counts[i] }))
  }, [tickets])

  // Urgent tickets for reminders
  const urgentTickets = useMemo(() => {
    return tickets
      .filter(t => ['NEW', 'ASSIGNED', 'ON_PROGRESS'].includes(t.status))
      .slice(0, 4)
      .map(ticket => ({
        id: ticket.id,
        time: new Date(ticket.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        label: ticket.ticket_number,
        description: ticket.problem,
        priority: ticket.status === 'NEW' ? 'high' as const : 'medium' as const,
        action: {
          label: 'Detail',
          onClick: () => router.push(`/tickets/${ticket.id}`)
        },
        actions: [
          {
            label: 'Detail',
            onClick: () => router.push(`/tickets/${ticket.id}`),
            variant: 'secondary' as const
          },
          {
            label: 'Cetak Tiket',
            onClick: () => router.push(`/tickets/${ticket.id}/print`),
            variant: 'primary' as const
          }
        ]
      }))
  }, [tickets, router])

  // Status distribution
  const statusDistribution = [
    { label: 'Baru', value: stats.new, color: '#D2F377' },
    { label: 'Diproses', value: stats.inProgress, color: '#FFEAA5' },
    { label: 'Selesai', value: stats.completed, color: '#C5B4FC' },
  ]

  // KPI Stats
  const kpiStats = [
    {
      title: 'Total Tiket',
      value: stats.total,
      icon: <Ticket className="w-5 h-5 text-white" />,
      variant: 'primary' as const,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Selesai',
      value: stats.completed,
      subtitle: 'Tiket selesai',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />
    },
    {
      title: 'Sedang Diproses',
      value: stats.inProgress,
      subtitle: 'Sedang dikerjakan',
      icon: <Clock className="w-5 h-5 text-amber-600" />
    },
    {
      title: 'Tiket Baru',
      value: stats.new,
      subtitle: 'Menunggu ditugaskan',
      icon: <AlertCircle className="w-5 h-5 text-blue-600" />
    }
  ]

  // Left content
  const leftContent = (
    <AnalyticsCard
      title="Tren Komplain Harian"
      subtitle="Statistik pengaduan warga per hari"
    >
      <WeeklyBarChart data={chartData} height={260} />
      <div className="mt-4">
        <ChartLegend items={[{ color: '#C5B4FC', label: 'Jumlah Komplain' }]} />
      </div>
    </AnalyticsCard>
  )

  // Right content
  const rightContent = (
    <div className="space-y-4">
      <ReminderCard
        title="Tiket Mendesak"
        items={urgentTickets}
        emptyText="Tidak ada tiket mendesak"
      />
      <DonutCard
        title="Status Penanganan"
        segments={statusDistribution}
        total={stats.total}
        centerLabel="Total"
      />
    </div>
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-purple-100 p-12 text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 mt-4">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <TaskoDashboard
        pageTitle="Dashboard RR"
        pageSubtitle="Selamat datang! Berikut ringkasan aktivitas Anda."
        actions={{
          primary: {
            label: 'Buat Tiket',
            href: '/rr/ticket-maker'
          }
        }}
        stats={kpiStats}
        leftContent={leftContent}
        rightContent={rightContent}
      />

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: '/rr/task', label: 'Task Management', icon: Ticket, color: 'from-purple-500 to-purple-600' },
          { href: '/rr/calendar', label: 'Kalender', icon: Calendar, color: 'from-indigo-500 to-indigo-600' },
          { href: '/rr/analytics', label: 'Analytics', icon: TrendingUp, color: 'from-emerald-500 to-emerald-600' },
          { href: '/rr/database', label: 'Database', icon: Ticket, color: 'from-amber-500 to-amber-600' },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
            >
              <Link
                href={item.href}
                className={`block p-4 bg-gradient-to-r ${item.color} rounded-2xl shadow-md hover:shadow-lg transition-all group`}
              >
                <Icon className="w-6 h-6 text-white mb-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{item.label}</span>
                  <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
