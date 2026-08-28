'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  Ticket,
  CheckCircle2,
  Clock,
  AlertCircle,
  Star,
  TrendingUp,
  Loader2,
  X,
  Users,
  Wrench,
  Crown,
  Shield,
  UserCheck,
  Briefcase,
  Award,
  ChevronRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { UserRole } from '@/types/database'

interface UserProfile {
  full_name: string
  division: string
  avatar_url?: string
  role: UserRole
}

interface User {
  id: string
  full_name: string
  division: string
  role: string
  is_active: boolean
  avatar_url?: string
}

interface DashboardStats {
  total: number
  onProgress: number
  completed: number
  waitingConfirmation: number
  rework: number
  cancelled: number
}

type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'yearly'

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280']

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ADMIN: Crown,
  PENGURUS: Shield,
  ENGINEERING_ADMIN: Award,
  ENGINEERING: Wrench,
  RR: Briefcase,
}

const ROLE_GRADIENTS: Record<string, string> = {
  ADMIN: 'from-slate-800 to-slate-900',
  PENGURUS: 'from-amber-500 to-amber-600',
  ENGINEERING_ADMIN: 'from-purple-600 to-purple-700',
  ENGINEERING: 'from-blue-500 to-blue-600',
  RR: 'from-emerald-500 to-emerald-600',
}

