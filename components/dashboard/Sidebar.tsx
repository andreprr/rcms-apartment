'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Ticket, FileBarChart, Building2, Shield, UserCircle, Wrench, HardHat } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()

  const menus = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tiket Komplain', href: '/tickets', icon: Ticket },
    { name: 'Dashboard RR', href: '/rr/dashboard', icon: UserCircle },
    { name: 'Engineering Admin', href: '/engineering-admin/dashboard', icon: Wrench },
    { name: 'My Tickets (Engineering)', href: '/engineering/dashboard', icon: HardHat },
    { name: 'Admin Center', href: '/admin', icon: Shield },
    { name: 'Laporan', href: '/reports', icon: FileBarChart },
  ]

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 bg-slate-950 text-white gap-3 border-b border-slate-800">
        <Building2 className="w-6 h-6 text-blue-500" />
        <span className="font-bold text-lg tracking-wide">RCMS</span>
      </div>
      
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">
          Menu Utama
        </div>
        {menus.map((menu) => {
          const isActive = pathname === menu.href || pathname.startsWith(menu.href + '/')
          const Icon = menu.icon
          return (
            <Link 
              key={menu.name} 
              href={menu.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white font-medium' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {menu.name}
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800 text-xs text-center text-slate-500">
        Versi 1.2
      </div>
    </aside>
  )
}