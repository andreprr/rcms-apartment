import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch RR tickets with optional filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check user auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check RR or Admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || (profile.role !== 'RR' && profile.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        problem,
        description,
        status,
        priority,
        scheduled_at,
        created_at,
        ticket_date,
        unit_code,
        resident_name,
        phone_number,
        current_stage,
        current_assignee_id,
        assignments:ticket_assignments(
          engineering:engineering_user_id(
            full_name,
            avatar_url
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (startDate) {
      query = query.gte('ticket_date', startDate)
    }

    if (endDate) {
      query = query.lte('ticket_date', endDate)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: tickets, error } = await query

    if (error) throw error

    // Calculate stats
    const stats = {
      total: tickets?.length || 0,
      new: tickets?.filter(t => t.status === 'NEW').length || 0,
      inProgress: tickets?.filter(t => ['ASSIGNED', 'WAITING_ANALYSIS', 'ON_PROGRESS'].includes(t.status)).length || 0,
      completed: tickets?.filter(t => t.status === 'COMPLETED').length || 0,
    }

    return NextResponse.json({ tickets, stats })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error fetching RR tickets:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
