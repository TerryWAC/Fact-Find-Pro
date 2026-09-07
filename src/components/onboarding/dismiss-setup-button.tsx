'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { completeOnboardingAction } from '@/app/(onboarding)/onboarding/actions'

/** Lets an adviser leave setup entirely — it should never be a trap. */
export function DismissSetupButton({ label = 'Skip setup, take me to the dashboard' }: { label?: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      onClick={() => startTransition(async () => void (await completeOnboardingAction()))}
      disabled={pending}
      className="text-muted-foreground"
    >
      {pending ? 'One moment…' : label}
    </Button>
  )
}
