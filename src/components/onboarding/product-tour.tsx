'use client'

import { useRef, useState, type CSSProperties } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Link2,
  ListChecks,
  LockKeyhole,
  Mail,
  Palette,
  UserRound,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SectionDepth } from '@/components/forms/section-depth'
import { FACTFIND_TYPES, FACTFIND_TYPE_META } from '@/lib/constants'
import { factFindIcon } from '@/components/shared/factfind-icon'
import { brandCssVars, brandTheme } from '@/lib/branding'
import type { FactFindType } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils'

const CHAPTERS = [
  {
    id: 'brand',
    label: 'Brand',
    icon: Palette,
    title: 'Make the first impression yours.',
    description:
      'Add your firm name, logo, adviser photo and colours. Your client forms and PDF copies carry your practice’s identity.',
    points: [
      'Your details introduce you before the first question.',
      'Update your branding later in Settings.',
    ],
  },
  {
    id: 'links',
    label: 'Links',
    icon: Link2,
    title: 'The right questions. One link.',
    description:
      'Choose Mortgage, Protection, Medical or Home from My FactFind Links. Copy your link and share it with the client through your usual channel.',
    points: [
      'Each form has its own reusable link.',
      'Clients open the link without creating an account.',
    ],
  },
  {
    id: 'questions',
    label: 'Fill in',
    icon: ListChecks,
    title: 'A guided conversation, at their pace.',
    description:
      'Clients work through clear sections and check their answers before sending. Conditional questions adapt to the answers they give.',
    points: [
      'In Mortgage and Protection, choose Adviser when you are completing the form together.',
      'Adviser-only sections stay out of the client PDF copy.',
    ],
  },
  {
    id: 'review',
    label: 'Review',
    icon: ClipboardCheck,
    title: 'Every completed FactFind, in one place.',
    description:
      'New submissions arrive in your dashboard. Open a record, review the answers, download its PDF and move it from New to In review to Completed.',
    points: [
      'Search by client, form type or reference.',
      'Your adviser workspace holds your own client records.',
    ],
  },
  {
    id: 'emails',
    label: 'Emails',
    icon: Mail,
    title: 'You choose who receives a copy.',
    description:
      'Your saved delivery preferences control automatic PDF emails when a FactFind is submitted. You can also email a client copy from a submission when needed.',
    points: [
      'Client emails use your branding and replies go to you.',
      'Sending uses the FactFind email domain; your own email domain is not required.',
    ],
  },
] as const

interface ProductTourProps {
  companyName: string
  adviserName: string
  brandColour?: string | null
  adviserCopy: boolean
  clientCopy: boolean
}

