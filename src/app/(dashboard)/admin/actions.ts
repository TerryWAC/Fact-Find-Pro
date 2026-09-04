'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send'
import { getBaseUrl } from '@/lib/utils'
import type { UserStatus } from '@/lib/supabase/database.types'

export interface AdminActionResult {
  ok: boolean
  error?: string
  message?: string
  processed?: number
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
    .select('id, name, company_name, email')

  if (error) return { ok: false, error: error.message }

  const loginUrl = `${getBaseUrl()}/login`
  await Promise.all(
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
  return {
    ok: true,
    processed: count,
    message: count === 1 ? 'Adviser approved and notified.' : `${count} advisers approved and notified.`,
  }
}

/** Rejects one or more registrations and emails the applicants. */
export async function rejectUsers(userIds: string[], reason?: string): Promise<AdminActionResult> {
  if (userIds.length === 0) return { ok: false, error: 'No users selected.' }

  const { supabase, adminId, error: authError } = await requireAdminClient()
  if (authError || !adminId) return { ok: false, error: authError ?? 'Not authorised.' }

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
    .select('id, name, company_name, email')

  if (error) return { ok: false, error: error.message }

  await Promise.all(
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
  return {
    ok: true,
    processed: count,
    message: count === 1 ? 'Registration rejected.' : `${count} registrations rejected.`,
  }
}

/** Suspends or reinstates an already-approved account. */
export async function setUserStatus(userId: string, status: UserStatus): Promise<AdminActionResult> {
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

  if (error) return { ok: false, error: error.message }

  revalidateAdmin()
  return { ok: true, message: 'User status updated.' }
}
