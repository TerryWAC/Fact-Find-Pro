import type { ReactNode } from 'react'

interface StepShellProps {
  title: string
  description?: string
  children: ReactNode
}

/** Consistent heading + body wrapper for each wizard step. */
export function StepShell({ title, description, children }: StepShellProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}
