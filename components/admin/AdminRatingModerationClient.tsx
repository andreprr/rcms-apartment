'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Eye,
  EyeOff,
  Building2,
  MessageSquare,
  Filter,
} from 'lucide-react'
import type { UserRole } from '@/types/database'

interface Rating {
  id: string
  rating: number
  comment: string | null
  is_visible: boolean
  confirmed_at: string
  ticket: {
    ticket_number: string
    unit_code: string
    problem: string
  }
}

interface UserProfile {
  full_name: string
  division: string
  avatar_url?: string
  role: UserRole
}

const RATING_CONFIG = {
  baik: { label: 'Baik', min: 4, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  normal: { label: 'Normal', min: 3, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  buruk: { label: 'Buruk', min: 1, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
}

export default function AdminRatingModerationClient({
  initialRatings
}: {
  initialRatings: Rating[]
  userProfile: UserProfile
}) {
  const [ratings, setRatings] = useState<Rating[]>(initialRatings)
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all')

  const filteredRatings = useMemo(() => {
    if (filter === 'visible') return ratings.filter(r => r.is_visible)
    if (filter === 'hidden') return ratings.filter(r => !r.is_visible)
    return ratings
  }, [ratings, filter])

  const stats = useMemo(() => {
    const visible = ratings.filter(r => r.is_visible)
    const visibleRatings = visible.map(r => r.rating).filter(Boolean)
    return {
      total: ratings.length,
      visible: visible.length,
      hidden: ratings.length - visible.length,
      avgRating: visibleRatings.length > 0
        ? visibleRatings.reduce((a, b) => a + b, 0) / visibleRatings.length
        : 0,
      baik: visible.filter(r => r.rating >= 4).length,
      normal: visible.filter(r => r.rating === 3).length,
      buruk: visible.filter(r => r.rating <= 2).length,
    }
  }, [ratings])

  const toggleVisibility = async (ratingId: string, currentVisibility: boolean) => {
    try {
      const response = await fetch(`/api/admin/ratings/${ratingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: !currentVisibility }),
      })

      if (response.ok) {
        setRatings(ratings.map(r =>
          r.id === ratingId ? { ...r, is_visible: !currentVisibility } : r
        ))
      }
    } catch (err) {
      console.error('Failed to toggle visibility:', err)
    }
  }

  const getRatingConfig = (rating: number) => {
    if (rating >= 4) return RATING_CONFIG.baik
    if (rating === 3) return RATING_CONFIG.normal
    return RATING_CONFIG.buruk
  }

  const getRatingIcon = (rating: number) => {
    if (rating >= 4) return <ThumbsUp className="w-4 h-4" />
    if (rating === 3) return <Minus className="w-4 h-4" />
    return <ThumbsDown className="w-4 h-4" />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Moderasi Rating</h1>
        <p className="text-sm text-slate-500 mt-0.5">Kelola visibilitas ulasan warga.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-purple-100 p-4 shadow-sm"
        >
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-xs text-slate-500">Total Ulasan</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm"
        >
          <p className="text-2xl font-bold text-emerald-600">{stats.visible}</p>
          <p className="text-xs text-slate-500">Tampil</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
        >
          <p className="text-2xl font-bold text-slate-600">{stats.hidden}</p>
          <p className="text-xs text-slate-500">Disembunyikan</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-purple-100 p-4 shadow-sm"
        >
          <p className="text-2xl font-bold text-amber-600">{stats.avgRating.toFixed(1)}</p>
          <p className="text-xs text-slate-500">Rating Rata-rata</p>
        </motion.div>
      </div>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-xl border border-purple-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Filter:</span>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Semua', count: stats.total },
              { key: 'visible', label: 'Tampil', count: stats.visible },
              { key: 'hidden', label: 'Disembunyikan', count: stats.hidden },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  filter === tab.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Ratings List */}
        <div className="divide-y divide-slate-100">
          {filteredRatings.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Tidak ada ulasan</p>
            </div>
          ) : (
            filteredRatings.map((rating) => {
              const config = getRatingConfig(rating.rating)
              return (
                <div
                  key={rating.id}
                  className={`px-5 py-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors ${
                    !rating.is_visible ? 'bg-slate-50/50 opacity-60' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg} ${config.color}`}>
                    {getRatingIcon(rating.rating)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rating.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      {!rating.is_visible && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-500">
                          DISEMBUNYIKAN
                        </span>
                      )}
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
                        {rating.ticket?.unit_code}
                      </span>
                      <span className="font-medium text-slate-600">{rating.ticket?.ticket_number}</span>
                      <span>{rating.ticket?.problem}</span>
                    </div>
                  </div>

                  {/* Actions & Date */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => toggleVisibility(rating.id, rating.is_visible)}
                      className={`p-2 rounded-lg transition-colors ${
                        rating.is_visible
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={rating.is_visible ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {rating.is_visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <span className="text-xs text-slate-400">
                      {new Date(rating.confirmed_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </motion.div>
    </div>
  )
}
