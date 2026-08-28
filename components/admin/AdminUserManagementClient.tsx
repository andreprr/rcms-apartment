'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import TaskoDashboard from '@/components/dashboard/TaskoDashboard'
import {
  Users,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  X,
  Shield,
  Activity,
  Settings,
  Key
} from 'lucide-react'
import { WeeklyBarChart, ChartLegend, AnalyticsCard } from '@/components/dashboard/AnalyticsWidgets'
import type { UserRole } from '@/types/database'

// Types
interface UserData {
  id: string
  auth_user_id: string
  full_name: string
  username: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

interface RoleOption {
  value: string
  label: string
  color: string
  bgColor: string
}

interface AdminUserManagementClientProps {
  initialUsers: UserData[]
  userProfile: {
    full_name: string
    division: string
    avatar_url?: string
    role: UserRole
  }
}

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'ADMIN', label: 'Admin', color: 'text-red-600', bgColor: 'bg-red-50' },
  { value: 'RR', label: 'Residence Representative', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { value: 'ENGINEERING_ADMIN', label: 'Engineering Admin', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { value: 'ENGINEERING', label: 'Engineering', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { value: 'PENGURUS', label: 'Management', color: 'text-purple-600', bgColor: 'bg-purple-50' },
]

// Animation variants
const modalVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
}

const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 }
}

// Role badge component
function RoleBadge({ role }: { role: string }) {
  const roleOption = ROLE_OPTIONS.find(r => r.value === role) || ROLE_OPTIONS[0]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleOption.bgColor} ${roleOption.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {roleOption.label}
    </span>
  )
}

