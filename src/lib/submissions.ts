import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { SUBMISSIONS_PAGE_SIZE, isFactFindType } from '@/lib/constants'
import {
  isSubmissionStatus,
  submissionPage,
  submissionSearchFilter,
  type SubmissionSearchParams,
} from '@/lib/submission-search'
import type { SubmissionRow } from '@/components/submissions/submissions-table'

export type { SubmissionSearchParams } from '@/lib/submission-search'

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
  error: boolean
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

  let page = submissionPage(searchParams.page)

  const columns = withAdviser
    ? 'id, reference, client_name, client_email, form_type, status, submitted_at, adviser:profiles!factfind_submissions_adviser_id_fkey(name, company_name)'
    : 'id, reference, client_name, client_email, form_type, status, submitted_at'

  const buildQuery = () => {
    let query = supabase
      .from('factfind_submissions')
      .select(columns, { count: 'exact' })
      .order('submitted_at', { ascending: searchParams.sort === 'oldest' })
      .order('id', { ascending: searchParams.sort === 'oldest' })

    if (adviserId) query = query.eq('adviser_id', adviserId)

    if (isFactFindType(searchParams.type)) {
      query = query.eq('form_type', searchParams.type)
    }

    if (isSubmissionStatus(searchParams.status)) {
      query = query.eq('status', searchParams.status)
    }

    const term = searchParams.q?.trim()
    if (term) {
      query = query.or(submissionSearchFilter(term))
    }
    return query
  }

  const fetchPage = (number: number) => buildQuery().range((number - 1) * pageSize, number * pageSize - 1)
  let result = await fetchPage(page)

  // A bookmarked page can disappear after filtering or deleting rows. Recover
  // to the last available page; PostgREST reports out-of-range offsets as 416.
  if (page > 1 && (result.error?.code === 'PGRST103' || (!result.error && !result.data?.length))) {
    const first = await fetchPage(1)
    if (first.error) result = first
    else {
      page = Math.max(1, Math.ceil((first.count ?? 0) / pageSize))
      result = page === 1 ? first : await fetchPage(page)
    }
  }

  const { data, count, error } = result

  if (error) {
    console.error('querySubmissions failed:', error.code)
    return { rows: [], total: 0, page, pageSize, error: true }
  }

  const rows = (
    (data ?? []) as unknown as Array<
      SubmissionRow & {
        adviser?:
          | { name: string; company_name: string | null }[]
          | { name: string; company_name: string | null }
          | null
      }
    >
  ).map((row) => ({
    ...row,
    adviser: Array.isArray(row.adviser) ? (row.adviser[0] ?? null) : (row.adviser ?? null),
  }))

  return { rows, total: count ?? 0, page, pageSize, error: false }
}
