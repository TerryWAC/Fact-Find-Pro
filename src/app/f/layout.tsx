import { Logo } from '@/components/shared/logo'
import { BrandBannerImage } from '@/components/shared/brand-banner-image'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { BRAND } from '@/lib/constants'

/** Public, unauthenticated shell for client-facing FactFind pages. */
export default function PublicFactFindLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="brand-surface">
        <div className="mx-auto flex min-h-16 w-full max-w-5xl items-center justify-between gap-4 px-6 py-2">
          <BrandBannerImage className="max-h-20 w-auto" fallback={<Logo variant="light" href={null} />} />
          <ThemeToggle className="text-white hover:bg-white/10 hover:text-white" />
        </div>
        <div className="gold-rule h-1 w-full" />
      </header>

      <main className="flex-1 px-6 py-10 sm:py-14">{children}</main>

      <footer className="border-t py-6">
        <p className="mx-auto w-full max-w-5xl px-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {BRAND.organisation} · {BRAND.product}. Your information is handled in
          line with UK GDPR and shared only with your adviser.
        </p>
      </footer>
    </div>
  )
}
