'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendClientPdfCopy } from '@/lib/email/client-copy'
import type { SubmissionStatus } from '@/lib/supabase/database.types'

const VALID_STATUSES: SubmissionStatus[] = ['new', 'in_review', 'completed', 'archived']

export interface SubmissionActionResult {
  ok: boolean
  error?: string
}

/**
 * Updates a submission's workflow status. RLS restricts advisers to their own
 * submissions, so no extra ownership check is needed here.
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: string,
): Promise<SubmissionActionResult> {
  if (!VALID_STATUSES.includes(status as SubmissionStatus)) {
    return { ok: false, error: 'Unknown status' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('factfind_submissions')
    .update({ status: status as SubmissionStatus })
    .eq('id', submissionId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/submissions')
  revalidatePath(`/submissions/${submissionId}`)
  revalidatePath('/admin/submissions')
  revalidatePath(`/admin/submissions/${submissionId}`)
  revalidatePath('/dashboard')

  return { ok: true }
}

export interface EmailClientResult {
  ok: boolean
  error?: string
  /** True when no mail provider is configured and the email was only logged. */
  loggedOnly?: boolean
}

/**
 * Emails the client a branded PDF of this submission, on demand. RLS scopes
 * the submission to the caller (own submissions for advisers, all for admins),
 * and the PDF is rendered in the owning adviser's branding.
 */
export async function emailPdfToClientAction(submissionId: string): Promise<EmailClientResult> {
  const supabase = await createClient()

  const { data: submission } = await supabase
    .from('factfind_submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle()
  if (!submission) return { ok: false, error: 'Submission not found.' }

  const { data: adviser } = await supabase
    .from('profiles')
    .select('name, email, company_name, brand_colour, logo_url, avatar_url')
    .eq('id', submission.adviser_id)
    .maybeSingle()
  if (!adviser) return { ok: false, error: 'The owning adviser could not be found.' }

  try {
    const result = await sendClientPdfCopy(submission, adviser)
    if (!result.ok) return { ok: false, error: result.error ?? 'The email could not be sent.' }
    if (result.skipped) return { ok: false, error: 'The client copy email template is switched off.' }
    return { ok: true, loggedOnly: result.provider === 'log' }
  } catch (error) {
    return { ok: false, error: (error as Error).message }
  }
}
