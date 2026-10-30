'use client'

import { useState } from 'react'
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
import { Progress } from '@/components/ui/progress'
import { inviteBatchAction } from '@/app/(dashboard)/admin/imports/actions'

interface InviteAllButtonProps {
  /** Prepared advisers who have not yet been sent a link. */
  waiting: number
}

/**
 * Invites every prepared adviser who has not had a link yet, in short batches
 * so progress is visible and no single request runs long.
 */
export function InviteAllButton({ waiting }: InviteAllButtonProps) {
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [sent, setSent] = useState(0)
  const [failed, setFailed] = useState(0)
  const [notes, setNotes] = useState<string[]>([])
  const total = waiting
  const processed = sent + failed

  async function run() {
    setRunning(true)
    setDone(false)
    let totalSent = 0
    let totalFailed = 0
    const allNotes: string[] = []
    try {
      for (let guard = 0; guard < 100; guard++) {
        const result = await inviteBatchAction()
        if (!result.ok) {
          toast.error(result.error ?? 'Inviting stopped unexpectedly')
          break
        }
        totalSent += result.sent
        totalFailed += result.failed
        allNotes.push(...result.notes)
        setSent(totalSent)
        setFailed(totalFailed)
        setNotes([...allNotes])
        if (result.remaining === 0 || result.sent + result.failed === 0) break
      }
      setDone(true)
      if (totalFailed) toast.warning(`${totalSent} invited, ${totalFailed} need attention`)
      else toast.success(`${totalSent} activation ${totalSent === 1 ? 'link' : 'links'} sent`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={waiting === 0 || running} data-testid="invite-all">
        <Send className="h-4 w-4" />
        {waiting === 0 ? 'Everyone has been invited' : `Invite all ${waiting} waiting advisers`}
      </Button>

      <Dialog open={open} onOpenChange={(next) => !running && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email activation links to {total} advisers?</DialogTitle>
            <DialogDescription>
              Each adviser receives one email with a personal link to set a password, check their details and
              switch on their four FactFind links. Links work once and expire in 14 days. Advisers who already
              have a link are not emailed again.
            </DialogDescription>
          </DialogHeader>

          {(running || done) && (
            <div className="space-y-2" aria-live="polite">
              <Progress value={total ? Math.round((processed / total) * 100) : 100} aria-label="Invitation progress" />
              <p className="text-sm">
                {done ? 'Finished.' : 'Sending…'} {sent} sent{failed ? `, ${failed} need attention` : ''} of {total}.
              </p>
              {notes.length > 0 && (
                <ul className="max-h-40 space-y-1 overflow-auto rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                  {notes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <DialogFooter>
            {done ? (
              <Button onClick={() => window.location.reload()}>Close and refresh</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={running}>
                  Cancel
                </Button>
                <Button onClick={run} disabled={running} data-testid="confirm-invite-all">
                  {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {running ? 'Sending…' : `Send ${total} emails`}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
