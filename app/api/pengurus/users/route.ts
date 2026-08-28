import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch all users for Administrators
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
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || profile.role !== 'PENGURUS') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, full_name, division, role, is_active')
      .order('role', { ascending: true })
      .order('full_name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error fetching users:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
