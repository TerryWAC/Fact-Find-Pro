'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'

export function SubmissionLoadError({ title = 'Submissions could not be loaded' }: { title?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <div role="alert">
      <EmptyState
        icon={AlertCircle}
        title={title}
        description="Please try again. Your search and filters will stay in place."
        action={
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => startTransition(() => router.refresh())}
          >
            <RotateCw className={pending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden />
            {pending ? 'Retrying…' : 'Try again'}
          </Button>
        }
      />
    </div>
  )
}
