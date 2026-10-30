import { createHash, randomBytes } from 'node:crypto'

/**
 * Activation links for prepared adviser accounts.
 *
 * The link carries a random token; the database keeps only its SHA-256 hash,
 * so a copy of the table cannot be turned back into working links. Pure
 * functions, no I/O — see src/lib/adviser-activation.ts for the flow.
 */

export const ACTIVATION_TTL_DAYS = 14

const TOKEN_BYTES = 32

export function generateActivationToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url')
}

export function hashActivationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Shape check before touching the database — base64url of 32 bytes is 43 chars. */
export function isWellFormedActivationToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{40,64}$/.test(token)
}

export function activationExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + ACTIVATION_TTL_DAYS * 86_400_000)
}

export type ActivationState = 'active' | 'used' | 'expired'

export function activationState(
  row: { used_at: string | null; expires_at: string },
  now: number = Date.now(),
): ActivationState {
  if (row.used_at) return 'used'
  if (new Date(row.expires_at).getTime() <= now) return 'expired'
  return 'active'
}

/** The most recent link decides what an admin sees for an adviser. */
export function latestActivation<T extends { sent_at: string }>(rows: readonly T[]): T | null {
  return rows.reduce<T | null>((latest, row) => (!latest || row.sent_at > latest.sent_at ? row : latest), null)
}
