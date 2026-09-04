import {
  LayoutDashboard,
  Link2,
  FileText,
  Settings,
  ShieldCheck,
  Users,
  Inbox,
  Mail,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Match child routes too (e.g. /submissions/[id]). */
  matchPrefix?: boolean
}

export interface NavSection {
  label: string
  items: NavItem[]
  adminOnly?: boolean
}

export const ADVISER_NAV: NavSection[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'My FactFind Links', href: '/links', icon: Link2 },
      { label: 'Submissions', href: '/submissions', icon: FileText, matchPrefix: true },
    ],
  },
  {
    label: 'Account',
    items: [{ label: 'Settings', href: '/settings', icon: Settings }],
  },
]

export const ADMIN_NAV: NavSection[] = [
  {
    label: 'Administration',
    adminOnly: true,
    items: [
      { label: 'Admin Dashboard', href: '/admin', icon: ShieldCheck },
      { label: 'User Approvals', href: '/admin/users', icon: Users, matchPrefix: true },
      { label: 'All Submissions', href: '/admin/submissions', icon: Inbox },
      { label: 'Email Templates', href: '/admin/emails', icon: Mail },
    ],
  },
]

export function navForRole(isAdmin: boolean): NavSection[] {
  return isAdmin ? [...ADVISER_NAV, ...ADMIN_NAV] : ADVISER_NAV
}

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.matchPrefix) return pathname === item.href || pathname.startsWith(`${item.href}/`)
  return pathname === item.href
}
