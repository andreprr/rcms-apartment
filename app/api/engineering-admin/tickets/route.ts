import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch tickets for engineering admin
export async function GET() {
  try {
    const supabase = await createClient()

    // Check user auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || (profile.role !== 'ENGINEERING_ADMIN' && profile.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get tickets with assignments
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        problem,
        status,
        created_at,
        submitted_at,
        unit_code,
        resident_name,
        current_assignee_id
      `)
      .in('status', ['NEW', 'ASSIGNED', 'ON_PROGRESS', 'WAITING_CONFIRMATION'])
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ tickets })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error fetching engineering tickets:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
