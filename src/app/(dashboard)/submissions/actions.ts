'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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
