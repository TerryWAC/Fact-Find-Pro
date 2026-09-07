import type { Metadata } from 'next'
import { StepProgress } from '@/components/onboarding/step-progress'
import { WelcomeStep } from '@/components/onboarding/welcome-step'
import { DetailsStep } from '@/components/onboarding/details-step'
import { BrandStep } from '@/components/onboarding/brand-step'
import { DeliveryStep } from '@/components/onboarding/delivery-step'
import { TeamStep } from '@/components/onboarding/team-step'
import { FinishStep, type FinishLink } from '@/components/onboarding/finish-step'
import { requireApprovedUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getAdviserForms } from '@/lib/queries'
import { clampStep, onboardingChecklist } from '@/lib/onboarding'
import { factFindUrl } from '@/lib/constants'
import { getBaseUrl } from '@/lib/utils'

export const metadata: Metadata = { title: 'Setup' }

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const { id, email, profile } = await requireApprovedUser()
  const params = await searchParams

  // Resume where they left off when no step is given.
  const step = params.step ? clampStep(params.step) : clampStep(profile.onboarding_step)

  const supabase = await createClient()
  const { data: teamData } = await supabase
    .from('team_members')
    .select('*')
    .eq('owner_id', id)
    .order('created_at', { ascending: true })

  const members = teamData ?? []
  const tasks = onboardingChecklist(profile, members.length)

  let links: FinishLink[] = []
  if (step === 6) {
    const forms = await getAdviserForms(id)
    const baseUrl = getBaseUrl()
    links = forms.map((form) => ({
      type: form.form_type,
      url: factFindUrl(baseUrl, form.form_type, form.unique_slug),
    }))
  }

  return (
    <>
      <StepProgress current={step} />

      {step === 1 && (
        <WelcomeStep
          tasks={tasks}
          firstName={profile.name.split(' ')[0] ?? ''}
          hasStarted={profile.onboarding_step > 1}
        />
      )}
      {step === 2 && <DetailsStep profile={profile} email={email} />}
      {step === 3 && <BrandStep profile={profile} />}
      {step === 4 && <DeliveryStep profile={profile} />}
      {step === 5 && <TeamStep members={members} />}
      {step === 6 && <FinishStep links={links} tasks={tasks} />}
    </>
  )
}
