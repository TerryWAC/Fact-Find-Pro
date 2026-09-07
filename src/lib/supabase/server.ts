import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { requireSupabaseEnv } from '@/lib/env'
import type { Database } from './database.types'

/**
 * Server Supabase client bound to the request cookies.
 * Uses the anon key, so every query is still enforced by RLS.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const { url, anonKey } = requireSupabaseEnv()

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Called from a Server Component; the middleware refreshes the
            // session cookies instead, so this is safe to ignore.
          }
        },
      },
    },
  )
}
