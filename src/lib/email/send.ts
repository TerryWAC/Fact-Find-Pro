import 'server-only'

import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin'
import { randomUUID } from 'node:crypto'
import { interpolate, wrapHtml, type EmailBranding } from './render'
import { emailConfiguration } from './config'
import { sendResendEmail } from './transport'
import { DEFAULT_EMAIL_TEMPLATES, type EmailTemplateKey, type EmailVariablesMap } from './templates'

export interface EmailAttachment {
  filename: string
  /** Raw file contents. */
  content: Buffer
}

export interface SendEmailOptions {
  branding?: EmailBranding
  attachments?: EmailAttachment[]
  /** Overrides EMAIL_REPLY_TO — e.g. the adviser's address on a client copy. */
  replyTo?: string
}

export interface SendEmailResult {
  ok: boolean
  provider: 'resend' | 'log'
  skipped?: boolean
  error?: string
  messageId?: string
}

interface RenderedEmail {
  subject: string
  html: string
  text: string
}

/**
 * Loads the live template from the database, falling back to the built-in
 * default when the row is missing or the DB is unreachable.
 */
async function loadTemplate(key: EmailTemplateKey) {
  const fallback = DEFAULT_EMAIL_TEMPLATES[key]

  if (!hasAdminClient()) return { ...fallback, enabled: true }

  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('email_templates')
      .select('subject, body_html, body_text, enabled')
      .eq('key', key)
      .maybeSingle()

    if (!data) return { ...fallback, enabled: true }

    return {
      ...fallback,
      subject: data.subject || fallback.subject,
      bodyHtml: data.body_html || fallback.bodyHtml,
      bodyText: data.body_text || fallback.bodyText,
      enabled: data.enabled,
    }
  } catch {
    return { ...fallback, enabled: true }
  }
}

export async function renderEmail<K extends EmailTemplateKey>(
  key: K,
  variables: EmailVariablesMap[K],
  branding?: EmailBranding,
): Promise<RenderedEmail & { enabled: boolean }> {
  const template = await loadTemplate(key)
  const vars = variables as Record<string, string | undefined>

  const subject = interpolate(template.subject, vars)

  return {
    enabled: template.enabled,
    subject,
    html: wrapHtml(interpolate(template.bodyHtml, vars, true), subject, branding),
    text: interpolate(template.bodyText, vars),
  }
}

async function logEmail(
  key: EmailTemplateKey,
  to: string,
  subject: string,
  status: string,
  provider: string,
  error?: string,
  payload: Record<string, unknown> = {},
) {
  if (!hasAdminClient()) return
  try {
    const supabase = createAdminClient()
    const { error: logError } = await supabase.from('email_log').insert({
      template_key: key,
      to_email: to,
      subject,
      status,
      provider,
      error: error ?? null,
      payload: payload as never,
    })
    if (logError) console.error('Email log could not be saved:', logError.code)
  } catch {
    // Logging must never break the calling flow.
  }
}

/** Record preparation failures that happen before a provider request can be made. */
export async function recordEmailPreparationFailure(key: EmailTemplateKey, to: string, submissionId: string) {
  await logEmail(
    key,
    to,
    'Submission PDF could not be prepared',
    'failed',
    'none',
    'The PDF could not be prepared. Open the submission and retry the client copy.',
    { submission_id: submissionId },
  )
}

/**
 * Sends a templated notification.
 *
 * Provider resolution:
 *  - RESEND_API_KEY set  → delivered via the Resend HTTP API
 *  - otherwise           → written to the server log and `email_log` table so
 *                          the flow is fully testable without a mail provider
 *
 * Never throws: a failed notification must not roll back the user action that
 * triggered it.
 */
export async function sendEmail<K extends EmailTemplateKey>(
  key: K,
  to: string | string[],
  variables: EmailVariablesMap[K],
  options: SendEmailOptions = {},
): Promise<SendEmailResult> {
  const attachments = options.attachments ?? []
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean)
  if (recipients.length === 0) {
    return { ok: false, provider: 'log', skipped: true, error: 'No recipients' }
  }

  let rendered: RenderedEmail & { enabled: boolean }
  try {
    rendered = await renderEmail(key, variables, options.branding)
  } catch (error) {
    return { ok: false, provider: 'log', error: (error as Error).message }
  }

  if (!rendered.enabled) {
    await logEmail(key, recipients.join(', '), rendered.subject, 'skipped', 'none', 'Template disabled')
    return { ok: true, provider: 'log', skipped: true }
  }

  const requestId = randomUUID()
  const result = await sendResendEmail(
    emailConfiguration(process.env),
    {
      to: recipients,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      replyTo: options.replyTo,
      fromName: options.branding?.companyName || options.branding?.adviserName || undefined,
      attachments,
    },
    requestId,
  )
  const status = !result.ok ? 'failed' : result.provider === 'log' ? 'logged' : 'sent'
  // Preserve the existing status vocabulary; "sent" means provider acceptance.
  await logEmail(key, recipients.join(', '), rendered.subject, status, result.provider, result.error, {
    request_id: requestId,
    ...(result.messageId ? { message_id: result.messageId } : {}),
    attachments: attachments.map((item) => item.filename),
  })
  // Operational metadata only: never print the client's email body or PDF contents.
  if (result.provider === 'log')
    console.info(`[email:${key}] ${status}; ${attachments.length} attachment(s); request ${requestId}`)
  return result
}

/** Admin notification recipients, from env or the admin profiles table. */
export async function getAdminRecipients(): Promise<string[]> {
  const configured = process.env.ADMIN_NOTIFICATION_EMAIL
  if (configured) {
    return configured
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  }

  if (!hasAdminClient()) return []

  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin')
      .eq('status', 'approved')

    return (data ?? []).map((row) => row.email).filter(Boolean)
  } catch {
    return []
  }
}
