import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch all engineers
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

    // Get all engineers
    const { data: engineers, error } = await supabase
      .from('users')
      .select('id, full_name, email, is_active')
      .eq('role', 'ENGINEERING')
      .order('full_name')

    if (error) throw error

    return NextResponse.json({ engineers })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error fetching engineers:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
