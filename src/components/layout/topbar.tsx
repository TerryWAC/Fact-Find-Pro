import { Badge } from '@/components/ui/badge'
import type { Profile } from '@/lib/supabase/database.types'
import { MobileNav } from './mobile-nav'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { UserMenu } from './user-menu'

export function Topbar({ profile, isAdmin }: { profile: Profile; isAdmin: boolean }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
      <MobileNav isAdmin={isAdmin} />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="hidden min-w-0 flex-col leading-tight sm:flex">
          <span className="truncate text-sm font-medium text-foreground">
            {profile.company_name ?? profile.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {isAdmin ? 'Administrator' : 'Adviser workspace'}
          </span>
        </div>
        {isAdmin && (
          <Badge variant="default" className="hidden sm:inline-flex">
            Admin
          </Badge>
        )}
      </div>

      <ThemeToggle />

      <UserMenu
        name={profile.name}
        email={profile.email}
        companyName={profile.company_name}
        isAdmin={isAdmin}
      />
    </header>
  )
}
