'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import { updateBrandingAction, type SettingsActionState } from './actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { FieldError } from '@/components/shared/field-error'
import { SubmitButton } from '@/components/shared/submit-button'
import { BrandColourField } from '@/components/shared/brand-colour-field'
import { ImagePicker } from '@/components/onboarding/image-picker'
import { EmailBrandPreview } from '@/components/shared/email-brand-preview'

const initialState: SettingsActionState = {}

export function BrandingForm({
  defaultValues,
  companyName,
  adviserName,
  email,
}: {
  defaultValues: { logo_url: string; avatar_url: string; brand_colour: string }
  companyName: string
  adviserName: string
  email: string
}) {
  const [state, formAction] = useActionState(updateBrandingAction, initialState)
  const [logo, setLogo] = useState(defaultValues.logo_url)
  const [colour, setColour] = useState(defaultValues.brand_colour)

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
        <ImagePicker kind="logo" label="Company logo" name="logo_url" defaultValue={defaultValues.logo_url} onValueChange={setLogo} />
        <FieldError message={state.fieldErrors?.logo_url} />
        <p className="text-xs text-muted-foreground">
          Shown on client pages, emails and PDFs. Your firm’s name appears when no logo is set.
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
          logoUrl={logo || undefined}
          companyName={companyName}
          onValueChange={setColour}
        />
        <FieldError message={state.fieldErrors?.brand_colour} />
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
        <p className="font-medium">Your firm, throughout the client journey</p>
        <p className="mt-1 text-muted-foreground">Client pages, emails and PDFs carry your identity. Emails use the FactFind sending domain with your firm’s name, and client replies come to you.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingLabel="Saving…">Save branding</SubmitButton>
        <EmailBrandPreview branding={{ companyName, adviserName, replyTo: email, logoUrl: logo, colour }} />
      </div>
    </form>
  )
}
