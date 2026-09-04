'use client'

import { useTheme } from 'next-themes'
import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  const { theme } = useTheme()

  return (
    <SonnerToaster
      theme={(theme as 'light' | 'dark' | 'system') ?? 'system'}
      position="top-right"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-border bg-background text-foreground shadow-lg',
          description: 'text-muted-foreground',
        },
      }}
    />
  )
}
