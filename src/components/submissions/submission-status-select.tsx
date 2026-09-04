'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateSubmissionStatus } from '@/app/(dashboard)/submissions/actions'
import { SUBMISSION_STATUS_META } from '@/lib/constants'
import type { SubmissionStatus } from '@/lib/supabase/database.types'

const STATUSES = Object.keys(SUBMISSION_STATUS_META) as SubmissionStatus[]

export function SubmissionStatusSelect({
  submissionId,
  status,
}: {
  submissionId: string
  status: SubmissionStatus
}) {
  const router = useRouter()
  const [value, setValue] = useState<SubmissionStatus>(status)
  const [isPending, startTransition] = useTransition()

  function handleChange(next: string) {
    const previous = value
    setValue(next as SubmissionStatus)

    startTransition(async () => {
      const result = await updateSubmissionStatus(submissionId, next)
      if (!result.ok) {
        setValue(previous)
        toast.error(result.error ?? 'Could not update the status')
        return
      }
      toast.success(`Status set to ${SUBMISSION_STATUS_META[next as SubmissionStatus].label}`)
      router.refresh()
    })
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-[10rem]" aria-label="Submission status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((option) => (
          <SelectItem key={option} value={option}>
            {SUBMISSION_STATUS_META[option].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