export default function PengurusDashboardClient({ userProfile }: { userProfile: UserProfile }) {
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly')
  const [stats, setStats] = useState<DashboardStats>({
    total: 0, onProgress: 0, completed: 0, waitingConfirmation: 0, rework: 0, cancelled: 0
  })
  const [users, setUsers] = useState<User[]>([])
  const [trendData, setTrendData] = useState<{ label: string; value: number }[]>([])
  const [csatIndex, setCsatIndex] = useState(0)
  const [showUserModal, setShowUserModal] = useState(false)

  const safeUserProfile = useMemo(() => ({
    full_name: userProfile?.full_name || 'Pengurus',
    division: userProfile?.division || 'Executive',
    avatar_url: userProfile?.avatar_url,
    role: userProfile?.role || 'PENGURUS' as UserRole
  }), [userProfile])

  const isExecutive = ['ADMIN', 'PENGURUS', 'ENGINEERING_ADMIN'].includes(safeUserProfile.role)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [ticketsRes, usersRes] = await Promise.all([
          fetch('/api/pengurus/stats'),
          fetch('/api/pengurus/users')
        ])

        const ticketsData = await ticketsRes.json()
        const usersData = await usersRes.json()

        if (ticketsData.stats) setStats(ticketsData.stats)
        if (ticketsData.trend) setTrendData(ticketsData.trend)
        if (ticketsData.csat !== undefined) setCsatIndex(ticketsData.csat)
        if (usersData.users) setUsers(usersData.users)
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const pieData = useMemo(() => [
    { name: 'Selesai', value: stats.completed, color: '#10B981' },
    { name: 'On Progress', value: stats.onProgress, color: '#F59E0B' },
    { name: 'Waiting', value: stats.waitingConfirmation, color: '#8B5CF6' },
    { name: 'Rework', value: stats.rework, color: '#EF4444' },
    { name: 'Cancelled', value: stats.cancelled, color: '#6B7280' },
  ].filter(d => d.value > 0), [stats])

  const usersByDivision = useMemo(() => {
    const grouped = users.reduce((acc, user) => {
      if (!acc[user.division]) acc[user.division] = []
      acc[user.division].push(user)
      return acc
    }, {} as Record<string, User[]>)
    return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)
  }, [users])

  const roleCounts = useMemo(() => {
    const counts: Record<string, { total: number; active: number }> = {}
    users.forEach(user => {
      if (!counts[user.role]) counts[user.role] = { total: 0, active: 0 }
      counts[user.role].total++
      if (user.is_active) counts[user.role].active++
    })
    return counts
  }, [users])

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
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Executive</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Selamat datang, {safeUserProfile.full_name}! Ringkasan performa manajemen.
            </p>
          </div>
          {/* Time Filter */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            {(['daily', 'weekly', 'monthly', 'yearly'] as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  timeFilter === filter
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard title="Total Tiket" value={stats.total} icon={Ticket} color="purple" trend={12} />
        <MetricCard title="On Progress" value={stats.onProgress} icon={Clock} color="amber" />
        <MetricCard title="Selesai" value={stats.completed} icon={CheckCircle2} color="emerald" trend={8} />
        <MetricCard title="Waiting" value={stats.waitingConfirmation} icon={AlertCircle} color="indigo" />
        <MetricCard title="Rework" value={stats.rework} icon={Wrench} color="red" />
        <MetricCard title="Cancelled" value={stats.cancelled} icon={X} color="gray" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bar Chart - Trend */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">Tren Komplain per Periode</h3>
              <p className="text-xs text-slate-400">Jumlah tiket berdasarkan waktu</p>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#A78BFA" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Donut Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">Rasio Status Tiket</h3>
              <p className="text-xs text-slate-400">Perbandingan selesai vs pending</p>
            </div>
            <div className="p-5">
              <div className="flex items-center">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right - Widgets */}
        <div className="space-y-6">
          {/* CSAT Index */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-5 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-purple-200 text-sm">CSAT Index</p>
                <p className="text-white text-3xl font-bold">{csatIndex}%</p>
              </div>
            </div>
            <p className="text-purple-200 text-sm">Customer Satisfaction Index bulan ini</p>
            <div className="mt-3 flex items-center gap-1 text-emerald-300">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+3% dari bulan lalu</span>
            </div>
          </motion.div>

          {/* User & Division Cards - Large Format */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-800">User & Divisi</h3>
                <p className="text-xs text-slate-400">{users.length} user terdaftar</p>
              </div>
              <button
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-medium rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                Lihat Semua
              </button>
            </div>
            <div className="p-4 space-y-3">
              {Object.entries(roleCounts).slice(0, 4).map(([role, data]) => {
                const RoleIcon = ROLE_ICONS[role] || Users
                const gradient = ROLE_GRADIENTS[role] || 'from-slate-500 to-slate-600'
                return (
                  <div key={role} className={`p-3 rounded-xl bg-gradient-to-r ${gradient} text-white`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <RoleIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{role.replace('_', ' ')}</p>
                        <p className="text-xs text-white/70">{data.active} aktif / {data.total} total</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-3"
          >
            <Link
              href="/pengurus/analytics"
              className="block p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <TrendingUp className="w-6 h-6 text-white mb-2" />
              <span className="text-sm font-semibold text-white">Analytics</span>
            </Link>
            <Link
              href="/pengurus/rating-management"
              className="block p-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <Star className="w-6 h-6 text-white mb-2" />
              <span className="text-sm font-semibold text-white">Ratings</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* User Modal - Expandable View */}
      <AnimatePresence>
        {showUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Daftar User Internal</h3>
                    <p className="text-sm text-slate-500">{users.length} user dikelompokkan per divisi</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                <div className="space-y-6">
                  {usersByDivision.map(([division, divisionUsers]) => (
                    <div key={division}>
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{division}</h4>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">
                          {divisionUsers.length} user
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {divisionUsers.map((user) => {
                          const RoleIcon = ROLE_ICONS[user.role] || Users
                          const isExecRole = ['ADMIN', 'PENGURUS', 'ENGINEERING_ADMIN'].includes(user.role)
                          return (
                            <div
                              key={user.id}
                              className={`p-4 rounded-xl border transition-all ${
                                isExecRole
                                  ? 'bg-gradient-to-r from-slate-800/5 to-slate-900/5 border-slate-300'
                                  : 'bg-slate-50 border-slate-200 hover:border-purple-200'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden ${
                                  isExecRole
                                    ? 'bg-gradient-to-br from-amber-200 to-amber-300 text-amber-700'
                                    : 'bg-purple-100 text-purple-600'
                                }`}>
                                  {user.avatar_url ? (
                                    <Image
                                      src={user.avatar_url}
                                      alt={user.full_name}
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    user.full_name.charAt(0).toUpperCase()
                                  )}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-semibold text-slate-800 truncate">{user.full_name}</p>
                                    {isExecRole && <Crown className="w-4 h-4 text-amber-500 fill-amber-100" />}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                      isExecRole
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-purple-100 text-purple-600'
                                    }`}>
                                      <RoleIcon className="w-3 h-3" />
                                      {user.role.replace('_', ' ')}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-2">
                                    {user.is_active ? (
                                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                                        <UserCheck className="w-3 h-3" />
                                        Aktif
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-xs text-slate-400">
                                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                                        Nonaktif
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, color, trend }: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  trend?: number
}) {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-slate-100 text-slate-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-purple-100 p-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </span>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{title}</p>
    </motion.div>
  )
}
