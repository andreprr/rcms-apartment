'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  X,
  Loader2,
  UserPlus,
  Shield,
  Check,
  User,
  Briefcase,
  Award,
  Wrench,
  Crown,
  Pencil,
  Save,
} from 'lucide-react'
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
  auth_user_id: string
  full_name: string
  username: string
  email: string
  role: string
  division: string
  is_active: boolean
  avatar_url?: string
  created_at: string
}

interface UserProfile {
  full_name: string
  division: string
  avatar_url?: string
  role: UserRole
}

const ROLES = [
  { value: 'ADMIN', label: 'Admin', icon: Crown, color: 'text-amber-600' },
  { value: 'PENGURUS', label: 'Executive', icon: Shield, color: 'text-amber-500' },
  { value: 'ENGINEERING_ADMIN', label: 'Engineering Admin', icon: Award, color: 'text-purple-600' },
  { value: 'ENGINEERING', label: 'Teknisi', icon: Wrench, color: 'text-blue-600' },
  { value: 'RR', label: 'Resident Relations', icon: Briefcase, color: 'text-emerald-600' },
]

export default function AdminUsersClient({
  initialUsers
}: {
  initialUsers: User[]
  userProfile: UserProfile
}) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    division: '',
    role: 'ENGINEERING',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<{ id: string; role: string; division: string } | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const startEdit = (user: User) => {
    setEditingUser({ id: user.id, role: user.role, division: user.division })
    setError(null)
    setSuccess(null)
  }

  const saveEdit = async () => {
    if (!editingUser) return
    if (!editingUser.division.trim()) {
      setError('Divisi tidak boleh kosong')
      return
    }

    setSavingEdit(true)
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editingUser.role, division: editingUser.division }),
      })

      if (response.ok) {
        setUsers(users.map(u =>
          u.id === editingUser.id ? { ...u, role: editingUser.role, division: editingUser.division } : u
        ))
        setSuccess('Perubahan user berhasil disimpan')
        setEditingUser(null)
      } else {
        const result = await safeJson(response)
        setError(result.error || 'Gagal menyimpan perubahan')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    }
    setSavingEdit(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await safeJson(response)

      if (!response.ok || result.error) {
        setError(result.error || 'Terjadi kesalahan')
        setIsSubmitting(false)
        return
      }

      setSuccess('User berhasil dibuat!')
      setUsers([result.user, ...users])
      setShowModal(false)
      setFormData({ full_name: '', username: '', email: '', password: '', division: '', role: 'ENGINEERING' })
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    }
    setIsSubmitting(false)
  }

  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u))
      }
    } catch (err) {
      console.error('Failed to toggle user status:', err)
    }
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
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">User Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Registrasi dan kelola user internal.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Registrasi User Baru
          </button>
        </div>
      </motion.div>

      {!showModal && error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          {error}
        </div>
      )}
      {!showModal && success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600 flex items-center gap-2">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* User Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Divisi</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const roleInfo = ROLES.find(r => r.value === user.role) || ROLES[0]
                const RoleIcon = roleInfo.icon
                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${
                      user.role === 'ADMIN'
                        ? 'bg-gradient-to-r from-amber-50/60 via-yellow-50/40 to-white hover:from-amber-50/80'
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden ${
                          user.role === 'ADMIN'
                            ? 'ring-2 ring-amber-400 ring-offset-2 bg-gradient-to-br from-amber-400 to-amber-600 text-white border-2 border-amber-300'
                            : user.role === 'PENGURUS'
                              ? 'bg-gradient-to-br from-amber-200 to-amber-300 text-amber-700'
                              : 'bg-purple-100 text-purple-600'
                        }`}>
                          {user.avatar_url ? (
                            <Image src={user.avatar_url} alt={user.full_name} width={40} height={40} unoptimized className="w-full h-full object-cover" />
                          ) : (
                            user.full_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-800">{user.full_name}</p>
                            {user.role === 'ADMIN' ? (
                              <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[10px] font-bold tracking-wide flex items-center gap-1 shadow-sm">
                                <Crown className="w-3 h-3 fill-amber-100" />
                                SUPER ADMIN
                              </span>
                            ) : user.role === 'PENGURUS' ? (
                              <Crown className="w-3.5 h-3.5 text-amber-500" />
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-500">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {editingUser?.id === user.id ? (
                        <select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                          className="px-2 py-1.5 text-sm bg-slate-50 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none"
                        >
                          {ROLES.map((role) => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                      ) : (
                        <div className={`flex items-center gap-1.5 ${roleInfo.color}`}>
                          <RoleIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">{roleInfo.label}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {editingUser?.id === user.id ? (
                        <input
                          type="text"
                          value={editingUser.division}
                          onChange={(e) => setEditingUser({ ...editingUser, division: e.target.value })}
                          className="w-full min-w-[120px] px-2 py-1.5 text-sm bg-slate-50 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none"
                        />
                      ) : (
                        <span className="text-sm text-slate-600">{user.division}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => toggleUserActive(user.id, user.is_active)}
                        title={user.is_active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          user.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          user.is_active ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {editingUser?.id === user.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={saveEdit}
                            disabled={savingEdit}
                            className="p-2 text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Simpan"
                          >
                            {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Batal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(user)}
                          className="p-2 text-slate-500 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                          title="Edit Role & Divisi"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Registration Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Registrasi User Baru</h3>
                    <p className="text-sm text-slate-500">Tambah user ke sistem</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600">
                    {success}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none transition-all"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none transition-all"
                      placeholder="budis"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none transition-all"
                      placeholder="Min 6 karakter"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none transition-all"
                    placeholder="budi@apartemen.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Divisi</label>
                    <input
                      type="text"
                      required
                      value={formData.division}
                      onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none transition-all"
                      placeholder="Engineering"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none transition-all"
                    >
                      {ROLES.map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
