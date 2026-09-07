'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BRAND } from '@/lib/constants'

/**
 * Scoped to the authenticated area, so a failure in one page keeps the sidebar
 * and top bar usable instead of replacing the whole application.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Card className="p-8 text-center sm:p-12">
      <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="text-xl font-semibold tracking-tight">This page could not be loaded</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Something went wrong fetching your data. Try again — if it keeps happening, send the reference below
        to {BRAND.supportEmail} so we can find it in the logs.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </Card>
  )
}
