import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// PATCH - Update ticket status/cancellation
export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/admin/tickets/[id]'>
) {
  try {
    const supabase = await createClient()
    const { id: ticketId } = await ctx.params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status, cancellation_reason, is_archived } = body

    const updates: Record<string, any> = {}

    if (status) {
      updates.status = status
      if (status === 'CANCELLED') {
        updates.cancelled_at = new Date().toISOString()
        updates.cancelled_by = profile.id
        if (cancellation_reason) {
          updates.cancellation_reason = cancellation_reason
        }
      }
    }

    if (is_archived !== undefined) {
      updates.is_archived = is_archived
      if (is_archived) {
        updates.archived_at = new Date().toISOString()
        updates.archived_by = profile.id
      }
    }

    const { data: updated, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Log history
    await supabase.from('ticket_history').insert({
      ticket_id: ticketId,
      user_id: profile.id,
      action: status === 'CANCELLED' ? 'CANCELLED' : 'ARCHIVED',
      description: status === 'CANCELLED'
        ? `Tiket dibatalkan oleh Admin: ${cancellation_reason || 'Tidak ada alasan'}`
        : 'Tiket diarsipkan oleh Admin',
    })

    revalidatePath('/admin/tickets')
    revalidatePath('/tickets')

    return NextResponse.json({ ticket: updated, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
