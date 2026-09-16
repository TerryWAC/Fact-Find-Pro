import { brandedSender, emailAddress, type EmailConfiguration } from './config'

export interface OutgoingEmail {
  to: string[]
  subject: string
  html: string
  text: string
  replyTo?: string
  fromName?: string
  attachments?: Array<{ filename: string; content: Buffer }>
}

export interface DeliveryResult {
  ok: boolean
  provider: 'resend' | 'log'
  messageId?: string
  error?: string
  skipped?: boolean
}

function providerError(status: number, name?: string): string {
  if (status === 401 || name === 'invalid_api_key')
    return 'Resend could not authenticate. Check RESEND_API_KEY.'
  if (status === 403)
    return 'Resend refused this sender or recipient. Check the API key permissions and verify the EMAIL_FROM domain in Resend.'
  if (status === 429) return 'Resend is temporarily rate limited. Please try again shortly.'
  if (status === 409)
    return 'This email request is already being processed or has changed. Check the email log before sending again.'
  if (status === 422 || status === 400)
    return 'Resend rejected the email details. Check the sender, recipient and attachment.'
  return 'Resend is temporarily unavailable. Check the email log before trying again.'
}

/** Retries the identical body once, with the same idempotency key, within a bounded time. */
export async function sendResendEmail(
  config: EmailConfiguration,
  email: OutgoingEmail,
  idempotencyKey: string,
  dependencies: { fetch?: typeof fetch; sleep?: (ms: number) => Promise<void> } = {},
): Promise<DeliveryResult> {
  if (config.error)
    return { ok: false, provider: config.configured ? 'resend' : 'log', error: config.error }
  if (
    !email.to.length ||
    email.to.some((address) => !emailAddress(address)) ||
    (email.replyTo && !emailAddress(email.replyTo))
  ) {
    return {
      ok: false,
      provider: 'log',
      error: 'A valid recipient and reply-to address are required.',
    }
  }
  if (!/^[\x21-\x7E]{1,256}$/.test(idempotencyKey))
    return { ok: false, provider: 'log', error: 'The email request identifier is invalid.' }
  if (!config.configured) return { ok: true, provider: 'log' }
  const fetcher = dependencies.fetch ?? fetch
  const sleep = dependencies.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)))
  const body = JSON.stringify({
    from: brandedSender(config.from, email.fromName),
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    ...(email.replyTo || config.replyTo ? { reply_to: email.replyTo || config.replyTo } : {}),
    ...(email.attachments?.length
      ? {
          attachments: email.attachments.map((item) => ({
            filename: item.filename,
            content: item.content.toString('base64'),
          })),
        }
      : {}),
  })
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetcher('https://api.resend.com/emails', {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body,
      })
      const result = (await response.json().catch(() => null)) as {
        id?: unknown
        name?: string
      } | null
      if (response.ok && typeof result?.id === 'string' && result.id)
        return { ok: true, provider: 'resend', messageId: result.id }
      const retryable =
        response.status === 429 ||
        response.status >= 500 ||
        (response.status === 409 && result?.name === 'concurrent_idempotent_requests')
      if (attempt === 0 && retryable) {
        const seconds = Number(response.headers.get('retry-after') ?? '1')
        await sleep(Number.isFinite(seconds) ? Math.min(2000, Math.max(500, seconds * 1000)) : 1000)
        continue
      }
      return {
        ok: false,
        provider: 'resend',
        error: response.ok
          ? 'Resend did not return a message ID. Check the email log before trying again.'
          : providerError(response.status, result?.name),
      }
    } catch {
      if (attempt === 0) {
        await sleep(500)
        continue
      }
      return {
        ok: false,
        provider: 'resend',
        error:
          'The connection to Resend timed out or failed. Delivery is unconfirmed; check Resend before sending again.',
      }
    }
  }
  return { ok: false, provider: 'resend', error: 'Email delivery could not be confirmed.' }
}
