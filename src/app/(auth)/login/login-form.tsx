'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, PlugZap } from 'lucide-react'
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
  const [state, formAction, pending] = useActionState(signInAction, initialState)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [ready, setReady] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  // Controlled fields must not accept input before hydration can retain it.
  useEffect(() => setReady(true), [])

  useEffect(() => {
    if (!state.error) return
    const target = state.fieldErrors?.email ? emailRef.current
      : state.fieldErrors?.password ? passwordRef.current : errorRef.current
    target?.focus()
  }, [state])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent-strong dark:text-accent"><KeyRound className="h-5 w-5" aria-hidden /></div>
        <p className="pb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-accent-strong dark:text-accent">Adviser sign in</p>
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.045em] sm:text-[34px]">Welcome back.</h1>
        <p className="max-w-xs text-xs leading-[1.8] text-muted-foreground">
          Your client reviews, branded forms and completed FactFinds. All in one place.
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
        <Alert variant="destructive" ref={errorRef} tabIndex={-1} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive">
          <AlertCircle />
          <AlertDescription>{state.error ?? notice}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-5" noValidate aria-busy={!ready || pending}>
        <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            ref={emailRef}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoCapitalize="none"
            spellCheck={false}
            disabled={!ready || pending}
            className="h-[52px] rounded-xl bg-background/60 text-base shadow-none"
            placeholder="you@yourcompany.co.uk"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? 'login-email-error' : undefined}
          />
          <FieldError id="login-email-error" message={state.fieldErrors?.email} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="inline-flex min-h-8 items-center rounded text-[11px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            ref={passwordRef}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={!ready || pending}
            className="h-[52px] rounded-xl bg-background/60 pr-12 text-base shadow-none"
            autoComplete="current-password"
            placeholder="••••••••••"
            required
            aria-invalid={Boolean(state.fieldErrors?.password)}
            aria-describedby={state.fieldErrors?.password ? 'login-password-error' : undefined}
          />
            <button type="button" onClick={() => setShowPassword((value) => !value)} disabled={!ready || pending}
              aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} aria-controls="password"
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
          <FieldError id="login-password-error" message={state.fieldErrors?.password} />
        </div>

        <SubmitButton className="h-[52px] w-full rounded-xl shadow-md shadow-black/5" size="lg" pendingLabel="Signing in…" disabled={!ready || Boolean(setupError)}>
          Sign in <ArrowRight aria-hidden />
        </SubmitButton>
      </form>

      <p className="border-t pt-5 text-center text-xs leading-7 text-muted-foreground">
        New to FactFind Pro?{' '}
        <Link href="/signup" className="inline-flex min-h-8 items-center rounded font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Register your practice
        </Link>
      </p>
    </div>
  )
}
