import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  description?: string
  href?: string
  iconClassName?: string
  emphasis?: boolean
}

export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  href,
  iconClassName,
  emphasis = false,
}: StatCardProps) {
  const body = (
    <Card
      className={cn(
        'h-full p-5 transition-all',
        href && 'hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md',
        emphasis && 'border-accent/40 bg-accent/5',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">{value}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-strong dark:text-accent',
            iconClassName,
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  )

  if (!href) return body

  return (
    <Link href={href} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  )
}
