import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const VALID_ROLES = ['ADMIN', 'RR', 'ENGINEERING_ADMIN', 'ENGINEERING', 'PENGURUS']

// Service Role client - bypasses RLS & has auth.admin privileges
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST - Create new user (Supabase Auth + public.users insert)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check ADMIN role for requester
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, username, email, password, division, role } = body

    if (!full_name || !username || !email || !password || !division || !role) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
    }

    const service = getServiceClient()

    // Guard against duplicate email/username before touching Auth
    const { data: dup } = await service
      .from('users')
      .select('email, username')
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle()

    if (dup) {
      return NextResponse.json(
        { error: 'Email atau Username sudah terdaftar (Duplicate Key)' },
        { status: 400 }
      )
    }

    // Create auth user with Service Role privileges
    const { data: authResult, error: authError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      // Handle duplicate email error from Supabase directly
      if (authError.message && /already? registered|already been registered|duplicate/i.test(authError.message)) {
        return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const authUserId = authResult.user!.id

    // Insert profile into public.users (service client bypasses RLS)
    const { data: newUser, error: userError } = await service
      .from('users')
      .insert({
        auth_user_id: authUserId,
        full_name,
        username,
        email,
        division,
        role,
        is_active: true,
      })
      .select()
      .single()

    if (userError) {
      // Cleanup auth user if profile insert fails (avoid orphan account)
      await service.auth.admin.deleteUser(authUserId)
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    return NextResponse.json({ user: newUser, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
