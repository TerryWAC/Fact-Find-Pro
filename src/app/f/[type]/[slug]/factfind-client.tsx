'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  LockKeyhole,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react'
import { FactFindForm } from '@/components/forms/factfind-form'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/shared/copy-button'
import { AdviserContact } from '@/components/public/adviser-contact'
import type { PracticeDetails } from '@/lib/practice'
import { submitFactFind } from '@/app/f/actions'
import type { FormSchema } from '@/lib/forms/types'
import type { FactFindType } from '@/lib/supabase/database.types'

interface FactFindClientProps {
  schema: FormSchema
  formType: FactFindType
  slug: string
  adviserName: string
  companyName: string | null
  adviserPhotoUrl?: string | null
  practice?: PracticeDetails
  previewOnly?: boolean
}

const PREPARATION: Record<FactFindType, string[]> = {
  mortgage: [
    'Your income and regular outgoings',
    'Details of your property or mortgage',
    'Any existing protection policies',
  ],
  protection: [
    'Your income and regular outgoings',
    'Your family and employment details',
    'Any existing protection policies',
  ],
  medical: [
    'Your medical history and medication',
    'Your family health history',
    'Your GP’s contact details',
  ],
  home: [
    'Your property and security details',
    'The cover you would like',
    'Details of any previous claims',
  ],
}

export function FactFindClient({
  schema,
  formType,
  slug,
  adviserName,
  companyName,
  adviserPhotoUrl,
  practice = {},
  previewOnly = false,
}: FactFindClientProps) {
  const [started, setStarted] = useState(false)
  const [reference, setReference] = useState<string | null>(null)
  const successRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (reference) {
      successRef.current?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [reference])

  const adviser = (
    <div className="flex min-w-0 items-start gap-3">
      {adviserPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- adviser-supplied image
        <img
          src={adviserPhotoUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-full border object-cover"
          data-testid="adviser-photo"
        />
      ) : (
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-sm font-semibold text-accent-strong dark:text-accent"
          aria-hidden="true"
        >
          {adviserName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((name) => name[0])
            .join('')}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Your adviser
        </p>
        <p className="mt-1 break-words text-sm font-semibold">{adviserName}</p>
        {companyName && (
          <p className="mt-0.5 break-words text-xs text-muted-foreground">{companyName}</p>
        )}
        <AdviserContact details={practice} />
      </div>
    </div>
  )

  if (reference) {
    return (
      <div className="factfind-experience mx-auto w-full max-w-2xl py-4 sm:py-10">
        <div className="factfind-complete-card overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="px-6 pb-8 pt-10 text-center sm:px-12">
            <span className="factfind-complete-seal mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </span>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-success">
              FactFind complete
            </p>
            <h1
              ref={successRef}
              tabIndex={-1}
              className="text-3xl font-semibold tracking-tight outline-none"
            >
              You’re all done. Thank you.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Your {formType} FactFind has been submitted to {adviserName}. There’s nothing more to
              fill in.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-muted/40 p-5 text-left">
              <div>
                <p className="text-xs text-muted-foreground">Your reference</p>
                <p className="mt-1 font-mono text-xl font-semibold tracking-wide">{reference}</p>
              </div>
              <CopyButton
                value={reference}
                label="Copy reference"
                toastMessage="Reference copied"
              />
            </div>
          </div>
          <div className="border-t bg-muted/20 p-6 sm:px-12 sm:py-8">
            <h2 className="mb-5 text-sm font-semibold">What happens next?</h2>
            <div className="flex gap-3">
              <ClipboardCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-accent-strong dark:text-accent"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium">Your adviser reviews your details</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  They’ll use your answers to prepare for your conversation.
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <MessageSquare
                className="mt-0.5 h-5 w-5 shrink-0 text-accent-strong dark:text-accent"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium">You’ll discuss the next steps</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Need to change something? Contact your adviser and quote your reference.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-xl border bg-card p-5">{adviser}</div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          You can now safely close this tab.
        </p>
      </div>
    )
  }

  if (started) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-5 border-b pb-7">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-strong dark:text-accent">
              Let’s make a start
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{schema.title}</h1>
          </div>
          {adviser}
        </header>
        <FactFindForm
          schema={schema}
          slug={slug}
          formType={formType}
          adviserName={adviserName}
          onSubmitAction={previewOnly ? async () => ({ ok: false, error: 'This is an admin preview. No submission was saved and no email was sent.' }) : submitFactFind}
          onComplete={setReference}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl py-3 sm:py-8">
      <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        <div>
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border bg-card px-3.5 py-2 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {schema.title}
            {schema.placeholder && <span className="text-muted-foreground"> · Preview</span>}
          </div>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Good advice starts{' '}
            <span className="text-accent-strong dark:text-accent">with you.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
            {schema.subtitle ??
              'Help your adviser understand what matters to you, one step at a time.'}
          </p>
          <div className="mt-8 border-l-2 border-accent/40 pl-5">{adviser}</div>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              onClick={() => setStarted(true)}
              className="h-13 min-h-12 w-full px-7 sm:w-auto"
            >
              Start your FactFind <ArrowRight aria-hidden="true" />
            </Button>
            {schema.estimatedMinutes && (
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                About {schema.estimatedMinutes} minutes
              </span>
            )}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            No account needed. You can check everything before you send.
          </p>
        </div>
        <div className="relative rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-7 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent-strong dark:text-accent">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold tracking-tight">A little preparation helps</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Have these details to hand if you can:
          </p>
          <ul className="my-6 space-y-4">
            {PREPARATION[formType].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong dark:text-accent"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-muted/60 p-4">
            <p className="text-xs font-medium">One section at a time</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              We’ll guide you through the questions and skip sections that don’t apply. Keep this
              tab open: your answers are saved when you submit.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-12 grid gap-6 border-t pt-7 sm:mt-16 sm:grid-cols-3 sm:gap-10">
        {[
          {
            icon: FileText,
            title: 'Tell us about you',
            text: 'Simple sections to build a picture of your circumstances.',
          },
          {
            icon: ClipboardCheck,
            title: 'Review at your pace',
            text: 'Check your answers and make changes before sending.',
          },
          {
            icon: ShieldCheck,
            title: 'Ready for your adviser',
            text: 'Your completed FactFind goes to your adviser for review.',
          },
        ].map(({ icon: Icon, title, text }, index) => (
          <div key={title} className="flex gap-3">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div>
              <h2 className="text-xs font-semibold">
                <span className="mr-2 text-muted-foreground">0{index + 1}</span>
                {title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
        Prepared for your conversation. Handled with care.
      </p>
    </div>
  )
}
