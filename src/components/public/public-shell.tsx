import Link from 'next/link'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { AdviserLogo } from './adviser-logo'
import { InstallApp } from '@/components/shared/install-app'
import { brandCssVars, brandTheme } from '@/lib/branding'

interface PublicShellProps {
  /** The adviser's uploaded logo; firm name when absent or unavailable. */
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
    <div className="flex min-h-dvh flex-col bg-background" style={style} data-brand={theme.custom ? 'custom' : 'default'}>
      <header
        className={theme.custom ? undefined : 'brand-surface'}
        style={{ backgroundColor: theme.colour, color: theme.onColour }}
      >
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <AdviserLogo logoUrl={logoUrl} companyName={companyName || 'Your adviser'} />
          <ThemeToggle className={toggleTone} />
        </div>
        <div
          className={theme.custom ? 'h-1 w-full' : 'gold-rule h-1 w-full'}
          style={theme.custom ? { backgroundColor: theme.accent } : undefined}
        />
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">{children}</main>

      <footer className="border-t py-6">
        <div className="mb-3 text-center"><InstallApp name={companyName || 'Your adviser'} /></div>
        <p className="mx-auto w-full max-w-5xl px-6 text-center text-xs text-muted-foreground">
          {companyName || 'Your adviser'} · Private and confidential. Your answers are sent to your adviser for review.
        </p>
        <nav aria-label="Form privacy information" className="mt-2 flex flex-wrap justify-center gap-x-6 px-4 text-xs text-muted-foreground">
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">Privacy notice <span className="sr-only">(opens in a new tab)</span></Link>
          <Link href="/privacy#retention" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">Your data and deletion requests <span className="sr-only">(opens in a new tab)</span></Link>
        </nav>
      </footer>
    </div>
  )
}
