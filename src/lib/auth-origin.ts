import 'server-only'

import { headers } from 'next/headers'
import { getBaseUrl } from '@/lib/utils'

/**
 * The origin the current request was made to, e.g. https://www.factfindpro.com.
 *
 * Auth email links (confirmation, password reset) must come back to the same
 * host the user started on: the PKCE code verifier lives in a cookie on that
 * host, so a link that lands on a different domain cannot be exchanged for a
 * session and reads as "expired". Using the request host keeps every attached
 * domain working; NEXT_PUBLIC_APP_URL remains the fallback for jobs that run
 * without a request (emails sent from background work).
 *
 * Supabase still only follows redirect URLs on its allow list, so a forged
 * Host header cannot send anyone somewhere unexpected.
 */
export async function requestOrigin(): Promise<string> {
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host')?.split(',')[0]?.trim() || h.get('host')
    if (host && /^[a-z0-9.-]+(:\d+)?$/i.test(host)) {
      const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim() || (host.startsWith('localhost') ? 'http' : 'https')
      return `${proto}://${host}`
    }
  } catch {
    // Called outside a request scope — fall through to the configured URL.
  }
  return getBaseUrl()
}

/** Absolute URL of the auth callback on the requesting host, optionally with a `next` path. */
export async function authCallbackUrl(next?: string): Promise<string> {
  const origin = await requestOrigin()
  return `${origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`
}
