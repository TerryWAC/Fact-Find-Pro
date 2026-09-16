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
// Checklist state describes saved account data. Resume uses onboarding_step;
// default delivery settings do not mean the adviser has reviewed that step.
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
      title: 'Your visual identity',
      description: 'Shown to clients on links, copies and PDFs',
      done: Boolean(profile.logo_url || profile.avatar_url),
    },
    {
      step: 4,
      title: 'Saved delivery settings',
      description: `Adviser email: ${profile.delivery_email_copy ? 'automatic' : 'off'}. Client email: ${profile.delivery_client_copy ? 'automatic' : 'off'}. PDF downloads always available.`,
      // These preferences exist even before the adviser reviews them.
      done: true,
    },
    {
      step: 5,
      title: 'Add your team',
      description: 'Optional colleague directory; accounts are registered separately',
      done: teamCount > 0,
      optional: true,
    },
    {
      step: 6,
      title: 'Your links and final review',
      description: 'Check link availability and delivery choices, then open your dashboard',
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
