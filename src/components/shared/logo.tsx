import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/constants'

interface LogoProps {
  className?: string
  /** `light` = placed on the black brand surface. `dark` = placed on a page background. */
  variant?: 'light' | 'dark'
  href?: string | null
  showOrganisation?: boolean
}

/** Wealthy Advisers Club / FactFind Pro lockup — black, gold and white. */
export function Logo({ className, variant = 'dark', href = '/', showOrganisation = true }: LogoProps) {
  const content = (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold tracking-tight shadow-sm',
          variant === 'light'
            ? 'gold-gradient text-brand-black'
            : 'bg-brand-black text-brand-gold ring-1 ring-brand-gold/30 dark:gold-gradient dark:text-brand-black dark:ring-0',
        )}
        aria-hidden
      >
        FF
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'text-[15px] font-semibold tracking-tight',
            variant === 'light' ? 'text-white' : 'text-foreground',
          )}
        >
          {BRAND.product}
        </span>
        {showOrganisation && (
          <span
            className={cn(
              'mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]',
              variant === 'light' ? 'text-brand-gold' : 'text-accent-strong dark:text-accent',
            )}
          >
            {BRAND.organisation}
          </span>
        )}
      </span>
    </span>
  )

  if (!href) return content

  return (
    <Link href={href} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {content}
    </Link>
  )
}
