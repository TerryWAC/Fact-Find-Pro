'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { emailConfiguration } from '@/lib/email/config'
import { sendResendEmail } from '@/lib/email/transport'
import { createTestEmail } from '@/lib/email/test-message'

export async function sendTestEmailAction() {
  const session = await requireAdmin()
  const config = emailConfiguration(process.env)
  if (!config.configured || config.error)
    return {
      ok: false,
      error: config.error ?? 'Add RESEND_API_KEY to the server environment before testing.',
    }
  const requestId = randomUUID()
  try {
    // The destination comes from the authenticated account, never from form input.
    const email = await createTestEmail(session.email)
    const result = await sendResendEmail(config, email, requestId)
    const supabase = await createClient()
    await supabase.from('email_log').insert({
      template_key: 'connection_test',
      to_email: session.email,
      subject: email.subject,
      status: result.ok ? 'sent' : 'failed',
      provider: 'resend',
      error: result.error ?? null,
      payload: {
        request_id: requestId,
        message_id: result.messageId ?? null,
        attachments: ['factfind-email-test.pdf'],
      },
    })
    revalidatePath('/admin/emails')
    return { ok: result.ok, error: result.error, messageId: result.messageId }
  } catch {
    return {
      ok: false,
      error: 'The test could not be completed. Check the email log before trying again.',
    }
  }
}
