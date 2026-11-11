import type { ReactNode } from 'react'
import type { FormField } from '@/lib/forms/types'
import { cn } from '@/lib/utils'

interface QuestionCardProps {
  field: FormField
  number: number
  /**
   * Some advisers leave the "Optional" marker off so clients are not nudged to
   * skip questions. Required questions are always marked; nothing becomes
   * mandatory either way.
   */
  hideOptionalMarker?: boolean
  children: ReactNode
}

export function QuestionCard({ field, number, hideOptionalMarker = false, children }: QuestionCardProps) {
  const marker = field.required ? 'Required' : hideOptionalMarker ? null : 'Optional'
  return (
    <div
      data-question-id={field.id}
      className={cn('factfind-question min-w-0 rounded-xl border p-4 sm:p-5', field.colSpan === 1 ? 'sm:col-span-1' : 'sm:col-span-2')}
    >
      <div aria-hidden="true" className="mb-3 flex items-center justify-between gap-3">
        <span className="factfind-question-number inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[10px] font-semibold tabular-nums">
          {String(number).padStart(2, '0')}
        </span>
        {marker && <span className="factfind-question-marker text-[10px] font-medium tracking-wide text-muted-foreground">{marker}</span>}
      </div>
      {children}
    </div>
  )
}
