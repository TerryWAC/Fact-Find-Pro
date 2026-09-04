'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FACTFIND_TYPES, FACTFIND_TYPE_META, SUBMISSION_STATUS_META } from '@/lib/constants'
import type { SubmissionStatus } from '@/lib/supabase/database.types'

const ALL = 'all'
const STATUSES = Object.keys(SUBMISSION_STATUS_META) as SubmissionStatus[]

/**
 * Search + filter bar for the submissions table. Writes to the URL so the
 * server component can do the filtering, and every view is shareable.
 */
export function SubmissionFilters({ showAdviserSearch = false }: { showAdviserSearch?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const type = searchParams.get('type') ?? ALL
  const status = searchParams.get('status') ?? ALL

  // Keep the input in sync when the URL changes underneath us (e.g. Reset).
  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())

    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === ALL) params.delete(key)
      else params.set(key, value)
    }
    // Any filter change resets pagination.
    params.delete('page')

    const qs = params.toString()
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname))
  }

  const hasFilters = Boolean(searchParams.get('q') || searchParams.get('type') || searchParams.get('status'))

  return (
    <form
      className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center"
      onSubmit={(event) => {
        event.preventDefault()
        apply({ q: query.trim() || null })
      }}
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            showAdviserSearch
              ? 'Search client name, email or reference…'
              : 'Search by client name or email…'
          }
          className="pl-9"
          aria-label="Search submissions"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              apply({ q: null })
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={type} onValueChange={(value) => apply({ type: value })}>
          <SelectTrigger className="w-[9.5rem]" aria-label="Filter by FactFind type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {FACTFIND_TYPES.map((value) => (
              <SelectItem key={value} value={value}>
                {FACTFIND_TYPE_META[value].shortLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(value) => apply({ status: value })}>
          <SelectTrigger className="w-[9.5rem]" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {SUBMISSION_STATUS_META[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="submit" variant="secondary" size="icon" aria-label="Search" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('')
              apply({ q: null, type: null, status: null })
            }}
          >
            Reset
          </Button>
        )}
      </div>
    </form>
  )
}
