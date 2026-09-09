'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import { updateDeliveryAction, type SettingsActionState } from './actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/field-error'
import { SubmitButton } from '@/components/shared/submit-button'

const initialState: SettingsActionState = {}

interface DeliveryDefaults {
  delivery_email_copy: boolean
  delivery_client_copy: boolean
  delivery_webhook_enabled: boolean
  delivery_webhook_url: string
}

/*
 * Each toggle submits through an explicit hidden input driven by local state,
 * not the checkbox's own form control — see the onboarding delivery step for why.
 */
function Toggle({
  id,
  checked,
  onChange,
  label,
  children,
}: {
  id: string
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border p-4">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} className="mt-0.5" />
      {checked && <input type="hidden" name={id} value="on" />}
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}

export function DeliveryForm({ defaultValues }: { defaultValues: DeliveryDefaults }) {
  const [state, formAction] = useActionState(updateDeliveryAction, initialState)
  const [emailCopy, setEmailCopy] = useState(defaultValues.delivery_email_copy)
  const [clientCopy, setClientCopy] = useState(defaultValues.delivery_client_copy)
  const [webhook, setWebhook] = useState(defaultValues.delivery_webhook_enabled)

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message)
  }, [state])

  const showWebhookUrl = webhook || Boolean(state.fieldErrors?.delivery_webhook_url)

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Toggle id="delivery_email_copy" checked={emailCopy} onChange={setEmailCopy} label="Email me a copy">
        Every completed fact find arrives in your inbox with the PDF attached.
      </Toggle>

      <Toggle id="delivery_client_copy" checked={clientCopy} onChange={setClientCopy} label="Send the client a PDF copy">
        As soon as they submit, the client gets an email in your branding with their answers attached as a
        PDF. Replies come to you. You can also send one by hand from any submission.
      </Toggle>

      <Toggle id="delivery_webhook_enabled" checked={webhook} onChange={setWebhook} label="Send automatically to a CRM or Zapier">
        Posts each submission as JSON to a webhook URL.
        {showWebhookUrl && (
          <div className="mt-3 space-y-2">
            <Label htmlFor="delivery_webhook_url" className="text-xs">
              Webhook URL
            </Label>
            <Input
              id="delivery_webhook_url"
              name="delivery_webhook_url"
              defaultValue={defaultValues.delivery_webhook_url}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              aria-invalid={Boolean(state.fieldErrors?.delivery_webhook_url)}
            />
            <FieldError message={state.fieldErrors?.delivery_webhook_url} />
          </div>
        )}
      </Toggle>

      <SubmitButton pendingLabel="Saving…">Save delivery options</SubmitButton>
    </form>
  )
}
