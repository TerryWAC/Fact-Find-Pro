'use client'

import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { resetPasswordAction, signOutAction, type ActionState } from '../actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'
import { SubmitButton } from '@/components/shared/submit-button'

const initialState: ActionState = {}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, initialState)

  // After a successful reset, end the recovery session and return to sign in.
  useEffect(() => {
    if (!state.ok) return
    const timer = setTimeout(() => {
      void signOutAction('/login?reset=1')
    }, 2000)
    return () => clearTimeout(timer)
  }, [state.ok])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">
          Pick something you have not used before. You will be signed in with it next time.
        </p>
      </div>

      {state.ok ? (
        <Alert variant="success">
          <CheckCircle2 />
          <AlertDescription>{state.message} Taking you to sign in…</AlertDescription>
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
              <Label htmlFor="password">New password</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm new password</Label>
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

            <SubmitButton className="w-full" size="lg" pendingLabel="Updating password…">
              Update password
            </SubmitButton>
          </form>
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Need a new link?{' '}
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          Request a reset email
        </Link>
      </p>
    </div>
  )
}
