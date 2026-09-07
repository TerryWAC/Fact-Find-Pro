/**
 * Supabase environment resolution.
 *
 * Two things make this fiddlier than a couple of `process.env` reads:
 *
 * 1. `NEXT_PUBLIC_*` variables are inlined at BUILD time, not read at runtime.
 *    Adding them to a hosting provider without triggering a new build leaves
 *    them `undefined` in the deployed bundle.
 * 2. Supabase can be wired up by hand or through a platform integration (the
 *    Vercel <-> Supabase one, for example), and those inject their own variable
 *    names. So we accept the common aliases rather than insisting on one pair.
 *
 * Every alias below is referenced as a full static expression, which is what
 * lets the bundler inline the `NEXT_PUBLIC_*` ones. Non-public aliases are read
 * at runtime on the server, so a platform integration works without a rebuild.
 */

function firstValue(...candidates: (string | undefined)[]): string | undefined {
  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value) return value
  }
  return undefined
}

/** Project URL, from any of the names Supabase or its integrations may use. */
export function supabaseUrl(): string | undefined {
  return firstValue(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL,
  )
}

/** Anon / publishable key — the client-safe key that RLS is enforced against. */
export function supabaseAnonKey(): string | undefined {
  return firstValue(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY,
    process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

/** Service-role / secret key. Server-only — never expose this to the browser. */
export function supabaseServiceKey(): string | undefined {
  return firstValue(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SERVICE_KEY,
    process.env.SUPABASE_SECRET_KEY,
  )
}

export function missingSupabaseEnv(): string[] {
  const missing: string[] = []
  if (!supabaseUrl()) missing.push('NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)')
  if (!supabaseAnonKey()) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)')
  return missing
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey())
}

/** Human-readable, safe-to-display explanation of what to fix. */
export function supabaseConfigMessage(): string {
  const missing = missingSupabaseEnv()
  if (missing.length === 0) return ''

  return `FactFind Pro is not connected to Supabase: ${missing.join(' and ')} ${
    missing.length === 1 ? 'is' : 'are'
  } missing. Add ${
    missing.length === 1 ? 'it' : 'them'
  } to your environment and redeploy — NEXT_PUBLIC_ values are baked in when the app is built, so setting them without a fresh build has no effect.`
}

export class SupabaseConfigError extends Error {
  constructor() {
    super(supabaseConfigMessage() || 'Supabase is not configured.')
    this.name = 'SupabaseConfigError'
  }
}

/** Returns the Supabase URL and anon key, or throws a clear, actionable error. */
export function requireSupabaseEnv(): { url: string; anonKey: string } {
  const url = supabaseUrl()
  const anonKey = supabaseAnonKey()

  if (!url || !anonKey) throw new SupabaseConfigError()

  return { url, anonKey }
}
