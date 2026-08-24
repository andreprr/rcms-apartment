'use client'

import { logout } from '@/actions/auth'
import { LogOut, User } from 'lucide-react'

export default function Header({ userProfile }: { userProfile: any }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-6 fixed top-0 right-0 left-64 z-10">
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-700">{userProfile?.full_name}</p>
          <p className="text-xs text-slate-500">{userProfile?.role}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <User className="w-5 h-5" />
        </div>
        
        <div className="h-6 w-px bg-slate-200 mx-2"></div>
        
        <button 
          onClick={() => logout()}
          className="text-slate-500 hover:text-red-600 flex items-center gap-2 text-sm font-medium transition-colors"
          title="Keluar"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}