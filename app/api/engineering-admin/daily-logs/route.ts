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

    const { data: logs, error } = await supabase
      .from('ticket_daily_logs')
      .select(`
        id,
        ticket_id,
        day_number,
        work_description,
        action_type,
        duration_minutes,
        created_at,
        tickets!inner (
          id,
          ticket_number,
          problem,
          status,
          submitted_at
        ),
        users!engineering_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    // Fetch attachments for all logs
    const logIds = logs?.map(l => l.id) || []
    const { data: attachments } = await supabase
      .from('ticket_attachments')
      .select('id, daily_log_id, storage_path, photo_type, file_name')
      .in('daily_log_id', logIds)

    const logsWithAttachments = logs?.map(log => ({
      id: log.id,
      ticket_id: log.ticket_id,
      ticket_number: (log.tickets as any)?.ticket_number || '',
      problem: (log.tickets as any)?.problem || '',
      status: (log.tickets as any)?.status || '',
      submitted_at: (log.tickets as any)?.submitted_at || null,
      engineering_name: (log.users as any)?.full_name || '',
      day_number: log.day_number,
      work_description: log.work_description,
      action_type: log.action_type,
      duration_minutes: log.duration_minutes,
      created_at: log.created_at,
      attachments: attachments?.filter(a => a.daily_log_id === log.id) || [],
    })) || []

    return NextResponse.json({ logs: logsWithAttachments })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error fetching daily logs:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
