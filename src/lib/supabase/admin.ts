import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { isSupabaseConfigured, requireSupabaseEnv, supabaseServiceKey } from '@/lib/env'

/**
 * Service-role Supabase client. BYPASSES RLS — never expose it to the browser
 * and never build a query from unvalidated user input with it.
 *
 * Used for admin-only operations that need to reach past RLS, such as reading
 * the admin notification recipient list and writing the email delivery log.
 */
export function createAdminClient() {
  const serviceKey = supabaseServiceKey()

  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your environment to enable admin operations.',
    )
  }

  const { url } = requireSupabaseEnv()

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** True when the service role key is configured. */
export function hasAdminClient(): boolean {
  return Boolean(supabaseServiceKey()) && isSupabaseConfigured()
}
