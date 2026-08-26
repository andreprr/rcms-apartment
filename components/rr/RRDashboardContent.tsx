'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Ticket,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  TrendingUp,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { WeeklyBarChart, ChartLegend, AnalyticsCard } from '@/components/dashboard/AnalyticsWidgets'
import { DonutCard, ReminderCard } from '@/components/dashboard/RightWidgets'
import type { UserRole } from '@/types/database'

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
  role: UserRole
}

interface KpiCard {
  title: string
  value: number | string
  subtitle?: string
  icon?: React.ReactNode
  variant?: 'primary' | 'default'
  trend?: { value: number; isPositive: boolean }
}

export default function RRDashboardContent({ userProfile }: { userProfile: UserProfile }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, new: 0, inProgress: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  // Fetch tickets
  useEffect(() => {
    async function fetchTickets() {
      setLoading(true)
      try {
        const response = await fetch('/api/rr/tickets')
        const result = await response.json()
        if (result.tickets) {
          setTickets(result.tickets)
          if (result.stats) {
            setStats(result.stats)
          }
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

  // Urgent tickets
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
          onClick: () => window.location.href = `/tickets/${ticket.id}`
        }
      }))
  }, [tickets])

  // Status distribution
  const statusDistribution = [
    { label: 'Baru', value: stats.new, color: '#3B82F6' },
    { label: 'Diproses', value: stats.inProgress, color: '#F59E0B' },
    { label: 'Selesai', value: stats.completed, color: '#10B981' },
  ].filter(s => s.value > 0)

  // KPI Stats
  const kpiStats: KpiCard[] = [
    {
      title: 'Total Tiket',
      value: stats.total,
      icon: <Ticket className="w-5 h-5 text-white" />,
      variant: 'primary',
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-purple-100 p-12 text-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
          <p className="text-slate-500 mt-4">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard RR</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Selamat datang, {userProfile.full_name}! Berikut ringkasan aktivitas Anda.
            </p>
          </div>
          <Link
            href="/rr/ticket-maker"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Ticket className="w-4 h-4" />
            Buat Tiket Baru
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={stat.variant === 'primary'
              ? 'relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 p-5 text-white shadow-lg'
              : 'bg-white rounded-2xl border border-purple-100 p-5 shadow-sm'
            }
          >
            {stat.variant === 'primary' && (
              <>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              </>
            )}
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${stat.variant === 'primary' ? 'text-purple-100' : 'text-slate-500'}`}>
                  {stat.title}
                </span>
                {stat.icon && (
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    stat.variant === 'primary' ? 'bg-white/20' : 'bg-slate-50'
                  }`}>
                    {stat.icon}
                  </div>
                )}
              </div>
              <p className={`text-3xl font-bold ${stat.variant === 'primary' ? 'text-white' : 'text-slate-800'}`}>
                {stat.value}
              </p>
              {stat.subtitle && (
                <p className={`text-xs mt-1 ${stat.variant === 'primary' ? 'text-purple-200' : 'text-slate-400'}`}>
                  {stat.subtitle}
                </p>
              )}
              {stat.trend && (
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                  stat.variant === 'primary' ? 'text-purple-200' : stat.trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {stat.trend.isPositive ? '↑' : '↓'} {stat.trend.value}% from last month
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Tren Komplain Harian</h3>
            <p className="text-xs text-slate-400">Statistik pengaduan warga per hari</p>
          </div>
          <div className="p-5">
            <WeeklyBarChart data={chartData} height={260} />
            <div className="mt-4">
              <ChartLegend items={[{ color: '#10B981', label: 'Jumlah Komplain' }]} />
            </div>
          </div>
        </motion.div>

        {/* Right - Widgets */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
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
        </motion.div>
      </div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { href: '/rr/task', label: 'Task Management', icon: Ticket, gradient: 'from-purple-500 to-purple-600' },
          { href: '/rr/calendar', label: 'Kalender', icon: Calendar, gradient: 'from-indigo-500 to-indigo-600' },
          { href: '/rr/analytics', label: 'Analytics', icon: TrendingUp, gradient: 'from-emerald-500 to-emerald-600' },
          { href: '/rr/database', label: 'Database', icon: Ticket, gradient: 'from-amber-500 to-amber-600' },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block p-4 bg-gradient-to-r ${item.gradient} rounded-2xl shadow-md hover:shadow-lg transition-all group`}
            >
              <Icon className="w-6 h-6 text-white mb-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{item.label}</span>
                <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          )
        })}
      </motion.div>
    </div>
  )
}
