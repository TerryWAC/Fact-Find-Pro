'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send'
import { emailOutcome } from '@/lib/email/outcome'
import { getBaseUrl } from '@/lib/utils'
import type { UserStatus } from '@/lib/supabase/database.types'

export interface AdminActionResult {
  ok: boolean
  error?: string
  message?: string
  processed?: number
  warning?: boolean
}

/** Confirms the caller is an approved admin before any privileged write. */
async function requireAdminClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { supabase, adminId: null as string | null, error: 'Your session has expired.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin' || profile.status !== 'approved') {
    return { supabase, adminId: null as string | null, error: 'You do not have permission to do that.' }
  }

  return { supabase, adminId: user.id, error: null }
}

function revalidateAdmin() {
  revalidatePath('/admin')
  revalidatePath('/admin/users')
  revalidatePath('/dashboard')
}

/**
 * Approves one or more registrations.
 *
 * The `on_profile_status_change` trigger provisions the adviser's four unique
 * FactFind links; this action then sends the approval email.
 */
export async function approveUsers(userIds: string[]): Promise<AdminActionResult> {
  if (userIds.length === 0) return { ok: false, error: 'No users selected.' }

  const { supabase, adminId, error: authError } = await requireAdminClient()
  if (authError || !adminId) return { ok: false, error: authError ?? 'Not authorised.' }
  if (userIds.includes(adminId)) return { ok: false, error: 'You cannot change your own status.' }

  const { data: updated, error } = await supabase
    .from('profiles')
    .update({
      status: 'approved' as UserStatus,
      approved_at: new Date().toISOString(),
      approved_by: adminId,
      rejected_at: null,
      rejection_reason: null,
    })
    .in('id', userIds)
    .eq('import_pending', false)
    .select('id, name, company_name, email')

  if (error) return { ok: false, error: error.message }
  if (!updated?.length) return { ok: false, error: 'No registrations were updated. Refresh and try again.' }

  const loginUrl = `${getBaseUrl()}/login`
  const notifications = await Promise.allSettled(
    (updated ?? []).map((user) =>
      sendEmail('approval', user.email, {
        name: user.name,
        company_name: user.company_name ?? '',
        login_url: loginUrl,
      }),
    ),
  )

  revalidateAdmin()

  const count = updated?.length ?? 0
  const delivery = emailOutcome(notifications, 'Approval')
  return {
    ok: true,
    processed: count,
    warning: delivery.warning,
    message: `${count === 1 ? 'Adviser approved.' : `${count} advisers approved.`} ${delivery.message}`,
  }
}

/** Rejects one or more registrations and emails the applicants. */
export async function rejectUsers(userIds: string[], reason?: string): Promise<AdminActionResult> {
  if (userIds.length === 0) return { ok: false, error: 'No users selected.' }

  const { supabase, adminId, error: authError } = await requireAdminClient()
  if (authError || !adminId) return { ok: false, error: authError ?? 'Not authorised.' }
  if (userIds.includes(adminId)) return { ok: false, error: 'You cannot change your own status.' }

  const trimmedReason = reason?.trim() || null

  const { data: updated, error } = await supabase
    .from('profiles')
    .update({
      status: 'rejected' as UserStatus,
      rejected_at: new Date().toISOString(),
      rejection_reason: trimmedReason,
      approved_at: null,
    })
    .in('id', userIds)
    .eq('import_pending', false)
    .select('id, name, company_name, email')

  if (error) return { ok: false, error: error.message }
  if (!updated?.length) return { ok: false, error: 'No registrations were updated. Refresh and try again.' }

  const notifications = await Promise.allSettled(
    (updated ?? []).map((user) =>
      sendEmail('rejection', user.email, {
        name: user.name,
        company_name: user.company_name ?? '',
        reason: trimmedReason ?? 'No further detail was provided.',
      }),
    ),
  )

  revalidateAdmin()

  const count = updated?.length ?? 0
  const delivery = emailOutcome(notifications, 'Rejection')
  return {
    ok: true,
    processed: count,
    warning: delivery.warning,
    message: `${count === 1 ? 'Registration rejected.' : `${count} registrations rejected.`} ${delivery.message}`,
  }
}

/** Retry a notification without repeating the account-status change. */
export async function resendApprovalEmail(userId: string): Promise<AdminActionResult> {
  const { supabase, adminId, error: authError } = await requireAdminClient()
  if (authError || !adminId) return { ok: false, error: authError ?? 'Not authorised.' }
  const { data: user, error } = await supabase.from('profiles')
    .select('name, company_name, email').eq('id', userId).eq('status', 'approved').eq('role', 'adviser').eq('import_pending', false).maybeSingle()
  if (error || !user) return { ok: false, error: 'Approved adviser not found.' }
  const results = await Promise.allSettled([sendEmail('approval', user.email, {
    name: user.name, company_name: user.company_name ?? '', login_url: `${getBaseUrl()}/login`,
  })])
  return { ok: true, ...emailOutcome(results, 'Approval') }
}

/** Suspends or reinstates an already-approved account. */
export async function setUserStatus(userId: string, status: UserStatus): Promise<AdminActionResult> {
  if (!['approved', 'suspended'].includes(status)) return { ok: false, error: 'Choose Suspend or Reinstate.' }
  const { supabase, adminId, error: authError } = await requireAdminClient()
  if (authError || !adminId) return { ok: false, error: authError ?? 'Not authorised.' }

  if (userId === adminId) return { ok: false, error: 'You cannot change your own status.' }

  const { error } = await supabase
    .from('profiles')
    .update({
      status,
      ...(status === 'approved'
        ? { approved_at: new Date().toISOString(), approved_by: adminId, rejected_at: null }
        : {}),
    })
    .eq('id', userId)
    .eq('import_pending', false)

  if (error) return { ok: false, error: error.message }

  revalidateAdmin()
  return { ok: true, message: 'User status updated.' }
}
