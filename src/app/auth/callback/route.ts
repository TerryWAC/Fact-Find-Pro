import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Supabase Auth redirect target. Exchanges the one-time code for a session
 * cookie (email confirmation, magic links, password recovery) and forwards the
 * user on to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const errorDescription = searchParams.get('error_description')

  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  if (errorDescription) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Invalid or missing auth code.')}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('That link has expired or has already been used.')}`,
    )
  }

  return NextResponse.redirect(`${origin}${safeNext}`)
}
