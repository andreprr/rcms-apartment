'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Loader2,
  ArrowLeft,
  Star,
  ThumbsUp,
  ThumbsDown,
  Minus,
  MessageSquare,
  Calendar,
  Building2,
  Filter,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import type { UserRole } from '@/types/database'

interface UserProfile {
  full_name: string
  division: string
  avatar_url?: string
  role: UserRole
}

interface Rating {
  id: string
  rating: number
  comment: string | null
  confirmed_at: string
  ticket: {
    ticket_number: string
    unit_code: string
    problem: string
  }
}

interface RatingStats {
  baik: number
  normal: number
  bad: number
  total: number
  avgRating: number
}

const COLORS = {
  baik: '#10B981',
  normal: '#F59E0B',
  bad: '#EF4444',
}

export default function RatingManagementClient({ userProfile }: { userProfile: UserProfile }) {
  const [loading, setLoading] = useState(true)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [stats, setStats] = useState<RatingStats>({ baik: 0, normal: 0, bad: 0, total: 0, avgRating: 0 })
  const [filter, setFilter] = useState<'all' | 'baik' | 'normal' | 'bad'>('all')

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
        const response = await fetch('/api/pengurus/ratings?visible=true')
        const data = await response.json()
        if (data.ratings) setRatings(data.ratings)
        if (data.stats) setStats(data.stats)
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const pieData = useMemo(() => [
    { name: 'Baik (4-5)', value: stats.baik, color: COLORS.baik },
    { name: 'Normal (3)', value: stats.normal, color: COLORS.normal },
    { name: 'Buruk (1-2)', value: stats.bad, color: COLORS.bad },
  ].filter(d => d.value > 0), [stats])

  const filteredRatings = useMemo(() => {
    if (filter === 'all') return ratings
    if (filter === 'baik') return ratings.filter(r => r.rating >= 4)
    if (filter === 'normal') return ratings.filter(r => r.rating === 3)
    if (filter === 'bad') return ratings.filter(r => r.rating <= 2)
    return ratings
  }, [ratings, filter])

  const getRatingCategory = (rating: number) => {
    if (rating >= 4) return { label: 'Baik', color: 'text-emerald-600', bg: 'bg-emerald-50' }
    if (rating === 3) return { label: 'Normal', color: 'text-amber-600', bg: 'bg-amber-50' }
    return { label: 'Buruk', color: 'text-red-600', bg: 'bg-red-50' }
  }

  const getRatingIcon = (rating: number) => {
    if (rating >= 4) return <ThumbsUp className="w-4 h-4" />
    if (rating === 3) return <Minus className="w-4 h-4" />
    return <ThumbsDown className="w-4 h-4" />
  }

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
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Rating Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Monitoring dan analisis kepuasan warga.
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

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pie Chart - Rating Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-1 bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Distribusi Rating</h3>
            <p className="text-xs text-slate-400">Persentase kepuasan</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
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
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm flex flex-col justify-center"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800">{stats.avgRating.toFixed(1)}</p>
              <p className="text-xs text-slate-500">Rating Rata-rata</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(stats.avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                }`}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-2">
            <ThumbsUp className="w-6 h-6 text-emerald-200" />
            <span className="text-emerald-200 text-sm font-medium">Baik</span>
          </div>
          <p className="text-white text-3xl font-bold">{stats.baik}</p>
          <p className="text-emerald-200 text-xs mt-1">
            {stats.total > 0 ? Math.round((stats.baik / stats.total) * 100) : 0}% dari total
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-2">
            <ThumbsDown className="w-6 h-6 text-red-200" />
            <span className="text-red-200 text-sm font-medium">Buruk</span>
          </div>
          <p className="text-white text-3xl font-bold">{stats.bad}</p>
          <p className="text-red-200 text-xs mt-1">
            {stats.total > 0 ? Math.round((stats.bad / stats.total) * 100) : 0}% dari total
          </p>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Filter:</span>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Semua', count: stats.total },
              { key: 'baik', label: 'Baik', count: stats.baik, color: 'emerald' },
              { key: 'normal', label: 'Normal', count: stats.normal, color: 'amber' },
              { key: 'bad', label: 'Buruk', count: stats.bad, color: 'red' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filter === tab.key
                    ? `bg-purple-600 text-white`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Rating Feed */}
        <div className="divide-y divide-slate-100">
          {filteredRatings.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Tidak ada rating tersedia</p>
            </div>
          ) : (
            filteredRatings.map((rating) => {
              const category = getRatingCategory(rating.rating)
              return (
                <motion.div
                  key={rating.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${category.bg}`}>
                      <span className={`${category.color}`}>
                        {getRatingIcon(rating.rating)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${category.bg} ${category.color}`}>
                          {category.label} ({rating.rating})
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= rating.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(rating.confirmed_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      {rating.comment && (
                        <div className="flex items-start gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                          <p className="text-sm text-slate-700">{rating.comment}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {rating.ticket.unit_code}
                        </span>
                        <span className="font-medium text-slate-600">{rating.ticket.ticket_number}</span>
                        <span>{rating.ticket.problem}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </motion.div>
    </div>
  )
}
