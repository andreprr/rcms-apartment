'use client'

import { logout } from '@/actions/auth'
import { LogOut, User } from 'lucide-react'

export default function Header({ userProfile }: { userProfile: any }) {
  return (
    <header className="h-16 bg-[#192A56] border-b border-[#F7D794]/20 flex items-center justify-end px-6 fixed top-0 right-0 left-64 z-10">
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xl font-extrabold tracking-tight text-[#FCFBFB]">{userProfile?.full_name}</p>
          <span className="mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#F7D794]/10 text-[#F7D794] border border-[#F7D794]/30">
            {userProfile?.role}
          </span>
        </div>
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#F7D794] flex items-center justify-center text-[#192A56] overflow-hidden border-2 border-[#F7D794]/40">
          <User className="w-5 h-5" />
        </div>
        
        <div className="h-6 w-px bg-[#F7D794]/20 mx-2"></div>
        
        <button 
          onClick={() => logout()}
          className="text-[#FCFBFB] hover:text-[#EDA6A3] flex items-center gap-2 text-sm font-medium transition-colors"
          title="Keluar"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}