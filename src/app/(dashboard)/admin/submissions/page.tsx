import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { SubmissionFilters } from '@/components/submissions/submission-filters'
import { SubmissionsTable } from '@/components/submissions/submissions-table'
import { requireAdmin } from '@/lib/auth'
import { querySubmissions, type SubmissionSearchParams } from '@/lib/submissions'

export const metadata: Metadata = { title: 'All Submissions' }

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<SubmissionSearchParams>
}) {
  await requireAdmin()
  const params = await searchParams

  const { rows, total, page, pageSize } = await querySubmissions({
    adviserId: null,
    searchParams: params,
    withAdviser: true,
  })

  return (
    <>
      <PageHeader
        title="All submissions"
        description="Every FactFind submitted across the platform, with the adviser who owns it."
      />

      <Card className="overflow-hidden p-0">
        <SubmissionFilters showAdviserSearch />
        <SubmissionsTable rows={rows} detailBasePath="/admin/submissions" showAdviser />
        {total > 0 && <Pagination page={page} pageSize={pageSize} total={total} />}
      </Card>
    </>
  )
}
