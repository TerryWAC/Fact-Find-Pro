import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { SUBMISSIONS_PAGE_SIZE, isFactFindType } from '@/lib/constants'
import type { SubmissionStatus } from '@/lib/supabase/database.types'
import { escapeLike } from '@/lib/utils'
import type { SubmissionRow } from '@/components/submissions/submissions-table'

const SUBMISSION_STATUSES: SubmissionStatus[] = ['new', 'in_review', 'completed', 'archived']

export interface SubmissionSearchParams {
  q?: string
  type?: string
  status?: string
  page?: string
}

export interface SubmissionQueryOptions {
  /** Restrict to one adviser. `null` returns every submission (admin view). */
  adviserId: string | null
  searchParams: SubmissionSearchParams
  withAdviser?: boolean
  pageSize?: number
}

export interface SubmissionQueryResult {
  rows: SubmissionRow[]
  total: number
  page: number
  pageSize: number
}

/**
 * Search, filter and paginate submissions.
 *
 * Filtering happens in Postgres under RLS: an adviser can only ever read their
 * own rows, regardless of what is passed in.
 */
export async function querySubmissions({
  adviserId,
  searchParams,
  withAdviser = false,
  pageSize = SUBMISSIONS_PAGE_SIZE,
}: SubmissionQueryOptions): Promise<SubmissionQueryResult> {
  const supabase = await createClient()

  const page = Math.max(1, Number.parseInt(searchParams.page ?? '1', 10) || 1)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const columns = withAdviser
    ? 'id, reference, client_name, client_email, form_type, status, submitted_at, adviser:profiles!factfind_submissions_adviser_id_fkey(name, company_name)'
    : 'id, reference, client_name, client_email, form_type, status, submitted_at'

  let query = supabase
    .from('factfind_submissions')
    .select(columns, { count: 'exact' })
    .order('submitted_at', { ascending: false })
    .range(from, to)

  if (adviserId) query = query.eq('adviser_id', adviserId)

  if (isFactFindType(searchParams.type)) {
    query = query.eq('form_type', searchParams.type)
  }

  if (searchParams.status && SUBMISSION_STATUSES.includes(searchParams.status as SubmissionStatus)) {
    query = query.eq('status', searchParams.status as SubmissionStatus)
  }

  const term = searchParams.q?.trim()
  if (term) {
    const safe = escapeLike(term)
    query = query.or(
      `client_name.ilike.%${safe}%,client_email.ilike.%${safe}%,reference.ilike.%${safe}%`,
    )
  }

  const { data, count, error } = await query

  if (error) {
    // Surfacing an empty result beats a 500 on a filter typo.
    console.error('querySubmissions failed:', error.message)
    return { rows: [], total: 0, page, pageSize }
  }

  const rows = ((data ?? []) as unknown as Array<
    SubmissionRow & { adviser?: { name: string; company_name: string | null }[] | { name: string; company_name: string | null } | null }
  >).map((row) => ({
    ...row,
    adviser: Array.isArray(row.adviser) ? (row.adviser[0] ?? null) : (row.adviser ?? null),
  }))

  return { rows, total: count ?? 0, page, pageSize }
}
