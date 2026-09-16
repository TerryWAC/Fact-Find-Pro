import 'server-only'

import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin'
import { renderSubmissionPdf, submissionPdfFilename } from '@/lib/pdf/render'
import { sendClientPdfCopy } from './client-copy'
import { recordEmailPreparationFailure, sendEmail, type EmailAttachment } from './send'
import { FACTFIND_TYPE_META } from '@/lib/constants'
import { getBaseUrl } from '@/lib/utils'

/** Read recipients and content from the saved submission, after the public RPC succeeds. */
export async function notifySubmission(submissionId: string): Promise<void> {
  if (!hasAdminClient()) {
    console.warn('Automatic submission emails are unavailable: Supabase server key missing.')
    return
  }

  const admin = createAdminClient()
  const { data: submission, error: submissionError } = await admin
    .from('factfind_submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle()
  if (submissionError || !submission) {
    console.error(
      'Submission notification could not load its saved submission:',
      submissionError?.code ?? 'not_found',
    )
    return
  }

  const { data: adviser, error: adviserError } = await admin
    .from('profiles')
    .select(
      'name, email, contact_email, company_name, brand_colour, logo_url, avatar_url, delivery_email_copy, delivery_client_copy',
    )
    .eq('id', submission.adviser_id)
    .maybeSingle()
  if (adviserError || !adviser) {
    console.error('Submission notification could not load its adviser:', adviserError?.code ?? 'not_found')
    return
  }
  if (!adviser.delivery_email_copy && !adviser.delivery_client_copy) return

  const attachments: EmailAttachment[] = []
  if (adviser.delivery_email_copy) {
    try {
      const pdf = await renderSubmissionPdf({ submission, adviser })
      attachments.push({ filename: submissionPdfFilename(submission), content: pdf })
    } catch {
      console.error('Submission PDF for adviser notification could not be prepared.')
    }
  }

  // A client-copy failure must not suppress the adviser's notification. The
  // adviser still receives the protected submission link if rendering fails.
  const deliveries = []
  if (adviser.delivery_client_copy) {
    deliveries.push(sendClientPdfCopy(submission, adviser).catch(async () => {
      await recordEmailPreparationFailure('submission_client_copy', submission.client_email, submissionId)
      throw new Error('Client PDF copy could not be prepared.')
    }))
  }
  if (adviser.delivery_email_copy) {
    deliveries.push(
      sendEmail(
        'submission_notification',
        adviser.email,
        {
          name: adviser.name,
          client_name: submission.client_name,
          client_email: submission.client_email,
          form_type: FACTFIND_TYPE_META[submission.form_type].shortLabel,
          reference: submission.reference,
          submitted_at: new Date(submission.submitted_at).toLocaleString('en-GB', {
            timeZone: 'Europe/London',
          }),
          submission_url: `${getBaseUrl()}/submissions/${submissionId}`,
        },
        {
          attachments,
          branding: {
            companyName: adviser.company_name || adviser.name,
            colour: adviser.brand_colour,
            logoUrl: adviser.logo_url,
            adviserName: adviser.name,
            replyTo: adviser.email,
          },
        },
      ),
    )
  }
  const results = await Promise.allSettled(deliveries)
  if (results.some((result) => result.status === 'rejected' || !result.value.ok))
    console.error('One or more submission emails failed. Check the email log.')
}
