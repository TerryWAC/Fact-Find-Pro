'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FACTFIND_TYPES, FACTFIND_TYPE_META, SUBMISSION_STATUS_META, isFactFindType } from '@/lib/constants'
import { hasSubmissionFilters, isSubmissionStatus } from '@/lib/submission-search'
import type { SubmissionStatus } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils'

const ALL = 'all'
const STATUSES = Object.keys(SUBMISSION_STATUS_META) as SubmissionStatus[]

/** URL-based filters keep browser back/forward and bookmarked views useful. */
export function SubmissionFilters({ total }: { total: number | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const appliedQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(appliedQuery)
  const type = isFactFindType(searchParams.get('type')) ? searchParams.get('type')! : ALL
  const status = isSubmissionStatus(searchParams.get('status')) ? searchParams.get('status')! : ALL
  const sort = searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest'
  const hasFilters = hasSubmissionFilters({ q: appliedQuery, type, status })

  useEffect(() => {
    setQuery(appliedQuery)
  }, [appliedQuery])

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries({ q: query.trim(), ...updates })) {
      if (!value || value === ALL) params.delete(key)
      else params.set(key, value)
    }
    params.delete('page')
    const qs = params.toString()
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    <form
      aria-label="Filter submissions"
      aria-busy={isPending}
      onSubmit={(event) => {
        event.preventDefault()
        apply({ q: query.trim() })
      }}
    >
      <div className="flex flex-wrap gap-1 border-b px-3 py-2" role="group" aria-label="Submission status">
        {[ALL, ...STATUSES].map((value) => (
          <button
            key={value}
            type="button"
            disabled={isPending}
            aria-pressed={status === value}
            onClick={() => apply({ status: value })}
            className={cn(
              'min-h-11 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
              status === value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {value === ALL ? 'All submissions' : SUBMISSION_STATUS_META[value as SubmissionStatus].label}
          </button>
        ))}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="flex min-w-0 flex-1 gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, email or reference…"
                className="h-11 pl-9 pr-11 text-base sm:text-sm"
                aria-label="Search submissions"
                disabled={isPending}
              />
              {query && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setQuery('')
                    apply({ q: null })
                  }}
                  className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
            <Button type="submit" variant="secondary" className="h-11 px-4" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Search className="h-4 w-4" aria-hidden />
              )}
              <span className="hidden sm:inline">Search</span>
              <span className="sr-only sm:hidden">Search</span>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 xl:w-80">
            <Select value={type} disabled={isPending} onValueChange={(value) => apply({ type: value })}>
              <SelectTrigger className="h-11" aria-label="Filter by FactFind type">
                <SelectValue />
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
            <Select
              value={sort}
              disabled={isPending}
              onValueChange={(value) => apply({ sort: value === 'newest' ? null : value })}
            >
              <SelectTrigger className="h-11" aria-label="Sort submissions">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
          <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
            {isPending
              ? 'Updating results…'
              : total === null
                ? 'Results unavailable'
                : `${total} ${hasFilters ? 'matching ' : ''}submission${total === 1 ? '' : 's'}`}
          </p>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setQuery('')
                apply({ q: null, type: null, status: null })
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
