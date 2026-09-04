'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'value'> {
  value: string
  label?: string
  copiedLabel?: string
  toastMessage?: string
}

export function CopyButton({
  value,
  label = 'Copy link',
  copiedLabel = 'Copied',
  toastMessage = 'Link copied to clipboard',
  className,
  variant = 'outline',
  size = 'sm',
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        // Fallback for browsers without the async clipboard API.
        const textarea = document.createElement('textarea')
        textarea.value = value
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      setCopied(true)
      toast.success(toastMessage)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy — please copy the link manually')
    }
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={handleCopy} className={cn(className)} {...props}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? copiedLabel : label}
    </Button>
  )
}
