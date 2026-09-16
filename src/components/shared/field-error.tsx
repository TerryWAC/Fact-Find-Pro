import { cn } from '@/lib/utils'

export function FieldError({ message, className, id }: { message?: string; className?: string; id?: string }) {
  if (!message) return null
  return (
    <p id={id} className={cn('text-xs font-medium text-destructive', className)} role="alert">
      {message}
    </p>
  )
}
