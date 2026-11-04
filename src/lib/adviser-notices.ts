import 'server-only'

import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin'
import { sendEmail, type SendEmailResult } from '@/lib/email/send'

/** The one-off notice that Fact Find Version 1 is being switched off. */
export const RETIREMENT_NOTICE_KEY = 'v1_retirement_notice' as const

export interface NoticeRecipient {
  id: string
  name: string
  email: string
}

export interface NoticeProgress {
  /** Prepared advisers (reviewed and included) who can receive the notice. */
  total: number
  /** Advisers whose notice was accepted by the mail provider or logged. */
  notified: number
  /** Advisers still to be emailed, in directory order. */
  pending: NoticeRecipient[]
}

const DELIVERED = ['sent', 'logged']

/**
 * Who has and has not had the notice. The email log is the record, so a
 * second run never emails the same adviser twice and a failed send is retried.
 */
export async function retirementNoticeProgress(): Promise<NoticeProgress> {
  if (!hasAdminClient()) return { total: 0, notified: 0, pending: [] }
  const admin = createAdminClient()

  const { data: included } = await admin
    .from('adviser_imports')
    .select('profile_id')
    .eq('decision', 'include')
    .not('profile_id', 'is', null)
    .order('source_row')
  const ids = [...new Set((included ?? []).map((row) => row.profile_id).filter((id): id is string => Boolean(id)))]
  if (ids.length === 0) return { total: 0, notified: 0, pending: [] }

  const [{ data: profiles }, { data: log }] = await Promise.all([
    admin.from('profiles').select('id, name, email').in('id', ids),
    admin.from('email_log').select('to_email').eq('template_key', RETIREMENT_NOTICE_KEY).in('status', DELIVERED),
  ])
  const done = new Set((log ?? []).map((row) => row.to_email.trim().toLowerCase()))
  const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  const recipients = ids.map((id) => byId.get(id)).filter((profile): profile is NoticeRecipient => Boolean(profile?.email))
  const pending = recipients.filter((profile) => !done.has(profile.email.trim().toLowerCase()))
  return { total: recipients.length, notified: recipients.length - pending.length, pending }
}

/** Emails the notice to one adviser; the send is recorded in the email log. */
export async function sendRetirementNotice(recipient: NoticeRecipient, origin: string): Promise<SendEmailResult> {
  return sendEmail(RETIREMENT_NOTICE_KEY, recipient.email, {
    name: recipient.name,
    signup_url: `${origin.replace(/\/$/, '')}/signup`,
  })
}
