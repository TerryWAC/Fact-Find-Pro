import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { SubmissionFilters } from '@/components/submissions/submission-filters'
import { SubmissionsTable } from '@/components/submissions/submissions-table'
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

  const { rows, total, page, pageSize } = await querySubmissions({
    adviserId: id,
    searchParams: params,
  })

  return (
    <>
      <PageHeader
        title="Submissions"
        description="Every FactFind submitted through your unique client links."
      />

      <Card className="overflow-hidden p-0">
        <SubmissionFilters />
        <SubmissionsTable
          rows={rows}
          detailBasePath="/submissions"
          emptyTitle={total === 0 ? 'No submissions yet' : 'No matching submissions'}
          emptyDescription={
            total === 0
              ? 'Share your FactFind links with clients — their submissions will appear here.'
              : 'Try adjusting your search or filters.'
          }
        />
        {total > 0 && <Pagination page={page} pageSize={pageSize} total={total} />}
      </Card>
    </>
  )
}
