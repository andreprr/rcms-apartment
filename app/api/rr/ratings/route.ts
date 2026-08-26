import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch ratings with ticket info
    const { data: ratings, error } = await supabase
      .from('ticket_confirmations')
      .select(`
        id,
        ticket_id,
        rating,
        comment,
        is_visible,
        confirmed_at,
        ticket:tickets(
          id,
          ticket_number,
          unit_code,
          resident_name
        )
      `)
      .eq('is_visible', true)
      .order('confirmed_at', { ascending: false })

    if (error) throw error

    // Transform data
    const transformedRatings = (ratings || []).map(r => ({
      id: r.id,
      ticket_id: r.ticket_id,
      rating: r.rating,
      comment: r.comment,
      is_visible: r.is_visible,
      confirmed_at: r.confirmed_at,
      ticket_number: (r.ticket as any)?.ticket_number,
      unit_code: (r.ticket as any)?.unit_code,
      resident_name: (r.ticket as any)?.resident_name,
    }))

    return NextResponse.json({ ratings: transformedRatings })
  } catch (error: any) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch ratings' }, { status: 500 })
  }
}
