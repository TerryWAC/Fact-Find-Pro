'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser, isAdmin } from '@/lib/auth'
import { requestOrigin } from '@/lib/auth-origin'
import { inviteAdviser, nextUninvitedProfileIds } from '@/lib/adviser-activation'
import { retirementNoticeProgress, sendRetirementNotice } from '@/lib/adviser-notices'
import { emailOutcome } from '@/lib/email/outcome'

export interface InviteActionResult {
  ok: boolean
  error?: string
  message?: string
  warning?: boolean
  /** The one-time link, for passing on by hand when email is not an option. */
  activationUrl?: string
}

export interface InviteBatchResult {
  ok: boolean
  error?: string
  /** Links issued in this batch. */
  sent: number
  /** Advisers whose link could not be issued or emailed in this batch. */
  failed: number
  /** Prepared advisers still waiting for a first link after this batch. */
  remaining: number
  notes: string[]
}

/** The size of each bulk step; keeps every request well inside the function time limit. */
const BATCH_SIZE = 10

async function requireAdminSession() {
  const session = await getSessionUser()
  if (!session || !isAdmin(session.profile)) return null
  return session
}

/** Issues and emails an activation link to one prepared adviser. */
export async function inviteAdviserAction(profileId: string): Promise<InviteActionResult> {
  const session = await requireAdminSession()
  if (!session) return { ok: false, error: 'You do not have permission to do that.' }
  if (!/^[0-9a-f-]{36}$/i.test(profileId)) return { ok: false, error: 'Unknown adviser.' }

  const result = await inviteAdviser(profileId, session.id, await requestOrigin())
  revalidatePath('/admin/imports', 'layout')
  if (!result.ok) return { ok: false, error: result.error }

  const delivery = emailOutcome([{ status: 'fulfilled', value: result.email! }], 'Activation')
  return {
    ok: true,
    activationUrl: result.activationUrl,
    warning: delivery.warning,
    message: `Activation link issued for ${result.name} (${result.to}). ${delivery.message}`,
  }
}

/**
 * Invites the next batch of prepared advisers who have never been sent a link.
 * The admin screen calls this repeatedly until `remaining` is zero, so a long
 * list is handled in short requests and progress is visible throughout.
 */
export async function inviteBatchAction(): Promise<InviteBatchResult> {
  const session = await requireAdminSession()
  if (!session) return { ok: false, error: 'You do not have permission to do that.', sent: 0, failed: 0, remaining: 0, notes: [] }

  const origin = await requestOrigin()
  const { ids, remaining } = await nextUninvitedProfileIds(BATCH_SIZE)
  let sent = 0
  let failed = 0
  const notes: string[] = []

  for (const id of ids) {
    const result = await inviteAdviser(id, session.id, origin)
    if (result.ok && result.email?.ok) sent++
    else {
      failed++
      notes.push(`${result.name ?? id}: ${result.error ?? result.email?.error ?? 'email not accepted'}`)
    }
    // Space the sends out so the mail provider's per-second limit is never hit.
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  revalidatePath('/admin/imports', 'layout')
  return { ok: true, sent, failed, remaining: Math.max(0, remaining - ids.length), notes }
}

/**
 * Sends the Version 1 retirement notice to the next batch of prepared advisers
 * who have not had it. The email log decides who is still waiting, so the
 * admin screen can call this until `remaining` is zero without duplicates.
 */
export async function noticeBatchAction(): Promise<InviteBatchResult> {
  const session = await requireAdminSession()
  if (!session) return { ok: false, error: 'You do not have permission to do that.', sent: 0, failed: 0, remaining: 0, notes: [] }

  const origin = await requestOrigin()
  const progress = await retirementNoticeProgress()
  const batch = progress.pending.slice(0, BATCH_SIZE)
  let sent = 0
  let failed = 0
  const notes: string[] = []

  for (const recipient of batch) {
    const result = await sendRetirementNotice(recipient, origin)
    if (result.ok && !result.skipped) sent++
    else {
      failed++
      notes.push(`${recipient.name} (${recipient.email}): ${result.error ?? (result.skipped ? 'template is switched off' : 'email not accepted')}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  revalidatePath('/admin/imports', 'layout')
  return { ok: true, sent, failed, remaining: Math.max(0, progress.pending.length - batch.length), notes }
}
