import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch tickets assigned to current engineer
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

    // Get tickets assigned to this engineer
    const { data: assignments, error: assignError } = await supabase
      .from('ticket_assignments')
      .select('ticket_id, status')
      .eq('user_id', profile.id)
      .eq('status', 'ACTIVE')

    if (assignError) throw assignError

    const ticketIds = assignments?.map(a => a.ticket_id) || []

    if (ticketIds.length === 0) {
      return NextResponse.json({ tickets: [] })
    }

    // Get ticket details
    const { data: tickets, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        problem,
        description,
        status,
        current_stage,
        created_at,
        units(unit_code, floor),
        complaint_categories(name),
        ticket_assignments(id, status)
      `)
      .in('id', ticketIds)
      .order('created_at', { ascending: false })

    if (ticketError) throw ticketError

    return NextResponse.json({ tickets })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error fetching my tickets:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
