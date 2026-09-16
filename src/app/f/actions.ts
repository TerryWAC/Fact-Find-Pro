'use server'

import { headers } from 'next/headers'
import { after } from 'next/server'
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin'
import { notifySubmission } from '@/lib/email/submission-notifications'
import { getFormSchema } from '@/lib/forms/registry'
import { prepareSubmission } from '@/lib/forms/prepare-submission'
import { isFactFindType } from '@/lib/constants'
import type { FactFindType, Json } from '@/lib/supabase/database.types'

export interface SubmitFactFindInput {
  formType: FactFindType
  slug: string
  clientName: string
  clientEmail: string
  clientPhone: string | null
  submissionData: unknown
}

export interface SubmitFactFindResult {
  ok: boolean
  reference?: string
  error?: string
  stepId?: string
  fieldErrors?: Record<string, string>
}

/**
 * Public FactFind submission.
 *
 * Validates against the trusted Typeform-derived schema, then writes through
 * the service-role-only `submit_factfind` function, which
 * resolves the slug to its owning adviser server-side. The client never gets to
 * name the adviser, so a submission can only ever land on the adviser whose
 * link was actually used.
 */
export async function submitFactFind(input: SubmitFactFindInput): Promise<SubmitFactFindResult> {
  if (!input || !isFactFindType(input.formType)) {
    return { ok: false, error: 'Unknown FactFind type.' }
  }

  const slug = String(input.slug ?? '').trim()
  if (!/^[a-z0-9]{4,32}$/i.test(slug)) {
    return { ok: false, error: 'This FactFind link is not valid.' }
  }

  const prepared = prepareSubmission(getFormSchema(input.formType), input.submissionData)
  if (!prepared.ok) return prepared

  if (!hasAdminClient()) {
    console.error('Validated submission persistence is unavailable: Supabase server key missing.')
    return { ok: false, error: 'Submissions are temporarily unavailable. Your answers are still here; please try again shortly.' }
  }

  const headerList = await headers()
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('submit_factfind', {
    p_form_type: input.formType,
    p_slug: slug,
    p_client_name: prepared.identity.client_name,
    p_client_email: prepared.identity.client_email,
    p_client_phone: prepared.identity.client_phone || null,
    p_submission_data: prepared.payload as unknown as Json,
    p_meta: {
      user_agent: headerList.get('user-agent') ?? null,
      referer: headerList.get('referer') ?? null,
      submitted_via: 'web',
    } as Json,
  })

  if (error) {
    console.error('submit_factfind failed:', error.message)
    return {
      ok: false,
      error:
        error.code === 'P0002'
          ? 'This FactFind link is no longer active. Please ask your adviser for a new one.'
          : 'We could not submit your FactFind. Please try again in a moment.',
    }
  }

  const result = Array.isArray(data) ? data[0] : data
  const reference = result?.reference
  const submissionId = result?.submission_id

  if (!reference || !submissionId) {
    return {
      ok: false,
      error: 'We could not confirm your submission. Please contact your adviser.',
    }
  }

  // Keep notification work alive after the response on serverless hosts.
  after(async () => {
    await notifySubmission(submissionId).catch(() =>
      console.error('Submission notification could not complete.'),
    )
  })

  return { ok: true, reference }
}
