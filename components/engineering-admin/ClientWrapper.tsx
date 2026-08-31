'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/ui/Sidebar'
import type { UserRole } from '@/types/database'

async function safeJson(res: Response) {
  const type = res.headers.get('content-type') || ''
  if (!type.includes('application/json')) return {}
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

interface Ticket {
  id: string
  ticket_number: string
  problem: string
  status: string
  created_at: string
  unit_code: string
  resident_name: string
  current_assignee_id?: string
  assignments?: {
    engineering?: {
      full_name: string
      avatar_url?: string
    }
  }
}

interface Stats {
  total: number
  new: number
  assigned: number
  inProgress: number
  waitingConfirmation: number
  completed: number
}

interface Engineer {
  id: string
  full_name: string
  avatar_url?: string
  assigned: number
  completed: number
}

export default function EngineeringAdminClient({ initialStats, engineers }: { initialStats: Stats; engineers: Engineer[] }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [chartData] = useState([{ day: 'S', value: 0 }, { day: 'M', value: 0 }, { day: 'T', value: 0 }, { day: 'W', value: 0 }, { day: 'T', value: 0 }, { day: 'F', value: 0 }, { day: 'S', value: 0 }])

  useEffect(() => {
    fetch('/api/engineering-admin/tickets').then(r => safeJson(r)).then(d => {
      if (d.tickets) setTickets(d.tickets)
    })
  }, [])

  return (
    <div>
      <p>Engineering Admin Client - {tickets.length} tickets loaded</p>
    </div>
  )
}
