import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { FACTFIND_TYPES } from '@/lib/constants'
import type { FactFindType } from '@/lib/supabase/database.types'

export interface AdviserStats {
  total: number
  byType: Record<FactFindType, number>
  last30Days: number
}

/** Submission counts for one adviser (or for everyone when adviserId is null). */
export async function getSubmissionStats(adviserId: string | null): Promise<AdviserStats> {
  const supabase = await createClient()

  const base = () => {
    const query = supabase.from('factfind_submissions').select('id', { count: 'exact', head: true })
    return adviserId ? query.eq('adviser_id', adviserId) : query
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [totalResult, last30Result, ...typeResults] = await Promise.all([
    base(),
    base().gte('submitted_at', thirtyDaysAgo),
    ...FACTFIND_TYPES.map((type) => base().eq('form_type', type)),
  ])

  const byType = FACTFIND_TYPES.reduce(
    (acc, type, index) => {
      acc[type] = typeResults[index]?.count ?? 0
      return acc
    },
    {} as Record<FactFindType, number>,
  )

  return {
    total: totalResult.count ?? 0,
    last30Days: last30Result.count ?? 0,
    byType,
  }
}

export interface AdminStats {
  totalUsers: number
  pendingUsers: number
  approvedUsers: number
  rejectedUsers: number
  totalSubmissions: number
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient()

  const users = () => supabase.from('profiles').select('id', { count: 'exact', head: true })

  const [total, pending, approved, rejected, submissions] = await Promise.all([
    users(),
    users().eq('status', 'pending'),
    users().eq('status', 'approved'),
    users().eq('status', 'rejected'),
    supabase.from('factfind_submissions').select('id', { count: 'exact', head: true }),
  ])

  return {
    totalUsers: total.count ?? 0,
    pendingUsers: pending.count ?? 0,
    approvedUsers: approved.count ?? 0,
    rejectedUsers: rejected.count ?? 0,
    totalSubmissions: submissions.count ?? 0,
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
