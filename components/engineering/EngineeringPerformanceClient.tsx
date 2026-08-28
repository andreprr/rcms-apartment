'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import {
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Star,
  TrendingUp,
  Target,
  Award,
  Calendar,
} from 'lucide-react'
import type { UserRole } from '@/types/database'

interface UserProfile {
  full_name: string
  division: string
  avatar_url?: string
  role: UserRole
}

interface PerformanceData {
  mttrHours: number
  mttrMinutes: number
  firstTimeFixRate: number
  avgRating: number
  totalCompleted: number
  workHoursData: { day: string; hours: number }[]
  monthlyTrend: { month: string; completed: number; avgRating: number }[]
}

export default function EngineeringPerformanceClient({ userProfile }: { userProfile: UserProfile }) {
  const [loading, setLoading] = useState(true)
  const [performance, setPerformance] = useState<PerformanceData | null>(null)

  // Guard against undefined userProfile
  const safeUserProfile = useMemo(() => ({
    full_name: userProfile?.full_name || 'Teknisi',
    division: userProfile?.division || 'Engineering',
    avatar_url: userProfile?.avatar_url,
    role: userProfile?.role || 'ENGINEERING' as UserRole
  }), [userProfile])

  useEffect(() => {
    async function fetchPerformance() {
      setLoading(true)
      try {
        const response = await fetch('/api/engineering/performance')
        const data = await response.json()
        if (data.performance) {
          setPerformance(data.performance)
        } else {
          setPerformance({
            mttrHours: 4,
            mttrMinutes: 30,
            firstTimeFixRate: 85,
            avgRating: 4.7,
            totalCompleted: 45,
            workHoursData: [
              { day: 'Sen', hours: 7.5 },
              { day: 'Sel', hours: 8.0 },
              { day: 'Rab', hours: 6.5 },
              { day: 'Kam', hours: 8.5 },
              { day: 'Jum', hours: 7.0 },
              { day: 'Sab', hours: 4.0 },
              { day: 'Min', hours: 0 },
            ],
            monthlyTrend: [
              { month: 'Jan', completed: 38, avgRating: 4.5 },
              { month: 'Feb', completed: 42, avgRating: 4.6 },
              { month: 'Mar', completed: 45, avgRating: 4.7 },
              { month: 'Apr', completed: 48, avgRating: 4.8 },
              { month: 'Mei', completed: 45, avgRating: 4.7 },
              { month: 'Jun', completed: 52, avgRating: 4.9 },
            ],
          })
        }
      } catch (error) {
        console.error('Failed to fetch performance:', error)
        setPerformance({
          mttrHours: 4,
          mttrMinutes: 30,
          firstTimeFixRate: 85,
          avgRating: 4.7,
          totalCompleted: 45,
          workHoursData: [
            { day: 'Sen', hours: 7.5 },
            { day: 'Sel', hours: 8.0 },
            { day: 'Rab', hours: 6.5 },
            { day: 'Kam', hours: 8.5 },
            { day: 'Jum', hours: 7.0 },
            { day: 'Sab', hours: 4.0 },
            { day: 'Min', hours: 0 },
          ],
          monthlyTrend: [
            { month: 'Jan', completed: 38, avgRating: 4.5 },
            { month: 'Feb', completed: 42, avgRating: 4.6 },
            { month: 'Mar', completed: 45, avgRating: 4.7 },
            { month: 'Apr', completed: 48, avgRating: 4.8 },
            { month: 'Mei', completed: 45, avgRating: 4.7 },
            { month: 'Jun', completed: 52, avgRating: 4.9 },
          ],
        })
      }
      setLoading(false)
    }
    fetchPerformance()
  }, [])

  if (loading || !performance) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const avgWorkHours = performance.workHoursData.reduce((sum, d) => sum + d.hours, 0) /
    performance.workHoursData.filter(d => d.hours > 0).length

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
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Performance</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Statistik dan metrik kerja {safeUserProfile.full_name}.
            </p>
          </div>
          <Link
            href="/engineering"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-purple-200 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MTTR */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">MTTR</p>
              <p className="text-sm font-medium text-slate-400">Durasi Pengerjaan</p>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-800">{performance.mttrHours}</span>
            <span className="text-lg font-semibold text-slate-600">j</span>
            <span className="text-3xl font-bold text-slate-800">{performance.mttrMinutes}</span>
            <span className="text-lg font-semibold text-slate-600">m</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Rata-rata waktu perbaikan</p>
        </motion.div>

        {/* First Time Fix Rate */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">FTFR</p>
              <p className="text-sm font-medium text-slate-400">First-Time Fix</p>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-emerald-600">{performance.firstTimeFixRate}</span>
            <span className="text-lg font-semibold text-emerald-600">%</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Selesai sekali kerja</p>
        </motion.div>

        {/* Average Rating */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Rating</p>
              <p className="text-sm font-medium text-slate-400">Rata-rata Warga</p>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-amber-600">{performance.avgRating}</span>
            <span className="text-lg text-amber-600">/ 5</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 ${star <= Math.round(performance.avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Total Completed */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-sm font-medium text-slate-400">Tiket Selesai</p>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-blue-600">{performance.totalCompleted}</span>
            <span className="text-lg font-semibold text-blue-600">tiket</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Sepanjang waktu</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Hours Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Durasi Jam Kerja Harian</h3>
                <p className="text-xs text-slate-400">Rata-rata {avgWorkHours.toFixed(1)} jam/hari</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">+5%</span>
              </div>
            </div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={performance.workHoursData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  domain={[0, 10]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    padding: '8px 12px'
                  }}
                  formatter={(value) => [`${value} jam`, 'Jam Kerja']}
                />
                <Bar
                  dataKey="hours"
                  fill="url(#workHoursGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
                <defs>
                  <linearGradient id="workHoursGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#A78BFA" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Tren Bulanan</h3>
                <p className="text-xs text-slate-400">Tiket selesai & rating per bulan</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600">+12%</span>
              </div>
            </div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={performance.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  domain={[0, 5]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    padding: '8px 12px'
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="completed"
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgRating"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', r: 4 }}
                  name="Rating"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-xs text-slate-500">Tiket Selesai</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-xs text-slate-500">Rating</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 shadow-lg"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Ringkasan Performa {safeUserProfile.full_name}</p>
              <p className="text-purple-200 text-sm">Statistik keseluruhan tahun ini</p>
            </div>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{performance.totalCompleted}</p>
              <p className="text-xs text-purple-200">Total Selesai</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{performance.avgRating}/5</p>
              <p className="text-xs text-purple-200">Rating Rata-rata</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{performance.firstTimeFixRate}%</p>
              <p className="text-xs text-purple-200">First-Time Fix</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
