import type { Metadata } from 'next'
import Link from 'next/link'
import { Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { SubmissionFilters } from '@/components/submissions/submission-filters'
import { SubmissionsTable } from '@/components/submissions/submissions-table'
import { SubmissionLoadError } from '@/components/submissions/submission-load-error'
import { hasSubmissionFilters } from '@/lib/submission-search'
import { requireApprovedUser } from '@/lib/auth'
import { querySubmissions, type SubmissionSearchParams } from '@/lib/submissions'

export const metadata: Metadata = { title: 'Submissions' }

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<SubmissionSearchParams>
}) {
  const { id } = await requireApprovedUser()
  const params = await searchParams

  const { rows, total, page, pageSize, error } = await querySubmissions({
    adviserId: id,
    searchParams: params,
  })
  const filtered = hasSubmissionFilters(params)

  return (
    <>
      <PageHeader
        title="Submissions"
        description="Find a client, pick up a review, or revisit a completed FactFind."
        actions={
          <Button asChild variant="outline">
            <Link href="/links">
              <Link2 className="h-4 w-4" aria-hidden />
              Share a FactFind
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        <SubmissionFilters total={error ? null : total} />
        {error ? (
          <SubmissionLoadError />
        ) : (
          <SubmissionsTable
            rows={rows}
            detailBasePath="/submissions"
            emptyTitle={filtered ? 'No matching submissions' : 'No submissions yet'}
            emptyDescription={
              filtered
                ? 'Try another name, email or reference, or clear your filters to see all submissions.'
                : 'Share a personal FactFind link with your first client. Their completed form will appear here.'
            }
            emptyAction={
              !filtered && (
                <Button asChild>
                  <Link href="/links">Choose a client link</Link>
                </Button>
              )
            }
          />
        )}
        {total > 0 && <Pagination page={page} pageSize={pageSize} total={total} />}
      </Card>
    </>
  )
}
