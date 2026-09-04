'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'

interface SubmitButtonProps extends ButtonProps {
  pendingLabel?: string
  /** Force the pending state when not using a form action. */
  loading?: boolean
}

export function SubmitButton({
  children,
  pendingLabel,
  loading,
  disabled,
  ...props
}: SubmitButtonProps) {
  const status = useFormStatus()
  const isPending = loading ?? status.pending

  return (
    <Button type="submit" disabled={disabled || isPending} {...props}>
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
      {isPending ? (pendingLabel ?? children) : children}
    </Button>
  )
}
