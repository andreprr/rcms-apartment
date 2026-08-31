'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Mail, Building2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'
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

interface User {
  id: string
  full_name: string
  division: string
  email: string
  avatar_url?: string
  is_active: boolean
  created_at: string
}

export default function RRTeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      try {
        const response = await fetch('/api/admin/users')
        const data = await safeJson(response)
        if (data.users) {
          // Filter only RR users
          const rrUsers = data.users.filter((u: any) => u.role === 'RR')
          setUsers(rrUsers)
        }
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
      setLoading(false)
    }
    fetchUsers()
  }, [])

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
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Team RR</h1>
            <p className="text-sm text-slate-500 mt-0.5">Rekan kerja Role Residence Representative.</p>
          </div>
          <div className="text-3xl font-bold text-purple-600">{users.length}</div>
        </div>
      </motion.div>

      {/* Team Grid */}
      {users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-100 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Belum ada rekan RR lainnya.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.full_name}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-2xl object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-200 to-purple-300 flex items-center justify-center text-purple-700 font-bold text-xl shadow-sm">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Status indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    user.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                  }`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{user.full_name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {user.division || 'RR'}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <a
                  href={`mailto:${user.email}`}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-purple-600 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{user.email}</span>
                </a>
              </div>

              {/* Status Badge */}
              <div className="mt-4">
                {user.is_active ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aktif
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                    <XCircle className="w-3.5 h-3.5" />
                    Nonaktif
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
