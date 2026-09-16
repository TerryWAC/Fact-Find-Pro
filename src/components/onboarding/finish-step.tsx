'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { toast } from 'sonner'
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  Palette,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CopyButton } from '@/components/shared/copy-button'
import { factFindIcon } from '@/components/shared/factfind-icon'
import { StepShell } from './step-shell'
import { completeOnboardingAction } from '@/app/(onboarding)/onboarding/actions'
import { FACTFIND_TYPES, FACTFIND_TYPE_META } from '@/lib/constants'
import type { FactFindType } from '@/lib/supabase/database.types'

export interface FinishLink {
  type: FactFindType
  url: string
  isActive: boolean
}

export function FinishStep({
  links,
  companyName,
  adviserCopy,
  clientCopy,
}: {
  links: FinishLink[]
  companyName: string
  adviserCopy: boolean
  clientCopy: boolean
}) {
  const [pending, startTransition] = useTransition()
  const activeCount = links.filter((link) => link.isActive).length
  const allReady = FACTFIND_TYPES.every((type) =>
    links.some((link) => link.type === type && link.isActive),
  )

  return (
    <StepShell
      title="Your practice, ready for its next chapter."
      description="Review your saved choices and client links, then finish setup to open your dashboard. You can return to the guide or change your settings later."
    >
      <Card className="overflow-hidden p-0">
        <div className="border-b bg-accent/5 p-5">
          <p className="onboarding-eyebrow">Your launch checklist</p>
          <h2 className="mt-2 text-lg font-semibold">
            {allReady
              ? 'All four client links are active.'
              : `${activeCount} of four client links active.`}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {allReady
              ? 'Copy the right link below and share it when you are ready.'
              : 'Only active links can accept submissions. If a link is missing or inactive, contact platform support before sharing it.'}
          </p>
        </div>
        <dl className="divide-y px-5">
          <div className="flex items-start justify-between gap-4 py-4 text-sm">
            <dt className="flex shrink-0 items-center gap-2 text-muted-foreground">
              <Palette className="h-4 w-4" aria-hidden />
              Your practice
            </dt>
            <dd className="min-w-0 break-words text-right font-medium">
              {companyName}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-4 text-sm">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              Adviser PDF email
            </dt>
            <dd className="text-xs font-semibold">
              {adviserCopy ? 'Automatic' : 'Off'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-4 text-sm">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              Client PDF email
            </dt>
            <dd className="text-xs font-semibold">
              {clientCopy ? 'Automatic' : 'Off'}
            </dd>
          </div>
        </dl>
        <div className="border-t px-5 py-3">
          <Link
            href="/onboarding?step=4"
            className="inline-flex min-h-11 items-center gap-2 rounded text-xs font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Change delivery choices
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </Card>

      <section aria-labelledby="ready-links-title">
        <h2 id="ready-links-title" className="text-lg font-semibold">
          Your client links
        </h2>
        <p className="mb-4 mt-2 text-xs leading-relaxed text-muted-foreground">
          These open real client forms. A completed submission follows your
          saved email choices. Clients do not need an account.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {FACTFIND_TYPES.map((type) => {
            const link = links.find((entry) => entry.type === type)
            const meta = FACTFIND_TYPE_META[type]
            const Icon = factFindIcon(type)
            return (
              <Card key={type} className="flex min-w-0 flex-col p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-strong dark:text-accent">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{meta.label}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>
                </div>
                {link?.isActive ? (
                  <>
                    <p className="mb-3 mt-4 break-all rounded-lg border bg-muted/50 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                      {link.url}
                    </p>
                    <div className="mt-auto flex gap-2">
                      <CopyButton
                        value={link.url}
                        className="min-h-11 flex-1"
                        toastMessage={`${meta.label} link copied`}
                      />
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="min-h-11 flex-1"
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden />
                          Open form
                          <span className="sr-only">
                            {' '}
                            — {meta.label}, new tab
                          </span>
                        </a>
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    {link
                      ? 'Inactive — not ready to share'
                      : 'Link unavailable — contact platform support'}
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      </section>

      <div className="rounded-xl border bg-muted/30 p-5">
        <h2 className="text-sm font-semibold">
          What to do with your first submission
        </h2>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          Open it in Submissions, review the answers and download the branded
          PDF. Move it to In review while you work, then Completed when your
          review is finished.
        </p>
        <Link
          href="/onboarding?step=1#how-it-works"
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded text-xs font-medium text-accent-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-accent"
        >
          <BookOpen className="h-4 w-4" aria-hidden />
          Revisit the walkthrough
        </Link>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="outline">
          <Link href="/onboarding?step=5">Back</Link>
        </Button>
        <Button
          variant="accent"
          size="lg"
          className="h-auto min-h-12 whitespace-normal sm:min-w-[14rem]"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await completeOnboardingAction()
              if (result?.error) toast.error(result.error)
            })
          }
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          )}
          {pending ? 'Finishing…' : 'Finish and open dashboard'}
          {!pending && <ArrowRight className="h-4 w-4" aria-hidden />}
        </Button>
      </div>
    </StepShell>
  )
}
