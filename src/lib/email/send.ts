import 'server-only'

import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin'
import { interpolate, wrapHtml } from './render'
import {
  DEFAULT_EMAIL_TEMPLATES,
  type EmailTemplateKey,
  type EmailVariablesMap,
} from './templates'

export interface EmailAttachment {
  filename: string
  /** Raw file contents. */
  content: Buffer
}

export interface SendEmailOptions {
  attachments?: EmailAttachment[]
}

export interface SendEmailResult {
  ok: boolean
  provider: 'resend' | 'log'
  skipped?: boolean
  error?: string
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
): Promise<RenderedEmail & { enabled: boolean }> {
  const template = await loadTemplate(key)
  const vars = variables as Record<string, string | undefined>

  const subject = interpolate(template.subject, vars)

  return {
    enabled: template.enabled,
    subject,
    html: wrapHtml(interpolate(template.bodyHtml, vars), subject),
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
    await supabase.from('email_log').insert({
      template_key: key,
      to_email: to,
      subject,
      status,
      provider,
      error: error ?? null,
      payload: payload as never,
    })
  } catch {
    // Logging must never break the calling flow.
  }
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
    rendered = await renderEmail(key, variables)
  } catch (error) {
    return { ok: false, provider: 'log', error: (error as Error).message }
  }

  if (!rendered.enabled) {
    await logEmail(key, recipients.join(', '), rendered.subject, 'skipped', 'none', 'Template disabled')
    return { ok: true, provider: 'log', skipped: true }
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'FactFind Pro <onboarding@resend.dev>'

  if (!apiKey) {
    console.info(
      `\n[email:${key}] (no RESEND_API_KEY — logged only)\n  to: ${recipients.join(', ')}\n  subject: ${rendered.subject}\n  ${rendered.text.replace(/\n/g, '\n  ')}\n` +
        (attachments.length ? `  attachments: ${attachments.map((a) => `${a.filename} (${a.content.length} bytes)`).join(', ')}\n` : ''),
    )
    await logEmail(key, recipients.join(', '), rendered.subject, 'logged', 'log', undefined, {
      text: rendered.text,
      attachments: attachments.map((a) => a.filename),
    })
    return { ok: true, provider: 'log' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
        ...(attachments.length
          ? { attachments: attachments.map((a) => ({ filename: a.filename, content: a.content.toString('base64') })) }
          : {}),
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      await logEmail(key, recipients.join(', '), rendered.subject, 'failed', 'resend', body)
      return { ok: false, provider: 'resend', error: body }
    }

    await logEmail(key, recipients.join(', '), rendered.subject, 'sent', 'resend')
    return { ok: true, provider: 'resend' }
  } catch (error) {
    const message = (error as Error).message
    await logEmail(key, recipients.join(', '), rendered.subject, 'failed', 'resend', message)
    return { ok: false, provider: 'resend', error: message }
  }
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
