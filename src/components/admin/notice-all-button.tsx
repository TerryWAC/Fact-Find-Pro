'use client'

import { useState } from 'react'
import { Loader2, Megaphone } from 'lucide-react'
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
import { noticeBatchAction } from '@/app/(dashboard)/admin/imports/actions'

interface NoticeAllButtonProps {
  /** Prepared advisers who have not yet been sent the notice. */
  pending: number
}

/**
 * Sends the Version 1 retirement notice to every prepared adviser who has not
 * had it, in short batches. Advisers already in the email log are skipped.
 */
export function NoticeAllButton({ pending }: NoticeAllButtonProps) {
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [sent, setSent] = useState(0)
  const [failed, setFailed] = useState(0)
  const [notes, setNotes] = useState<string[]>([])
  const total = pending
  const processed = sent + failed

  async function run() {
    setRunning(true)
    setDone(false)
    let totalSent = 0
    let totalFailed = 0
    const allNotes: string[] = []
    try {
      for (let guard = 0; guard < 100; guard++) {
        const result = await noticeBatchAction()
        if (!result.ok) {
          toast.error(result.error ?? 'Sending stopped unexpectedly')
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
      if (totalFailed) toast.warning(`${totalSent} sent, ${totalFailed} need attention`)
      else toast.success(`${totalSent} ${totalSent === 1 ? 'notice' : 'notices'} sent`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={pending === 0 || running} data-testid="notice-all">
        <Megaphone className="h-4 w-4" />
        {pending === 0 ? 'Everyone has had the notice' : `Send the notice to ${pending} ${pending === 1 ? 'adviser' : 'advisers'}`}
      </Button>

      <Dialog open={open} onOpenChange={(next) => !running && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email the Version 1 retirement notice to {total} advisers?</DialogTitle>
            <DialogDescription>
              Each adviser receives the notice once. It tells them Version 1 is being discontinued, that their
              activation email has been sent, and where to sign up if they cannot find it. Advisers already in
              the email log are not emailed again. The wording can be changed under Admin → Emails first.
            </DialogDescription>
          </DialogHeader>

          {(running || done) && (
            <div className="space-y-2" aria-live="polite">
              <Progress value={total ? Math.round((processed / total) * 100) : 100} aria-label="Notice progress" />
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
                <Button onClick={run} disabled={running} data-testid="confirm-notice-all">
                  {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
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
