'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { ArrowRight, CheckCircle2, ExternalLink, Loader2, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CopyButton } from '@/components/shared/copy-button'
import { factFindIcon } from '@/components/shared/factfind-icon'
import { StepShell } from './step-shell'
import { completeOnboardingAction } from '@/app/(onboarding)/onboarding/actions'
import { FACTFIND_TYPE_META } from '@/lib/constants'
import type { ChecklistTask } from '@/lib/onboarding'
import type { FactFindType } from '@/lib/supabase/database.types'

export interface FinishLink {
  type: FactFindType
  url: string
}

export function FinishStep({ links, tasks }: { links: FinishLink[]; tasks: ChecklistTask[] }) {
  const [pending, startTransition] = useTransition()

  const done = tasks.filter((task) => task.done && task.step !== 6).length
  const total = tasks.length - 1

  return (
    <StepShell
      title="You are live"
      description="These are your unique client links. Send one to a client and their answers come straight back to you — nobody else can see them."
    >
      <Card className="flex items-start gap-4 border-accent/40 bg-accent/5 p-5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <PartyPopper className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium">Setup complete</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {done} of {total} setup steps done. Anything you skipped can be finished later in Settings.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((link) => {
          const meta = FACTFIND_TYPE_META[link.type]
          const Icon = factFindIcon(link.type)

          return (
            <Card key={link.type} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-strong dark:text-accent">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{meta.description}</p>
                </div>
              </div>

              <p className="mt-3 break-all rounded-lg border bg-muted/50 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {link.url}
              </p>

              <div className="mt-3 flex gap-2">
                <CopyButton value={link.url} className="flex-1" toastMessage={`${meta.label} link copied`} />
                <Button asChild variant="secondary" size="sm" className="flex-1">
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Preview
                  </a>
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {links.length === 0 && (
        <Card className="p-6 text-sm text-muted-foreground">
          Your client links are still being generated. They appear under My FactFind Links shortly after your
          account is approved.
        </Card>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="outline">
          <Link href="/onboarding?step=5">Back</Link>
        </Button>

        <Button
          variant="accent"
          size="lg"
          className="sm:min-w-[14rem]"
          disabled={pending}
          onClick={() => startTransition(async () => void (await completeOnboardingAction()))}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {pending ? 'Finishing…' : 'Finish and go to dashboard'}
          {!pending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </StepShell>
  )
}
