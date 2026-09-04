import type { Metadata } from 'next'
import Link from 'next/link'
import { Activity, ArrowUpRight, CheckCircle2, Clock, FileText, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FactFindTypeBadge, UserStatusBadge } from '@/components/shared/status-badge'
import { requireAdmin } from '@/lib/auth'
import { getAdminStats, getRecentActivity } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatRelative } from '@/lib/utils'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [stats, activity, registrations, submissions] = await Promise.all([
    getAdminStats(),
    getRecentActivity(null, 6),
    supabase
      .from('profiles')
      .select('id, name, company_name, email, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('factfind_submissions')
      .select(
        'id, client_name, client_email, form_type, submitted_at, adviser:profiles!factfind_submissions_adviser_id_fkey(name)',
      )
      .order('submitted_at', { ascending: false })
      .limit(5),
  ])

  const recentRegistrations = registrations.data ?? []
  const recentSubmissions = (submissions.data ?? []) as unknown as Array<{
    id: string
    client_name: string
    client_email: string
    form_type: 'mortgage' | 'protection' | 'medical' | 'home'
    submitted_at: string
    adviser: { name: string } | { name: string }[] | null
  }>

  return (
    <>
      <PageHeader
        title="Admin dashboard"
        description="Platform-wide view of advisers, approvals and client submissions."
        actions={
          <Button asChild>
            <Link href="/admin/users?status=pending">
              Review approvals
              {stats.pendingUsers > 0 && (
                <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                  {stats.pendingUsers}
                </span>
              )}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={stats.totalUsers} icon={Users} href="/admin/users" />
        <StatCard
          label="Pending approvals"
          value={stats.pendingUsers}
          icon={Clock}
          href="/admin/users?status=pending"
          description={stats.pendingUsers > 0 ? 'Waiting on you' : 'All caught up'}
          emphasis={stats.pendingUsers > 0}
        />
        <StatCard
          label="Approved users"
          value={stats.approvedUsers}
          icon={CheckCircle2}
          href="/admin/users?status=approved"
        />
        <StatCard
          label="Total submissions"
          value={stats.totalSubmissions}
          icon={FileText}
          href="/admin/submissions"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent registrations */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle>Recent registrations</CardTitle>
              <CardDescription>The five newest accounts.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/users">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentRegistrations.length === 0 ? (
              <EmptyState icon={UserPlus} title="No registrations yet" />
            ) : (
              <ul className="divide-y">
                {recentRegistrations.map((user) => (
                  <li key={user.id} className="flex items-center gap-3 px-6 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.company_name ?? user.email}
                      </p>
                    </div>
                    <UserStatusBadge status={user.status} />
                    <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground sm:block">
                      {formatDate(user.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent submissions */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle>Recent submissions</CardTitle>
              <CardDescription>Across every adviser on the platform.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/submissions">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentSubmissions.length === 0 ? (
              <EmptyState icon={FileText} title="No submissions yet" />
            ) : (
              <ul className="divide-y">
                {recentSubmissions.map((submission) => {
                  const adviser = Array.isArray(submission.adviser)
                    ? submission.adviser[0]
                    : submission.adviser
                  return (
                    <li key={submission.id}>
                      <Link
                        href={`/admin/submissions/${submission.id}`}
                        className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{submission.client_name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            via {adviser?.name ?? 'Unknown adviser'}
                          </p>
                        </div>
                        <FactFindTypeBadge type={submission.form_type} />
                        <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground sm:block">
                          {formatDate(submission.submitted_at)}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>Platform activity</CardTitle>
            <CardDescription>Registrations, approvals and submissions as they happen.</CardDescription>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          {activity.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" />
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
    </>
  )
}
