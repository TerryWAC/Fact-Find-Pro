'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth'
import { clampStep, TOTAL_ONBOARDING_STEPS } from '@/lib/onboarding'
import {
  onboardingBrandSchema,
  onboardingDeliverySchema,
  onboardingDetailsSchema,
  teamMemberSchema,
} from '@/lib/validations'

export interface OnboardingActionState {
  ok?: boolean
  error?: string
  message?: string
  fieldErrors?: Record<string, string>
  /**
   * What the user submitted, echoed back on failure.
   *
   * A failed submit re-renders the step and client state is remounted, so
   * without this the form would silently reset — losing a toggle the user set
   * and hiding the field-level message attached to it.
   */
  values?: Record<string, string | boolean>
}

function fieldErrorsFrom(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '')
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
  }
  return fieldErrors
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/**
 * Reads a form field as a string.
 *
 * A disabled or absent input is simply missing from FormData, and `null` fails
 * an optional string schema — so normalise to an empty string.
 */
function text(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

/** Records how far the adviser has got, so the wizard can resume. */
async function recordProgress(userId: string, step: number) {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('onboarding_step').eq('id', userId).maybeSingle()

  const furthest = Math.max(data?.onboarding_step ?? 1, clampStep(step))
  await supabase.from('profiles').update({ onboarding_step: furthest }).eq('id', userId)
}

function nextStepPath(step: number): string {
  const next = Math.min(step + 1, TOTAL_ONBOARDING_STEPS)
  return `/onboarding?step=${next}`
}

// -----------------------------------------------------------------------------
// Step 2 — Your details
// -----------------------------------------------------------------------------
export async function saveDetailsAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const parsed = onboardingDetailsSchema.safeParse({
    name: text(formData, 'name'),
    job_title: text(formData, 'job_title'),
    phone: text(formData, 'phone'),
    company_name: text(formData, 'company_name'),
    fca_number: text(formData, 'fca_number'),
    website: text(formData, 'website'),
    business_location: text(formData, 'business_location'),
  })

  if (!parsed.success) {
    return { error: 'Please check the form and try again.', fieldErrors: fieldErrorsFrom(parsed.error) }
  }

  const values = parsed.data
  const supabase = await createClient()

  // The account email is the sign-in identity and is changed through Supabase
  // Auth, not here — so it is deliberately not written back.
  const { error } = await supabase
    .from('profiles')
    .update({
      name: values.name,
      job_title: emptyToNull(values.job_title),
      phone: emptyToNull(values.phone),
      company_name: emptyToNull(values.company_name),
      fca_number: emptyToNull(values.fca_number),
      website: emptyToNull(values.website),
      business_location: emptyToNull(values.business_location),
    })
    .eq('id', session.id)

  if (error) return { error: error.message }

  await recordProgress(session.id, 3)
  revalidatePath('/onboarding')
  revalidatePath('/', 'layout')
  redirect(nextStepPath(2))
}

// -----------------------------------------------------------------------------
// Step 3 — Your brand
// -----------------------------------------------------------------------------
export async function saveBrandAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const parsed = onboardingBrandSchema.safeParse({
    logo_url: text(formData, 'logo_url'),
    avatar_url: text(formData, 'avatar_url'),
    brand_colour: text(formData, 'brand_colour'),
  })

  if (!parsed.success) {
    return { error: 'Please check the form and try again.', fieldErrors: fieldErrorsFrom(parsed.error) }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      logo_url: emptyToNull(parsed.data.logo_url),
      avatar_url: emptyToNull(parsed.data.avatar_url),
      brand_colour: emptyToNull(parsed.data.brand_colour),
    })
    .eq('id', session.id)

  if (error) return { error: error.message }

  await recordProgress(session.id, 4)
  revalidatePath('/onboarding')
  revalidatePath('/', 'layout')
  redirect(nextStepPath(3))
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

/**
 * Uploads a brand image to the `branding` bucket.
 *
 * Deliberately server-side: a browser upload would need the public Supabase
 * keys inlined at build time, and everything else in the app is server-only.
 * Storage RLS still applies, and the path is forced under the caller's own
 * folder so one adviser can never write into another's.
 */
