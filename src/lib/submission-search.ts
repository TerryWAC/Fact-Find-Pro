import { isFactFindType, SUBMISSION_STATUS_META } from '@/lib/constants'
import type { SubmissionStatus } from '@/lib/supabase/database.types'
import { textSearchFilter } from './postgrest-search'

export interface SubmissionSearchParams {
  q?: string
  type?: string
  status?: string
  sort?: string
  page?: string
}

export function isSubmissionStatus(value: string | undefined | null): value is SubmissionStatus {
  return !!value && Object.hasOwn(SUBMISSION_STATUS_META, value)
}

export function hasSubmissionFilters(params: SubmissionSearchParams): boolean {
  return Boolean(params.q?.trim() || isFactFindType(params.type) || isSubmissionStatus(params.status))
}

/** Escape SQL LIKE wildcards, then quote the value for PostgREST's OR grammar. */
export function submissionSearchFilter(term: string): string {
  return textSearchFilter(['client_name', 'client_email', 'reference'], term)
}

export function submissionPage(value: string | undefined): number {
  const page = Number(value)
  return Number.isSafeInteger(page) && page > 0 ? Math.min(page, 1_000_000) : 1
}
