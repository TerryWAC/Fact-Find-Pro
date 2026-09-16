import { z } from 'zod'

export interface EmailConfiguration {
  apiKey: string
  from: string
  replyTo?: string
  configured: boolean
  testSender: boolean
  error?: string
}

export function emailAddress(value: string): string | null {
  if (/[\r\n]/.test(value)) return null
  const match = /^(?:[^<>]+<([^<>]+)>|([^<>]+))$/.exec(value.trim())
  const address = (match?.[1] ?? match?.[2] ?? '').trim()
  return z.string().email().safeParse(address).success ? address : null
}

/** Change only the display name; every firm uses the platform's verified domain. */
export function brandedSender(from: string, name?: string | null): string {
  const address = emailAddress(from)
  const cleanName = name?.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, 120)
  if (!address || !cleanName) return from
  return `"${cleanName.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}" <${address}>`
}

/** Server callers pass environment values explicitly; never serialize this object to a client. */
export function emailConfiguration(env: Record<string, string | undefined>): EmailConfiguration {
  const apiKey = env.RESEND_API_KEY?.trim() ?? ''
  const from = env.EMAIL_FROM?.trim() || 'FactFind Pro <onboarding@resend.dev>'
  const replyTo = env.EMAIL_REPLY_TO?.trim() || undefined
  const address = emailAddress(from)
  const error =
    apiKey && !/^re_[A-Za-z0-9_-]+$/.test(apiKey)
      ? 'The Resend API key format is invalid. Check the server configuration.'
      : !address
        ? 'EMAIL_FROM must contain a valid sender address.'
        : replyTo && !emailAddress(replyTo)
          ? 'EMAIL_REPLY_TO must contain a valid email address.'
          : undefined
  return {
    apiKey,
    from,
    replyTo,
    configured: Boolean(apiKey),
    testSender: address?.endsWith('@resend.dev') ?? false,
    error,
  }
}

/** Only this safe summary may be displayed in the admin interface. */
export function emailConfigurationStatus(config: EmailConfiguration) {
  return {
    configured: config.configured,
    from: config.from,
    testSender: config.testSender,
    error: config.error,
  }
}
