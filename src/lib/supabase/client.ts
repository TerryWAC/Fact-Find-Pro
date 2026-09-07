'use client'

import { createBrowserClient } from '@supabase/ssr'
import { requireSupabaseEnv } from '@/lib/env'
import type { Database } from './database.types'

/**
 * Browser Supabase client. Uses the anon key and honours RLS.
 *
 * Nothing in the app needs this today — auth is read and written server-side,
 * which is what lets the deployment work without any NEXT_PUBLIC_ variable.
 * Reach for it only for genuinely client-side work such as realtime
 * subscriptions, and note that it DOES require NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY to be present at build time.
 */
export function createClient() {
  const { url, anonKey } = requireSupabaseEnv()

  return createBrowserClient<Database>(url, anonKey)
}
