'use client'

import { LogOut, Bell, User } from 'lucide-react'
import { logout } from '@/actions/auth'
import Image from 'next/image'
import type { UserRole } from '@/types/database'

interface HeaderProps {
  user: {
    full_name: string
    division: string
    avatar_url?: string
    role: UserRole
  }
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-purple-100 flex items-center justify-end px-6 fixed top-0 right-0 left-64 z-10">
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white" />
        </button>

        <div className="h-6 w-px bg-purple-100" />

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{user.full_name}</p>
            <p className="text-xs text-slate-500">{user.division}</p>
          </div>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-200 to-purple-300 flex items-center justify-center text-purple-700 font-bold shadow-sm">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.full_name}
                width={36}
                height={36}
                unoptimized
                className="w-9 h-9 rounded-xl object-cover"
              />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>

          <button
            onClick={() => logout()}
            className="ml-2 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Keluar"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
