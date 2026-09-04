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
import { USER_STATUS_META } from '@/lib/constants'
import type { UserStatus } from '@/lib/supabase/database.types'

const ALL = 'all'
const STATUSES = Object.keys(USER_STATUS_META) as UserStatus[]

export function UserFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const status = searchParams.get('status') ?? ALL
  const role = searchParams.get('role') ?? ALL

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === ALL) params.delete(key)
      else params.set(key, value)
    }
    params.delete('page')

    const qs = params.toString()
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname))
  }

  const hasFilters = Boolean(searchParams.get('q') || searchParams.get('status') || searchParams.get('role'))

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
          placeholder="Search name, company or email…"
          className="pl-9"
          aria-label="Search users"
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
        <Select value={status} onValueChange={(value) => apply({ status: value })}>
          <SelectTrigger className="w-[9.5rem]" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {USER_STATUS_META[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={role} onValueChange={(value) => apply({ role: value })}>
          <SelectTrigger className="w-[8.5rem]" aria-label="Filter by role">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All roles</SelectItem>
            <SelectItem value="adviser">Adviser</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
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
              apply({ q: null, status: null, role: null })
            }}
          >
            Reset
          </Button>
        )}
      </div>
    </form>
  )
}
