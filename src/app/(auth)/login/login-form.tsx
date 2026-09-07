'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { AlertCircle, CheckCircle2, PlugZap } from 'lucide-react'
import { signInAction, type ActionState } from '../actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'
import { SubmitButton } from '@/components/shared/submit-button'

const initialState: ActionState = {}

export function LoginForm({
  redirectTo,
  notice,
  reset,
  setupError,
}: {
  redirectTo?: string
  notice?: string
  reset?: boolean
  /** Set when the deployment has no Supabase credentials. */
  setupError?: string
}) {
  const [state, formAction] = useActionState(signInAction, initialState)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to FactFind Pro</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back. Enter your details to access your adviser workspace.
        </p>
      </div>

      {setupError && (
        <Alert variant="warning">
          <PlugZap />
          <AlertDescription>{setupError}</AlertDescription>
        </Alert>
      )}

      {reset && (
        <Alert variant="success">
          <CheckCircle2 />
          <AlertDescription>Your password has been updated. Sign in with your new password.</AlertDescription>
        </Alert>
      )}

      {(state.error || notice) && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error ?? notice}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />

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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••"
            required
            aria-invalid={Boolean(state.fieldErrors?.password)}
          />
          <FieldError message={state.fieldErrors?.password} />
        </div>

        <SubmitButton className="w-full" size="lg" pendingLabel="Signing in…" disabled={Boolean(setupError)}>
          Sign in
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Register your practice
        </Link>
      </p>
    </div>
  )
}
