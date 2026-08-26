import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // 1. Already logged in → /login => redirect to role dashboard
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 2. Not logged in → protected routes => redirect to /login
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname === '/'
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. Logged in → / or /dashboard => role-based redirect (done ONCE in middleware)
  if (user && (pathname === '/' || pathname === '/dashboard')) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (profile) {
      switch (profile.role) {
        case 'ADMIN':
          return NextResponse.redirect(new URL('/admin', request.url))
        case 'ENGINEERING_ADMIN':
          return NextResponse.redirect(new URL('/engineering-admin/dashboard', request.url))
        case 'ENGINEERING':
          return NextResponse.redirect(new URL('/engineering/dashboard', request.url))
        case 'PENGURUS':
          return NextResponse.redirect(new URL('/pengurus/dashboard', request.url))
        case 'RR':
          return NextResponse.redirect(new URL('/rr/dashboard', request.url))
        default:
          return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  // 4. Protect /admin → ADMIN only
  if (pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (profile?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // 5. Protect role-specific routes → role check
  const roleRouteMap: Record<string, string[]> = {
    '/rr': ['RR', 'ADMIN'],
    '/engineering-admin': ['ENGINEERING_ADMIN', 'ADMIN'],
    '/engineering': ['ENGINEERING', 'ADMIN'],
    '/pengurus': ['PENGURUS', 'ADMIN'],
  }

  for (const [route, allowedRoles] of Object.entries(roleRouteMap)) {
    if (pathname.startsWith(route) && user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single()

      if (profile && !allowedRoles.includes(profile.role)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      break
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
