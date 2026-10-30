import 'server-only'

import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin'
import { sendEmail, type SendEmailResult } from '@/lib/email/send'
import { stringFields } from '@/lib/adviser-directory'
import { LEGAL } from '@/lib/legal'
import { formatDate } from '@/lib/utils'
import {
  activationExpiry,
  activationState,
  generateActivationToken,
  hashActivationToken,
  isWellFormedActivationToken,
} from '@/lib/activation-token'
import type { ActivationValues } from '@/lib/validations'
import type { AdviserImport, Profile } from '@/lib/supabase/database.types'

/**
 * Activation of the privately prepared adviser accounts.
 *
 * Every step here runs with the service role, because the database guards
 * (`guard_imported_profile`, `guard_imported_form`) only let that role clear
 * `import_pending` and switch the reserved FactFinds on. Nothing in this file
 * is reachable without either an approved admin (inviting) or a valid,
 * unexpired, unused activation token (activating).
 */

const NO_SERVER_KEY = 'The server key needed to manage adviser accounts is not configured.'

export interface InviteOutcome {
  ok: boolean
  error?: string
  profileId?: string
  name?: string
  to?: string
  /** The one-time link, so an admin can also pass it on by hand. */
  activationUrl?: string
  email?: SendEmailResult
}

/** Issues a fresh single-use link for one prepared adviser and emails it to them. */
export async function inviteAdviser(profileId: string, invitedBy: string, origin: string): Promise<InviteOutcome> {
  if (!hasAdminClient()) return { ok: false, error: NO_SERVER_KEY }
  const admin = createAdminClient()

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, name, email, company_name, import_pending, status, role')
    .eq('id', profileId)
    .maybeSingle()
  if (profileError) return { ok: false, error: profileError.message }
  if (!profile || !profile.import_pending || profile.status !== 'pending' || profile.role !== 'adviser') {
    return { ok: false, error: 'This account is not waiting for activation.' }
  }

  const { data: record } = await admin.from('adviser_imports').select('decision').eq('profile_id', profileId).maybeSingle()
  if (record?.decision !== 'include') return { ok: false, error: 'Only reviewed, included advisers can be invited.' }

  const now = new Date()
  // Any earlier link stops working the moment a new one is issued.
  await admin
    .from('adviser_activations')
    .update({ expires_at: now.toISOString() })
    .eq('profile_id', profileId)
    .is('used_at', null)
    .gt('expires_at', now.toISOString())

  const token = generateActivationToken()
  const expiresAt = activationExpiry(now)
  const { error: insertError } = await admin.from('adviser_activations').insert({
    profile_id: profileId,
    token_hash: hashActivationToken(token),
    invited_by: invitedBy,
    expires_at: expiresAt.toISOString(),
  })
  if (insertError) return { ok: false, error: insertError.message }

  const activationUrl = `${origin.replace(/\/$/, '')}/activate/${token}`
  const email = await sendEmail('adviser_activation', profile.email, {
    name: profile.name,
    company_name: profile.company_name ?? '',
    activation_url: activationUrl,
    expires_on: formatDate(expiresAt),
  })

  return { ok: true, profileId, name: profile.name, to: profile.email, activationUrl, email }
}

/** Prepared advisers who have never been sent a link, oldest source rows first. */
export async function nextUninvitedProfileIds(limit: number): Promise<{ ids: string[]; remaining: number }> {
  if (!hasAdminClient()) return { ids: [], remaining: 0 }
  const admin = createAdminClient()

  const { data: included } = await admin
    .from('adviser_imports')
    .select('profile_id, source_row')
    .eq('decision', 'include')
    .not('profile_id', 'is', null)
    .order('source_row')
  const candidateIds = (included ?? []).map((row) => row.profile_id).filter((id): id is string => Boolean(id))
  if (candidateIds.length === 0) return { ids: [], remaining: 0 }

  const [{ data: pending }, { data: invited }] = await Promise.all([
    admin.from('profiles').select('id').in('id', candidateIds).eq('import_pending', true),
    admin.from('adviser_activations').select('profile_id').in('profile_id', candidateIds),
  ])
  const pendingIds = new Set((pending ?? []).map((row) => row.id))
  const invitedIds = new Set((invited ?? []).map((row) => row.profile_id))
  const uninvited = candidateIds.filter((id) => pendingIds.has(id) && !invitedIds.has(id))
  return { ids: uninvited.slice(0, Math.max(0, limit)), remaining: uninvited.length }
}

