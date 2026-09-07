/**
 * Supabase environment resolution.
 *
 * IMPORTANT: `NEXT_PUBLIC_*` variables are inlined at BUILD time, not read at
 * runtime. Adding them to a hosting provider without triggering a new build
 * leaves them `undefined` in the deployed bundle — which is why a missing key
 * shows up as a crash the moment something touches Supabase, rather than at
 * boot.
 */

export const SUPABASE_ENV_VARS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const

/** Names of the Supabase variables that are missing. Empty when configured. */
export function missingSupabaseEnv(): string[] {
  const missing: string[] = []
  // Referenced statically so Next.js can inline them at build time.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return missing
}

export function isSupabaseConfigured(): boolean {
  return missingSupabaseEnv().length === 0
}

/** Human-readable, safe-to-display explanation of what to fix. */
export function supabaseConfigMessage(): string {
  const missing = missingSupabaseEnv()
  if (missing.length === 0) return ''

  return `FactFind Pro is not connected to Supabase: ${missing.join(' and ')} ${
    missing.length === 1 ? 'is' : 'are'
  } missing. Add ${missing.length === 1 ? 'it' : 'them'} to your environment and redeploy — these values are baked in when the app is built, so setting them without a fresh build has no effect.`
}

export class SupabaseConfigError extends Error {
  constructor() {
    super(supabaseConfigMessage() || 'Supabase is not configured.')
    this.name = 'SupabaseConfigError'
  }
}

/** Returns the Supabase URL and anon key, or throws a clear, actionable error. */
export function requireSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) throw new SupabaseConfigError()

  return { url, anonKey }
}
