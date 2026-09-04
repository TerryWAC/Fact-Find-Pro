import { cn } from '@/lib/utils'

export function FieldError({ message, className }: { message?: string; className?: string }) {
  if (!message) return null
  return (
    <p className={cn('text-xs font-medium text-destructive', className)} role="alert">
      {message}
    </p>
  )
}
