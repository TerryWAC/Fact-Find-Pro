'use client'

import { useActionState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FieldError } from '@/components/shared/field-error'
import { ImagePicker } from './image-picker'
import { StepFooter } from './step-footer'
import { StepShell } from './step-shell'
import { saveBrandAction, type OnboardingActionState } from '@/app/(onboarding)/onboarding/actions'
import type { Profile } from '@/lib/supabase/database.types'

const initialState: OnboardingActionState = {}

export function BrandStep({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState(saveBrandAction, initialState)

  return (
    <StepShell
      title="Your brand"
      description="Upload your company logo and a picture of yourself. These go on every client link, client copy and PDF. Leave the logo blank and the Wealthy Advisers Club branding is used."
    >
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-6" noValidate>
        <Card className="space-y-6 p-6">
          <div className="space-y-2">
            <ImagePicker
              kind="logo"
              label="Upload your company logo"
              name="logo_url"
              defaultValue={profile.logo_url ?? ''}
            />
            <FieldError message={state.fieldErrors?.logo_url} />
          </div>

          <Separator />

          <div className="space-y-2">
            <ImagePicker
              kind="headshot"
              label="Upload a picture of yourself"
              name="avatar_url"
              defaultValue={profile.avatar_url ?? ''}
              shape="circle"
            />
            <FieldError message={state.fieldErrors?.avatar_url} />
          </div>

          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP or SVG, up to 2MB. Images are stored privately against your account.
          </p>
        </Card>

        <StepFooter backTo={2} skipTo={4} />
      </form>
    </StepShell>
  )
}
