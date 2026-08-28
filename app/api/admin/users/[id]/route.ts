import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

const VALID_ROLES = ['ADMIN', 'RR', 'ENGINEERING_ADMIN', 'ENGINEERING', 'PENGURUS']

// PATCH - Update user profile (role, division, is_active)
export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/admin/users/[id]'>
) {
  try {
    const supabase = await createClient()
    const { id: userId } = await ctx.params

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
    const { role, division, is_active } = body

    const updates: Record<string, any> = {}

    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      updates.role = role
    }

    if (division !== undefined) {
      if (!division || typeof division !== 'string' || !division.trim()) {
        return NextResponse.json({ error: 'Division is required' }, { status: 400 })
      }
      updates.division = division.trim()
    }

    if (is_active !== undefined) {
      updates.is_active = Boolean(is_active)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { data: updated, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    revalidatePath('/admin/users')

    return NextResponse.json({ user: updated, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
