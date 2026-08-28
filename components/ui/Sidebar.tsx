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
    <aside className="w-64 bg-gradient-to-br from-slate-50 via-purple-50 to-lavender-50 flex flex-col h-screen fixed left-0 top-0 border-r border-purple-200/40 shadow-lg">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-purple-200/40 bg-white/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
            isExecutive
              ? 'bg-gradient-to-br from-amber-500 to-amber-600'
              : 'bg-gradient-to-br from-purple-500 to-purple-600'
          }`}>
            <span className="text-white font-bold text-sm">RC</span>
          </div>
          <span className="font-bold text-slate-800 tracking-tight">RCMS</span>
        </div>
      </div>

      {/* User Profile */}
      <div className={`px-4 py-5 backdrop-blur-sm border-b border-purple-200/40 ${
        isExecutive ? 'bg-gradient-to-r from-amber-50/50 to-yellow-50/50' : 'bg-white/50'
      }`}>
        <div className={`flex items-center gap-3 p-3 rounded-2xl shadow-sm ${
          isExecutive
            ? 'bg-gradient-to-r from-amber-100/80 to-yellow-100/80 border-2 border-amber-300/60'
            : 'bg-white/80 border border-purple-100/60'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-sm overflow-hidden ${
            isExecutive
              ? 'bg-gradient-to-br from-amber-200 to-amber-300 text-amber-700 font-bold'
              : 'bg-gradient-to-br from-purple-200 to-purple-300 text-purple-700 font-bold'
          }`}>
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.full_name}
                width={48}
                height={48}
                unoptimized
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              user.full_name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-slate-800 truncate">{user.full_name}</p>
              {isExecutive && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-100" />}
            </div>
            <p className={`text-xs font-medium ${isExecutive ? 'text-amber-600' : 'text-purple-600'}`}>
              {user.division}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation - Role Menu */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">
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
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-200/50'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-800'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-xl bg-purple-400/20 blur-md -z-10" />
              )}
              <Icon className={`w-5 h-5 ${
                isActive ? 'text-white' : 'text-slate-400'
              }`} />
              <span className="font-medium text-sm flex-1">{item.name}</span>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          )
        })}

        {/* GENERAL Section */}
        <div className="mt-6 pt-4 border-t border-purple-200/40">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">
            General
          </div>

          {/* Settings */}
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mb-1 ${
              pathname === '/settings'
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-800'
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
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="font-medium text-sm">Help</span>
          </Link>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </nav>

      {/* Footer Logo */}
      <div className="px-4 py-4 border-t border-purple-200/40 bg-white/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/80 shadow-sm flex items-center justify-center">
            <Image src="/logo.png" alt="Gateway Logo" width={32} height={32} className="w-8 h-8 object-contain" />
          </div>
          <div className="text-xs">
            <p className="font-medium text-slate-600">Gateway System</p>
            <p className="text-slate-400">v3.2</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
