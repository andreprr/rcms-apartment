import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch daily logs for a ticket
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('ticket_id')

    if (!ticketId) {
      return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 })
    }

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

    if (!profile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch daily logs
    const { data: logs, error } = await supabase
      .from('ticket_daily_logs')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('day_number', { ascending: true })

    if (error) throw error

    return NextResponse.json({ logs: logs || [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error fetching daily logs:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
