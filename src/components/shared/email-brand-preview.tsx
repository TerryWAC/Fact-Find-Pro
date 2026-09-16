'use client'

import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { interpolate, wrapHtml, type EmailBranding } from '@/lib/email/render'
import { DEFAULT_EMAIL_TEMPLATES } from '@/lib/email/templates'

/** Uses the same frame as delivered mail, with fictional answers and no attachment. */
export function EmailBrandPreview({ branding }: { branding: EmailBranding }) {
  const template = DEFAULT_EMAIL_TEMPLATES.submission_client_copy
  const vars = { client_name: 'Sam Taylor', adviser_name: branding.adviserName || 'Your adviser', company_name: branding.companyName || 'Your firm', form_type: 'Mortgage', reference: 'FF-EXAMPLE', submitted_at: '13/09/2026, 10:30' }
  const html = wrapHtml(interpolate(template.bodyHtml, vars, true), interpolate(template.subject, vars), branding)
  return (
    <Dialog>
      <DialogTrigger asChild><Button type="button" variant="outline"><Mail className="h-4 w-4" />Preview client email</Button></DialogTrigger>
      <DialogContent className="max-w-2xl p-4 sm:p-6">
        <DialogTitle className="pr-8">Your branded client email</DialogTitle>
        <DialogDescription>Preview with fictional details. Save branding to apply it. An administrator may have customised the email wording.</DialogDescription>
        <iframe title="Client email preview" sandbox="" srcDoc={html} className="h-[60dvh] min-h-60 w-full rounded-lg border bg-white" />
      </DialogContent>
    </Dialog>
  )
}
