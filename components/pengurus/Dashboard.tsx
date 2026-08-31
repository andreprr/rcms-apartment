'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import TaskoDashboard from '@/components/dashboard/TaskoDashboard'
import {
  Ticket,
  CheckCircle2,
  Clock,
  AlertCircle,
  Star,
  TrendingUp,
  Users,
  Filter,
  Loader2
} from 'lucide-react'
import { WeeklyBarChart, ChartLegend, AnalyticsCard } from '@/components/dashboard/AnalyticsWidgets'
import { ReminderCard, DonutCard, ProgressRing } from '@/components/dashboard/RightWidgets'
import type { UserRole } from '@/types/database'

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
  category?: string
}

interface Stats {
  total: number
  completed: number
  inProgress: number
  avgRating: number
}

interface DashboardProps {
  userProfile: {
    full_name: string
    division: string
    avatar_url?: string
    role: UserRole
  }
}

export default function Dashboard({ userProfile }: DashboardProps) {
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, inProgress: 0, avgRating: 4.5 })

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch from RR tickets API (management can view all)
        const response = await fetch('/api/rr/tickets')
        const result = await safeJson(response)

        if (result.stats) {
          setStats({
            total: result.stats.total || 0,
            completed: result.stats.completed || 0,
            inProgress: result.stats.inProgress || 0,
            avgRating: 4.5 // Default, would come from confirmations table
          })
        }
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  // Generate chart data - complaints by category
  const chartData = useMemo(() => {
    return [
      { day: 'Plumbing', value: Math.floor(Math.random() * 15) + 10 },
      { day: 'Electric', value: Math.floor(Math.random() * 12) + 8 },
      { day: 'AC', value: Math.floor(Math.random() * 10) + 5 },
      { day: 'Paint', value: Math.floor(Math.random() * 8) + 3 },
      { day: 'Struktur', value: Math.floor(Math.random() * 6) + 2 },
    ]
  }, [])

  // Satisfaction summary for reminder panel
  const satisfactionSummary = useMemo(() => [
    {
      id: '1',
      time: 'Puas',
      label: `${Math.round(stats.avgRating * 20)}%`,
      description: 'Rating rata-rata',
      priority: 'low' as const
    },
    {
      id: '2',
      time: 'Kenaikan',
      label: '+12%',
      description: 'vs bulan lalu',
      priority: 'medium' as const
    },
    {
      id: '3',
      time: 'Target',
      label: '95%',
      description: 'Target kepuasan',
      priority: 'low' as const
    }
  ], [stats])

  // KPI Stats
  const kpiStats = [
    {
      title: 'Total Tiket',
      value: stats.total,
      icon: <Ticket className="w-5 h-5 text-white" />,
      variant: 'primary' as const,
      trend: { value: 15, isPositive: true }
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
      subtitle: 'On progress',
      icon: <Clock className="w-5 h-5 text-amber-600" />
    },
    {
      title: 'Rating Rata-rata',
      value: stats.avgRating.toFixed(1),
      subtitle: 'Kepuasan warga',
      icon: <Star className="w-5 h-5 text-yellow-500" />
    }
  ]

  // Left content - Category Trends
  const leftContent = (
    <AnalyticsCard
      title="Tren Komplain per Kategori"
      subtitle="Distribusi keluhan berdasarkan kategori"
    >
      <div className="h-64">
        <WeeklyBarChart
          data={chartData.map((d, i) => ({ day: d.day.charAt(0), value: d.value }))}
          height={250}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {chartData.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-600">{item.day}</span>
            <span className="text-xs font-semibold text-slate-800">{item.value}</span>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  )

  // Right content - Satisfaction Summary
  const rightContent = (
    <div className="space-y-4">
      <ReminderCard
        title="Ringkasan Kepuasan Warga"
        items={satisfactionSummary}
        emptyText="Data belum tersedia"
      />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <ProgressRing
          value={Math.round((stats.completed / (stats.total || 1)) * 100)}
          label="Tingkat Penyelesaian"
          subtitle="Secara keseluruhan"
          color="#D2F377"
        />
      </div>
    </div>
  )

  return (
    <TaskoDashboard
      pageTitle="Dashboard Management"
      pageSubtitle="Pantau performa dan kepuasan warga."
      actions={{
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
      isLoading={loading}
    />
  )
}
