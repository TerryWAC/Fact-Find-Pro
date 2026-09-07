import { ONBOARDING_STEPS, TOTAL_ONBOARDING_STEPS } from '@/lib/onboarding'
import { cn } from '@/lib/utils'

/** "Setup 2 of 6: Your details" plus the segmented bar beneath it. */
export function StepProgress({ current }: { current: number }) {
  const meta = ONBOARDING_STEPS.find((entry) => entry.step === current) ?? ONBOARDING_STEPS[0]

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold tracking-tight text-accent">
        Setup {current} of {TOTAL_ONBOARDING_STEPS}: {meta.title}
      </p>
      <ol className="flex gap-2" aria-label={`Step ${current} of ${TOTAL_ONBOARDING_STEPS}`}>
        {ONBOARDING_STEPS.map((entry) => (
          <li
            key={entry.step}
            aria-current={entry.step === current ? 'step' : undefined}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              entry.step <= current ? 'gold-gradient' : 'bg-border',
            )}
          >
            <span className="sr-only">{entry.title}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
