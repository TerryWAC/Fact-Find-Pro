'use client'

import { useActionState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'
import { PracticeFields } from '@/components/shared/practice-fields'
import { StepFooter } from './step-footer'
import { StepShell } from './step-shell'
import { saveDetailsAction, type OnboardingActionState } from '@/app/(onboarding)/onboarding/actions'
import type { Profile } from '@/lib/supabase/database.types'

const initialState: OnboardingActionState = {}

const FIELDS: {
  name: keyof Profile | 'email'
  label: string
  type?: string
  placeholder?: string
  required?: boolean
  readOnly?: boolean
  help?: string
}[] = [
  { name: 'name', label: 'What is your adviser name?', placeholder: 'Terry Blackburn', required: true },
  { name: 'email', label: 'What is your email address?', type: 'email', readOnly: true, help: 'This is your sign-in address.' },
  { name: 'phone', label: 'What is your phone number?', type: 'tel', placeholder: 'Your business phone number', help: 'Shown on your client forms. Use the business number you want clients to call; sample mobile numbers are hidden.' },
  { name: 'company_name', label: 'What is your company name?', placeholder: 'Wealthy Advisers Club' },
]

export function DetailsStep({ profile, email }: { profile: Profile; email: string }) {
  const [state, formAction] = useActionState(saveDetailsAction, initialState)

  return (
    <StepShell title="Introduce your practice." description="Help clients recognise your firm and know who they are speaking to. Your name and contact details introduce you on the client journey and its PDF copies.">
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-6" noValidate>
        <Card className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {FIELDS.map((field) => {
              const defaultValue =
                field.name === 'email' ? email : ((state.values?.[field.name] as string | undefined) ?? (profile[field.name as keyof Profile] as string) ?? '')

              return (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type={field.type ?? 'text'}
                    defaultValue={defaultValue}
                    placeholder={field.placeholder}
                    required={field.required}
                    readOnly={field.readOnly}
                    disabled={field.readOnly}
                    aria-invalid={Boolean(state.fieldErrors?.[field.name])}
                  />
                  {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
                  <FieldError message={state.fieldErrors?.[field.name]} />
                </div>
              )
            })}
          </div>
          <div className="mt-6 border-t pt-6"><PracticeFields values={{...profile, ...state.values}} errors={state.fieldErrors} /></div>
        </Card>

        <StepFooter backTo={1} skipTo={3} />
      </form>
    </StepShell>
  )
}
