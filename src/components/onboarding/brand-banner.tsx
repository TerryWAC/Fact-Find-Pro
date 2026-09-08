import { BrandBannerImage } from '@/components/shared/brand-banner-image'

/**
 * Welcome banner. Shows the lion artwork once it has been added to
 * public/brand; until then a typographic lockup keeps the screen finished.
 */
export function BrandBanner() {
  return (
    <div className="overflow-hidden rounded-xl border border-accent/25 bg-brand-black">
      <BrandBannerImage
        fallback={
          <div className="relative px-6 py-12 text-center sm:py-16">
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
        }
      />
    </div>
  )
}