// Status badge component
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      isActive
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-slate-100 text-slate-500'
    }`}>
      {isActive ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Aktif
        </>
      ) : (
        <>
          <XCircle className="w-3.5 h-3.5" />
          Nonaktif
        </>
      )}
    </span>
  )
}

export default function AdminUserManagementClient({ initialUsers }: AdminUserManagementClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [showModal, setShowModal] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    byRole: ROLE_OPTIONS.map(r => ({
      label: r.label.split(' ')[0],
      value: users.filter(u => u.role === r.value).length,
      color: r.color.includes('red') ? '#EF4444' :
             r.color.includes('blue') ? '#3B82F6' :
             r.color.includes('amber') ? '#F59E0B' :
             r.color.includes('emerald') ? '#10B981' : '#8B5CF6'
    }))
  }

  // Chart data (static demo values)
  const chartData = [
    { day: 'S', value: 3 },
    { day: 'M', value: 7 },
    { day: 'T', value: 5 },
    { day: 'W', value: 6 },
    { day: 'T', value: 4 },
    { day: 'F', value: 8 },
    { day: 'S', value: 2 },
  ]

  // KPI Stats
  const kpiStats = [
    {
      title: 'Total User',
      value: stats.total,
      icon: <Users className="w-5 h-5 text-white" />,
      variant: 'primary' as const,
      trend: { value: 10, isPositive: true }
    },
    {
      title: 'User Aktif',
      value: stats.active,
      subtitle: 'Dapat login',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />
    },
    {
      title: 'Tiket Aktif',
      value: 24,
      subtitle: 'Sedang berjalan',
      icon: <Activity className="w-5 h-5 text-blue-600" />
    },
    {
      title: 'Cancelled',
      value: 3,
      subtitle: 'Bulan ini',
      icon: <XCircle className="w-5 h-5 text-rose-600" />
    }
  ]

  // Left content - Global Statistics
  const leftContent = (
    <AnalyticsCard
      title="Statistik Global"
      subtitle="Aktivitas sistem secara keseluruhan"
    >
      <WeeklyBarChart data={chartData} height={240} />
      <div className="mt-4">
        <ChartLegend
          items={[
            { color: '#10B981', label: 'Aktivitas' }
          ]}
        />
      </div>
    </AnalyticsCard>
  )

  // Right content - System Audit
  const rightContent = (
    <div className="space-y-4">
      {/* System Audit Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <h3 className="text-base font-semibold text-slate-800">System Audit</h3>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Total Transaksi</span>
            <span className="text-sm font-semibold text-slate-800">1,234</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Login Hari Ini</span>
            <span className="text-sm font-semibold text-slate-800">18</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Error Rate</span>
            <span className="text-sm font-semibold text-emerald-600">0.2%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Uptime</span>
            <span className="text-sm font-semibold text-emerald-600">99.9%</span>
          </div>
        </div>
      </div>

      {/* Impersonate Gateway */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-500" />
            <h3 className="text-base font-semibold text-slate-800">Impersonate Gateway</h3>
          </div>
        </div>
        <div className="p-4">
          <button className="w-full px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center gap-2">
            <Settings className="w-4 h-4" />
            Akses Mode Super Admin
          </button>
        </div>
      </div>
    </div>
  )

  // Create user
  async function handleCreateUser(formData: FormData) {
    setModalLoading(true)
    setError(null)

    const fullName = formData.get('full_name') as string
    const username = formData.get('username') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as string

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, username, email, password, role })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat pengguna')
      }

      const refreshResponse = await fetch('/api/admin/users')
      const refreshData = await refreshResponse.json()
      setUsers(refreshData.users || [])

      setShowModal(false)
    } catch (err: any) {
      setError(err.message || 'Gagal membuat pengguna')
    } finally {
      setModalLoading(false)
    }
  }

  // Toggle user status
  async function toggleUserStatus(userId: string, currentStatus: boolean) {
    setToggleLoading(userId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, is_active: !currentStatus })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengubah status')
      }

      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_active: !currentStatus } : u
      ))
    } catch (err) {
      console.error('Failed to toggle status:', err)
    } finally {
      setToggleLoading(null)
    }
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = !roleFilter || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <TaskoDashboard
      pageTitle="Dashboard Admin"
      pageSubtitle="Kelola pengguna dan pantau statistik sistem."
      actions={{
        primary: {
          label: 'Tambah User',
          icon: <UserPlus className="w-4 h-4" />,
          onClick: () => setShowModal(true)
        }
      }}
      stats={kpiStats}
      leftContent={leftContent}
      rightContent={rightContent}
    >
      {/* User Management Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        {/* Table Header */}
        <div className="px-6 py-5 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-white/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Manajemen Pengguna</h2>
              <p className="text-sm text-slate-500 mt-0.5">{filteredUsers.length} pengguna ditemukan</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
              >
                <option value="">Semua Role</option>
                {ROLE_OPTIONS.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Pengguna</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Bergabung</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                        <Users className="w-7 h-7 text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-medium">Tidak ada pengguna ditemukan</p>
                      <p className="text-sm text-slate-400 mt-1">Coba ubah kata kunci pencarian</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{user.full_name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge isActive={user.is_active} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(user.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        disabled={toggleLoading === user.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          user.is_active
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        } disabled:opacity-50`}
                      >
                        {toggleLoading === user.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : user.is_active ? (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            Nonaktifkan
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aktifkan
                          </>
                        )}
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Tambah User Baru</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Lengkapi data pengguna di bawah ini</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form action={handleCreateUser} className="p-6 space-y-5">
                {error && (
                  <div className="flex items-start gap-3 bg-red-50/80 border border-red-200/60 text-red-600 px-4 py-3 rounded-xl text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Username</label>
                  <input
                    type="text"
                    name="username"
                    required
                    placeholder="johndoe"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Password</label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={6}
                      placeholder="Min. 6 karakter"
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Role</label>
                  <select
                    name="role"
                    required
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 transition-all cursor-pointer"
                  >
                    <option value="">Pilih Role</option>
                    {ROLE_OPTIONS.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-70"
                  >
                    {modalLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Simpan User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </TaskoDashboard>
  )
}
