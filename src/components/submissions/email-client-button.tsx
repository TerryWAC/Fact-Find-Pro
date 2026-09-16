'use client'

import { useState, useTransition } from 'react'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { emailPdfToClientAction } from '@/app/(dashboard)/submissions/actions'

/** Sends the client a branded PDF of their submission, after a confirmation. */
export function EmailClientButton({
  submissionId,
  clientEmail,
}: {
  submissionId: string
  clientEmail: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function send() {
    startTransition(async () => {
      let result
      try {
        result = await emailPdfToClientAction(submissionId)
      } catch {
        toast.error(
          'Could not complete the email request. Please check the email log before retrying.',
        )
        return
      }
      setOpen(false)
      if (!result.ok) {
        toast.error(result.error ?? 'Could not send the email')
        return
      }
      if (result.loggedOnly) {
        toast.info('PDF email logged only', {
          description:
            'No email provider is configured. Nothing was sent or queued for later delivery.',
        })
        return
      }
      toast.success(`Resend accepted the PDF email for ${clientEmail}`)
    })
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={pending}>
        <Send className="h-4 w-4" />
        Email PDF to client
      </Button>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!pending) setOpen(value)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email a PDF copy to the client?</DialogTitle>
            <DialogDescription>
              A PDF of this submission, in your branding, will be emailed to{' '}
              <span className="font-medium text-foreground">{clientEmail}</span>. Replies come to
              you.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={send} disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {pending ? 'Sending…' : 'Send PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
