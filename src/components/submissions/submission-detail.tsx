import Link from 'next/link'
import { ArrowLeft, Building2, Calendar, Hash, Mail, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/page-header'
import { FactFindTypeBadge } from '@/components/shared/status-badge'
import { SubmissionAnswers } from './submission-answers'
import { SubmissionStatusSelect } from './submission-status-select'
import { ExportButton } from './export-button'
import { EmailClientButton } from './email-client-button'
import { FACTFIND_TYPE_META } from '@/lib/constants'
import type { FactFindSubmission } from '@/lib/supabase/database.types'
import { formatDate, formatRelative } from '@/lib/utils'

interface SubmissionDetailProps {
  submission: FactFindSubmission
  adviser?: { name: string; company_name: string | null; email: string } | null
  backHref: string
  backLabel?: string
  /** Route that streams the branded PDF. */
  pdfHref: string
  /** Admins see the owning adviser panel. */
  showAdviser?: boolean
}

function DetailRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof User
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} className="break-words text-sm hover:underline">
            {value}
          </a>
        ) : (
          <p className="break-words text-sm">{value}</p>
        )}
      </div>
    </div>
  )
}

export function SubmissionDetail({
  submission,
  adviser,
  backHref,
  backLabel = 'Back to submissions',
  pdfHref,
  showAdviser = false,
}: SubmissionDetailProps) {
  const meta = FACTFIND_TYPE_META[submission.form_type]

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href={backHref}>
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </Button>

      <PageHeader
        title={submission.client_name}
        description={`${meta.label} · submitted ${formatRelative(submission.submitted_at)}`}
        actions={
          <>
            <SubmissionStatusSelect submissionId={submission.id} status={submission.status} />
            <EmailClientButton submissionId={submission.id} clientEmail={submission.client_email} />
            <ExportButton payload={submission.submission_data} reference={submission.reference} pdfHref={pdfHref} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden p-0">
            <CardHeader className="p-6 pb-0">
              <CardTitle>Responses</CardTitle>
              <CardDescription>
                Everything the client submitted, grouped by the sections of the FactFind.
              </CardDescription>
            </CardHeader>
            <div className="mt-5">
              <SubmissionAnswers data={submission.submission_data} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Client details */}
          <Card>
            <CardHeader>
              <CardTitle>Client details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow icon={User} label="Full name" value={submission.client_name} />
              <DetailRow
                icon={Mail}
                label="Email"
                value={submission.client_email}
                href={`mailto:${submission.client_email}`}
              />
              <DetailRow
                icon={Phone}
                label="Phone"
                value={submission.client_phone ?? '—'}
                href={submission.client_phone ? `tel:${submission.client_phone}` : undefined}
              />
            </CardContent>
          </Card>

          {/* Submission information */}
          <Card>
            <CardHeader>
              <CardTitle>Submission information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow icon={Hash} label="Reference" value={submission.reference} />
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    FactFind type
                  </p>
                  <FactFindTypeBadge type={submission.form_type} className="mt-1" />
                </div>
              </div>
              <DetailRow
                icon={Calendar}
                label="Submitted"
                value={formatDate(submission.submitted_at, true)}
              />
            </CardContent>
          </Card>

          {/* Owning adviser (admin view) */}
          {showAdviser && adviser && (
            <Card>
              <CardHeader>
                <CardTitle>Adviser</CardTitle>
                <CardDescription>The adviser whose link was used.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow icon={User} label="Name" value={adviser.name} />
                <DetailRow icon={Building2} label="Company" value={adviser.company_name ?? '—'} />
                <Separator />
                <DetailRow icon={Mail} label="Email" value={adviser.email} href={`mailto:${adviser.email}`} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
