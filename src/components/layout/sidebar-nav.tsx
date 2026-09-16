'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/shared/logo'
import { isActive, navForRole } from './nav-config'
import { cn } from '@/lib/utils'

interface SidebarNavProps {
  isAdmin: boolean
  onNavigate?: () => void
}

export function SidebarNav({ isAdmin, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()
  const sections = navForRole(isAdmin)

  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="shrink-0 border-b border-sidebar-border px-5 py-7">
        <Link href="/dashboard" onClick={onNavigate} aria-label="FactFind Pro dashboard" className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent">
          <Logo variant="light" href={null} showOrganisation={false} />
        </Link>
        <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-muted">Your adviser workspace</p>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Main navigation">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
              {section.label}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex min-h-11 items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent',
                        active
                          ? 'border-sidebar-accent/20 bg-sidebar-accent/10 text-white'
                          : 'text-sidebar-foreground/75 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          active ? 'text-sidebar-accent' : 'text-sidebar-muted group-hover:text-sidebar-accent',
                        )}
                        aria-hidden
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border px-5 py-4">
        <p className="text-[11px] leading-relaxed text-sidebar-muted">
          FactFind Pro<br />
          <span className="text-sidebar-foreground/60">By Wealthy Advisers Club</span>
        </p>
      </div>
    </div>
  )
}
