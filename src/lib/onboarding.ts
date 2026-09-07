import type { Profile, TeamMember, TeamRole } from '@/lib/supabase/database.types'

/**
 * The six-step setup wizard.
 *
 * Steps are 1-indexed to match the "Setup N of 6" label. Every step except the
 * welcome and finish screens can be skipped — onboarding should never trap an
 * adviser who wants to get straight to work.
 */
export const ONBOARDING_STEPS = [
  { step: 1, slug: 'welcome', title: 'Welcome' },
  { step: 2, slug: 'details', title: 'Your details' },
  { step: 3, slug: 'brand', title: 'Your brand' },
  { step: 4, slug: 'delivery', title: 'Delivery' },
  { step: 5, slug: 'team', title: 'Your team' },
  { step: 6, slug: 'finish', title: 'Your links' },
] as const

export const TOTAL_ONBOARDING_STEPS = ONBOARDING_STEPS.length

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]['step']

export function clampStep(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (Number.isNaN(parsed)) return 1
  return Math.min(Math.max(parsed, 1), TOTAL_ONBOARDING_STEPS)
}

export const TEAM_ROLES: { value: TeamRole; label: string }[] = [
  { value: 'adviser', label: 'Adviser' },
  { value: 'administrator', label: 'Administrator' },
  { value: 'paraplanner', label: 'Paraplanner' },
]

export function teamRoleLabel(role: TeamRole): string {
  return TEAM_ROLES.find((entry) => entry.value === role)?.label ?? 'Adviser'
}

// -----------------------------------------------------------------------------
// Checklist state — drives the welcome screen and the "resume where you left
// off" behaviour. Each task reports whether it has been done, from real data
// rather than a stored flag, so it stays honest if details are edited later.
// -----------------------------------------------------------------------------

export interface ChecklistTask {
  step: number
  title: string
  description: string
  done: boolean
  /** Optional tasks do not hold up completion. */
  optional?: boolean
}

export function onboardingChecklist(profile: Profile, teamCount: number): ChecklistTask[] {
  return [
    {
      step: 2,
      title: 'Your details',
      description: 'Name, email, phone, company and job title',
      done: Boolean(profile.name && profile.company_name && profile.phone && profile.job_title),
    },
    {
      step: 3,
      title: 'Logo and headshot',
      description: 'Shown to clients on links, copies and PDFs',
      done: Boolean(profile.logo_url || profile.avatar_url),
    },
    {
      step: 4,
      title: 'Choose where fact finds go',
      description: 'Email copy, downloads, or straight into your CRM',
      // Downloads are always on, so this task is satisfied by default.
      done: true,
    },
    {
      step: 5,
      title: 'Add your team',
      description: 'Optional. Everyone gets their own configured copy',
      done: teamCount > 0,
      optional: true,
    },
    {
      step: 6,
      title: 'Share your first fact find',
      description: 'Copy a client link and run one with a test client',
      done: Boolean(profile.onboarding_completed_at),
    },
  ]
}

export function checklistProgress(tasks: ChecklistTask[]): { done: number; total: number } {
  const required = tasks.filter((task) => !task.optional)
  return { done: required.filter((task) => task.done).length, total: required.length }
}

/** True when the wizard should be shown on sign-in. */
export function needsOnboarding(profile: Pick<Profile, 'onboarding_completed_at'>): boolean {
  return !profile.onboarding_completed_at
}

export type { TeamMember }