export function ProductTour({
  companyName,
  adviserName,
  brandColour,
  adviserCopy,
  clientCopy,
}: ProductTourProps) {
  const [chapter, setChapter] = useState<string>('brand')
  const [formType, setFormType] = useState<FactFindType>('mortgage')
  const [adviserMode, setAdviserMode] = useState(false)
  const [joint, setJoint] = useState(false)
  const chapterTabs = useRef<Array<HTMLButtonElement | null>>([])
  const index = CHAPTERS.findIndex((entry) => entry.id === chapter)
  const theme = brandTheme(brandColour)
  const firm = companyName || adviserName || 'Your practice'

  function goToChapter(nextIndex: number) {
    setChapter(CHAPTERS[nextIndex].id)
    // The previous panel unmounts; keep keyboard focus on the new chapter.
    chapterTabs.current[nextIndex]?.focus({ preventScroll: true })
  }

  return (
    <section
      id="how-it-works"
      aria-labelledby="product-tour-title"
      className="scroll-mt-24"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="onboarding-eyebrow">The client journey</p>
          <h2
            id="product-tour-title"
            className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            See how it all connects.
          </h2>
        </div>
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
          Interactive walkthrough. Nothing here creates a submission or sends an
          email.
        </p>
      </div>
      <Tabs
        value={chapter}
        onValueChange={setChapter}
        className="onboarding-tour overflow-hidden rounded-2xl border bg-card"
      >
        <TabsList
          aria-label="How FactFind Pro works"
          className="grid h-auto w-full grid-cols-5 gap-1 rounded-none border-b bg-muted/30 p-2 sm:p-3"
        >
          {CHAPTERS.map(({ id, label, icon: Icon }, n) => (
            <TabsTrigger
              key={id}
              ref={(element) => {
                chapterTabs.current[n] = element
              }}
              value={id}
              className="min-h-14 min-w-0 flex-col gap-1.5 px-1 text-[11px] sm:flex-row sm:gap-2 sm:text-xs"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span>
                <span className="hidden sm:inline">0{n + 1} · </span>
                {label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        {CHAPTERS.map((entry, n) => (
          <TabsContent key={entry.id} value={entry.id} className="m-0">
            <div className="grid lg:min-h-[410px] lg:grid-cols-[1fr_1.1fr]">
              <div className="flex flex-col p-5 sm:p-8 lg:p-9">
                <p className="onboarding-eyebrow">0{n + 1} / 05</p>
                <h3 className="mt-4 max-w-sm text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                  {entry.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {entry.description}
                </p>
                <ul className="mb-6 mt-5 space-y-3">
                  {entry.points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-2.5 text-xs leading-relaxed"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong dark:text-accent"
                        aria-hidden
                      />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between gap-2 border-t pt-5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-11"
                    disabled={index === 0}
                    onClick={() => goToChapter(index - 1)}
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Previous
                  </Button>
                  {index < CHAPTERS.length - 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-11"
                      onClick={() => goToChapter(index + 1)}
                    >
                      Next: {CHAPTERS[index + 1].label}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-11"
                      onClick={() => goToChapter(0)}
                    >
                      Replay tour
                    </Button>
                  )}
                </div>
              </div>
              <div
                className="onboarding-tour-scene flex items-center justify-center border-t px-5 py-8 sm:px-8 lg:border-l lg:border-t"
                style={brandCssVars(theme) as CSSProperties}
              >
                <div
                  className="onboarding-demo relative w-full max-w-sm"
                  key={entry.id}
                >
                  <div className="onboarding-demo-card relative rounded-2xl border bg-card p-5 shadow-xl shadow-black/5 sm:p-6">
                    {entry.id === 'brand' && (
                      <>
                        <div
                          className="-mx-5 -mt-5 flex min-h-16 items-center gap-3 rounded-t-2xl px-5 py-4 sm:-mx-6 sm:-mt-6 sm:px-6"
                          style={{
                            backgroundColor: theme.colour,
                            color: theme.onColour,
                          }}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/20 text-sm font-semibold">
                            {firm.trim().charAt(0).toUpperCase()}
                          </span>
                          <p className="min-w-0 break-words text-sm font-semibold">
                            {firm}
                          </p>
                        </div>
                        <div className="mt-6 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              Your client experience
                            </p>
                            <p className="mt-3 text-2xl font-semibold leading-tight tracking-tight">
                              Good advice
                              <br />
                              starts with you.
                            </p>
                          </div>
                          <SectionDepth number={1} />
                        </div>
                        <div className="my-5 h-px bg-border" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Your adviser
                        </p>
                        <p className="mt-1 break-words text-sm font-medium">
                          {adviserName}
                        </p>
                        <div className="mt-5 flex items-center justify-between rounded-lg bg-primary px-4 py-3 text-xs font-medium text-primary-foreground">
                          <span>Your branded FactFind</span>
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </div>
                      </>
                    )}
                    {entry.id === 'links' && (
                      <>
                        <p className="text-sm font-semibold">
                          Choose a FactFind
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Try the example selector.
                        </p>
                        <div className="my-5 grid grid-cols-2 gap-2">
                          {FACTFIND_TYPES.map((type) => {
                            const Icon = factFindIcon(type)
                            return (
                              <button
                                key={type}
                                type="button"
                                aria-pressed={formType === type}
                                onClick={() => setFormType(type)}
                                className={cn(
                                  'onboarding-demo-choice min-h-20 rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                  formType === type &&
                                    'border-accent bg-accent/10',
                                )}
                              >
                                <Icon
                                  className="mb-2 h-5 w-5 text-accent-strong dark:text-accent"
                                  aria-hidden
                                />
                                <span className="text-xs font-medium">
                                  {FACTFIND_TYPE_META[type].shortLabel}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                        <div
                          className="rounded-lg bg-muted/50 p-4"
                          role="status"
                        >
                          <p className="text-xs font-semibold">
                            {FACTFIND_TYPE_META[formType].label}
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {FACTFIND_TYPE_META[formType].description}
                          </p>
                        </div>
                      </>
                    )}
                    {entry.id === 'questions' && (
                      <>
                        <p className="text-sm font-semibold">
                          A Mortgage example
                        </p>
                        <div
                          className="mt-4 grid grid-cols-2 gap-2"
                          aria-label="Example completion mode"
                        >
                          {[false, true].map((mode) => (
                            <button
                              key={String(mode)}
                              type="button"
                              aria-pressed={adviserMode === mode}
                              onClick={() => setAdviserMode(mode)}
                              className={cn(
                                'min-h-11 rounded-lg border px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                adviserMode === mode &&
                                  'border-accent bg-accent/10',
                              )}
                            >
                              {mode ? 'Adviser completes' : 'Client completes'}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          aria-pressed={joint}
                          onClick={() => setJoint((value) => !value)}
                          className="mt-4 flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border px-3 text-left text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4" aria-hidden />
                            Joint application
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-1 text-[10px]',
                              joint
                                ? 'bg-accent/15 text-accent-strong dark:text-accent'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {joint ? 'Yes' : 'No'}
                          </span>
                        </button>
                        <div className="mt-4 space-y-2" aria-live="polite">
                          <DemoRow
                            icon={UserRound}
                            label="Applicant 1"
                            detail="Personal details and income"
                          />
                          {joint && (
                            <DemoRow
                              icon={Users}
                              label="Applicant 2"
                              detail="Second applicant questions appear"
                            />
                          )}
                          {adviserMode && (
                            <DemoRow
                              icon={LockKeyhole}
                              label="Adviser-only sections"
                              detail="Internal notes stay out of the client PDF"
                            />
                          )}
                        </div>
                      </>
                    )}
                    {entry.id === 'review' && (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">
                            Your submissions
                          </p>
                          <span className="rounded-full bg-success/10 px-2 py-1 text-[10px] font-medium text-success">
                            New
                          </span>
                        </div>
                        <div className="mt-5 rounded-xl border p-4">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Example client
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            Sam Taylor
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Mortgage FactFind
                          </p>
                          <div className="my-4 h-px bg-border" />
                          <DemoRow
                            icon={ClipboardCheck}
                            label="Review the answers"
                            detail="Open each completed section"
                          />
                          <div className="mt-3">
                            <DemoRow
                              icon={FileText}
                              label="Download PDF"
                              detail="A copy in your firm's branding"
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-2 text-[10px] font-medium">
                          <span>New</span>
                          <ArrowRight
                            className="h-3 w-3 text-muted-foreground"
                            aria-hidden
                          />
                          <span>In review</span>
                          <ArrowRight
                            className="h-3 w-3 text-muted-foreground"
                            aria-hidden
                          />
                          <span>Completed</span>
                        </div>
                      </>
                    )}
                    {entry.id === 'emails' && (
                      <>
                        <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent-strong dark:text-accent">
                          <Mail aria-hidden className="h-5 w-5" />
                        </span>
                        <p className="text-lg font-semibold">
                          Your saved delivery choices
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          These reflect your account settings.
                        </p>
                        <dl className="my-5 divide-y rounded-xl border px-4">
                          {[
                            ['Adviser PDF email', adviserCopy],
                            ['Client PDF email', clientCopy],
                          ].map(([label, enabled]) => (
                            <div
                              key={String(label)}
                              className="flex items-center justify-between gap-3 py-4 text-xs"
                            >
                              <dt>{label}</dt>
                              <dd
                                className={cn(
                                  'rounded-full px-2 py-1 font-medium',
                                  enabled
                                    ? 'bg-success/10 text-success'
                                    : 'bg-muted text-muted-foreground',
                                )}
                              >
                                {enabled ? 'Automatic' : 'Off'}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <DemoRow
                          icon={CheckCircle2}
                          label="PDF downloads stay available"
                          detail="Change email choices in Setup or Settings."
                        />
                      </>
                    )}
                  </div>
                  <p className="mt-5 text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {entry.id === 'emails'
                      ? 'Your settings · no test email sent'
                      : 'Illustration · explore without submitting'}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}

function DemoRow({
  icon: Icon,
  label,
  detail,
}: {
  icon: typeof UserRound
  label: string
  detail: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong dark:text-accent"
        aria-hidden
      />
      <div>
        <p className="text-xs font-medium">{label}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {detail}
        </p>
      </div>
    </div>
  )
}
