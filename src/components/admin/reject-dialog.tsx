'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface RejectDialogProps {
  open: boolean
  count: number
  pending: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}

export function RejectDialog({ open, count, pending, onCancel, onConfirm }: RejectDialogProps) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) setReason('')
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Reject {count} registration{count === 1 ? '' : 's'}?
          </DialogTitle>
          <DialogDescription>
            The applicant will be emailed to say their account was not approved. They will not be able to sign
            in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reject-reason">Reason (optional)</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. We could not verify your FCA authorisation."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">This is included in the rejection email.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(reason)} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Reject {count > 1 ? `${count} users` : 'registration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
