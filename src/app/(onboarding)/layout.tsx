import { Logo } from '@/components/shared/logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { UserMenu } from '@/components/layout/user-menu'
import { requireApprovedUser } from '@/lib/auth'
import { BRAND } from '@/lib/constants'

/** Distraction-free shell for the setup wizard — no sidebar, just the wizard. */
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireApprovedUser()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6">
          <Logo href={null} />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu
              name={profile.name}
              email={profile.email}
              companyName={profile.company_name}
              isAdmin={profile.role === 'admin'}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-4xl animate-fade-in space-y-8">{children}</div>
      </main>

      <footer className="border-t py-6">
        <p className="mx-auto w-full max-w-4xl px-6 text-center text-xs text-muted-foreground">
          {BRAND.organisation} · {BRAND.product}
        </p>
      </footer>
    </div>
  )
}
