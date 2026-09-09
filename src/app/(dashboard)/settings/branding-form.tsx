'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import { updateBrandingAction, type SettingsActionState } from './actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { FieldError } from '@/components/shared/field-error'
import { SubmitButton } from '@/components/shared/submit-button'
import { BrandColourField } from '@/components/shared/brand-colour-field'
import { ImagePicker } from '@/components/onboarding/image-picker'

const initialState: SettingsActionState = {}

export function BrandingForm({
  defaultValues,
  companyName,
}: {
  defaultValues: { logo_url: string; avatar_url: string; brand_colour: string }
  companyName: string
}) {
  const [state, formAction] = useActionState(updateBrandingAction, initialState)

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message)
  }, [state])

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <ImagePicker kind="logo" label="Company logo" name="logo_url" defaultValue={defaultValues.logo_url} />
        <FieldError message={state.fieldErrors?.logo_url} />
        <p className="text-xs text-muted-foreground">
          Shown in the header of every client FactFind page and on every PDF. Leave blank to use the Wealthy
          Advisers Club logo.
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <ImagePicker kind="headshot" label="Your photo" name="avatar_url" defaultValue={defaultValues.avatar_url} shape="circle" />
        <FieldError message={state.fieldErrors?.avatar_url} />
        <p className="text-xs text-muted-foreground">Appears next to your name on client pages and PDFs.</p>
      </div>

      <Separator />

      <div className="space-y-2">
        <BrandColourField
          name="brand_colour"
          defaultValue={defaultValues.brand_colour}
          logoUrl={defaultValues.logo_url || undefined}
          companyName={companyName}
        />
        <FieldError message={state.fieldErrors?.brand_colour} />
      </div>

      <SubmitButton pendingLabel="Saving…">Save branding</SubmitButton>
    </form>
  )
}
