import { ONBOARDING_STEPS, TOTAL_ONBOARDING_STEPS } from '@/lib/onboarding'
import { cn } from '@/lib/utils'

/** "Setup 2 of 6: Your details" plus the segmented bar beneath it. */
export function StepProgress({ current }: { current: number }) {
  const meta = ONBOARDING_STEPS.find((entry) => entry.step === current) ?? ONBOARDING_STEPS[0]

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <p className="onboarding-eyebrow">
        Setup {current} of {TOTAL_ONBOARDING_STEPS}: {meta.title}
      </p>
      <ol className="flex gap-2 sm:gap-3" aria-label={`Step ${current} of ${TOTAL_ONBOARDING_STEPS}`}>
        {ONBOARDING_STEPS.map((entry) => (
          <li
            key={entry.step}
            aria-current={entry.step === current ? 'step' : undefined}
            className="min-w-0 flex-1"
          >
            <div className={cn('h-1 rounded-full', entry.step <= current ? 'gold-gradient' : 'bg-border')} />
            <span className={cn('mt-3 hidden text-[11px] sm:block', entry.step === current ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{entry.title}</span>
            <span className="sr-only sm:hidden">{entry.title}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
