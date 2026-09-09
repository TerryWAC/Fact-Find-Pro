'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin'
import { sendEmail, type EmailAttachment } from '@/lib/email/send'
import { renderSubmissionPdf, submissionPdfFilename } from '@/lib/pdf/render'
import { sendClientPdfCopy } from '@/lib/email/client-copy'
import { clientIdentitySchema } from '@/lib/validations'
import { isFactFindType, FACTFIND_TYPE_META } from '@/lib/constants'
import { getBaseUrl } from '@/lib/utils'
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
}

/**
 * Public FactFind submission.
 *
 * Writes through the `submit_factfind` SECURITY DEFINER function, which
 * resolves the slug to its owning adviser server-side. The client never gets to
 * name the adviser, so a submission can only ever land on the adviser whose
 * link was actually used.
 */
export async function submitFactFind(input: SubmitFactFindInput): Promise<SubmitFactFindResult> {
  if (!isFactFindType(input.formType)) {
    return { ok: false, error: 'Unknown FactFind type.' }
  }

  const slug = String(input.slug ?? '').trim()
  if (!/^[a-z0-9]{4,32}$/i.test(slug)) {
    return { ok: false, error: 'This FactFind link is not valid.' }
  }

  const identity = clientIdentitySchema.safeParse({
    client_name: input.clientName,
    client_email: input.clientEmail,
    client_phone: input.clientPhone ?? '',
  })

  if (!identity.success) {
    return { ok: false, error: identity.error.issues[0]?.message ?? 'Please check your details.' }
  }

  const headerList = await headers()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('submit_factfind', {
    p_form_type: input.formType,
    p_slug: slug,
    p_client_name: identity.data.client_name,
    p_client_email: identity.data.client_email,
    p_client_phone: identity.data.client_phone || null,
    p_submission_data: (input.submissionData ?? {}) as Json,
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
    return { ok: false, error: 'We could not confirm your submission. Please contact your adviser.' }
  }

  // Notify the adviser. Never let a mail failure fail the submission.
  void notifyAdviser({
    slug,
    formType: input.formType,
    submissionId,
    reference,
    clientName: identity.data.client_name,
    clientEmail: identity.data.client_email,
  }).catch(() => undefined)

  return { ok: true, reference }
}

async function notifyAdviser(params: {
  slug: string
  formType: FactFindType
  submissionId: string
  reference: string
  clientName: string
  clientEmail: string
}) {
  if (!hasAdminClient()) return

  const admin = createAdminClient()

  const { data: form } = await admin
    .from('factfind_forms')
    .select('adviser_id')
    .eq('form_type', params.formType)
    .eq('unique_slug', params.slug)
    .maybeSingle()

  if (!form) return

  const { data: adviser } = await admin
    .from('profiles')
    .select('name, email, company_name, brand_colour, logo_url, avatar_url, delivery_client_copy')
    .eq('id', form.adviser_id)
    .maybeSingle()

  if (!adviser) return

  // Attach the branded PDF. A rendering problem must not cost the notification.
  const attachments: EmailAttachment[] = []
  const { data: submission } = await admin.from('factfind_submissions').select('*').eq('id', params.submissionId).maybeSingle()
  let pdf: Buffer | undefined
  try {
    if (submission) {
      pdf = await renderSubmissionPdf({ submission, adviser })
      attachments.push({ filename: submissionPdfFilename(submission), content: pdf })
    }
  } catch (error) {
    console.error('submission PDF for notification failed:', (error as Error).message)
  }

  // The client's own copy, if the adviser has turned it on.
  if (submission && pdf && adviser.delivery_client_copy) {
    void sendClientPdfCopy(submission, adviser, pdf).catch((error: Error) =>
      console.error('client PDF copy failed:', error.message),
    )
  }

  await sendEmail(
    'submission_notification',
    adviser.email,
    {
      name: adviser.name,
      client_name: params.clientName,
      client_email: params.clientEmail,
      form_type: FACTFIND_TYPE_META[params.formType].shortLabel,
      reference: params.reference,
      submitted_at: new Date().toLocaleString('en-GB'),
      submission_url: `${getBaseUrl()}/submissions/${params.submissionId}`,
    },
    { attachments },
  )
}
