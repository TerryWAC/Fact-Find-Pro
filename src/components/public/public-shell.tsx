import { Logo } from '@/components/shared/logo'
import { BrandBannerImage } from '@/components/shared/brand-banner-image'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { BRAND } from '@/lib/constants'
import { brandCssVars, brandTheme } from '@/lib/branding'

interface PublicShellProps {
  /** The adviser's uploaded logo; the Wealthy Advisers Club banner when absent. */
  logoUrl?: string | null
  /** The adviser's brand colour; the black/gold house style when absent. */
  brandColour?: string | null
  /** Used for the logo's alt text. */
  companyName?: string | null
  children: React.ReactNode
}

/**
 * Public, unauthenticated shell for client-facing FactFind pages, painted in
 * the adviser's branding. The header takes the brand colour; the design tokens
 * (buttons, accents, focus rings) are re-pointed at it through CSS variables so
 * the whole page follows without any component knowing about branding.
 */
export function PublicShell({ logoUrl, brandColour, companyName, children }: PublicShellProps) {
  const theme = brandTheme(brandColour)
  const style = brandCssVars(theme) as React.CSSProperties
  const toggleTone = theme.onColour === '#FFFFFF' ? 'text-white hover:bg-white/10 hover:text-white' : 'text-black hover:bg-black/10 hover:text-black'

  return (
    <div className="flex min-h-screen flex-col bg-background" style={style} data-brand={theme.custom ? 'custom' : 'default'}>
      <header
        className={theme.custom ? undefined : 'brand-surface'}
        style={theme.custom ? { backgroundColor: theme.colour, color: theme.onColour } : undefined}
      >
        <div className="mx-auto flex min-h-16 w-full max-w-5xl items-center justify-between gap-4 px-6 py-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- adviser-supplied image of unknown dimensions
            <img src={logoUrl} alt={companyName ?? 'Adviser logo'} className="block max-h-16 w-auto max-w-[60%] object-contain" data-testid="adviser-logo" />
          ) : (
            <BrandBannerImage className="max-h-20 w-auto" fallback={<Logo variant="light" href={null} />} />
          )}
          <ThemeToggle className={toggleTone} />
        </div>
        <div
          className={theme.custom ? 'h-1 w-full' : 'gold-rule h-1 w-full'}
          style={theme.custom ? { backgroundColor: theme.accent } : undefined}
        />
      </header>

      <main className="flex-1 px-6 py-10 sm:py-14">{children}</main>

      <footer className="border-t py-6">
        <p className="mx-auto w-full max-w-5xl px-6 text-center text-xs text-muted-foreground">
          {companyName ? `${companyName} · ` : ''}Powered by {BRAND.product} from {BRAND.organisation}. Your information is
          handled in line with UK GDPR and shared only with your adviser.
        </p>
      </footer>
    </div>
  )
}
