import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// PATCH - Update rating visibility
export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/admin/ratings/[id]'>
) {
  try {
    const supabase = await createClient()
    const { id: ratingId } = await ctx.params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { is_visible } = body

    const { data: updated, error } = await supabase
      .from('ticket_confirmations')
      .update({ is_visible })
      .eq('id', ratingId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    revalidatePath('/admin/rating-moderation')

    return NextResponse.json({ rating: updated, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
