import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { FACTFIND_TYPES, SUBMISSION_STATUS_META } from '@/lib/constants'
import type { SubmissionStatus } from '@/lib/supabase/database.types'

export interface AdviserStats {
  total: number | null
  byStatus: Record<SubmissionStatus, number | null>
  last30Days: number | null
}

/** Submission counts for one adviser (or for everyone when adviserId is null). */
export async function getSubmissionStats(adviserId: string | null): Promise<AdviserStats> {
  const supabase = await createClient()

  const base = () => {
    const query = supabase.from('factfind_submissions').select('id', { count: 'exact', head: true })
    return adviserId ? query.eq('adviser_id', adviserId) : query
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const statuses = Object.keys(SUBMISSION_STATUS_META) as SubmissionStatus[]
  const [totalResult, last30Result, ...statusResults] = await Promise.all([
    base(),
    base().gte('submitted_at', thirtyDaysAgo),
    ...statuses.map((status) => base().eq('status', status)),
  ])

  const byStatus = statuses.reduce(
    (acc, status, index) => {
      const result = statusResults[index]
      acc[status] = result.error ? null : result.count
      return acc
    },
    {} as Record<SubmissionStatus, number | null>,
  )

  return {
    total: totalResult.error ? null : totalResult.count,
    last30Days: last30Result.error ? null : last30Result.count,
    byStatus,
  }
}

export interface AdminStats {
  totalUsers: number | null
  pendingUsers: number | null
  approvedUsers: number | null
  rejectedUsers: number | null
  totalSubmissions: number | null
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient()

  const users = () => supabase.from('profiles').select('id', { count: 'exact', head: true })

  const [total, pending, approved, rejected, submissions] = await Promise.all([
    users(),
    users().eq('status', 'pending').eq('import_pending', false),
    users().eq('status', 'approved'),
    users().eq('status', 'rejected'),
    supabase.from('factfind_submissions').select('id', { count: 'exact', head: true }),
  ])

  return {
    totalUsers: total.error ? null : total.count,
    pendingUsers: pending.error ? null : pending.count,
    approvedUsers: approved.error ? null : approved.count,
    rejectedUsers: rejected.error ? null : rejected.count,
    totalSubmissions: submissions.error ? null : submissions.count,
  }
}

/** Recent activity entries, scoped to an adviser or across the platform. */
export async function getRecentActivity(adviserId: string | null, limit = 8) {
  const supabase = await createClient()

  let query = supabase
    .from('activity_log')
    .select('id, type, title, description, created_at, adviser_id')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (adviserId) query = query.eq('adviser_id', adviserId)

  const { data } = await query
  return data ?? []
}

/** The four FactFind links owned by an adviser, ordered consistently. */
export async function getAdviserForms(adviserId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('factfind_forms')
    .select('id, form_type, unique_slug, is_active, created_at')
    .eq('adviser_id', adviserId)

  const forms = data ?? []
  const order = new Map(FACTFIND_TYPES.map((type, index) => [type, index]))

  return [...forms].sort((a, b) => (order.get(a.form_type) ?? 0) - (order.get(b.form_type) ?? 0))
}
