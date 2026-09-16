'use client'

import { Check, ChevronDown, ClipboardCheck } from 'lucide-react'
import type { FormStep } from '@/lib/forms/types'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  steps: FormStep[]
  currentIndex: number
  completedIds: string[]
  onNavigate: (index: number) => void
  disabled: boolean
}

export function StepIndicator({
  steps,
  currentIndex,
  completedIds,
  onNavigate,
  disabled,
}: StepIndicatorProps) {
  const reviewing = currentIndex === steps.length
  const sections = [
    ...steps.map((step) => ({ id: step.id, title: step.title })),
    { id: 'review', title: 'Review & send' },
  ]
  const list = (
    <ol className="space-y-1.5" aria-label="FactFind sections">
      {sections.map((step, index) => {
        const current = index === currentIndex
        const done = index < steps.length && completedIds.includes(step.id)
        const reachable =
          index < currentIndex ||
          done ||
          (index === steps.length && steps.every((entry) => completedIds.includes(entry.id)))
        return (
          <li key={step.id}>
            <button
              type="button"
              disabled={disabled || (!current && !reachable)}
              onClick={() => onNavigate(index)}
              aria-current={current ? 'step' : undefined}
              className={cn(
                'factfind-step-link flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default',
                current
                  ? 'bg-accent/10 text-foreground'
                  : 'text-muted-foreground enabled:hover:bg-secondary',
              )}
            >
              <span
                className={cn(
                  'factfind-step-token flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px]',
                  current && 'border-primary bg-primary text-primary-foreground',
                  done &&
                    !current &&
                    'border-accent/30 bg-accent/10 text-accent-strong dark:text-accent',
                )}
              >
                {done && !current ? (
                  <span className="factfind-step-check"><Check className="h-3 w-3" aria-hidden="true" /></span>
                ) : index === steps.length ? (
                  <ClipboardCheck className="h-3 w-3" aria-hidden="true" />
                ) : (
                  String(index + 1).padStart(2, '0')
                )}
              </span>
              <span>{step.title}</span>
              {done && <span className="sr-only">, completed</span>}
            </button>
          </li>
        )
      })}
    </ol>
  )
  return (
    <nav aria-label="Your progress">
      <div className="hidden lg:block">
        <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Your FactFind
        </p>
        {list}
      </div>
      <details key={currentIndex} className="group rounded-xl border bg-card lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span>
            {reviewing ? 'Review & send' : `${currentIndex + 1}. ${steps[currentIndex]?.title}`}
          </span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            Sections{' '}
            <ChevronDown
              className="h-4 w-4 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </span>
        </summary>
        <div className="border-t p-2">{list}</div>
      </details>
    </nav>
  )
}
