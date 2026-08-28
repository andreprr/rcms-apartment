'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  Loader2,
  ArrowLeft,
  Users,
  Ticket,
  CheckCircle2,
  Clock,
  Star,
  TrendingUp,
  BarChart3,
  Award,
  Crown,
  Shield,
  Wrench,
  Briefcase,
  UserCheck,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import {
  LineChart,
  Line,
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

interface TechnicianPerformance {
  id: string
  full_name: string
  totalTickets: number
  completedTickets: number
  avgRating: number
}

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899']

const ROLE_CONFIG: Record<string, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  borderColor: string
  isExecutive: boolean
}> = {
  ADMIN: {
    label: 'Super Admin Executive',
    icon: Crown,
    gradient: 'from-slate-800 to-slate-900',
    borderColor: 'border-amber-400',
    isExecutive: true,
  },
  PENGURUS: {
    label: 'Executive Board',
    icon: Shield,
    gradient: 'from-amber-600 to-amber-700',
    borderColor: 'border-amber-300',
    isExecutive: true,
  },
  ENGINEERING_ADMIN: {
    label: 'Engineering Admin',
    icon: Award,
    gradient: 'from-purple-600 to-purple-700',
    borderColor: 'border-purple-300',
    isExecutive: true,
  },
  ENGINEERING: {
    label: 'Teknisi Lapangan',
    icon: Wrench,
    gradient: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-300',
    isExecutive: false,
  },
  RR: {
    label: 'Resident Relations',
    icon: Briefcase,
    gradient: 'from-emerald-500 to-emerald-600',
    borderColor: 'border-emerald-300',
    isExecutive: false,
  },
}

const ROLE_ORDER = ['ADMIN', 'PENGURUS', 'ENGINEERING_ADMIN', 'ENGINEERING', 'RR']

export default function PengurusAnalyticsClient({ userProfile }: { userProfile: UserProfile }) {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [technicians, setTechnicians] = useState<TechnicianPerformance[]>([])
  const [trendData, setTrendData] = useState<{ month: string; tickets: number; completed: number }[]>([])
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([])
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({
    ADMIN: true,
    PENGURUS: true,
    ENGINEERING_ADMIN: true,
    ENGINEERING: true,
    RR: true,
  })

  const safeUserProfile = useMemo(() => ({
    full_name: userProfile?.full_name || 'Pengurus',
    division: userProfile?.division || 'Executive',
    avatar_url: userProfile?.avatar_url,
    role: userProfile?.role || 'PENGURUS' as UserRole
  }), [userProfile])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [usersRes, ratingsRes, statsRes] = await Promise.all([
          fetch('/api/pengurus/users'),
          fetch('/api/pengurus/ratings'),
          fetch('/api/pengurus/stats')
        ])

        const usersData = await usersRes.json()
        const ratingsData = await ratingsRes.json()
        const statsData = await statsRes.json()

        if (usersData.users) setUsers(usersData.users)
        if (ratingsData.technicians) setTechnicians(ratingsData.technicians)
        if (statsData.trendMonthly) setTrendData(statsData.trendMonthly)
        if (statsData.category) setCategoryData(statsData.category)
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const usersByRole = useMemo(() => {
    const grouped: Record<string, User[]> = {}
    users.forEach(user => {
      if (!grouped[user.role]) grouped[user.role] = []
      grouped[user.role].push(user)
    })
    return grouped
  }, [users])

  const sortedRoles = useMemo(() => {
    return ROLE_ORDER.filter(role => usersByRole[role]?.length > 0)
  }, [usersByRole])

  const toggleRole = (role: string) => {
    setExpandedRoles(prev => ({ ...prev, [role]: !prev[role] }))
  }

  const avgRating = technicians.length > 0
    ? (technicians.reduce((sum, t) => sum + t.avgRating, 0) / technicians.length).toFixed(1)
    : '0.0'

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
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Analytics Executive</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Analisis data dan statistik performa tim.
            </p>
          </div>
          <Link
            href="/pengurus"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-purple-200 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{users.length}</p>
              <p className="text-xs text-slate-500">Total User</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{users.filter(u => u.is_active).length}</p>
              <p className="text-xs text-slate-500">User Aktif</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{technicians.length}</p>
              <p className="text-xs text-slate-500">Teknisi</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{avgRating}</p>
              <p className="text-xs text-slate-500">Rating Rata-rata</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Tren Bulanan</h3>
            <p className="text-xs text-slate-400">Tiket dibuat vs selesai</p>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="tickets" stroke="#8B5CF6" strokeWidth={2} name="Dibuat" />
                <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} name="Selesai" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Distribusi Kategori</h3>
            <p className="text-xs text-slate-400">Berdasarkan jenis keluhan</p>
          </div>
          <div className="p-5">
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
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

      {/* User List by Role - New Layout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">User Distribution by Role</h3>
          <p className="text-xs text-slate-400">Daftar user internal berdasarkan divisi dan role</p>
        </div>
        <div className="p-5 space-y-4">
          {sortedRoles.map((role) => {
            const config = ROLE_CONFIG[role] || ROLE_CONFIG.RR
            const RoleIcon = config.icon
            const roleUsers = usersByRole[role] || []
            const isExpanded = expandedRoles[role]

            return (
              <div
                key={role}
                className={`rounded-xl border-2 overflow-hidden ${
                  config.isExecutive
                    ? `${config.borderColor} shadow-lg`
                    : 'border-slate-200'
                }`}
              >
                {/* Role Header */}
                <button
                  onClick={() => toggleRole(role)}
                  className={`w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r ${config.gradient} text-white`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                      <RoleIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{config.label}</p>
                        {config.isExecutive && <Crown className="w-4 h-4 text-amber-300 fill-amber-100" />}
                      </div>
                      <p className="text-xs text-white/70">{roleUsers.length} user</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-white/70" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-white/70" />
                  )}
                </button>

                {/* User List */}
                {isExpanded && (
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {roleUsers.map((user) => (
                        <div
                          key={user.id}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                            config.isExecutive
                              ? 'bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-150'
                              : 'bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden ${
                            config.isExecutive
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
                              {config.isExecutive && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-100 shrink-0" />}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{user.division}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {user.is_active ? (
                                <div className="flex items-center gap-1 text-xs text-emerald-600">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Aktif
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                  Nonaktif
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Technician Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">Performa Teknisi</h3>
          <p className="text-xs text-slate-400">Statistik individual teknisi lapangan</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nama</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Total Tiket</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Selesai</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Rate</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {technicians.map((tech) => (
                <tr key={tech.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {tech.full_name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800">{tech.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center text-slate-600">{tech.totalTickets}</td>
                  <td className="px-5 py-4 text-center text-emerald-600 font-medium">{tech.completedTickets}</td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${tech.totalTickets > 0 ? (tech.completedTickets / tech.totalTickets) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600">
                        {tech.totalTickets > 0 ? Math.round((tech.completedTickets / tech.totalTickets) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="font-medium text-slate-800">{tech.avgRating.toFixed(1)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
