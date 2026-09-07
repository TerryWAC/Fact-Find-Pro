'use client'

import { createBrowserClient } from '@supabase/ssr'
import { requireSupabaseEnv } from '@/lib/env'
import type { Database } from './database.types'

/** Browser Supabase client. Uses the anon key and honours RLS. */
export function createClient() {
  const { url, anonKey } = requireSupabaseEnv()

  return createBrowserClient<Database>(url, anonKey)
}
