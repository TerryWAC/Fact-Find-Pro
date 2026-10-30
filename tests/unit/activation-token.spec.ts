import { test, expect } from '@playwright/test'
import {
  ACTIVATION_TTL_DAYS,
  activationExpiry,
  activationState,
  generateActivationToken,
  hashActivationToken,
  isWellFormedActivationToken,
  latestActivation,
} from '../../src/lib/activation-token'
import { activationLabel, summariseActivation } from '../../src/lib/activation-status'

test('tokens are long, URL-safe, unique and never stored as issued', () => {
  const tokens = new Set(Array.from({ length: 200 }, () => generateActivationToken()))
  expect(tokens.size).toBe(200)
  for (const token of tokens) {
    expect(isWellFormedActivationToken(token)).toBe(true)
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const hash = hashActivationToken(token)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).not.toContain(token)
  }
  expect(hashActivationToken('same')).toBe(hashActivationToken('same'))
  expect(isWellFormedActivationToken('short')).toBe(false)
  expect(isWellFormedActivationToken('a'.repeat(43) + '/')).toBe(false)
})

test('links expire after the documented period and are single use', () => {
  const issued = new Date('2026-10-30T10:00:00Z')
  const expires = activationExpiry(issued)
  expect((expires.getTime() - issued.getTime()) / 86_400_000).toBe(ACTIVATION_TTL_DAYS)
  const row = { used_at: null, expires_at: expires.toISOString() }
  expect(activationState(row, issued.getTime())).toBe('active')
  expect(activationState(row, expires.getTime())).toBe('expired')
  expect(activationState({ ...row, used_at: '2026-10-31T09:00:00Z' }, issued.getTime())).toBe('used')
})

test('the newest link decides the status an admin sees', () => {
  const older = { sent_at: '2026-10-01T09:00:00Z', expires_at: '2026-10-15T09:00:00Z', used_at: null }
  const newer = { sent_at: '2026-10-20T09:00:00Z', expires_at: '2026-11-03T09:00:00Z', used_at: null }
  expect(latestActivation([older, newer])).toBe(newer)
  expect(latestActivation([])).toBeNull()
  const now = new Date('2026-10-30T10:00:00Z').getTime()
  expect(activationLabel({ importPending: true, latest: older }, now)).toEqual({ label: 'Link expired', tone: 'destructive' })
  expect(activationLabel({ importPending: true, latest: newer }, now)).toEqual({ label: 'Invited', tone: 'outline' })
  expect(activationLabel({ importPending: true, latest: null }, now)).toEqual({ label: 'Not invited', tone: 'secondary' })
  expect(activationLabel({ importPending: false, latest: newer }, now)).toEqual({ label: 'Activated', tone: 'success' })
  expect(activationLabel(undefined, now)).toBeNull()
})

test('directory totals count each prepared adviser exactly once', () => {
  const prepared = ['a', 'b', 'c', 'd']
  const summary = summariseActivation(
    prepared,
    [{ id: 'a', import_pending: false }, { id: 'b', import_pending: true }, { id: 'c', import_pending: true }],
    [
      { profile_id: 'a', sent_at: '2026-10-01T00:00:00Z', expires_at: '2026-10-15T00:00:00Z', used_at: '2026-10-02T00:00:00Z' },
      { profile_id: 'b', sent_at: '2026-10-01T00:00:00Z', expires_at: '2026-10-15T00:00:00Z', used_at: null },
      { profile_id: 'b', sent_at: '2026-10-20T00:00:00Z', expires_at: '2026-11-03T00:00:00Z', used_at: null },
    ],
  )
  expect(summary.activated).toBe(1)
  expect(summary.invited).toBe(1)
  expect(summary.waiting).toBe(2)
  expect(summary.byProfile.get('b')?.latest?.sent_at).toBe('2026-10-20T00:00:00Z')
  expect(summary.byProfile.get('d')).toEqual({ importPending: true, latest: null })
})
