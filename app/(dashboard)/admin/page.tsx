export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminUserManagementClient from '@/components/admin/AdminUserManagementClient'
import { Shield, Users, Activity, Settings, Wrench, Building2, ChevronRight, TrendingUp, CheckCircle2, Clock, AlertCircle, Layers } from 'lucide-react'
import Link from 'next/link'

// Division data interface
interface Division {
  id: string
  name: string
  shortName: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgGradient: string
  borderColor: string
  hoverGlow: string
  href: string
}

// Animation variants for framer-motion (inline for server component context)
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
}

export default async function AdminPage() {
  const supabase = await createClient()

  // Check user auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check admin role
  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Fetch stats
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: activeUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: totalTickets } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })

  const { count: newTickets } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'NEW')

  const { count: completedToday } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'COMPLETED')

  // Fetch all users for table
  const { data: allUsersData } = await supabase
    .from('users')
    .select('id, auth_user_id, full_name, username, email, role, is_active, created_at')
    .order('created_at', { ascending: false })

  // Calculate role counts
  const roleBreakdown = allUsersData?.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Division cards data
  const divisions: Division[] = [
    {
      id: 'rr',
      name: 'Residence Representative',
      shortName: 'RR',
      description: 'Mengelola pengaduan warga dan komunikasi dengan residents',
      icon: Building2,
      color: 'text-blue-600',
      bgGradient: 'from-blue-500/10 to-blue-600/5',
      borderColor: 'border-blue-200/50',
      hoverGlow: 'hover:shadow-blue-500/10',
      href: '/admin/users?role=RR'
    },
    {
      id: 'eng-admin',
      name: 'Engineering Admin',
      shortName: 'ENG-ADM',
      description: 'Supervisi dan koordinasi tim teknisi lapangan',
      icon: Settings,
      color: 'text-amber-600',
      bgGradient: 'from-amber-500/10 to-amber-600/5',
      borderColor: 'border-amber-200/50',
      hoverGlow: 'hover:shadow-amber-500/10',
      href: '/admin/users?role=ENGINEERING_ADMIN'
    },
    {
      id: 'engineering',
      name: 'Engineering',
      shortName: 'ENG',
      description: 'Teknisi lapangan yang menangani perbaikan dan maintenance',
      icon: Wrench,
      color: 'text-emerald-600',
      bgGradient: 'from-emerald-500/10 to-emerald-600/5',
      borderColor: 'border-emerald-200/50',
      hoverGlow: 'hover:shadow-emerald-500/10',
      href: '/admin/users?role=ENGINEERING'
    },
    {
      id: 'management',
      name: 'Management',
      shortName: 'MGMT',
      description: 'Oversight manajemen dan pengambilan keputusan strategis',
      icon: Activity,
      color: 'text-purple-600',
      bgGradient: 'from-purple-500/10 to-purple-600/5',
      borderColor: 'border-purple-200/50',
      hoverGlow: 'hover:shadow-purple-500/10',
      href: '/admin/users?role=MANAGEMENT'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-10 shadow-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-700/20 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Admin Control Center</h1>
              <p className="text-slate-400 mt-1">Kelola sistem dan seluruh pengguna RCMS</p>
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white font-medium">{totalUsers || 0} Total User</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white font-medium">{activeUsers || 0} Aktif</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-white font-medium">{totalTickets || 0} Tiket</span>
            </div>
          </div>
        </div>

        {/* Decorative Grid */}
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-5">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Division Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {divisions.map((division, index) => {
          const Icon = division.icon
          const userCount = roleBreakdown[division.id === 'eng-admin' ? 'ENGINEERING_ADMIN' : division.id === 'rr' ? 'RR' : division.id.toUpperCase()] || 0

          return (
            <Link
              key={division.id}
              href={division.href}
              className="group relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`
                relative overflow-hidden
                bg-gradient-to-br ${division.bgGradient}
                border ${division.borderColor}
                rounded-2xl p-6 md:p-7
                transition-all duration-300 ease-out
                hover:shadow-xl ${division.hoverGlow}
                hover:scale-[1.02]
                hover:border-opacity-60
                group-hover:shadow-2xl
              `}>
                {/* Icon */}
                <div className={`
                  w-14 h-14 rounded-2xl
                  bg-white/80 backdrop-blur-sm
                  border border-white/50
                  flex items-center justify-center
                  mb-5
                  group-hover:scale-110
                  transition-transform duration-300
                `}>
                  <Icon className={`w-7 h-7 ${division.color}`} />
                </div>

                {/* Content */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{division.shortName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${division.color} bg-white/60`}>
                        {userCount} user{userCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{division.name}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{division.description}</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="absolute bottom-6 right-6">
                  <div className={`
                    w-10 h-10 rounded-xl
                    bg-white/80 backdrop-blur-sm
                    border border-slate-200/50
                    flex items-center justify-center
                    text-slate-400
                    group-hover:${division.color}
                    group-hover:translate-x-1
                    transition-all duration-300
                  `}>
                    <ChevronRight className={`w-5 h-5 ${division.color} group-hover:translate-x-0.5 transition-transform`} />
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className={`absolute inset-0 bg-gradient-to-br ${division.bgGradient} rounded-2xl blur-xl`} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalTickets || 0}</p>
          <p className="text-sm text-slate-500">Total Tiket</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{newTickets || 0}</p>
          <p className="text-sm text-slate-500">Tiket Baru</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{completedToday || 0}</p>
          <p className="text-sm text-slate-500">Selesai</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalTickets && newTickets ? totalTickets - newTickets : 0}</p>
          <p className="text-sm text-slate-500">Sedang Diproses</p>
        </div>
      </div>

      {/* User Management Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Pengguna</h2>
        </div>
        <AdminUserManagementClient initialUsers={(allUsersData || [])} />
      </div>
    </div>
  )
}
