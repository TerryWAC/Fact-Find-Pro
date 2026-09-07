import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './database.types'
import { isSupabaseConfigured, requireSupabaseEnv, supabaseConfigMessage } from '@/lib/env'

/** Routes that never require a session. */
const PUBLIC_PREFIXES = ['/login', '/signup', '/forgot-password', '/reset-password', '/pending', '/f/', '/auth/']

const ADMIN_PREFIX = '/admin'

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true
  return PUBLIC_PREFIXES.some((prefix) =>
    prefix.endsWith('/') ? pathname.startsWith(prefix) : pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/**
 * Refreshes the Supabase session cookie and enforces route-level access:
 *  - unauthenticated users are pushed to /login
 *  - authenticated but not-yet-approved users are pushed to /pending
 *  - non-admins are kept out of /admin
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Without Supabase credentials there is no session to read. Let the request
  // through so the app can render a page explaining the misconfiguration,
  // rather than failing every route with an opaque 500.
  if (!isSupabaseConfigured()) {
    console.error(`[factfind] ${supabaseConfigMessage()}`)
    return response
  }

  const { url, anonKey } = requireSupabaseEnv()

  const supabase = createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // IMPORTANT: getUser() revalidates the token with Supabase Auth. Do not
  // replace it with getSession(), which trusts the cookie without checking.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user) {
    if (isPublicPath(pathname)) return response

    const redirect = request.nextUrl.clone()
    redirect.pathname = '/login'
    redirect.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirect)
  }

  // Signed in — resolve the profile to gate on status and role.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle()

  const status = profile?.status ?? 'pending'
  const isApproved = status === 'approved'
  const isAdmin = profile?.role === 'admin' && isApproved

  // Public FactFind pages stay public even for signed-in users.
  if (pathname.startsWith('/f/') || pathname.startsWith('/auth/')) return response

  if (!isApproved) {
    if (pathname === '/pending' || pathname === '/reset-password') return response
    const redirect = request.nextUrl.clone()
    redirect.pathname = '/pending'
    redirect.search = ''
    return NextResponse.redirect(redirect)
  }

  // First run: send approved users through setup until they finish or dismiss it.
  const needsSetup = !profile?.onboarding_completed_at
  if (needsSetup && pathname !== '/onboarding') {
    const redirect = request.nextUrl.clone()
    redirect.pathname = '/onboarding'
    redirect.search = ''
    return NextResponse.redirect(redirect)
  }

  // Approved users have no business on the auth screens.
  if (['/login', '/signup', '/forgot-password', '/pending', '/'].includes(pathname)) {
    const redirect = request.nextUrl.clone()
    redirect.pathname = needsSetup ? '/onboarding' : isAdmin ? '/admin' : '/dashboard'
    redirect.search = ''
    return NextResponse.redirect(redirect)
  }

  // Setup is done — don't let the wizard reappear.
  if (!needsSetup && pathname === '/onboarding' && !request.nextUrl.searchParams.has('step')) {
    const redirect = request.nextUrl.clone()
    redirect.pathname = isAdmin ? '/admin' : '/dashboard'
    redirect.search = ''
    return NextResponse.redirect(redirect)
  }

  if (pathname.startsWith(ADMIN_PREFIX) && !isAdmin) {
    const redirect = request.nextUrl.clone()
    redirect.pathname = '/dashboard'
    redirect.search = ''
    return NextResponse.redirect(redirect)
  }

  return response
}
