'use client'

import { useActionState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'
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
  { name: 'job_title', label: 'What is your job title within the company?', placeholder: 'Mortgage & Protection Adviser' },
  { name: 'email', label: 'What is your email address?', type: 'email', readOnly: true, help: 'This is your sign-in address.' },
  { name: 'phone', label: 'What is your phone number?', type: 'tel', placeholder: '07700 900000' },
  { name: 'company_name', label: 'What is your company name?', placeholder: 'Wealthy Advisers Club' },
  { name: 'fca_number', label: 'FCA reference number', placeholder: '123456' },
  { name: 'website', label: 'What is your website?', placeholder: 'https://yourfirm.co.uk' },
  { name: 'business_location', label: 'Where is your business located?', placeholder: 'Manchester, UK' },
]

export function DetailsStep({ profile, email }: { profile: Profile; email: string }) {
  const [state, formAction] = useActionState(saveDetailsAction, initialState)

  return (
    <StepShell title="Your details" description="Shown to your clients on every link, copy and PDF.">
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
                field.name === 'email' ? email : ((profile[field.name as keyof Profile] as string) ?? '')

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
        </Card>

        <StepFooter backTo={1} skipTo={3} />
      </form>
    </StepShell>
  )
}
