import 'server-only'

import { sendEmail, type SendEmailResult } from './send'
import { renderSubmissionPdf, submissionPdfFilename } from '@/lib/pdf/render'
import { FACTFIND_TYPE_META } from '@/lib/constants'
import type { FactFindSubmission } from '@/lib/supabase/database.types'
import { clientReplyEmail } from '@/lib/practice'

export interface ClientCopyAdviser {
  name: string
  email: string
  contact_email?: string | null
  company_name: string | null
  brand_colour: string | null
  logo_url: string | null
  avatar_url: string | null
}

/**
 * Emails the client a branded PDF of their submission, with replies routed to
 * the adviser. Used automatically on submission (when the adviser has turned
 * it on) and by hand from the submission page.
 */
export async function sendClientPdfCopy(
  submission: FactFindSubmission,
  adviser: ClientCopyAdviser,
): Promise<SendEmailResult> {
  // Always render the client audience here. Accepting a caller-supplied adviser
  // PDF would let automatic or manual sends disclose internal notes.
  const replyTo = clientReplyEmail(adviser)
  const content = await renderSubmissionPdf({
    submission,
    adviser: { ...adviser, email: replyTo },
    audience: 'client',
  })

  return sendEmail(
    'submission_client_copy',
    submission.client_email,
    {
      client_name: submission.client_name,
      adviser_name: adviser.name,
      company_name: adviser.company_name || adviser.name,
      form_type: FACTFIND_TYPE_META[submission.form_type].shortLabel,
      reference: submission.reference,
      submitted_at: new Date(submission.submitted_at).toLocaleString('en-GB', {
        timeZone: 'Europe/London',
      }),
    },
    {
      branding: {
        companyName: adviser.company_name || adviser.name,
        colour: adviser.brand_colour,
        logoUrl: adviser.logo_url,
        adviserName: adviser.name,
        replyTo,
      },
      attachments: [{ filename: submissionPdfFilename(submission), content }],
      replyTo,
    },
  )
}
