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
    <div className="bg-[#192A56] border-b border-[#F7D794]/20">
      {/* Main Header Bar */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Search Bar - Left Side */}
          <div className="flex-1 max-w-xl">
            {onSearch && (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F7D794]/60" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  onChange={(e) => onSearch(e.target.value)}
                  className="w-full pl-11 pr-20 py-2.5 bg-[#192A56] border border-[#F7D794]/30 rounded-xl text-sm text-[#FCFBFB] placeholder:text-[#FCFBFB]/40 focus:outline-none focus:ring-2 focus:ring-[#F7D794] focus:border-[#F7D794] transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-[#F7D794]/15 rounded-md text-xs text-[#F7D794] font-medium">
                  <Command className="w-3 h-3" />
                  <span>F</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Notifications & Profile */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-2.5 text-[#FCFBFB] hover:text-[#F7D794] hover:bg-[#F7D794]/10 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#EDA6A3] text-[#192A56] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-[#F7D794]/20">
              <div className="w-12 h-12 rounded-2xl bg-[#F7D794] flex items-center justify-center text-[#192A56] font-bold shadow-sm overflow-hidden border-2 border-[#F7D794]/40">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.full_name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-2xl object-cover"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xl font-extrabold tracking-tight text-[#FCFBFB]">{user.full_name}</p>
                <span className="mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#F7D794]/10 text-[#F7D794] border border-[#F7D794]/30">
                  {user.division || user.role}
                </span>
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
            <h1 className="text-2xl font-bold text-[#FCFBFB] tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-[#F7D794]/80 mt-0.5">{subtitle}</p>
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
