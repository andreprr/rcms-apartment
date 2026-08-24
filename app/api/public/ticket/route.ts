import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch public ticket info (NO AUTH REQUIRED)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const ticketNumber = request.nextUrl.searchParams.get('number')

    if (!ticketNumber) {
      return NextResponse.json({ error: 'Nomor tiket diperlukan.' }, { status: 400 })
    }

    // Get ticket (public data only)
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        problem,
        description,
        status,
        current_stage,
        created_at,
        submitted_at,
        units(unit_code, floor),
        complaint_categories(name)
      `)
      .eq('ticket_number', ticketNumber)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Tiket tidak ditemukan.' }, { status: 404 })
    }

    // Get history (only public actions)
    const { data: history } = await supabase
      .from('ticket_history')
      .select(`
        action,
        description,
        created_at,
        users(full_name)
      `)
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true })

    // Get AFTER attachments only
    const { data: attachments } = await supabase
      .from('ticket_attachments')
      .select('id, file_url, file_name, attachment_type')
      .eq('ticket_id', ticket.id)
      .eq('attachment_type', 'AFTER')

    return NextResponse.json({
      ticket,
      history: history || [],
      attachments: attachments || []
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error fetching public ticket:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
