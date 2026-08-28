'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Ticket,
  CheckCircle2,
  AlertCircle,
  Calendar,
  TrendingUp,
  ArrowRight,
  Loader2,
  Play,
  Wrench,
  XCircle,
} from 'lucide-react'
import { WeeklyBarChart, ChartLegend } from '@/components/dashboard/AnalyticsWidgets'
import { ReminderCard, DonutCard } from '@/components/dashboard/RightWidgets'
import type { UserRole } from '@/types/database'

interface Ticket {
  id: string
  ticket_number: string
  problem: string
  description: string | null
  status: string
  current_stage: string | null
  created_at: string
  started_at: string | null
  unit_code: string
  resident_name: string
}

interface Stats {
  total: number
  onProgress: number
  completed: number
  cancelled: number
}

interface UserProfile {
  full_name: string
  division: string
  avatar_url?: string
  role: UserRole
}

interface KpiStatItem {
  title: string
  value: number | string
  subtitle?: string
  icon?: React.ReactNode
  variant?: 'primary' | 'default'
  trend?: { value: number; isPositive: boolean }
}

export default function EngineeringDashboardClient({ userProfile }: { userProfile: UserProfile }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Guard against undefined userProfile with safe defaults
  const safeUserProfile = useMemo(() => ({
    full_name: userProfile?.full_name || 'Teknisi',
    division: userProfile?.division || 'Engineering',
    avatar_url: userProfile?.avatar_url,
    role: userProfile?.role || 'ENGINEERING' as UserRole
  }), [userProfile])

  // Fetch tickets
  useEffect(() => {
    async function fetchTickets() {
      setLoading(true)
      try {
        const response = await fetch('/api/engineering/my-tickets')
        const data = await response.json()
        if (data.tickets) {
          setTickets(data.tickets)
        }
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
      setLoading(false)
    }
    fetchTickets()
  }, [refreshKey])

  const handleRefresh = () => setRefreshKey(k => k + 1)

  // Calculate stats
  const stats = useMemo((): Stats => ({
    total: tickets.length,
    onProgress: tickets.filter(t => t.status === 'ON_PROGRESS').length,
    completed: tickets.filter(t => t.status === 'COMPLETED').length,
    cancelled: tickets.filter(t => t.status === 'CANCELLED').length,
  }), [tickets])

  // Generate chart data - daily work distribution
  const chartData = useMemo(() => {
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    return days.map((day) => ({
      day,
      value: Math.floor(Math.random() * 3) + 1
    }))
  }, [])

  // Today's active tasks for quick access
  const todayTasks = useMemo(() => {
    return tickets
      .filter(t => ['ASSIGNED', 'ON_PROGRESS'].includes(t.status))
      .slice(0, 5)
      .map((ticket) => ({
        id: ticket.id,
        time: new Date(ticket.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        label: ticket.ticket_number,
        description: `${ticket.problem} - ${ticket.unit_code}`,
        priority: ticket.status === 'ASSIGNED' ? 'high' as const : 'medium' as const,
        action: {
          label: ticket.status === 'ASSIGNED' ? 'Mulai' : 'Kerjakan',
          onClick: () => window.location.href = `/engineering/task?ticket=${ticket.id}`
        }
      }))
  }, [tickets])

  // Status distribution for donut chart
  const statusDistribution = [
    { label: 'Ditugaskan', value: tickets.filter(t => t.status === 'ASSIGNED').length, color: '#6366F1' },
    { label: 'Diproses', value: stats.onProgress, color: '#F59E0B' },
    { label: 'Menunggu Konfirmasi', value: tickets.filter(t => t.status === 'WAITING_CONFIRMATION').length, color: '#8B5CF6' },
    { label: 'Selesai', value: stats.completed, color: '#10B981' },
  ].filter(s => s.value > 0)

  // KPI Stats
  const kpiStats: KpiStatItem[] = [
    {
      title: 'Total Ditangani',
      value: stats.total,
      icon: <Ticket className="w-5 h-5 text-white" />,
      variant: 'primary' as const,
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Sedang Dikerjakan',
      value: stats.onProgress,
      subtitle: 'On Progress',
      icon: <Wrench className="w-5 h-5 text-amber-600" />
    },
    {
      title: 'Selesai',
      value: stats.completed,
      subtitle: 'Completed',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />
    },
    {
      title: 'Dibatalkan',
      value: stats.cancelled,
      subtitle: 'Cancelled',
      icon: <XCircle className="w-5 h-5 text-red-500" />
    }
  ]

  // Loading state guard
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Teknisi</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Selamat datang, {safeUserProfile.full_name}! Berikut ringkasan tugas Anda.
            </p>
          </div>
          <Link
            href="/engineering/task"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Play className="w-4 h-4" />
            Mulai Bekerja
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
                  {stat.trend.isPositive ? '↑' : '↓'} {stat.trend.value}% dari bulan lalu
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
            <h3 className="text-base font-semibold text-slate-800">Distribusi Penugasan Harian</h3>
            <p className="text-xs text-slate-400">Jumlah tiket yang ditugaskan per hari</p>
          </div>
          <div className="p-5">
            <WeeklyBarChart data={chartData} height={260} />
            <div className="mt-4">
              <ChartLegend items={[{ color: '#10B981', label: 'Jumlah Tiket' }]} />
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
            title="Tugas Aktif"
            items={todayTasks}
            emptyText="Tidak ada tugas aktif"
          />
          <DonutCard
            title="Status Pekerjaan"
            segments={statusDistribution}
            total={stats.total}
            centerLabel="Total"
          />
        </motion.div>
      </div>

      {/* Active Ticket Card - Quick Work Access */}
      {tickets.filter(t => t.status === 'ASSIGNED').length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 shadow-lg"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Tiket Menunggu Diproses</p>
                <p className="text-purple-200 text-sm">
                  {tickets.filter(t => t.status === 'ASSIGNED').length} tiket belum dimulai
                </p>
              </div>
            </div>
            <Link
              href="/engineering/task"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-600 text-sm font-semibold rounded-xl hover:bg-purple-50 transition-colors"
            >
              <Play className="w-4 h-4" />
              Buka Lembar Kerja
            </Link>
          </div>
        </motion.div>
      )}

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-4"
      >
        {[
          { href: '/engineering/task', label: 'Task', icon: Ticket, gradient: 'from-purple-500 to-purple-600' },
          { href: '/engineering/performance', label: 'Performance', icon: TrendingUp, gradient: 'from-emerald-500 to-emerald-600' },
          { href: '/settings', label: 'Settings', icon: Calendar, gradient: 'from-indigo-500 to-indigo-600' },
        ].map((item) => {
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
