'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import { activateAccountAction } from '../actions'
import type { ActionState } from '@/app/(auth)/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { FieldError } from '@/components/shared/field-error'
import { SubmitButton } from '@/components/shared/submit-button'

const initialState: ActionState = {}

interface ActivationFormProps {
  token: string
  email: string
  expiresOn: string
  defaults: {
    name: string
    company_name: string
    phone: string
    job_title: string
    website: string
    business_location: string
  }
  images: Partial<Record<'avatar_url' | 'logo_url', string>>
}

function Field({
  id,
  label,
  defaultValue,
  error,
  required,
  type = 'text',
  autoComplete,
  placeholder,
}: {
  id: keyof ActivationFormProps['defaults']
  label: string
  defaultValue: string
  error?: string
  required?: boolean
  type?: string
  autoComplete?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
      />
      <FieldError message={error} />
    </div>
  )
}

/**
 * The adviser's side of activation: confirm the details prepared for them,
 * decide whether to keep the photo and logo they supplied, choose a password
 * and delivery preferences, and accept the current terms.
 */
export function ActivationForm({ token, email, expiresOn, defaults, images }: ActivationFormProps) {
  const [state, formAction] = useActionState(activateAccountAction, initialState)
  const errors = state.fieldErrors ?? {}

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Activate your FactFind Pro account</h1>
        <p className="text-sm text-muted-foreground">
          Check the details we hold for you, choose a password and your account is live, with four client
          FactFind links ready to share. This link expires on {expiresOn}.
        </p>
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-6" noValidate>
        <input type="hidden" name="token" value={token} />

        <section className="space-y-4">
          <h2 className="text-sm font-semibold">Your details</h2>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" value={email} disabled readOnly />
            <p className="text-xs text-muted-foreground">You will sign in with this address.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Full name" defaultValue={defaults.name} error={errors.name} required autoComplete="name" />
            <Field id="phone" label="Phone number" defaultValue={defaults.phone} error={errors.phone} required type="tel" autoComplete="tel" />
          </div>
          <Field id="company_name" label="Company name" defaultValue={defaults.company_name} error={errors.company_name} required autoComplete="organization" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="job_title" label="Job title" defaultValue={defaults.job_title} error={errors.job_title} autoComplete="organization-title" placeholder="Mortgage and Protection Adviser" />
            <Field id="business_location" label="Business location" defaultValue={defaults.business_location} error={errors.business_location} placeholder="Manchester, UK" />
          </div>
          <Field id="website" label="Website" defaultValue={defaults.website} error={errors.website} type="url" autoComplete="url" placeholder="https://" />
        </section>

        {(images.avatar_url || images.logo_url) && (
          <>
            <Separator />
            <section className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold">Your photo and logo</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  These were supplied with your original signup. Tick the ones to show on your client pages and
                  PDFs. You can change them later in Settings.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ['avatar_url', 'use_photo', 'Use this as my photo', 'Supplied adviser photo'],
                    ['logo_url', 'use_logo', 'Use this as my company logo', 'Supplied company logo'],
                  ] as const
                ).map(([key, field, label, alt]) =>
                  images[key] ? (
                    <div key={key} className="rounded-xl border p-3">
                      <div className="flex h-32 items-center justify-center rounded-lg bg-muted/30 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element -- private signed preview */}
                        <img src={images[key]} alt={alt} className={key === 'avatar_url' ? 'h-28 w-28 rounded-full object-cover' : 'max-h-full max-w-full object-contain'} />
                      </div>
                      <div className="mt-3 flex items-start gap-3">
                        <Checkbox id={field} name={field} defaultChecked className="mt-0.5" />
                        <Label htmlFor={field} className="text-sm font-normal leading-relaxed">
                          {label}
                        </Label>
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            </section>
          </>
        )}

        <Separator />

        <section className="space-y-4">
          <h2 className="text-sm font-semibold">Choose a password</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 10 characters" required aria-invalid={Boolean(errors.password)} />
              <FieldError message={errors.password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm password</Label>
              <Input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" required aria-invalid={Boolean(errors.confirm_password)} />
              <FieldError message={errors.confirm_password} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Use 10+ characters with upper and lower case letters and a number, and not one you use elsewhere.
          </p>
        </section>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">When a client completes a FactFind</h2>
          <div className="flex items-start gap-3 rounded-xl border p-4">
            <Checkbox id="delivery_email_copy" name="delivery_email_copy" defaultChecked className="mt-0.5" />
            <div>
              <Label htmlFor="delivery_email_copy" className="text-sm font-medium">
                Email me a copy
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">Each completed fact find arrives in your inbox with the PDF attached.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border p-4">
            <Checkbox id="delivery_client_copy" name="delivery_client_copy" className="mt-0.5" />
            <div>
              <Label htmlFor="delivery_client_copy" className="text-sm font-medium">
                Send the client a PDF copy
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                The client receives their answers as a PDF in your branding the moment they submit. Replies come to you.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">You can change these any time in Settings.</p>
        </section>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Checkbox id="terms" name="terms" aria-required className="mt-0.5" aria-invalid={Boolean(errors.terms)} />
            <Label htmlFor="terms" className="text-sm font-normal leading-relaxed text-muted-foreground">
              I confirm I am an FCA-authorised adviser (or work under an authorised firm) and accept the{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                FactFind Pro terms of use
              </Link>{' '}
              and have read the{' '}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                privacy notice
              </Link>
              .
            </Label>
          </div>
          <FieldError message={errors.terms} />
        </div>

        <SubmitButton className="w-full" size="lg" pendingLabel="Activating…">
          <ShieldCheck className="h-4 w-4" /> Activate my account
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already activated?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
