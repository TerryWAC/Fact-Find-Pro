import type { FactFindType, SubmissionStatus, UserStatus } from '@/lib/supabase/database.types'

export const BRAND = {
  product: 'FactFind Pro',
  organisation: 'Wealthy Advisors Club',
  tagline: 'Client fact-finding for UK mortgage & protection advisers',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@wealthyadvisorsclub.co.uk',
} as const

export const FACTFIND_TYPES = ['mortgage', 'protection', 'medical', 'home'] as const

export interface FactFindTypeMeta {
  type: FactFindType
  label: string
  shortLabel: string
  description: string
  /** Tailwind classes for the type badge/accent. */
  badgeClass: string
  accentClass: string
  icon: 'home' | 'shield' | 'stethoscope' | 'building'
}

export const FACTFIND_TYPE_META: Record<FactFindType, FactFindTypeMeta> = {
  mortgage: {
    type: 'mortgage',
    label: 'Mortgage FactFind',
    shortLabel: 'Mortgage',
    description: 'Capture affordability, property and borrowing requirements.',
    badgeClass:
      'bg-amber-100/70 text-amber-900 ring-amber-700/20 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-300/25',
    accentClass: 'text-amber-700 dark:text-amber-300',
    icon: 'building',
  },
  protection: {
    type: 'protection',
    label: 'Protection FactFind',
    shortLabel: 'Protection',
    description: 'Life cover, critical illness and income protection needs.',
    badgeClass:
      'bg-teal-100/70 text-teal-900 ring-teal-700/20 dark:bg-teal-400/10 dark:text-teal-200 dark:ring-teal-300/25',
    accentClass: 'text-teal-700 dark:text-teal-300',
    icon: 'shield',
  },
  medical: {
    type: 'medical',
    label: 'Medical FactFind',
    shortLabel: 'Medical',
    description: 'Health and lifestyle disclosures for underwriting.',
    badgeClass:
      'bg-rose-100/70 text-rose-900 ring-rose-700/20 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-300/25',
    accentClass: 'text-rose-700 dark:text-rose-300',
    icon: 'stethoscope',
  },
  home: {
    type: 'home',
    label: 'Home FactFind',
    shortLabel: 'Home',
    description: 'Buildings and contents insurance requirements.',
    badgeClass:
      'bg-violet-100/70 text-violet-900 ring-violet-700/20 dark:bg-violet-400/10 dark:text-violet-200 dark:ring-violet-300/25',
    accentClass: 'text-violet-700 dark:text-violet-300',
    icon: 'home',
  },
}

export function isFactFindType(value: string | undefined | null): value is FactFindType {
  return !!value && (FACTFIND_TYPES as readonly string[]).includes(value)
}

export const USER_STATUS_META: Record<UserStatus, { label: string; badgeClass: string }> = {
  pending: {
    label: 'Pending',
    badgeClass:
      'bg-amber-100/70 text-amber-900 ring-amber-700/20 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-300/25',
  },
  approved: {
    label: 'Approved',
    badgeClass:
      'bg-emerald-100/70 text-emerald-900 ring-emerald-700/20 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-300/25',
  },
  rejected: {
    label: 'Rejected',
    badgeClass:
      'bg-rose-100/70 text-rose-900 ring-rose-700/20 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-300/25',
  },
  suspended: {
    label: 'Suspended',
    badgeClass:
      'bg-stone-200/70 text-stone-800 ring-stone-500/20 dark:bg-stone-400/10 dark:text-stone-300 dark:ring-stone-300/25',
  },
}

export const SUBMISSION_STATUS_META: Record<SubmissionStatus, { label: string; badgeClass: string }> = {
  new: {
    label: 'New',
    badgeClass:
      'bg-amber-400/20 text-amber-900 ring-amber-700/25 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-300/30',
  },
  in_review: {
    label: 'In review',
    badgeClass:
      'bg-sky-100/70 text-sky-900 ring-sky-700/20 dark:bg-sky-400/10 dark:text-sky-200 dark:ring-sky-300/25',
  },
  completed: {
    label: 'Completed',
    badgeClass:
      'bg-emerald-100/70 text-emerald-900 ring-emerald-700/20 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-300/25',
  },
  archived: {
    label: 'Archived',
    badgeClass:
      'bg-stone-200/70 text-stone-800 ring-stone-500/20 dark:bg-stone-400/10 dark:text-stone-300 dark:ring-stone-300/25',
  },
}

export const SUBMISSIONS_PAGE_SIZE = 10
export const USERS_PAGE_SIZE = 10

/** Public client link for a given adviser slug + FactFind type. */
export function factFindUrl(baseUrl: string, type: FactFindType, slug: string): string {
  return `${baseUrl.replace(/\/$/, '')}/f/${type}/${slug}`
}
