'use client'

import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CopyButton } from '@/components/shared/copy-button'
import { factFindIcon } from '@/components/shared/factfind-icon'
import { FACTFIND_TYPE_META } from '@/lib/constants'
import type { FactFindType } from '@/lib/supabase/database.types'

interface LinkCardProps {
  type: FactFindType
  url: string
  isActive: boolean
}

export function LinkCard({ type, url, isActive }: LinkCardProps) {
  const meta = FACTFIND_TYPE_META[type]
  const Icon = factFindIcon(type)

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-strong dark:text-accent"
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">{meta.label}</h2>
            {isActive ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="secondary">Paused</Badge>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{meta.description}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border bg-muted/50 px-3 py-2.5">
        <p className="break-all font-mono text-xs leading-relaxed text-muted-foreground">{url}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <CopyButton value={url} className="flex-1" toastMessage={`${meta.label} link copied`} />
        <Button asChild variant="secondary" size="sm" className="flex-1">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Open
          </a>
        </Button>
      </div>
    </Card>
  )
}
