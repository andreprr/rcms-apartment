'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Settings, User, Mail, Building2, Shield, Camera, Loader2, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/types/database'

interface Profile {
  id: string
  full_name: string
  division: string
  avatar_url?: string
  username: string
  email: string
  role: UserRole
  is_active: boolean
}

interface SettingsClientProps {
  profile: Profile
}

export default function SettingsClient({ profile }: SettingsClientProps) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(profile.full_name)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path)

      const newAvatarUrl = urlData.publicUrl
      setAvatarUrl(newAvatarUrl)

      // Update database
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message || 'Upload gagal')
    } finally {
      setUploading(false)
    }
  }

  async function handleSaveName() {
    if (fullName === profile.full_name) return
    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', profile.id)

      if (updateError) throw updateError
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Update gagal')
    } finally {
      setSaving(false)
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Settings</h1>
            <p className="text-sm text-slate-500">Kelola profil dan preferensi akun Anda</p>
          </div>
        </div>
      </motion.div>

      {/* Success Banner */}
      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Perubahan tersimpan
        </motion.div>
      )}

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Avatar Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-purple-50 bg-purple-50/30">
          <h2 className="font-semibold text-slate-800">Foto Profil</h2>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-200 to-purple-300 overflow-hidden shadow-md flex items-center justify-center text-purple-700 text-3xl font-bold">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" width={80} height={80} unoptimized className="w-20 h-20 rounded-2xl object-cover" />
                ) : profile.full_name.charAt(0).toUpperCase()}
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-2">Upload foto profil Anda. JPG, PNG, atau GIF maks 2MB.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                {uploading ? 'Mengunggah...' : 'Upload Foto'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Profile Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-purple-50 bg-purple-50/30">
          <h2 className="font-semibold text-slate-800">Informasi Profil</h2>
        </div>
        <div className="p-5 space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                />
              </div>
              <button
                onClick={handleSaveName}
                disabled={saving || fullName === profile.full_name}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
              </button>
            </div>
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Username</label>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                {profile.username}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Email</label>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                {profile.email}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Divisi</label>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400" />
                {profile.division}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Role</label>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                <Shield className="w-4 h-4 text-slate-400" />
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md font-medium text-xs">
                  {profile.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
