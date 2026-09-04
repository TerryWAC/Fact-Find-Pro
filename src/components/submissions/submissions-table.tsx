import Link from 'next/link'
import { ChevronRight, FileText } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
}

export function SubmissionsTable({
  rows,
  detailBasePath,
  showAdviser = false,
  emptyTitle = 'No submissions found',
  emptyDescription = 'Try adjusting your search or filters.',
}: SubmissionsTableProps) {
  if (rows.length === 0) {
    return <EmptyState icon={FileText} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Client name</TableHead>
          <TableHead className="hidden sm:table-cell">Email</TableHead>
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
              <p className="text-xs text-muted-foreground sm:hidden">{row.client_email}</p>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <a href={`mailto:${row.client_email}`} className="text-sm text-muted-foreground hover:underline">
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
                <Link href={`${detailBasePath}/${row.id}`}>
                  View
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
