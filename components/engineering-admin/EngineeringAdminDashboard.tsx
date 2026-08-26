'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Ticket,
  Users,
  Clock,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { WeeklyBarChart, ChartLegend, AnalyticsCard } from '@/components/dashboard/AnalyticsWidgets'
import { DonutCard, ProgressRing } from '@/components/dashboard/RightWidgets'
import type { UserRole } from '@/types/database'

interface Stats {
  total: number
  new: number
  assigned: number
  inProgress: number
  waitingConfirmation: number
  completed: number
}

interface Engineer {
  id: string
  full_name: string
  assigned: number
  completed: number
}

export default function EngineeringAdminDashboard({
  stats,
  engineers,
  chartData,
}: {
  stats: Stats
  engineers: Engineer[]
  chartData: { day: string; value: number }[]
}) {
  const kpiStats = [
    { title: 'Total Tiket', value: stats.total, icon: <Ticket className="w-5 h-5 text-white" />, variant: 'primary' as const },
    { title: 'Ditugaskan', value: stats.assigned, icon: <Users className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-50' },
    { title: 'Diproses', value: stats.inProgress, icon: <Clock className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-50' },
    { title: 'Pending Review', value: stats.waitingConfirmation, icon: <RefreshCw className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50' },
  ]

  const donutData = [
    { label: 'Baru', value: stats.new, color: '#3B82F6' },
    { label: 'Ditugaskan', value: stats.assigned, color: '#8B5CF6' },
    { label: 'Diproses', value: stats.inProgress, color: '#F59E0B' },
    { label: 'Pending', value: stats.waitingConfirmation, color: '#EC4899' },
    { label: 'Selesai', value: stats.completed, color: '#10B981' },
  ].filter(d => d.value > 0)

  const leftContent = (
    <AnalyticsCard title="Statistik Mingguan" subtitle="Aktivitas tiket per hari">
      <WeeklyBarChart data={chartData} height={260} />
      <div className="mt-4 flex items-center justify-between">
        <ChartLegend items={[{ color: '#10B981', label: 'Tiket Baru' }]} />
      </div>
    </AnalyticsCard>
  )

  const rightContent = (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Antrean Teknisi</h3>
        <div className="space-y-3">
          {engineers.slice(0, 5).map(e => (
            <div key={e.id} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">{e.full_name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{e.full_name}</p>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span>{e.assigned} ditugaskan</span>
                  <span>•</span>
                  <span>{e.completed} selesai</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <DonutCard title="Distribusi Tiket" segments={donutData} total={stats.total} centerLabel="Total" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard Engineering Admin</h1>
            <p className="text-sm text-slate-500">Supervisi tim teknisi lapangan</p>
          </div>
          <Link href="/engineering-admin/task" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
            <Ticket className="w-4 h-4" />
            Kelola Tiket
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiStats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={stat.variant === 'primary' ? 'relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 p-5 text-white shadow-lg shadow-purple-200/50' : 'bg-white rounded-2xl border border-purple-100 p-5 shadow-sm'}>
            {stat.variant === 'primary' && <div className="absolute inset-0 bg-white/10 rounded-2xl" />}
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${stat.variant === 'primary' ? 'text-purple-200' : 'text-slate-500'}`}>{stat.title}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.variant === 'primary' ? 'bg-white/20' : stat.bg}`}>{stat.icon}</div>
              </div>
              <p className={`text-3xl font-bold ${stat.variant === 'primary' ? 'text-white' : 'text-slate-800'}`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">{leftContent}</div>
        <div>{rightContent}</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { href: '/engineering-admin/status-kerja', label: 'Status Kerja', icon: Clock },
          { href: '/engineering-admin/calendar', label: 'Kalender', icon: Ticket },
          { href: '/engineering-admin/analytics', label: 'Analytics', icon: Ticket },
          { href: '/engineering-admin/team', label: 'Tim Teknisi', icon: Users },
          { href: '/engineering-admin/history', label: 'History', icon: CheckCircle2 },
        ].map(item => (
          <Link key={item.href} href={item.href} className="flex items-center justify-between p-4 bg-white rounded-xl border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
            <span className="text-sm font-medium text-slate-700">{item.label}</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  )
}
