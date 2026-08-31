'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  Settings,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Calendar,
  BarChart3,
  Users,
  Star,
  Database,
  ChevronRight,
  Activity,
  Ticket,
  Clock,
  FileText,
  Crown,
} from 'lucide-react'
import { ROLE_NAVIGATION } from '@/types/database'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Calendar,
  BarChart3,
  Users,
  Star,
  Database,
  Activity,
  Ticket,
  Clock,
  FileText,
}

interface SidebarProps {
  user: {
    full_name: string
    division: string
    avatar_url?: string
    role: string
  }
  onLogout?: () => void
}

const EXECUTIVE_ROLES = ['ADMIN', 'PENGURUS', 'ENGINEERING_ADMIN']

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const navItems = ROLE_NAVIGATION[user.role as keyof typeof ROLE_NAVIGATION] || []
  const isExecutive = EXECUTIVE_ROLES.includes(user.role)

  return (
    <aside className="w-64 bg-[#192A56] flex flex-col h-screen fixed left-0 top-0 border-r border-[#F7D794]/20 shadow-lg">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#F7D794]/20 bg-[#192A56]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md bg-[#F7D794]">
            <span className="text-[#192A56] font-bold text-sm">RC</span>
          </div>
          <span className="font-bold text-[#FCFBFB] tracking-tight">RCMS</span>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-4 py-5 bg-[#192A56] border-b border-[#F7D794]/20">
        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-[#192A56] border border-[#F7D794]/30">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center text-4xl font-extrabold shadow-sm overflow-hidden border-2 border-[#F7D794]/40 bg-[#F7D794] text-[#192A56]">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.full_name}
                width={112}
                height={112}
                unoptimized
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover"
              />
            ) : (
              user.full_name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0 w-full text-center">
            <div className="flex items-center justify-center gap-1.5">
              <p className="text-xl font-extrabold tracking-tight text-[#FCFBFB] truncate">{user.full_name}</p>
              {isExecutive && <Crown className="w-4 h-4 text-[#F7D794]" />}
            </div>
            <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#F7D794]/10 text-[#F7D794] border border-[#F7D794]/30">
              {user.division || user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation - Role Menu */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="text-xs font-bold text-[#F7D794]/70 uppercase tracking-wider mb-3 px-3">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 mb-1 ${
                isActive
                  ? 'bg-[#F7D794] text-[#192A56] font-medium shadow-lg shadow-[#192A56]/40'
                  : 'text-[#FCFBFB] hover:bg-[#F7D794]/10 hover:text-[#F7D794]'
              }`}
            >
              <Icon className={`w-5 h-5 ${
                isActive ? 'text-[#192A56]' : 'text-[#F7D794]/70'
              }`} />
              <span className="font-medium text-sm flex-1">{item.name}</span>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          )
        })}

        {/* GENERAL Section */}
        <div className="mt-6 pt-4 border-t border-[#F7D794]/20">
          <div className="text-xs font-bold text-[#F7D794]/70 uppercase tracking-wider mb-3 px-3">
            General
          </div>

          {/* Settings */}
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mb-1 ${
              pathname === '/settings'
                ? 'bg-[#F7D794] text-[#192A56] font-medium shadow-lg'
                : 'text-[#FCFBFB] hover:bg-[#F7D794]/10 hover:text-[#F7D794]'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Settings</span>
          </Link>

          {/* Help */}
          <Link
            href="/help"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mb-1 ${
              pathname === '/help'
                ? 'bg-[#F7D794] text-[#192A56] font-medium shadow-lg'
                : 'text-[#FCFBFB] hover:bg-[#F7D794]/10 hover:text-[#F7D794]'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="font-medium text-sm">Help</span>
          </Link>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#FCFBFB] hover:bg-[#EDA6A3]/20 hover:text-[#EDA6A3] transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </nav>

      {/* Footer Logo */}
      <div className="px-4 py-4 border-t border-[#F7D794]/20 bg-[#192A56]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F7D794]/10 border border-[#F7D794]/30 flex items-center justify-center">
            <Image src="/logo.png" alt="Gateway Logo" width={32} height={32} className="w-8 h-8 object-contain" />
          </div>
          <div className="text-xs">
            <p className="font-medium text-[#FCFBFB]">Gateway System</p>
            <p className="text-[#F7D794]/60">v3.2</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
