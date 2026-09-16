import type { SendEmailResult } from './send'

/** Provider acceptance is distinct from inbox delivery, disabled mail and logging. */
export function emailOutcome(results: readonly PromiseSettledResult<SendEmailResult>[], label: string) {
  let accepted = 0
  let skipped = 0
  let logged = 0
  let failed = 0
  for (const result of results) {
    if (result.status === 'rejected' || !result.value.ok) failed++
    else if (result.value.skipped) skipped++
    else if (result.value.provider === 'log') logged++
    else accepted++
  }
  const parts = [
    accepted && `${accepted === 1 ? label + ' email' : accepted + ' ' + label.toLowerCase() + ' emails'} accepted for delivery.`,
    failed && `${failed} email${failed === 1 ? '' : 's'} could not be sent. Please retry.`,
    skipped && `${skipped} email${skipped === 1 ? '' : 's'} skipped because the template is switched off.`,
    logged && `${logged} email${logged === 1 ? '' : 's'} logged only; configure email delivery to send.`,
  ].filter(Boolean)
  return { message: parts.join(' '), warning: failed + skipped + logged > 0 }
}
