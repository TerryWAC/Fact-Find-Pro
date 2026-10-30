import Link from 'next/link'
import { ArrowRight, Inbox } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CopyButton } from '@/components/shared/copy-button'
import { factFindIcon } from '@/components/shared/factfind-icon'
import { FACTFIND_TYPE_META, FACTFIND_TYPES, factFindUrl } from '@/lib/constants'
import type { FactFindTypeStats } from '@/lib/queries'
import type { FactFindType } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils'

interface FactFindOverviewProps {
  stats: Record<FactFindType, FactFindTypeStats>
  forms: { form_type: FactFindType; unique_slug: string; is_active: boolean }[]
  baseUrl: string
}

const show = (value: number | null) => (value === null ? '—' : value)

/**
 * One card per FactFind on the adviser dashboard: what has come in through
 * that link, what still needs a review, and the link itself ready to share.
 */
export function FactFindOverview({ stats, forms, baseUrl }: FactFindOverviewProps) {
  const anyUnavailable = FACTFIND_TYPES.some((type) => Object.values(stats[type]).some((value) => value === null))

  return (
    <section className="space-y-4" aria-labelledby="factfind-overview-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="factfind-overview-title" className="text-lg font-semibold">Your FactFinds</h2>
          <p className="mt-1 text-sm text-muted-foreground">How each of your four client forms is doing, with its link ready to share.</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="-mr-3">
          <Link href="/links">All links<ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </Button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {FACTFIND_TYPES.map((type) => {
          const meta = FACTFIND_TYPE_META[type]
          const Icon = factFindIcon(type)
          const form = forms.find((entry) => entry.form_type === type)
          const url = form ? factFindUrl(baseUrl, type, form.unique_slug) : null
          const counts = stats[type]
          const waiting = counts.needsReview !== null && counts.needsReview > 0
          return (
            <li key={type} className="min-w-0">
              <Card
                className={cn('flex h-full flex-col p-5', waiting && 'border-accent/40')}
                data-testid={`factfind-card-${type}`}
                aria-labelledby={`factfind-card-${type}-title`}
                role="group"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-strong dark:text-accent" aria-hidden>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 id={`factfind-card-${type}-title`} className="text-sm font-semibold">{meta.label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {!form ? <Badge variant="secondary">Link not ready</Badge> : form.is_active ? <Badge variant="success">Live</Badge> : <Badge variant="secondary">Paused</Badge>}
                    </p>
                  </div>
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/50 px-2 py-3">
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Received</dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums">{show(counts.total)}</dd>
                  </div>
                  <div className={cn('rounded-lg px-2 py-3', waiting ? 'bg-accent/10' : 'bg-muted/50')}>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">To review</dt>
                    <dd className={cn('mt-1 text-xl font-semibold tabular-nums', waiting && 'text-accent-strong dark:text-accent')}>{show(counts.needsReview)}</dd>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-2 py-3">
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Completed</dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums">{show(counts.completed)}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-col gap-2 border-t pt-4">
                  <Button asChild variant={waiting ? 'default' : 'outline'} size="sm" className="w-full">
                    <Link href={waiting ? `/submissions?type=${type}&status=new&sort=oldest` : `/submissions?type=${type}`}>
                      <Inbox className="h-4 w-4" aria-hidden />
                      {waiting ? `Review ${counts.needsReview} waiting` : `View ${meta.shortLabel} submissions`}
                    </Link>
                  </Button>
                  {url && (
                    <CopyButton value={url} variant="ghost" className="w-full" label={`Copy ${meta.shortLabel} link`} toastMessage={`${meta.label} link copied`} />
                  )}
                </div>
              </Card>
            </li>
          )
        })}
      </ul>
      {anyUnavailable && (
        <p role="status" className="text-sm text-muted-foreground">Some FactFind totals are temporarily unavailable.</p>
      )}
    </section>
  )
}
