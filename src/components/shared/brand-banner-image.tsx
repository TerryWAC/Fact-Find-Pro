import { BRAND, BRAND_BANNER } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface BrandBannerImageProps {
  className?: string
  /** Rendered when no artwork has been added yet. */
  fallback?: React.ReactNode
}

/**
 * The Wealthy Advisers Club lion banner.
 *
 * Renders the artwork when it has been added to public/brand (resolved at
 * build time), otherwise whatever fallback the caller provides.
 */
export function BrandBannerImage({ className, fallback = null }: BrandBannerImageProps) {
  if (!BRAND_BANNER) return <>{fallback}</>

  return (
    // eslint-disable-next-line @next/next/no-img-element -- author-supplied artwork of unknown dimensions
    <img
      src={BRAND_BANNER}
      alt={`${BRAND.organisation} — ${BRAND.product}`}
      className={cn('block h-auto w-full object-contain', className)}
    />
  )
}
