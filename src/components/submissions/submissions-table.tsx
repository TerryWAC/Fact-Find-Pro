import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronRight, FileText } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { FactFindTypeBadge, SubmissionStatusBadge } from '@/components/shared/status-badge'
import type { FactFindType, SubmissionStatus } from '@/lib/supabase/database.types'
import { formatDate } from '@/lib/utils'

export interface SubmissionRow {
  id: string
  reference: string
  client_name: string
  client_email: string
  form_type: FactFindType
  status: SubmissionStatus
  submitted_at: string
  adviser?: { name: string; company_name: string | null } | null
}

interface SubmissionsTableProps {
  rows: SubmissionRow[]
  /** Base path for the detail link, e.g. /submissions or /admin/submissions */
  detailBasePath: string
  showAdviser?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
}

export function SubmissionsTable({
  rows,
  detailBasePath,
  showAdviser = false,
  emptyTitle = 'No submissions found',
  emptyDescription = 'Try adjusting your search or filters.',
  emptyAction,
}: SubmissionsTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyState icon={FileText} title={emptyTitle} description={emptyDescription} action={emptyAction} />
    )
  }

  return (
    <>
      <ul className="divide-y border-t md:hidden" aria-label="Submissions">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={`${detailBasePath}/${row.id}`}
              className="block space-y-3 px-4 py-5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold">{row.client_name}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{row.client_email}</p>
                </div>
                <SubmissionStatusBadge status={row.status} className="shrink-0" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FactFindTypeBadge type={row.form_type} />
                <span className="font-mono text-[11px] text-muted-foreground">{row.reference}</span>
              </div>
              {showAdviser && (
                <p className="break-words text-xs text-muted-foreground">
                  Adviser: {row.adviser?.name ?? '—'}
                  {row.adviser?.company_name ? ` · ${row.adviser.company_name}` : ''}
                </p>
              )}
              <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs">
                <time dateTime={row.submitted_at} className="text-muted-foreground">
                  {formatDate(row.submitted_at, true)}
                </time>
                <span className="flex items-center gap-1 font-medium">
                  Open
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden border-t md:block">
        <Table aria-label="Submissions">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Client</TableHead>
              {showAdviser && <TableHead className="hidden lg:table-cell">Adviser</TableHead>}
              <TableHead>FactFind</TableHead>
              <TableHead className="hidden md:table-cell">Date submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    href={`${detailBasePath}/${row.id}`}
                    className="font-medium hover:text-accent-strong hover:underline dark:hover:text-accent"
                  >
                    {row.client_name}
                  </Link>
                  <p className="font-mono text-[11px] text-muted-foreground">{row.reference}</p>
                  <a
                    href={`mailto:${row.client_email}`}
                    className="mt-1 block break-all text-xs text-muted-foreground hover:underline"
                  >
                    {row.client_email}
                  </a>
                </TableCell>
                {showAdviser && (
                  <TableCell className="hidden lg:table-cell">
                    <p className="text-sm">{row.adviser?.name ?? '—'}</p>
                    {row.adviser?.company_name && (
                      <p className="text-xs text-muted-foreground">{row.adviser.company_name}</p>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <FactFindTypeBadge type={row.form_type} />
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground md:table-cell">
                  {formatDate(row.submitted_at, true)}
                </TableCell>
                <TableCell>
                  <SubmissionStatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      href={`${detailBasePath}/${row.id}`}
                      aria-label={`View ${row.client_name}, ${row.reference}`}
                    >
                      View
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
