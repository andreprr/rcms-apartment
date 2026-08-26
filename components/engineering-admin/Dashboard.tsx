'use client'
import { useState } from 'react'
import { LayoutDashboard } from 'lucide-react'
import type { User } from '@/types/database'
interface Props { profile: User }
export default function Dashboard({ profile }: Props) {
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <h1 className="text-2xl font-bold text-slate-800">Engineering Admin Dashboard</h1>
      <div className="bg-white rounded-2xl border border-purple-100 p-6">
        <p className="text-slate-500">Dashboard Engineering Admin dalam pengembangan...</p>
      </div>
    </div>
  )
}
