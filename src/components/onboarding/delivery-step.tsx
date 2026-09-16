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
  const submittedClientCopy = state.values?.delivery_client_copy as boolean | undefined
  const submittedWebhook = state.values?.delivery_webhook_enabled as boolean | undefined

  const emailCopyDefault = submittedEmailCopy ?? profile.delivery_email_copy
  const clientCopyDefault = submittedClientCopy ?? profile.delivery_client_copy
  const webhookDefault = submittedWebhook ?? profile.delivery_webhook_enabled
  const webhookUrl =
    (state.values?.delivery_webhook_url as string | undefined) ?? profile.delivery_webhook_url ?? ''

  const [emailCopy, setEmailCopy] = useState(emailCopyDefault)
  const [clientCopy, setClientCopy] = useState(clientCopyDefault)
  const [webhook, setWebhook] = useState(webhookDefault)

  // Re-sync after a submit so the toggles reflect what was actually sent,
  // whichever way React reconciles the re-render.
  useEffect(() => {
    if (submittedEmailCopy !== undefined) setEmailCopy(submittedEmailCopy)
    if (submittedClientCopy !== undefined) setClientCopy(submittedClientCopy)
    if (submittedWebhook !== undefined) setWebhook(submittedWebhook)
  }, [submittedEmailCopy, submittedClientCopy, submittedWebhook])

  // Never hide a field that is carrying an error message.
  const showWebhookUrl = webhook || Boolean(state.fieldErrors?.delivery_webhook_url)

  return (
    <StepShell
      title="Where should completed fact finds go?"
      description="Decide who receives a PDF when a form is submitted, whether the client completes it or you fill it in together. These choices can be changed any time in Settings."
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
                  Receive a notification with the completed FactFind attached as a branded PDF.
                  The submission is also available in your dashboard.
                </p>
              </div>
            </div>
          </Option>

          {/* PDF copy to the client */}
          <Option checked={clientCopy}>
            <div className="flex items-start gap-3">
              <Checkbox
                id="delivery_client_copy"
                checked={clientCopy}
                onCheckedChange={(value) => setClientCopy(value === true)}
                className="mt-0.5"
              />
              {clientCopy && <input type="hidden" name="delivery_client_copy" value="on" />}
              <div>
                <Label htmlFor="delivery_client_copy" className="text-sm font-medium">
                  Send the client a PDF copy
                </Label>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  The client receives their answers as a branded PDF, excluding adviser-only notes.
                  Emails use the FactFind sending domain and replies come to you. You can also send a copy from a submission.
                </p>
              </div>
            </div>
          </Option>

          {/* Downloads — always on */}
          <Option checked locked>
            <div className="flex items-start gap-3">
              <Checkbox checked disabled className="mt-0.5" aria-label="PDF downloads and copying JSON, always available" />
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  PDF downloads and copying JSON
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Always available. Download a PDF per fact find or copy its answers as JSON.
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
                  CRM or Zapier preference — coming soon
                </Label>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Saves your preference only. Automatic delivery to your CRM is not available yet.
                  Use email, PDF downloads or copying JSON in the meantime.
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

        <div className="rounded-xl border bg-accent/5 p-5" role="status">
          <p className="text-sm font-semibold">When a FactFind is submitted</p>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">It will appear in your dashboard. Adviser PDF email: <strong className="font-medium text-foreground">{emailCopy ? 'automatic' : 'off'}</strong>. Client PDF email: <strong className="font-medium text-foreground">{clientCopy ? 'automatic' : 'off'}</strong>.</p>
          <p className="mt-2 text-xs text-muted-foreground">Save and continue applies these choices. Saving your setup does not send an email.</p>
        </div>
        <StepFooter backTo={3} skipTo={5} />
      </form>
    </StepShell>
  )
}
