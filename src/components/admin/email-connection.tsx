'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, KeyRound, Loader2, Mail, Send } from 'lucide-react'
import { sendTestEmailAction } from '@/app/(dashboard)/admin/emails/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface EmailConnectionProps {
  configured: boolean
  from: string
  testSender: boolean
  error?: string
  recipient: string
  automaticDeliveryReady: boolean
}

export function EmailConnection({
  configured,
  from,
  testSender,
  error,
  recipient,
  automaticDeliveryReady,
}: EmailConnectionProps) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; error?: string; messageId?: string } | null>(
    null,
  )
  function test() {
    startTransition(async () => {
      setResult(null)
      try {
        setResult(await sendTestEmailAction())
      } catch {
        setResult({
          ok: false,
          error: 'The test could not be completed. Check the email log before trying again.',
        })
      }
    })
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email connection
            </CardTitle>
            <CardDescription>
              Connect Resend, then send yourself a sample PDF to check the whole email.
            </CardDescription>
          </div>
          <Badge variant={configured && !error ? 'success' : 'secondary'}>
            {error ? 'Needs attention' : configured ? 'Key configured' : 'Log only'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 rounded-xl bg-muted/50 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Provider</p>
            <p className="mt-1 font-medium">Resend</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sender</p>
            <p className="mt-1 break-all font-medium">{from}</p>
          </div>
        </div>
        {!configured && (
          <Alert>
            <KeyRound />
            <AlertDescription>
              Set <code>RESEND_API_KEY</code> and <code>EMAIL_FROM</code> in your server
              environment, then redeploy. The key stays on the server. Logged emails are not sent
              later automatically.
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {configured && testSender && (
          <Alert variant="warning">
            <AlertDescription>
              You’re using Resend’s test sender. Verify your own domain and update{' '}
              <code>EMAIL_FROM</code> before sending client copies.
            </AlertDescription>
          </Alert>
        )}
        {!automaticDeliveryReady && (
          <Alert variant="warning">
            <AlertDescription>
              Automatic submission emails also need the server’s Supabase service-role key. That
              connection is not configured.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-5">
          <div className="min-w-0">
            <p className="text-sm font-medium">Test your connection</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              Sends one sample PDF to {recipient}. No client data.
            </p>
          </div>
          <Button onClick={test} disabled={!configured || Boolean(error) || pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Send />}
            {pending ? 'Sending test…' : 'Send test email'}
          </Button>
        </div>
        {result && (
          <Alert variant={result.ok ? 'success' : 'destructive'}>
            {result.ok && <CheckCircle2 />}
            <AlertDescription>
              {result.ok
                ? 'Resend accepted the test. Check your inbox and open the PDF attachment to confirm delivery.'
                : result.error}
              {result.messageId && (
                <p className="mt-2 break-all font-mono text-xs">Message ID: {result.messageId}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
