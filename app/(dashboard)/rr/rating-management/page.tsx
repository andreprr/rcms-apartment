'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Star,
  Building2,
  User,
  Calendar,
  MessageSquare,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Eye,
  EyeOff,
} from 'lucide-react'

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

interface Rating {
  id: string
  ticket_id: string
  ticket_number: string
  rating: number
  comment?: string
  unit_code: string
  resident_name: string
  confirmed_at: string
  is_visible: boolean
}

export default function RRRatingManagementPage() {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRatings() {
      setLoading(true)
      try {
        const response = await fetch('/api/rr/ratings')
        const data = await safeJson(response)
        if (data.ratings) {
          setRatings(data.ratings)
        }
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
      setLoading(false)
    }
    fetchRatings()
  }, [])

  // Calculate stats
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : '0.0'

  const excellentCount = ratings.filter(r => r.rating >= 4).length
  const standardCount = ratings.filter(r => r.rating === 3).length
  const badCount = ratings.filter(r => r.rating < 3).length

  // Render stars
  function renderStars(rating: number) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Rating Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Kelola rating dan ulasan dari warga.</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{avgRating}</p>
              <p className="text-xs text-slate-500">Rating Rata-rata</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{ratings.length}</p>
              <p className="text-xs text-slate-500">Total Rating</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{ratings.filter(r => r.comment).length}</p>
              <p className="text-xs text-slate-500">Dengan Komentar</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{ratings.filter(r => r.is_visible).length}</p>
              <p className="text-xs text-slate-500">Tampil di Publik</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Rating Feed */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Feed Rating Warga</h2>
        </div>

        <div className="divide-y divide-slate-100">
          {ratings.length === 0 ? (
            <div className="p-12 text-center">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Belum ada rating dari warga.</p>
            </div>
          ) : (
            ratings.map((rating, index) => (
              <motion.div
                key={rating.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="p-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Rating Stars */}
                  <div className="flex-shrink-0">
                    {renderStars(rating.rating)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-slate-800">{rating.ticket_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        rating.rating >= 4 ? 'bg-emerald-50 text-emerald-700' :
                        rating.rating === 3 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {rating.rating >= 4 ? 'Puas' : rating.rating === 3 ? 'Netral' : 'Tidak Puas'}
                      </span>
                      {rating.is_visible ? (
                        <Eye className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {rating.unit_code}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {rating.resident_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(rating.confirmed_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>

                    {rating.comment && (
                      <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 mt-2">
                        "{rating.comment}"
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
