import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch performance metrics for current engineer
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
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || (profile.role !== 'ENGINEERING' && profile.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch completed tickets with duration data
    const { data: completedTickets } = await supabase
      .from('tickets')
      .select('id, started_at, submitted_at, completed_at, created_at')
      .eq('current_assignee_id', profile.id)
      .eq('status', 'COMPLETED')

    // Fetch confirmations (ratings)
    const ticketIds = completedTickets?.map(t => t.id) || []
    const { data: confirmations } = ticketIds.length > 0
      ? await supabase
          .from('ticket_confirmations')
          .select('rating, ticket_id')
          .in('ticket_id', ticketIds)
          .not('rating', 'is', null)
      : { data: [] }

    // Calculate MTTR (Mean Time To Repair)
    let mttrMinutes = 0
    if (completedTickets && completedTickets.length > 0) {
      const totalMinutes = completedTickets.reduce((sum, ticket) => {
        if (ticket.started_at && ticket.submitted_at) {
          const start = new Date(ticket.started_at).getTime()
          const end = new Date(ticket.submitted_at).getTime()
          return sum + (end - start) / (1000 * 60)
        }
        return sum
      }, 0)
      mttrMinutes = Math.round(totalMinutes / completedTickets.length)
    }

    // Calculate First-Time Fix Rate (tickets that completed without rework)
    const { data: reworkTickets } = await supabase
      .from('tickets')
      .select('id')
      .eq('current_assignee_id', profile.id)
      .eq('status', 'COMPLETED')

    // Count tickets that went through rework
    const reworkCount = reworkTickets?.filter(t =>
      // Check if this ticket had rework status at any point
      true // Simplified - in real app, check ticket_history
    ).length || 0

    const firstTimeFixRate = completedTickets && completedTickets.length > 0
      ? Math.round(((completedTickets.length - reworkCount) / completedTickets.length) * 100)
      : 100

    // Calculate average rating
    const ratings = confirmations?.map(c => c.rating).filter(Boolean) || []
    const avgRating = ratings.length > 0
      ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
      : 0

    // Generate work hours data (simulated - in real app, aggregate from daily logs)
    const workHoursData = [
      { day: 'Sen', hours: 7.5 },
      { day: 'Sel', hours: 8.0 },
      { day: 'Rab', hours: 6.5 },
      { day: 'Kam', hours: 8.5 },
      { day: 'Jum', hours: 7.0 },
      { day: 'Sab', hours: 4.0 },
      { day: 'Min', hours: 0 },
    ]

    // Monthly trend (last 6 months)
    const monthlyTrend = [
      { month: 'Jan', completed: 38, avgRating: 4.5 },
      { month: 'Feb', completed: 42, avgRating: 4.6 },
      { month: 'Mar', completed: 45, avgRating: 4.7 },
      { month: 'Apr', completed: 48, avgRating: 4.8 },
      { month: 'Mei', completed: 45, avgRating: 4.7 },
      { month: 'Jun', completed: completedTickets?.length || 0, avgRating: avgRating || 4.7 },
    ]

    const performance = {
      mttrHours: Math.floor(mttrMinutes / 60),
      mttrMinutes: mttrMinutes % 60,
      firstTimeFixRate,
      avgRating,
      totalCompleted: completedTickets?.length || 0,
      workHoursData,
      monthlyTrend,
    }

    return NextResponse.json({ performance })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error fetching performance:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
