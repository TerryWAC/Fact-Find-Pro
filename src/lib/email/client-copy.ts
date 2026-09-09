import 'server-only'

import { sendEmail, type SendEmailResult } from './send'
import { renderSubmissionPdf, submissionPdfFilename } from '@/lib/pdf/render'
import { FACTFIND_TYPE_META } from '@/lib/constants'
import type { FactFindSubmission } from '@/lib/supabase/database.types'

export interface ClientCopyAdviser {
  name: string
  email: string
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
  pdf?: Buffer,
): Promise<SendEmailResult> {
  const content = pdf ?? (await renderSubmissionPdf({ submission, adviser }))

  return sendEmail(
    'submission_client_copy',
    submission.client_email,
    {
      client_name: submission.client_name,
      adviser_name: adviser.name,
      company_name: adviser.company_name ?? '',
      form_type: FACTFIND_TYPE_META[submission.form_type].shortLabel,
      reference: submission.reference,
      submitted_at: new Date(submission.submitted_at).toLocaleString('en-GB'),
    },
    {
      attachments: [{ filename: submissionPdfFilename(submission), content }],
      replyTo: adviser.email,
    },
  )
}
