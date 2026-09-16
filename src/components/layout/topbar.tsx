import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/lib/supabase/database.types'
import { MobileNav } from './mobile-nav'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { UserMenu } from './user-menu'

export function Topbar({ profile, isAdmin }: { profile: Profile; isAdmin: boolean }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
      <MobileNav isAdmin={isAdmin} />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-medium text-foreground">
            {profile.company_name?.trim() || profile.name}
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

      <Button asChild variant="ghost" className="h-11 w-11 shrink-0 px-0 md:w-auto md:gap-2 md:px-3">
        <Link href="/submissions" aria-label="Find a submission" title="Find a submission">
          <Search aria-hidden /><span className="hidden text-xs text-muted-foreground md:inline">Find a submission</span>
        </Link>
      </Button>
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
