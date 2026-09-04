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
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
        <Logo variant="light" href="/dashboard" />
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Main navigation">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent',
                        active
                          ? 'bg-white/10 text-white'
                          : 'text-sidebar-foreground/75 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          active ? 'text-sidebar-accent' : 'text-sidebar-muted group-hover:text-sidebar-accent',
                        )}
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
          Wealthy Advisors Club
          <br />
          FactFind Pro · MVP
        </p>
      </div>
    </div>
  )
}
