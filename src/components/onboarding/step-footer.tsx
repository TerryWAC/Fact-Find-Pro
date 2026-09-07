'use client'

import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StepFooterProps {
  /** Previous step number, or null on the first step. */
  backTo: number | null
  /** Next step number for "Skip for now", or null to hide it. */
  skipTo: number | null
  submitLabel?: string
}

/** Back · Skip for now · Save and continue, shared by every editable step. */
export function StepFooter({ backTo, skipTo, submitLabel = 'Save and continue' }: StepFooterProps) {
  const { pending } = useFormStatus()

  return (
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
      <Button asChild variant="outline" disabled={pending}>
        {backTo ? <Link href={`/onboarding?step=${backTo}`}>Back</Link> : <span>Back</span>}
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row">
        {skipTo && (
          <Button asChild variant="secondary" disabled={pending}>
            <Link href={`/onboarding?step=${skipTo}`}>Skip for now</Link>
          </Button>
        )}
        <Button type="submit" variant="accent" disabled={pending} className="sm:min-w-[11rem]">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </div>
  )
}
