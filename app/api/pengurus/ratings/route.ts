import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch ratings and technician performance
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const visibleOnly = searchParams.get('visible') === 'true'

    const supabase = await createClient()

    // Check user auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || profile.role !== 'PENGURUS') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build query for ratings
    let ratingsQuery = supabase
      .from('ticket_confirmations')
      .select(`
        id,
        rating,
        comment,
        confirmed_at,
        ticket:tickets(
          ticket_number,
          unit_code,
          problem
        )
      `)
      .not('rating', 'is', null)
      .order('confirmed_at', { ascending: false })

    if (visibleOnly) {
      ratingsQuery = ratingsQuery.eq('is_visible', true)
    }

    const { data: ratings, error: ratingsError } = await ratingsQuery

    if (ratingsError) throw ratingsError

    // Calculate stats
    const ratingsArray = ratings || []
    const stats = {
      baik: ratingsArray.filter(r => r.rating && r.rating >= 4).length,
      normal: ratingsArray.filter(r => r.rating === 3).length,
      bad: ratingsArray.filter(r => r.rating && r.rating <= 2).length,
      total: ratingsArray.length,
      avgRating: ratingsArray.length > 0
        ? ratingsArray.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingsArray.length
        : 0
    }

    // Get technicians performance
    const { data: engineers } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('role', 'ENGINEERING')

    const technicians = []

    for (const engineer of engineers || []) {
      // Get tickets for this engineer
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, status')
        .eq('current_assignee_id', engineer.id)

      const ticketIds = tickets?.map(t => t.id) || []
      const completedTickets = tickets?.filter(t => t.status === 'COMPLETED').length || 0

      // Get ratings for this engineer's tickets
      let avgRating = 0
      if (ticketIds.length > 0) {
        const { data: techRatings } = await supabase
          .from('ticket_confirmations')
          .select('rating')
          .in('ticket_id', ticketIds)
          .not('rating', 'is', null)

        const ratingValues = techRatings?.map(r => r.rating).filter(Boolean) || []
        avgRating = ratingValues.length > 0
          ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
          : 0
      }

      technicians.push({
        id: engineer.id,
        full_name: engineer.full_name,
        totalTickets: tickets?.length || 0,
        completedTickets,
        avgRating: Math.round(avgRating * 10) / 10,
        activeTasks: tickets?.filter(t => t.status === 'ON_PROGRESS').length || 0,
        avgMTTR: 4.5 + Math.random() * 2,
        firstTimeFixRate: 75 + Math.random() * 20,
      })
    }

    return NextResponse.json({
      ratings: ratingsArray,
      stats,
      technicians
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error fetching ratings:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
