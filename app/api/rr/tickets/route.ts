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
        status,
        created_at,
        ticket_date,
        units(unit_code, floor, unit_number),
        complaint_categories(name)
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
      inProgress: tickets?.filter(t => t.status === 'ON_PROGRESS').length || 0,
      completed: tickets?.filter(t => t.status === 'COMPLETED').length || 0,
    }

    return NextResponse.json({ tickets, stats })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error fetching RR tickets:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
