import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateTicketPdfBase64 } from '@/lib/pdf-generator'

// GET - Generate PDF for a ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const ticketId = resolvedParams.id
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'generate' // 'generate' only

    const supabase = await createClient()

    // Check user auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch ticket with creator info
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        users:created_by(full_name)
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get domain from request headers or environment
    const domain = request.headers.get('x-domain') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Generate PDF
    const pdfBase64 = await generateTicketPdfBase64(
      {
        ticket_number: ticket.ticket_number,
        unit_code: ticket.unit_code,
        resident_name: ticket.resident_name,
        problem: ticket.problem,
        description: ticket.description,
        priority: ticket.priority,
        scheduled_at: ticket.scheduled_at,
        created_at: ticket.created_at,
        created_by_name: (ticket.users as any)?.full_name,
      },
      { domain }
    )

    // Only support PDF generation now. WhatsApp delivery is handled
    // client-side via a wa.me deeplink (see getWhatsAppShareUrl).
    if (action !== 'generate') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Return the PDF
    return new NextResponse(Buffer.from(pdfBase64, 'base64'), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Tiket_${ticket.ticket_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
