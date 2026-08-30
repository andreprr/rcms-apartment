import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { assignTicket, updateTicketStatus, startProgress, sendClientConfirmation, approveRework } from '@/actions/tickets'

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
        current_assignee_id,
        assigned_technician_ids,
        priority,
        scheduled_at,
        initial_inspection_notes,
        inspection_completed_at,
        inspection_approved_at,
        investigation_report,
        investigation_photo_paths,
        reschedule_photo_paths,
        before_photo_paths,
        process_photo_paths,
        after_photo_paths,
        finish_notes,
        rework_reason,
        rework_count,
        is_rework,
        client_feedback,
        required_materials,
        investigation_completed_at,
        reschedule_reason
      `)
      .or(
        `status.in.(${[
          'UNASSIGNED',
          'ASSIGNED',
          'INVESTIGATION',
          'RESCHEDULED',
          'NEEDS_ANALYSIS',
          'ON_PROGRESS',
          'REVIEW_FINISH',
          'WAITING_CLIENT_CONFIRMATION',
          'REWORK_REQ',
          'FINISHED',
          'CANCELLED',
        ].join(',')}),status.is.null`
      )
      .order('created_at', { ascending: false })

    if (error) throw error

    // Muat lampiran foto per tiket (untuk review Before/After di modal).
    if (tickets && tickets.length > 0) {
      const ids = tickets.map((t: any) => t.id)
      const { data: attachments, error: attErr } = await supabase
        .from('ticket_attachments')
        .select('id, ticket_id, storage_path, photo_type, file_name, created_at')
        .order('created_at', { ascending: true })

      if (!attErr && attachments) {
        const byTicket = new Map<string, any[]>()
        for (const a of attachments) {
          if (!byTicket.has(a.ticket_id)) byTicket.set(a.ticket_id, [])
          const url = supabase.storage.from('ticket-attachments').getPublicUrl(a.storage_path).data.publicUrl
          byTicket.get(a.ticket_id)!.push({
            id: a.id,
            storage_path: url,
            photo_type: a.photo_type,
            file_name: a.file_name,
            created_at: a.created_at,
          })
        }
        for (const t of tickets) {
          ;(t as any).photos = byTicket.get(t.id) || []
        }
      }

      // Ubah path kolom terkategori menjadi public URL untuk review modal.
      const toPublicUrls = (paths: any) =>
        (paths || []).map((p: string) => supabase.storage.from('ticket-attachments').getPublicUrl(p).data.publicUrl)

      for (const t of tickets) {
        ;(t as any).before_photo_paths = toPublicUrls(t.before_photo_paths)
        ;(t as any).process_photo_paths = toPublicUrls(t.process_photo_paths)
        ;(t as any).after_photo_paths = toPublicUrls(t.after_photo_paths)
        ;(t as any).investigation_photo_paths = toPublicUrls(t.investigation_photo_paths)
        ;(t as any).reschedule_photo_paths = toPublicUrls(t.reschedule_photo_paths)
      }
    }

    // Muat detail log harian per tiket (untuk konteks review di modal).
    if (tickets && tickets.length > 0) {
      const ids = tickets.map((t: any) => t.id)
      const { data: logs, error: logErr } = await supabase
        .from('ticket_daily_logs')
        .select('id, ticket_id, day_number, work_description, action_type, created_at')
        .in('ticket_id', ids)
        .order('day_number', { ascending: true })

      if (!logErr) {
        const byTicket = new Map<string, any[]>()
        for (const log of logs || []) {
          if (!byTicket.has(log.ticket_id)) byTicket.set(log.ticket_id, [])
          byTicket.get(log.ticket_id)!.push(log)
        }
        for (const t of tickets) {
          ;(t as any).daily_logs = byTicket.get(t.id) || []
        }
      }
    }

    return NextResponse.json({ tickets })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error fetching engineering tickets:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH - Assignment / status transition (routed through actions/tickets.ts)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const fd = new FormData()

    // Assignment: ticket_id + engineering_id(s) (multi 1..5) -> ASSIGNED
    if (body.ticket_id && !body.status) {
      const ids = Array.isArray(body.engineering_ids)
        ? body.engineering_ids
        : body.engineering_id
          ? [body.engineering_id]
          : []
      fd.set('ticket_id', body.ticket_id)
      ids.forEach((id: string) => fd.append('engineering_id', id))
      const result = await assignTicket(fd)
      if (result?.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    // Status transition: ticket_id + status
    if (body.ticket_id && body.status) {
      fd.set('ticket_id', body.ticket_id)
      if (body.status === 'ON_PROGRESS') {
        const result = await startProgress(body.ticket_id)
        if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 })
        return NextResponse.json({ success: true })
      }

      // Setujui Rework dari Client: REWORK_REQ -> INVESTIGATION (kembali ke teknisi)
      if (body.status === 'INVESTIGATION') {
        const result = await approveRework(body.ticket_id)
        if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 })
        return NextResponse.json({ success: true })
      }

      // Kirim Konfirmasi ke Client: REVIEW_FINISH -> WAITING_CLIENT_CONFIRMATION
      if (body.status === 'WAITING_CLIENT_CONFIRMATION') {
        const result = await sendClientConfirmation(body.ticket_id)
        if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 })
        return NextResponse.json({ success: true, waLink: result.waLink })
      }

      fd.set('status', body.status)
      if (body.priority) fd.set('priority', body.priority)
      const result = await updateTicketStatus(fd)
      if (result?.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error patching engineering ticket:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