export type ActivationLookup =
  | { kind: 'invalid' | 'expired' | 'used' }
  | {
      kind: 'ready'
      activationId: string
      token: string
      expiresAt: string
      profile: Profile
      record: AdviserImport | null
      prefill: Record<string, string>
      /** Short-lived signed URLs for the source photo and logo, when present. */
      images: Partial<Record<'avatar_url' | 'logo_url', string>>
    }

/** Resolves a link from the email to the account it activates. */
export async function loadActivation(token: string): Promise<ActivationLookup> {
  if (!isWellFormedActivationToken(token) || !hasAdminClient()) return { kind: 'invalid' }
  const admin = createAdminClient()

  const { data: row } = await admin
    .from('adviser_activations')
    .select('*')
    .eq('token_hash', hashActivationToken(token))
    .maybeSingle()
  if (!row) return { kind: 'invalid' }
  const state = activationState(row)
  if (state !== 'active') return { kind: state }

  const { data: profile } = await admin.from('profiles').select('*').eq('id', row.profile_id).maybeSingle()
  if (!profile || profile.role !== 'adviser') return { kind: 'invalid' }
  // A finished activation is marked used; a profile that is already live
  // without that mark means an earlier attempt stopped part-way, so let it finish.

  const { data: record } = await admin.from('adviser_imports').select('*').eq('profile_id', profile.id).maybeSingle()
  const prefill = stringFields(record?.profile_prefill ?? {})
  const paths = stringFields(record?.asset_paths ?? {})
  const images: Partial<Record<'avatar_url' | 'logo_url', string>> = {}
  await Promise.all(
    (['avatar_url', 'logo_url'] as const).map(async (key) => {
      const path = paths[key]
      if (!record || !path || !path.startsWith(`${record.source_id}/`)) return
      const { data } = await admin.storage.from('adviser-imports').createSignedUrl(path, 600)
      if (data?.signedUrl) images[key] = data.signedUrl
    }),
  )

  return { kind: 'ready', activationId: row.id, token, expiresAt: row.expires_at, profile, record: record ?? null, prefill, images }
}

export const ACTIVATION_MESSAGES: Record<'invalid' | 'expired' | 'used', { title: string; body: string }> = {
  invalid: {
    title: 'This activation link is not valid',
    body: 'Check that the whole link was copied from the email. If it still does not work, ask the FactFind Pro team to send a new one.',
  },
  expired: {
    title: 'This activation link has expired',
    body: 'Activation links last 14 days. Ask the FactFind Pro team to send you a fresh one.',
  },
  used: {
    title: 'This account has already been activated',
    body: 'Sign in with the password you chose. If you have forgotten it, use the reset link on the sign-in page.',
  },
}

/**
 * Copies a reviewed source image from private storage into the adviser's own
 * public branding folder, returning its public URL. Nothing is published
 * unless the adviser ticked the box.
 */
async function publishImportImage(
  admin: ReturnType<typeof createAdminClient>,
  record: AdviserImport | null,
  key: 'avatar_url' | 'logo_url',
  profileId: string,
): Promise<string | null> {
  if (!record) return null
  const path = stringFields(record.asset_paths)[key]
  if (!path || !path.startsWith(`${record.source_id}/`)) return null
  const { data: blob, error } = await admin.storage.from('adviser-imports').download(path)
  if (error || !blob) return null
  const target = `${profileId}/${key === 'avatar_url' ? 'headshot' : 'logo'}-activation.png`
  const { error: uploadError } = await admin.storage
    .from('branding')
    .upload(target, blob, { contentType: blob.type || 'image/png', upsert: true, cacheControl: '3600' })
  if (uploadError) return null
  return admin.storage.from('branding').getPublicUrl(target).data.publicUrl
}

