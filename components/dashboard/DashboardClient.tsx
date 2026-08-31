'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import TaskoDashboard from '@/components/dashboard/TaskoDashboard'
import {
  Calendar,
  Ticket,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  RefreshCw,
  Layers,
  Wrench,
  XCircle,
  Plus,
  Filter,
  Download,
  BarChart3,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { AnalyticsCard, WeeklyBarChart, ChartLegend } from '@/components/dashboard/AnalyticsWidgets'
import { DonutCard } from '@/components/dashboard/RightWidgets'
import type { UserRole } from '@/types/database'

// Luxury Palette
const COLORS = {
  primary: '#F7D794',
  success: '#F7D794',
  warning: '#EDA6A3',
  danger: '#EDA6A3',
  info: '#F7D794',
  purple: '#F7D794',
  gray: '#192A56',
  charcoal: '#192A56',
}

const STATUS_COLORS: Record<string, string> = {
  NEW: '#F7D794',
  ACKNOWLEDGED: '#F7D794',
  ASSIGNED: '#F7D794',
  ON_PROGRESS: '#EDA6A3',
  WAITING_CONFIRMATION: '#EDA6A3',
  COMPLETED: '#F7D794',
  REWORK: '#EDA6A3',
  ON_HOLD: '#192A56',
  CANCELLED: '#192A56',
}

interface DashboardProps {
  initialStats: {
    total: number
    newCount: number
    onProgress: number
    waitingConfirmation: number
    completed: number
    rework: number
    onHold: number
  }
  trendData: Array<{ date: string; total: number }>
  statusData: Array<{ name: string; value: number }>
  categoryData: Array<{ category: string; count: number }>
  workloadData: Array<{ engineer: string; assigned: number; completed: number }>
  userProfile: {
    full_name: string
    division: string
    avatar_url?: string
    role: UserRole
  }
}

export default function DashboardClient({
  initialStats,
  trendData,
  statusData,
  categoryData,
  workloadData,
  userProfile
}: DashboardProps) {
  const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Convert trend data to chart format
  const chartData = useMemo(() => {
    return trendData.slice(-7).map(d => ({
      day: new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' }).charAt(0),
      value: d.total
    }))
  }, [trendData])

  // Status distribution for donut
  const statusDistribution = useMemo(() => {
    return statusData.map(s => ({
      label: s.name.replace('_', ' '),
      value: s.value,
      color: STATUS_COLORS[s.name] || COLORS.gray
    }))
  }, [statusData])

  // KPI Stats
  const kpiStats = [
    {
      title: 'Total Aduan',
      value: initialStats.total,
      icon: <Ticket className="w-5 h-5 text-[#F7D794]" />,
      variant: 'primary' as const,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Selesai',
      value: initialStats.completed,
      subtitle: 'Tiket selesai',
      icon: <CheckCircle2 className="w-5 h-5 text-[#192A56]" />
    },
    {
      title: 'Sedang Diproses',
      value: initialStats.onProgress,
      subtitle: 'On progress',
      icon: <Layers className="w-5 h-5 text-[#192A56]" />
    },
    {
      title: 'Menunggu Konfirmasi',
      value: initialStats.waitingConfirmation,
      subtitle: 'Pending review',
      icon: <Clock className="w-5 h-5 text-[#EDA6A3]" />
    }
  ]

  // Left content - Main Charts
  const leftContent = (
    <>
      {/* Trend Chart */}
      <AnalyticsCard
        title="Tren Pengaduan"
        subtitle="Jumlah pengaduan harian"
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trendData.slice(-14)}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F7D794" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#F7D794" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F7D79428" />
            <XAxis
              dataKey="date"
              stroke="#192A56"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            />
            <YAxis stroke="#192A56" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#F7D794"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </AnalyticsCard>

      {/* Category Chart */}
      <AnalyticsCard
        title="Kategori Keluhan Terbanyak"
        subtitle="Distribusi berdasarkan kategori"
        className="mt-6"
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={categoryData.slice(0, 5)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F7D79428" />
            <XAxis type="number" stroke="#192A56" fontSize={12} hide />
            <YAxis
              dataKey="category"
              type="category"
              stroke="#192A56"
              fontSize={12}
              width={80}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Bar dataKey="count" fill="#F7D794" radius={[0, 6, 6, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </AnalyticsCard>
    </>
  )

  // Right content - Status & Workload
  const rightContent = (
    <>
      <DonutCard
        title="Status Tiket"
        segments={statusDistribution}
        total={initialStats.total}
        centerLabel="Total"
      />

      {/* Workload Card */}
      <div className="mt-6 bg-[#FCFBFB] rounded-2xl border border-[#F7D794]/20 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F7D794]/20">
          <h3 className="text-base font-semibold text-[#192A56]">Beban Kerja Teknisi</h3>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            {workloadData.slice(0, 4).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F7D794]/20 flex items-center justify-center text-[#192A56] font-semibold text-sm">
                    {item.engineer.charAt(0)}
                  </div>
                  <span className="text-sm text-[#192A56]/80">{item.engineer}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-sm font-semibold text-[#192A56]">{item.assigned}</span>
                    <span className="text-xs text-[#192A56]/50 ml-1">assigned</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-[#F7D794]">{item.completed}</span>
                    <span className="text-xs text-[#192A56]/50 ml-1">done</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <TaskoDashboard
      pageTitle="Dashboard Analyst & Monitoring"
      pageSubtitle="Ringkasan statistik pengaduan warga dan performa lapangan"
      actions={{
        primary: {
          label: 'Buat Tiket',
          icon: <Plus className="w-4 h-4" />,
          href: '/tickets/new'
        },
        secondary: [
          {
            label: 'Filter',
            icon: <Filter className="w-4 h-4" />
          }
        ]
      }}
      stats={kpiStats}
      leftContent={leftContent}
      rightContent={rightContent}
    />
  )
}
