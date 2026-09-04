import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowUpRight,
  Building2,
  FileText,
  Home,
  Link2,
  Settings,
  Shield,
  Stethoscope,
  Activity,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FactFindTypeBadge, SubmissionStatusBadge } from '@/components/shared/status-badge'
import { requireApprovedUser } from '@/lib/auth'
import { getRecentActivity, getSubmissionStats } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'
import { formatRelative, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

const QUICK_LINKS = [
  {
    href: '/links',
    icon: Link2,
    title: 'My FactFind links',
    description: 'Copy and share your four unique client links.',
  },
  {
    href: '/submissions',
    icon: FileText,
    title: 'All submissions',
    description: 'Search, filter and review everything clients have sent.',
  },
  {
    href: '/settings',
    icon: Settings,
    title: 'Account settings',
    description: 'Update your details, company name and password.',
  },
]

export default async function DashboardPage() {
  const { id, profile } = await requireApprovedUser()
  const supabase = await createClient()

  const [stats, activity, recentSubmissions] = await Promise.all([
    getSubmissionStats(id),
    getRecentActivity(id, 6),
    supabase
      .from('factfind_submissions')
      .select('id, reference, client_name, client_email, form_type, status, submitted_at')
      .eq('adviser_id', id)
      .order('submitted_at', { ascending: false })
      .limit(5),
  ])

  const submissions = recentSubmissions.data ?? []
  const firstName = profile.name.split(' ')[0]

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your FactFind activity at a glance."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/links">
                <Link2 className="h-4 w-4" />
                My links
              </Link>
            </Button>
            <Button asChild>
              <Link href="/submissions">
                View submissions
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Total submissions"
          value={stats.total}
          icon={FileText}
          description={`${stats.last30Days} in the last 30 days`}
          href="/submissions"
          emphasis
        />
        <StatCard
          label="Mortgage"
          value={stats.byType.mortgage}
          icon={Building2}
          href="/submissions?type=mortgage"
        />
        <StatCard
          label="Protection"
          value={stats.byType.protection}
          icon={Shield}
          href="/submissions?type=protection"
        />
        <StatCard
          label="Medical"
          value={stats.byType.medical}
          icon={Stethoscope}
          href="/submissions?type=medical"
        />
        <StatCard label="Home" value={stats.byType.home} icon={Home} href="/submissions?type=home" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent submissions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle>Recent submissions</CardTitle>
              <CardDescription>The five most recent FactFinds from your links.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/submissions">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {submissions.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No submissions yet"
                description="Share your FactFind links with clients — submissions will appear here as soon as they arrive."
                action={
                  <Button asChild size="sm">
                    <Link href="/links">Get my links</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y">
                {submissions.map((submission) => (
                  <li key={submission.id}>
                    <Link
                      href={`/submissions/${submission.id}`}
                      className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{submission.client_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{submission.client_email}</p>
                      </div>
                      <FactFindTypeBadge type={submission.form_type} className="hidden sm:inline-flex" />
                      <SubmissionStatusBadge status={submission.status} className="hidden md:inline-flex" />
                      <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                        {formatDate(submission.submitted_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>What has happened on your account.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {activity.length === 0 ? (
              <EmptyState icon={Activity} title="Nothing yet" description="Activity will show here." />
            ) : (
              <ul className="divide-y">
                {activity.map((entry) => (
                  <li key={entry.id} className="px-6 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-snug">{entry.title}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatRelative(entry.created_at)}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{entry.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
          <CardDescription>Jump straight to where you work most.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-lg border p-4 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent-strong dark:text-accent">
                <link.icon className="h-4 w-4" />
              </span>
              <p className="flex items-center gap-1.5 text-sm font-medium">
                {link.title}
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{link.description}</p>
            </Link>
          ))}
        </CardContent>
      </Card>

      {profile.adviser_slug && (
        <p className="text-xs text-muted-foreground">
          Your adviser identifier is{' '}
          <Badge variant="outline" className="font-mono">
            {profile.adviser_slug}
          </Badge>{' '}
          — it appears in every one of your client links.
        </p>
      )}
    </>
  )
}
