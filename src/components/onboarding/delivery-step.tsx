'use client'

import { useActionState, useEffect, useState } from 'react'
import { AlertCircle, Lock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'
import { StepFooter } from './step-footer'
import { StepShell } from './step-shell'
import { saveDeliveryAction, type OnboardingActionState } from '@/app/(onboarding)/onboarding/actions'
import type { Profile } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils'

const initialState: OnboardingActionState = {}

/*
 * The submitted value comes from an explicit hidden input driven by our own
 * state, not from the checkbox's built-in form control. When `checked` is set
 * programmatically (as it is when re-syncing after a failed submit) that
 * built-in control can lag behind the visible state — which submits the
 * opposite of what the user sees. Owning the input keeps them in step.
 */

function Option({
  checked,
  children,
  locked,
}: {
  checked: boolean
  children: React.ReactNode
  locked?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-colors',
        checked ? 'border-accent bg-accent/5' : 'border-border',
        locked && 'opacity-90',
      )}
    >
      {children}
    </div>
  )
}

export function DeliveryStep({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState(saveDeliveryAction, initialState)

  /*
   * A failed submit re-mounts this step, which resets any local state — so the
   * saved profile is the baseline and `state.values` (what the user just sent)
   * takes precedence. Local state only tracks changes since the last render.
   */
  const submittedEmailCopy = state.values?.delivery_email_copy as boolean | undefined
  const submittedWebhook = state.values?.delivery_webhook_enabled as boolean | undefined

  const emailCopyDefault = submittedEmailCopy ?? profile.delivery_email_copy
  const webhookDefault = submittedWebhook ?? profile.delivery_webhook_enabled
  const webhookUrl =
    (state.values?.delivery_webhook_url as string | undefined) ?? profile.delivery_webhook_url ?? ''

  const [emailCopy, setEmailCopy] = useState(emailCopyDefault)
  const [webhook, setWebhook] = useState(webhookDefault)

  // Re-sync after a submit so the toggles reflect what was actually sent,
  // whichever way React reconciles the re-render.
  useEffect(() => {
    if (submittedEmailCopy !== undefined) setEmailCopy(submittedEmailCopy)
    if (submittedWebhook !== undefined) setWebhook(submittedWebhook)
  }, [submittedEmailCopy, submittedWebhook])

  // Never hide a field that is carrying an error message.
  const showWebhookUrl = webhook || Boolean(state.fieldErrors?.delivery_webhook_url)

  return (
    <StepShell
      title="Where should completed fact finds go?"
      description="Tick everything that applies. You can change this any time in Settings."
    >
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-6" noValidate>
        <Card className="space-y-4 p-6">
          {/* Email a copy */}
          <Option checked={emailCopy}>
            <div className="flex items-start gap-3">
              <Checkbox
                id="delivery_email_copy"
                checked={emailCopy}
                onCheckedChange={(value) => setEmailCopy(value === true)}
                className="mt-0.5"
              />
              {emailCopy && <input type="hidden" name="delivery_email_copy" value="on" />}
              <div>
                <Label htmlFor="delivery_email_copy" className="text-sm font-medium">
                  Email me a copy
                </Label>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  When a fact find is finished you get an email with the full brief. Forward it, or paste it
                  into any CRM. No setup needed.
                </p>
              </div>
            </div>
          </Option>

          {/* Downloads — always on */}
          <Option checked locked>
            <div className="flex items-start gap-3">
              <Checkbox checked disabled className="mt-0.5" aria-label="PDF and CSV downloads, always on" />
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  PDF and CSV downloads
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Always on. Download a PDF per fact find, or a CSV of everything for importing into your own
                  CRM.
                </p>
              </div>
            </div>
          </Option>

          {/* Webhook */}
          <Option checked={webhook}>
            <div className="flex items-start gap-3">
              <Checkbox
                id="delivery_webhook_enabled"
                checked={webhook}
                onCheckedChange={(value) => setWebhook(value === true)}
                className="mt-0.5"
              />
              {webhook && <input type="hidden" name="delivery_webhook_enabled" value="on" />}
              <div className="min-w-0 flex-1">
                <Label htmlFor="delivery_webhook_enabled" className="text-sm font-medium">
                  Send automatically to a CRM or Zapier
                </Label>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Works with any system that accepts a JSON webhook: Zapier, Make, GoHighLevel, HubSpot, or a
                  custom CRM. If you are not sure, leave this off and use email or CSV.
                </p>

                {showWebhookUrl && (
                  <div className="mt-3 space-y-2">
                    <Label htmlFor="delivery_webhook_url" className="text-xs">
                      Webhook URL
                    </Label>
                    <Input
                      id="delivery_webhook_url"
                      name="delivery_webhook_url"
                      defaultValue={webhookUrl}
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      aria-invalid={Boolean(state.fieldErrors?.delivery_webhook_url)}
                    />
                    <FieldError message={state.fieldErrors?.delivery_webhook_url} />
                  </div>
                )}
              </div>
            </div>
          </Option>
        </Card>

        <StepFooter backTo={3} skipTo={5} />
      </form>
    </StepShell>
  )
}
