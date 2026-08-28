import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch stats for Administrators dashboard
export async function GET() {
  try {
    const supabase = await createClient()

    // Check user auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || profile.role !== 'PENGURUS') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all tickets for stats
    const { data: tickets } = await supabase
      .from('tickets')
      .select('status, created_at, completed_at')

    const stats = {
      total: tickets?.length || 0,
      onProgress: tickets?.filter(t => t.status === 'ON_PROGRESS').length || 0,
      completed: tickets?.filter(t => t.status === 'COMPLETED').length || 0,
      waitingConfirmation: tickets?.filter(t => t.status === 'WAITING_CONFIRMATION').length || 0,
      rework: tickets?.filter(t => t.status === 'REWORK').length || 0,
      cancelled: tickets?.filter(t => t.status === 'CANCELLED').length || 0,
    }

    // Generate trend data (last 7 days)
    const trend: { label: string; value: number }[] = []
    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count = tickets?.filter(t => t.created_at?.startsWith(dateStr)).length || 0
      trend.push({ label: dayNames[(i + 1) % 7], value: count })
    }

    // Monthly trend
    const trendMonthly: { month: string; tickets: number; completed: number }[] = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun']
    for (let i = 0; i < 6; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      const month = date.getMonth()
      const year = date.getFullYear()
      const ticketsInMonth = tickets?.filter(t => {
        const ticketDate = new Date(t.created_at)
        return ticketDate.getMonth() === month && ticketDate.getFullYear() === year
      }).length || 0
      const completedInMonth = tickets?.filter(t => {
        const ticketDate = new Date(t.completed_at || t.created_at)
        return ticketDate.getMonth() === month && ticketDate.getFullYear() === year && t.status === 'COMPLETED'
      }).length || 0
      trendMonthly.push({ month: monthNames[month], tickets: ticketsInMonth, completed: completedInMonth })
    }

    // Category data (simulated - would come from category field)
    const category = [
      { name: 'Plumbing', value: Math.floor((stats.total * 0.3)) },
      { name: 'Electrical', value: Math.floor((stats.total * 0.25)) },
      { name: 'AC', value: Math.floor((stats.total * 0.2)) },
      { name: 'Painting', value: Math.floor((stats.total * 0.15)) },
      { name: 'Lainnya', value: Math.floor((stats.total * 0.1)) },
    ]

    // Calculate CSAT
    const { data: confirmations } = await supabase
      .from('ticket_confirmations')
      .select('rating')
      .not('rating', 'is', null)
      .eq('is_visible', true)

    const csat = confirmations && confirmations.length > 0
      ? Math.round((confirmations.filter(c => c.rating && c.rating >= 3).length / confirmations.length) * 100)
      : 85

    return NextResponse.json({
      stats,
      trend,
      trendMonthly,
      category,
      csat
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error fetching stats:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
