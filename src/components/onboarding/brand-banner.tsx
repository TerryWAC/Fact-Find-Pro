import fs from 'node:fs'
import path from 'node:path'
import { BRAND } from '@/lib/constants'

const CUSTOM_BANNER = 'brand/onboarding-banner.png'

/**
 * Welcome banner.
 *
 * Drop your artwork at `public/brand/onboarding-banner.png` and it is used
 * automatically; otherwise the typographic lockup below is rendered, so the
 * screen looks finished without shipping a placeholder image.
 */
export function BrandBanner() {
  const hasCustom = fs.existsSync(path.join(process.cwd(), 'public', CUSTOM_BANNER))

  if (hasCustom) {
    return (
      <div className="overflow-hidden rounded-xl border border-accent/25">
        {/* eslint-disable-next-line @next/next/no-img-element -- author-supplied artwork of unknown dimensions */}
        <img src={`/${CUSTOM_BANNER}`} alt={BRAND.organisation} className="w-full" />
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-accent/25 bg-brand-black px-6 py-12 text-center sm:py-16">
      <div
        aria-hidden
        className="absolute inset-x-10 top-6 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
      />
      <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-white/80">The</p>
      <p className="mt-2 text-3xl font-semibold uppercase leading-tight tracking-[0.16em] text-white sm:text-4xl">
        Wealthy
        <br />
        Advisers
        <br />
        Club
      </p>
      <p className="mt-3 text-sm italic text-accent">By Terry Blackburn</p>
      <div
        aria-hidden
        className="absolute inset-x-10 bottom-6 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
      />
    </div>
  )
}
