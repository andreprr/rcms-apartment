'use client'

import { Bell, Search, User, Command } from 'lucide-react'
import { logout } from '@/actions/auth'
import Image from 'next/image'
import type { UserRole } from '@/types/database'

interface DashboardHeaderProps {
  user: {
    full_name: string
    division: string
    avatar_url?: string
    role: UserRole
  }
  title: string
  subtitle?: string
  onSearch?: (query: string) => void
  searchPlaceholder?: string
  actions?: React.ReactNode
  notificationCount?: number
}

export default function DashboardHeader({
  user,
  title,
  subtitle,
  onSearch,
  searchPlaceholder = "Search task...",
  actions,
  notificationCount = 0
}: DashboardHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-100">
      {/* Main Header Bar */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Search Bar - Left Side */}
          <div className="flex-1 max-w-xl">
            {onSearch && (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  onChange={(e) => onSearch(e.target.value)}
                  className="w-full pl-11 pr-20 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-xs text-slate-500 font-medium">
                  <Command className="w-3 h-3" />
                  <span>F</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Notifications & Profile */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">{user.full_name}</p>
                <p className="text-xs text-slate-500">{user.division || user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-bold shadow-sm overflow-hidden">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.full_name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Title & Actions Bar */}
      <div className="px-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Title & Subtitle */}
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>

          {/* Action Buttons */}
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