export async function uploadBrandImageAction(
  kind: 'logo' | 'headshot',
  formData: FormData,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const session = await getSessionUser()
  if (!session) return { ok: false, error: 'Your session has expired. Please sign in again.' }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Choose an image to upload.' }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'That image is larger than 2MB. Please use a smaller file.' }
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: 'Use a PNG, JPG, WEBP or SVG image.' }
  }

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
  const path = `${session.id}/${kind}-${Date.now()}.${extension}`

  const supabase = await createClient()
  const { error } = await supabase.storage
    .from('branding')
    .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type })

  if (error) return { ok: false, error: error.message }

  const {
    data: { publicUrl },
  } = supabase.storage.from('branding').getPublicUrl(path)

  // Explicit branches rather than a computed key, so the update stays typed.
  await supabase
    .from('profiles')
    .update(kind === 'logo' ? { logo_url: publicUrl } : { avatar_url: publicUrl })
    .eq('id', session.id)

  revalidatePath('/onboarding')
  revalidatePath('/', 'layout')

  return { ok: true, url: publicUrl }
}

// -----------------------------------------------------------------------------
// Step 4 — Delivery
// -----------------------------------------------------------------------------
export async function saveDeliveryAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const submitted = {
    delivery_email_copy: formData.get('delivery_email_copy') === 'on',
    delivery_client_copy: formData.get('delivery_client_copy') === 'on',
    delivery_webhook_enabled: formData.get('delivery_webhook_enabled') === 'on',
    delivery_webhook_url: text(formData, 'delivery_webhook_url'),
  }

  const parsed = onboardingDeliverySchema.safeParse(submitted)

  if (!parsed.success) {
    return {
      error: 'Please check the form and try again.',
      fieldErrors: fieldErrorsFrom(parsed.error),
      values: submitted,
    }
  }

  const values = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      delivery_email_copy: values.delivery_email_copy,
      delivery_client_copy: values.delivery_client_copy,
      delivery_webhook_enabled: values.delivery_webhook_enabled,
      // Clearing the URL alongside the toggle keeps the CHECK constraint happy.
      delivery_webhook_url: values.delivery_webhook_enabled
        ? emptyToNull(values.delivery_webhook_url)
        : null,
    })
    .eq('id', session.id)

  if (error) return { error: error.message }

  await recordProgress(session.id, 5)
  revalidatePath('/onboarding')
  redirect(nextStepPath(4))
}

// -----------------------------------------------------------------------------
// Step 5 — Your team
// -----------------------------------------------------------------------------
export async function addTeamMemberAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const parsed = teamMemberSchema.safeParse({
    name: text(formData, 'name'),
    email: text(formData, 'email'),
    phone: text(formData, 'phone'),
    job_title: text(formData, 'job_title'),
    fca_number: text(formData, 'fca_number'),
    role: text(formData, 'role') || 'adviser',
    headshot_url: text(formData, 'headshot_url'),
  })

  if (!parsed.success) {
    return { error: 'Please check the form and try again.', fieldErrors: fieldErrorsFrom(parsed.error) }
  }

  const values = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.from('team_members').insert({
    owner_id: session.id,
    name: values.name,
    email: values.email.toLowerCase(),
    phone: emptyToNull(values.phone),
    job_title: emptyToNull(values.job_title),
    fca_number: emptyToNull(values.fca_number),
    role: values.role,
    headshot_url: emptyToNull(values.headshot_url),
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'That email address is already on your team.', fieldErrors: { email: 'Already added' } }
    }
    return { error: error.message }
  }

  await recordProgress(session.id, 5)
  revalidatePath('/onboarding')

  return { ok: true, message: `${values.name} added to your team.` }
}

export async function removeTeamMemberAction(memberId: string): Promise<OnboardingActionState> {
  const session = await getSessionUser()
  if (!session) return { error: 'Your session has expired. Please sign in again.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId)
    .eq('owner_id', session.id)

  if (error) return { error: error.message }

  revalidatePath('/onboarding')
  return { ok: true, message: 'Team member removed.' }
}

// -----------------------------------------------------------------------------
// Navigation
// -----------------------------------------------------------------------------
export async function goToStepAction(step: number) {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  await recordProgress(session.id, step)
  redirect(`/onboarding?step=${clampStep(step)}`)
}

/** Marks setup finished (or dismissed) and hands over to the dashboard. */
export async function completeOnboardingAction() {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({
      onboarding_completed_at: new Date().toISOString(),
      onboarding_step: TOTAL_ONBOARDING_STEPS,
    })
    .eq('id', session.id)

  revalidatePath('/', 'layout')
  redirect(session.profile.role === 'admin' ? '/admin' : '/dashboard')
}
