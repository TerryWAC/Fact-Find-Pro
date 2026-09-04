'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { AlertCircle, Info } from 'lucide-react'
import { signUpAction, type ActionState } from '../actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'
import { SubmitButton } from '@/components/shared/submit-button'

const initialState: ActionState = {}

export function SignupForm() {
  const [state, formAction] = useActionState(signUpAction, initialState)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Register your practice</h1>
        <p className="text-sm text-muted-foreground">
          Create your FactFind Pro account. Registrations are reviewed by the Wealthy Advisors Club team
          before access is granted.
        </p>
      </div>

      <Alert variant="info">
        <Info />
        <AlertDescription>
          Your account will be created with <strong>Pending</strong> status. You will receive an email as soon
          as it is approved.
        </AlertDescription>
      </Alert>

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Jane Smith"
            required
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
          <FieldError message={state.fieldErrors?.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_name">Company name</Label>
          <Input
            id="company_name"
            name="company_name"
            autoComplete="organization"
            placeholder="Smith Mortgage Services Ltd"
            required
            aria-invalid={Boolean(state.fieldErrors?.company_name)}
          />
          <FieldError message={state.fieldErrors?.company_name} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="jane@smithmortgages.co.uk"
              required
              aria-invalid={Boolean(state.fieldErrors?.email)}
            />
            <FieldError message={state.fieldErrors?.email} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="07700 900000"
              required
              aria-invalid={Boolean(state.fieldErrors?.phone)}
            />
            <FieldError message={state.fieldErrors?.phone} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 10 characters"
            required
            aria-invalid={Boolean(state.fieldErrors?.password)}
          />
          <FieldError message={state.fieldErrors?.password} />
          <p className="text-xs text-muted-foreground">
            Use 10+ characters with upper and lower case letters and a number.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm password</Label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={Boolean(state.fieldErrors?.confirm_password)}
          />
          <FieldError message={state.fieldErrors?.confirm_password} />
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Checkbox id="terms" name="terms" className="mt-0.5" required />
            <Label htmlFor="terms" className="text-sm font-normal leading-relaxed text-muted-foreground">
              I confirm I am an FCA-authorised adviser (or work under an authorised firm) and accept the
              Wealthy Advisors Club terms of use and privacy policy.
            </Label>
          </div>
          <FieldError message={state.fieldErrors?.terms} />
        </div>

        <SubmitButton className="w-full" size="lg" pendingLabel="Creating account…">
          Create account
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already registered?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
