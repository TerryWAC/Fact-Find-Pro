'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser, isAdmin } from '@/lib/auth'
import { requestOrigin } from '@/lib/auth-origin'
import { inviteAdviser, nextUninvitedProfileIds } from '@/lib/adviser-activation'
import { retirementNoticeProgress, sendRetirementNotice } from '@/lib/adviser-notices'
import { emailOutcome } from '@/lib/email/outcome'
import { isThrottledError } from '@/lib/email/transport'

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
  /** Advisers still waiting after this batch, not counting those skipped this run. */
  remaining: number
  /** Profile IDs that failed in this batch; the caller passes them back so the run moves on. */
  failedIds: string[]
  /** The mail provider refused for rate or quota reasons, so the run should stop and be resumed later. */
  throttled?: boolean
  notes: string[]
}

/** The size of each bulk step; keeps every request well inside the function time limit. */
const BATCH_SIZE = 10
/** Resend accepts two requests a second; this spacing stays under it with the transport's own retry. */
const SEND_SPACING_MS = 600

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Profile IDs the client has already attempted in this run; anything odd is ignored. */
function excludedIds(input: unknown): Set<string> {
  const ids = Array.isArray(input) ? input : []
  return new Set(ids.filter((id): id is string => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)).slice(0, 5000))
}

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
export async function inviteBatchAction(exclude: string[] = []): Promise<InviteBatchResult> {
  const session = await requireAdminSession()
  if (!session) return { ok: false, error: 'You do not have permission to do that.', sent: 0, failed: 0, remaining: 0, failedIds: [], notes: [] }

  const origin = await requestOrigin()
  const skip = excludedIds(exclude)
  const { ids: candidates, remaining } = await nextUninvitedProfileIds(BATCH_SIZE + skip.size)
  const ids = candidates.filter((id) => !skip.has(id)).slice(0, BATCH_SIZE)
  let sent = 0
  let failed = 0
  let throttled = false
  const failedIds: string[] = []
  const notes: string[] = []

  for (const id of ids) {
    const result = await inviteAdviser(id, session.id, origin)
    if (result.ok && result.email?.ok) sent++
    else {
      failed++
      failedIds.push(id)
      const error = result.error ?? result.email?.error ?? 'email not accepted'
      notes.push(`${result.name ?? id}: ${error}`)
      if (isThrottledError(error)) { throttled = true; break }
    }
    await pause(SEND_SPACING_MS)
  }

  revalidatePath('/admin/imports', 'layout')
  const attempted = sent + failed
  return { ok: true, sent, failed, failedIds, throttled, remaining: Math.max(0, remaining - skip.size - attempted), notes }
}

/**
 * Sends the Version 1 retirement notice to the next batch of prepared advisers
 * who have not had it. The email log decides who is still waiting, so the
 * admin screen can call this until `remaining` is zero without duplicates.
 */
export async function noticeBatchAction(exclude: string[] = []): Promise<InviteBatchResult> {
  const session = await requireAdminSession()
  if (!session) return { ok: false, error: 'You do not have permission to do that.', sent: 0, failed: 0, remaining: 0, failedIds: [], notes: [] }

  const origin = await requestOrigin()
  const skip = excludedIds(exclude)
  const progress = await retirementNoticeProgress()
  const pending = progress.pending.filter((recipient) => !skip.has(recipient.id))
  const batch = pending.slice(0, BATCH_SIZE)
  let sent = 0
  let failed = 0
  let throttled = false
  const failedIds: string[] = []
  const notes: string[] = []

  for (const recipient of batch) {
    const result = await sendRetirementNotice(recipient, origin)
    if (result.ok && !result.skipped) sent++
    else {
      failed++
      failedIds.push(recipient.id)
      const error = result.error ?? (result.skipped ? 'template is switched off' : 'email not accepted')
      notes.push(`${recipient.name} (${recipient.email}): ${error}`)
      if (isThrottledError(error)) { throttled = true; break }
    }
    await pause(SEND_SPACING_MS)
  }

  revalidatePath('/admin/imports', 'layout')
  const attempted = sent + failed
  return { ok: true, sent, failed, failedIds, throttled, remaining: Math.max(0, pending.length - attempted), notes }
}
