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
import { CopyButton } from '@/components/shared/copy-button'
import { inviteAdviserAction } from '@/app/(dashboard)/admin/imports/actions'

interface InviteAdviserButtonProps {
  profileId: string
  name: string
  email: string
  /** True when a link has been sent before and this issues a replacement. */
  resend?: boolean
}

/** Sends one prepared adviser their activation link, after a confirmation. */
export function InviteAdviserButton({ profileId, name, email, resend = false }: InviteAdviserButtonProps) {
  const [open, setOpen] = useState(false)
  const [activationUrl, setActivationUrl] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function send() {
    startTransition(async () => {
      const result = await inviteAdviserAction(profileId)
      setOpen(false)
      if (!result.ok) {
        toast.error(result.error ?? 'The activation link could not be sent')
        return
      }
      setActivationUrl(result.activationUrl ?? null)
      if (result.warning) toast.warning(result.message)
      else toast.success(result.message)
    })
  }

  return (
    <div className="space-y-3">
      <Button variant={resend ? 'outline' : 'default'} onClick={() => setOpen(true)} data-testid="invite-adviser">
        <Send className="h-4 w-4" />
        {resend ? 'Send a new activation link' : 'Send activation link'}
      </Button>

      {activationUrl && (
        <div className="rounded-xl border bg-muted/30 p-3" data-testid="activation-link">
          <p className="text-xs font-medium">Activation link issued</p>
          <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{activationUrl}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            It has been emailed to {email}. If the email does not arrive, you can pass this link on directly.
            It works once and expires in 14 days.
          </p>
          <CopyButton value={activationUrl} label="Copy activation link" toastMessage="Activation link copied" className="mt-2" />
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{resend ? 'Send a new activation link?' : 'Send the activation link?'}</DialogTitle>
            <DialogDescription>
              An email goes to <span className="font-medium text-foreground">{email}</span> inviting{' '}
              {name} to set a password, check their details and switch on their four FactFind links.
              {resend ? ' Any earlier link stops working.' : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={send} disabled={pending} data-testid="confirm-invite">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {pending ? 'Sending…' : 'Send email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