export type CompleteActivationResult =
  | { ok: true; email: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

/**
 * Turns a prepared account into a live one. Each step is safe to repeat, so a
 * second submission after a partial failure completes the remaining steps
 * rather than leaving the adviser half-activated.
 */
export async function completeActivation(values: ActivationValues): Promise<CompleteActivationResult> {
  const lookup = await loadActivation(values.token)
  if (lookup.kind !== 'ready') return { ok: false, error: `${ACTIVATION_MESSAGES[lookup.kind].title}. ${ACTIVATION_MESSAGES[lookup.kind].body}` }
  const { profile, record } = lookup
  const admin = createAdminClient()
  const nowIso = new Date().toISOString()
  const blank = (value: string | undefined) => (value?.trim() ? value.trim() : null)

  // 1. Credentials first, while the account is still banned: a failure here
  //    (for example a password Supabase rejects) leaves nothing half done.
  const { error: credentialError } = await admin.auth.admin.updateUserById(profile.id, {
    password: values.password,
    email_confirm: true,
    user_metadata: { name: values.name, company_name: values.company_name, phone: values.phone },
  })
  if (credentialError) {
    const message = credentialError.message || 'The password could not be set.'
    return /password/i.test(message)
      ? { ok: false, error: 'Please choose a different password.', fieldErrors: { password: message } }
      : { ok: false, error: message }
  }

  // 2. Branding the adviser chose to keep.
  const branding: { avatar_url?: string; logo_url?: string } = {}
  if (values.use_photo) {
    const url = await publishImportImage(admin, record, 'avatar_url', profile.id)
    if (url) branding.avatar_url = url
  }
  if (values.use_logo) {
    const url = await publishImportImage(admin, record, 'logo_url', profile.id)
    if (url) branding.logo_url = url
  }

  // 3. The profile goes live. Clearing import_pending and approving happen in
  //    the same statement, which is what the database guard requires.
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      import_pending: false,
      status: 'approved',
      approved_at: profile.approved_at ?? nowIso,
      rejected_at: null,
      rejection_reason: null,
      name: values.name,
      company_name: values.company_name,
      phone: values.phone,
      job_title: blank(values.job_title),
      website: blank(values.website),
      business_location: blank(values.business_location),
      delivery_email_copy: values.delivery_email_copy,
      delivery_client_copy: values.delivery_client_copy,
      onboarding_step: 6,
      onboarding_completed_at: profile.onboarding_completed_at ?? nowIso,
      ...branding,
    })
    .eq('id', profile.id)
  if (profileError) return { ok: false, error: `Your details could not be saved: ${profileError.message}` }

  // 4. The four reserved FactFinds become public links.
  const { error: formsError } = await admin.from('factfind_forms').update({ is_active: true }).eq('adviser_id', profile.id)
  if (formsError) return { ok: false, error: `Your FactFind links could not be switched on: ${formsError.message}` }

  // 5. Lift the authentication ban last, so nothing can sign in before the
  //    account is fully set up.
  const { error: banError } = await admin.auth.admin.updateUserById(profile.id, { ban_duration: 'none' })
  if (banError) return { ok: false, error: `Your account could not be unlocked: ${banError.message}` }

  // 6. Retire the link and record the terms that were accepted.
  await admin
    .from('adviser_activations')
    .update({ used_at: nowIso, accepted_terms_version: LEGAL.version })
    .eq('id', lookup.activationId)
  await admin.from('activity_log').insert({
    adviser_id: profile.id,
    type: 'user.activated',
    title: 'Account activated',
    description: `${values.name} activated their prepared FactFind Pro account and accepted terms v${LEGAL.version}.`,
  })

  return { ok: true, email: profile.email }
}
