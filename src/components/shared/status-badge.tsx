import { Badge } from '@/components/ui/badge'
import { FACTFIND_TYPE_META, SUBMISSION_STATUS_META, USER_STATUS_META } from '@/lib/constants'
import type { FactFindType, SubmissionStatus, UserStatus } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils'

export function UserStatusBadge({ status, className }: { status: UserStatus; className?: string }) {
  const meta = USER_STATUS_META[status]
  return <Badge className={cn(meta.badgeClass, className)}>{meta.label}</Badge>
}

export function SubmissionStatusBadge({
  status,
  className,
}: {
  status: SubmissionStatus
  className?: string
}) {
  const meta = SUBMISSION_STATUS_META[status]
  return <Badge className={cn(meta.badgeClass, className)}>{meta.label}</Badge>
}

export function FactFindTypeBadge({ type, className }: { type: FactFindType; className?: string }) {
  const meta = FACTFIND_TYPE_META[type]
  return <Badge className={cn(meta.badgeClass, className)}>{meta.shortLabel}</Badge>
}
