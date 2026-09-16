import Link from 'next/link'
import { ArrowRight, Check, Play, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductTour } from './product-tour'
import { JourneyFaq } from './journey-faq'
import { HelpCentre } from './help-centre'
import { DismissSetupButton } from './dismiss-setup-button'
import type { ChecklistTask } from '@/lib/onboarding'
import type { Profile } from '@/lib/supabase/database.types'

export function WelcomeStep({
  tasks,
  profile,
  resumeStep,
}: {
  tasks: ChecklistTask[]
  profile: Pick<
    Profile,
    | 'name'
    | 'company_name'
    | 'brand_colour'
    | 'delivery_email_copy'
    | 'delivery_client_copy'
    | 'onboarding_completed_at'
  >
  resumeStep: number
}) {
  const firstName = profile.name.trim().split(/\s+/)[0]
  const actionLabel = profile.onboarding_completed_at
    ? 'Review my setup'
    : resumeStep > 2
      ? 'Continue setup'
      : 'Set up my practice'

  return (
    <div className="space-y-10 sm:space-y-14">
      <section className="brand-surface relative overflow-hidden rounded-2xl border border-white/10 p-6 text-white sm:p-10 lg:p-12">
        <div className="grid gap-9 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-12">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
              Your practice. Your client experience.
            </p>
            <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Less paperwork.
              <br />
              <span className="text-gold">More conversation.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/70">
              Welcome{firstName ? `, ${firstName}` : ''}. Bring your branding,
              share a FactFind and turn your client’s answers into a clear,
              organised record. Let’s make it feel like your practice from the
              first click.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="accent" size="lg">
                <Link href={`/onboarding?step=${resumeStep}`}>
                  {actionLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <a
                href="#how-it-works"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/20 px-5 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Play className="h-4 w-4" aria-hidden />
                See how it works
              </a>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-white/60">
              A short setup. Everything can be updated later in Settings.
            </p>
          </div>
          <ol
            aria-label="From setup to your first review"
            className="divide-y divide-white/10 rounded-2xl border border-white/15 bg-white/[0.04] px-5 sm:px-6"
          >
            {[
              [
                '01',
                'Make it yours',
                'Your identity, colours and delivery choices.',
              ],
              [
                '02',
                'Share a client link',
                'Four forms. No client account needed.',
              ],
              [
                '03',
                'Review with confidence',
                'Answers, branded PDFs and follow-up in your dashboard.',
              ],
            ].map(([number, title, detail]) => (
              <li key={number} className="flex gap-4 py-5">
                <span className="pt-1 font-mono text-xs text-gold" aria-hidden>
                  {number}
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                    {detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ProductTour
        companyName={profile.company_name || profile.name}
        adviserName={profile.name}
        brandColour={profile.brand_colour}
        adviserCopy={profile.delivery_email_copy}
        clientCopy={profile.delivery_client_copy}
      />

      <section aria-labelledby="setup-checklist-title">
        <div className="mb-5">
          <p className="onboarding-eyebrow">Make it your own</p>
          <h2
            id="setup-checklist-title"
            className="mt-2 text-2xl font-semibold tracking-tight"
          >
            Your setup, at a glance.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Review what is already saved, then add the finishing touches.
          </p>
        </div>
        <ol className="divide-y overflow-hidden rounded-2xl border bg-card">
          {tasks.map((task) => (
            <li
              key={task.step}
              className="flex items-start gap-3 p-5 sm:items-center sm:gap-4 sm:px-6"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-strong dark:text-accent"
                aria-hidden
              >
                {task.done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <SlidersHorizontal className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {task.title}
                  {task.optional && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      Optional
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {task.description}
                </p>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="min-h-11 shrink-0"
              >
                <Link href={`/onboarding?step=${task.step}`}>
                  Review<span className="sr-only"> {task.title}</span>
                  <ArrowRight
                    className="hidden h-3.5 w-3.5 sm:block"
                    aria-hidden
                  />
                </Link>
              </Button>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <DismissSetupButton />
          <Button asChild variant="accent" size="lg">
            <Link href={`/onboarding?step=${resumeStep}`}>
              {actionLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
      <JourneyFaq />
      <HelpCentre />
    </div>
  )
}
