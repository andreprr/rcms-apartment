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
      .select('ticket_id')
      .eq('engineering_user_id', profile.id)
      .eq('is_current', true)

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
        unit_code,
        resident_name,
        phone_number,
        current_assignee_id,
        assigned_technician_ids,
        priority,
        scheduled_at,
        initial_inspection_notes,
        inspection_completed_at,
        inspection_approved_at,
        investigation_report,
        investigation_photo_paths,
        required_materials,
        investigation_completed_at,
        reschedule_reason,
        reschedule_photo_paths,
        before_photo_paths,
        process_photo_paths,
        after_photo_paths,
        finish_notes,
        rework_reason,
        rework_count,
        is_rework
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
