'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import { updateProfileAction, type SettingsActionState } from './actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'
import { SubmitButton } from '@/components/shared/submit-button'

const initialState: SettingsActionState = {}

export function ProfileForm({
  defaultValues,
  email,
}: {
  defaultValues: { name: string; company_name: string; phone: string }
  email: string
}) {
  const [state, formAction] = useActionState(updateProfileAction, initialState)

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message)
  }, [state])

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultValues.name}
            required
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
          <FieldError message={state.fieldErrors?.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={defaultValues.phone}
            required
            aria-invalid={Boolean(state.fieldErrors?.phone)}
          />
          <FieldError message={state.fieldErrors?.phone} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_name">Company name</Label>
        <Input
          id="company_name"
          name="company_name"
          defaultValue={defaultValues.company_name}
          required
          aria-invalid={Boolean(state.fieldErrors?.company_name)}
        />
        <FieldError message={state.fieldErrors?.company_name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" value={email} disabled readOnly />
        <p className="text-xs text-muted-foreground">
          Contact the Wealthy Advisers Club team to change the email on your account.
        </p>
      </div>

      <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
    </form>
  )
}
