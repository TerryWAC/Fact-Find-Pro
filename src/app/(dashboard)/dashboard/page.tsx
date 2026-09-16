import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Inbox,
  Link2,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FactFindTypeBadge } from '@/components/shared/status-badge'
import { SubmissionLoadError } from '@/components/submissions/submission-load-error'
import { requireApprovedUser } from '@/lib/auth'
import { getRecentActivity, getSubmissionStats } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'
import { formatRelative, formatDate, initials } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const { id, profile } = await requireApprovedUser()
  const supabase = await createClient()
  const [stats, activity, queue] = await Promise.all([
    getSubmissionStats(id),
    getRecentActivity(id, 4),
    supabase
      .from('factfind_submissions')
      .select('id, reference, client_name, client_email, form_type, submitted_at')
      .eq('adviser_id', id)
      .eq('status', 'new')
      .order('submitted_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(5),
  ])
  const submissions = queue.data ?? []
  const nextSubmission = queue.error ? undefined : submissions[0]
  const firstName = profile.name.trim().split(/\s+/)[0]
  const newCount = stats.byStatus.new
  const unavailable =
    stats.total === null ||
    stats.last30Days === null ||
    Object.values(stats.byStatus).some((value) => value === null)

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border bg-card p-5 sm:p-7" aria-label="Workspace overview">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-accent/10 to-transparent" aria-hidden />
        <div className="relative">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-strong dark:text-accent">Your practice, at a glance</p>
        <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Pick up your next review and keep your clients moving."
        actions={
          <Button asChild variant="outline" className="min-h-11 rounded-lg bg-card">
            <Link href="/links">
              <Link2 className="h-4 w-4" aria-hidden />
              Share a FactFind
            </Link>
          </Button>
        }
        />
        {nextSubmission && (
          <div className="mt-6 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Next in your review queue</p>
              <p className="mt-1 text-sm font-semibold">{nextSubmission.client_name} <span className="ml-2 font-mono text-[11px] font-normal text-muted-foreground">{nextSubmission.reference}</span></p>
            </div>
            <Button asChild className="min-h-11 rounded-lg">
              <Link href={`/submissions/${nextSubmission.id}`}>Start next review <ArrowRight aria-hidden /></Link>
            </Button>
          </div>
        )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Submission overview">
        <StatCard
          label="Needs review"
          value={newCount ?? '—'}
          icon={Inbox}
          description="New client submissions"
          href="/submissions?status=new&sort=oldest"
          emphasis
          compact
        />
        <StatCard
          label="In review"
          value={stats.byStatus.in_review ?? '—'}
          icon={Clock3}
          description="Work you have started"
          href="/submissions?status=in_review"
          compact
        />
        <StatCard
          label="Completed"
          value={stats.byStatus.completed ?? '—'}
          icon={CheckCircle2}
          description="Reviews marked complete"
          href="/submissions?status=completed"
          compact
        />
        <StatCard
          label="All submissions"
          value={stats.total ?? '—'}
          icon={FileText}
          description={
            stats.last30Days === null
              ? 'Recent total unavailable'
              : `${stats.last30Days} received in the last 30 days`
          }
          href="/submissions"
          compact
        />
      </div>
      {unavailable && (
        <p role="status" className="text-sm text-muted-foreground">
          Some totals are temporarily unavailable. You can still open your submissions below.
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <Card className="min-w-0 overflow-hidden" role="region" aria-labelledby="review-queue-title">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="space-y-1.5">
              <CardTitle>
                <h2 id="review-queue-title">Ready for your review</h2>
              </CardTitle>
              <CardDescription>New submissions, with the longest waiting first.</CardDescription>
            </div>
            {newCount !== null && newCount > 0 && (
              <span className="w-fit shrink-0 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-strong dark:text-accent">
                {newCount} waiting
              </span>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {queue.error ? (
              <SubmissionLoadError />
            ) : submissions.length === 0 ? (
              <EmptyState
                icon={stats.total === 0 ? Link2 : CheckCircle2}
                title={stats.total === 0 ? 'Your first client starts here' : 'No new submissions waiting'}
                description={
                  stats.total === 0
                    ? 'Choose a FactFind and share your personal link. Completed forms will arrive here, ready to review.'
                    : 'Open your in-review submissions to continue work, or share a link with your next client.'
                }
                action={
                  <Button asChild variant="outline">
                    <Link href={stats.total === 0 ? '/links' : '/submissions?status=in_review'}>
                      {stats.total === 0 ? 'Choose a FactFind' : 'Continue your reviews'}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y border-t">
                {submissions.map((submission) => (
                  <li key={submission.id}>
                    <Link
                      href={`/submissions/${submission.id}`}
                      className="group flex items-center gap-3 px-4 py-5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6"
                    >
                      <span
                        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground sm:flex"
                        aria-hidden
                      >
                        {initials(submission.client_name)}
                      </span>
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="break-words text-sm font-semibold group-hover:text-accent-strong dark:group-hover:text-accent">
                          {submission.client_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <FactFindTypeBadge type={submission.form_type} />
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {submission.reference}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Received{' '}
                          <time dateTime={submission.submitted_at}>
                            {formatDate(submission.submitted_at)}
                          </time>
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-xs font-medium">
                        Review
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {!queue.error && submissions.length > 0 && (
              <div className="border-t bg-muted/30 px-4 py-3 sm:px-6">
                <Button asChild variant="ghost" size="sm" className="-ml-3">
                  <Link href="/submissions?status=new&sort=oldest">
                    View all new submissions
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-xl border bg-card" aria-labelledby="next-client-title">
            <div className="border-b bg-muted/30 p-6">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-strong dark:text-accent"><Link2 className="h-5 w-5" aria-hidden /></span>
              <h2 id="next-client-title" className="text-lg font-semibold">Your client experience</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your branding and saved delivery preferences.</p>
            </div>
            <div className="p-6">
            <dl className="space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4"><dt className="text-muted-foreground">Client branding</dt><dd className="min-w-0 break-words text-right font-medium">{profile.company_name?.trim() || profile.name}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Adviser PDF copy</dt><dd className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{profile.delivery_email_copy ? 'Automatic' : 'Off'}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Client PDF copy</dt><dd className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{profile.delivery_client_copy ? 'Automatic' : 'Off'}</dd></div>
            </dl>
            <Button asChild variant="outline" className="mt-6 min-h-11 w-full rounded-lg">
              <Link href="/links">
                Choose a client link
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Link
              href="/settings"
              className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden />
              Manage your branding and delivery
            </Link>
            <Link href="/how-it-works" className="flex min-h-11 items-center justify-center gap-2 rounded text-xs font-medium text-accent-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-accent"><BookOpen className="h-3.5 w-3.5" aria-hidden />Take the How it works tour</Link>
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Recent activity</h2>
              </CardTitle>
              <CardDescription>The latest from your account.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {activity.length === 0 ? (
                <EmptyState
                  className="py-8"
                  icon={Activity}
                  title="No recent activity"
                  description="Account updates will appear here."
                />
              ) : (
                <ul className="divide-y">
                  {activity.map((entry) => (
                    <li key={entry.id} className="px-6 py-4">
                      <p className="text-sm font-medium leading-snug">{entry.title}</p>
                      {entry.description && (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {entry.description}
                        </p>
                      )}
                      <time
                        dateTime={entry.created_at}
                        className="mt-2 block text-[11px] text-muted-foreground"
                      >
                        {formatRelative(entry.created_at)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
