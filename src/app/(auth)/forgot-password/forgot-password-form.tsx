'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { AlertCircle, ArrowLeft, MailCheck } from 'lucide-react'
import { forgotPasswordAction, type ActionState } from '../actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'
import { SubmitButton } from '@/components/shared/submit-button'

const initialState: ActionState = {}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter the email address on your account and we will send you a reset link.
        </p>
      </div>

      {state.ok ? (
        <Alert variant="success">
          <MailCheck />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : (
        <>
          {state.error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <form action={formAction} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@yourcompany.co.uk"
                required
                aria-invalid={Boolean(state.fieldErrors?.email)}
              />
              <FieldError message={state.fieldErrors?.email} />
            </div>

            <SubmitButton className="w-full" size="lg" pendingLabel="Sending link…">
              Send reset link
            </SubmitButton>
          </form>
        </>
      )}

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  )
}
