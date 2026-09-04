'use client'

import { Check } from 'lucide-react'
import type { FormStep } from '@/lib/forms/types'
import { cn } from '@/lib/utils'

export function StepIndicator({
  steps,
  currentIndex,
}: {
  steps: FormStep[]
  currentIndex: number
}) {
  return (
    <ol className="scrollbar-thin flex gap-2 overflow-x-auto pb-1" aria-label="FactFind sections">
      {steps.map((step, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <li
            key={step.id}
            aria-current={isCurrent ? 'step' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              isCurrent && 'border-accent bg-accent/15 text-accent-strong dark:text-accent',
              isDone && 'border-transparent bg-secondary text-muted-foreground',
              !isCurrent && !isDone && 'border-dashed text-muted-foreground',
            )}
          >
            {isDone ? (
              <Check className="h-3 w-3" />
            ) : (
              <span className="tabular-nums">{index + 1}.</span>
            )}
            {step.title}
          </li>
        )
      })}
    </ol>
  )
}
