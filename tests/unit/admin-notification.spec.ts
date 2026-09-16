import { test, expect } from '@playwright/test'
import { emailOutcome } from '../../src/lib/email/outcome'
import type { SendEmailResult } from '../../src/lib/email/send'

const settled = (value: SendEmailResult): PromiseFulfilledResult<SendEmailResult> => ({ status: 'fulfilled', value })

test('approval notification distinguishes accepted, failed, disabled and logged email', () => {
  expect(emailOutcome([settled({ ok: true, provider: 'resend' })], 'Approval')).toEqual({ message: 'Approval email accepted for delivery.', warning: false })
  for (const [value, message] of [
    [{ ok: false, provider: 'resend' }, 'could not be sent'],
    [{ ok: true, provider: 'resend', skipped: true }, 'template is switched off'],
    [{ ok: true, provider: 'log' }, 'logged only'],
  ] as const) {
    const result = emailOutcome([settled(value)], 'Approval')
    expect(result.warning).toBe(true)
    expect(result.message).toContain(message)
    expect(result.message).not.toContain('accepted')
  }
})

test('one rejected email does not erase successful bulk outcomes', () => {
  const result = emailOutcome([settled({ ok: true, provider: 'resend' }), { status: 'rejected', reason: new Error('network') }], 'Approval')
  expect(result.warning).toBe(true)
  expect(result.message).toContain('accepted for delivery')
  expect(result.message).toContain('1 email could not be sent')
})
