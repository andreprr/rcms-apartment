import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || (profile.role !== 'ENGINEERING_ADMIN' && profile.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: history, error } = await supabase
      .from('ticket_history')
      .select(`
        id,
        ticket_id,
        action,
        description,
        old_value,
        new_value,
        created_at,
        tickets!inner (
          id,
          ticket_number,
          status
        ),
        users!user_id (
          id,
          full_name,
          division
        )
      `)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    const entries = history?.map(h => ({
      id: h.id,
      ticket_id: h.ticket_id,
      ticket_number: (h.tickets as any)?.ticket_number || '',
      ticket_status: (h.tickets as any)?.status || '',
      action: h.action,
      description: h.description,
      old_value: h.old_value,
      new_value: h.new_value,
      user_name: (h.users as any)?.full_name || '',
      user_division: (h.users as any)?.division || '',
      created_at: h.created_at,
    })) || []

    return NextResponse.json({ entries })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error fetching history:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
