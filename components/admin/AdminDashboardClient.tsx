'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Users,
  Ticket,
  Shield,
  Crown,
  LayoutDashboard,
  Star,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Wrench,
  Briefcase,
  Award,
} from 'lucide-react'
import type { UserRole } from '@/types/database'

interface UserProfile {
  full_name: string
  division: string
  avatar_url?: string
  role: UserRole
}

interface Stats {
  totalUsers: number
  activeTickets: number
  completedTickets: number
  cancelledTickets: number
}

interface GatewayRole {
  id: string
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  description: string
}

export default function AdminDashboardClient({
  userProfile,
  stats
}: {
  userProfile: UserProfile
  stats: Stats
}) {
  const safeUserProfile = useMemo(() => ({
    full_name: userProfile?.full_name || 'Admin',
    division: userProfile?.division || 'Super Admin',
    avatar_url: userProfile?.avatar_url,
    role: userProfile?.role || 'ADMIN' as UserRole
  }), [userProfile])

  const gatewayRoles: GatewayRole[] = [
    {
      id: 'rr',
      name: 'Resident Relations',
      href: '/rr',
      icon: Briefcase,
      gradient: 'from-emerald-500 to-emerald-600',
      description: 'Kelola tiket komplain warga'
    },
    {
      id: 'eng-admin',
      name: 'Engineering Admin',
      href: '/engineering-admin',
      icon: Award,
      gradient: 'from-purple-600 to-purple-700',
      description: 'Kelola teknisi & penugasan'
    },
    {
      id: 'engineering',
      name: 'Engineering',
      href: '/engineering',
      icon: Wrench,
      gradient: 'from-blue-500 to-blue-600',
      description: ' Teknisi lapangan'
    },
    {
      id: 'pengurus',
      name: 'Executive Board',
      href: '/pengurus',
      icon: Shield,
      gradient: 'from-amber-500 to-amber-600',
      description: 'Analytics & laporan'
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Crown className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Control Center</h1>
            <p className="text-slate-300 text-sm mt-0.5">
              Selamat datang, {safeUserProfile.full_name}! Super Admin Dashboard.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
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
              <p className="text-2xl font-bold text-slate-800">{stats.totalUsers}</p>
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
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.activeTickets}</p>
              <p className="text-xs text-slate-500">Tiket Aktif</p>
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
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.completedTickets}</p>
              <p className="text-xs text-slate-500">Tiket Selesai</p>
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
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.cancelledTickets}</p>
              <p className="text-xs text-slate-500">Tiket Dibatalkan</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gateway to Other Roles */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-base font-semibold text-slate-800">Gateway ke Modul Lain</h3>
              <p className="text-xs text-slate-400">Impersonasi akses ke role lain</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {gatewayRoles.map((role, index) => {
              const Icon = role.icon
              return (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <Link
                    href={role.href}
                    className={`block p-5 rounded-xl bg-gradient-to-br ${role.gradient} shadow-md hover:shadow-lg transition-all group`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-sm">{role.name}</p>
                        <p className="text-xs text-white/70">{role.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white/80">Buka Modul</span>
                      <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link
          href="/admin/users"
          className="flex items-center gap-4 p-5 bg-white rounded-xl border border-purple-100 shadow-sm hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 group-hover:text-purple-600 transition-colors">User Management</p>
            <p className="text-xs text-slate-500">Registrasi & kelola user</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/tickets"
          className="flex items-center gap-4 p-5 bg-white rounded-xl border border-purple-100 shadow-sm hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Ticket className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 group-hover:text-amber-600 transition-colors">Ticket Control</p>
            <p className="text-xs text-slate-500">Batalkan & arsip tiket</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/rating-moderation"
          className="flex items-center gap-4 p-5 bg-white rounded-xl border border-purple-100 shadow-sm hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Star className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">Moderasi Rating</p>
            <p className="text-xs text-slate-500">Kelola ulasan warga</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  )
}
