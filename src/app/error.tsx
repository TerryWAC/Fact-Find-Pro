'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Once per error, reload the page instead of only offering "Try again".
 *
 * A page opened before a deployment keeps the old form action ids; when it is
 * submitted, the server answers "Failed to find Server Action" and, in
 * production, only a digest reaches the browser. "Try again" re-renders the
 * same stale page, so the user is stuck. A reload fetches the current page
 * and clears it. The guard stops a genuine error from looping.
 */
function reloadOnceFor(digest: string | undefined): boolean {
  if (typeof window === 'undefined') return false
  const key = `ffp-reloaded:${digest ?? 'no-digest'}`
  try {
    if (window.sessionStorage.getItem(key)) return false
    window.sessionStorage.setItem(key, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [reloading, setReloading] = useState(false)

  useEffect(() => {
    console.error(error)
    if (reloadOnceFor(error.digest)) setReloading(true)
  }, [error])

  if (reloading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <RefreshCw className="mb-4 h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Refreshing the page…</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. Try again, and contact support if the problem persists.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          Reload page
        </Button>
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  )
}
