import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-accent/15 text-accent-strong ring-accent/30 dark:text-accent',
        secondary: 'bg-secondary text-secondary-foreground ring-border',
        outline: 'bg-transparent text-foreground ring-border',
        success:
          'bg-emerald-100/70 text-emerald-900 ring-emerald-700/20 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-300/25',
        warning:
          'bg-amber-100/70 text-amber-900 ring-amber-700/20 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-300/25',
        destructive:
          'bg-rose-100/70 text-rose-900 ring-rose-700/20 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-300/25',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
