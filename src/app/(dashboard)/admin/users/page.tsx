import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { UserFilters } from '@/components/admin/user-filters'
import { UsersTable } from '@/components/admin/users-table'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { USERS_PAGE_SIZE } from '@/lib/constants'
import { textSearchFilter } from '@/lib/postgrest-search'
import { submissionPage } from '@/lib/submission-search'
import { SubmissionLoadError } from '@/components/submissions/submission-load-error'
import type { UserRole, UserStatus } from '@/lib/supabase/database.types'

export const metadata: Metadata = { title: 'User Approvals' }

const STATUSES: UserStatus[] = ['pending', 'approved', 'rejected', 'suspended']
const ROLES: UserRole[] = ['admin', 'adviser']

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; role?: string; page?: string }>
}) {
  const { id: adminId } = await requireAdmin()
  const params = await searchParams
  const supabase = await createClient()

  let page = submissionPage(params.page)

  const buildQuery = () => {
    let query = supabase
    .from('profiles')
    .select('id, name, company_name, email, phone, role, status, adviser_slug, created_at, import_pending, job_title, website, business_location, contact_email, services, client_focus', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  if (params.status && STATUSES.includes(params.status as UserStatus)) {
    query = query.eq('status', params.status as UserStatus)
  }
  if (params.role && ROLES.includes(params.role as UserRole)) {
    query = query.eq('role', params.role as UserRole)
  }

  const term = params.q?.trim()
  if (term) {
    query = query.or(textSearchFilter(['name', 'email', 'company_name'], term))
  }
    return query
  }

  const fetchPage = (number: number) => buildQuery().range((number - 1) * USERS_PAGE_SIZE, number * USERS_PAGE_SIZE - 1)
  let result = await fetchPage(page)
  if (page > 1 && (result.error?.code === 'PGRST103' || (!result.error && !result.data?.length))) {
    const first = await fetchPage(1)
    if (first.error) result = first
    else {
      page = Math.max(1, Math.ceil((first.count ?? 0) / USERS_PAGE_SIZE))
      result = page === 1 ? first : await fetchPage(page)
    }
  }
  const { data, count, error } = result
  const users = data ?? []
  const total = count ?? 0

  const { count: pendingCount, error: pendingError } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('import_pending', false)

  return (
    <>
      <PageHeader
        title="User approvals"
        description={
          pendingError || pendingCount === null
            ? 'Approval totals are currently unavailable. Please try again.'
            : pendingCount > 0
            ? `${pendingCount} registration${pendingCount === 1 ? '' : 's'} awaiting your decision.`
            : 'Everyone has been reviewed — nothing is waiting for approval.'
        }
      />

      <Card className="overflow-hidden p-0">
        <UserFilters />
        {error ? <SubmissionLoadError title="Users could not be loaded" /> : <UsersTable users={users} currentAdminId={adminId} />}
        {!error && total > 0 && <Pagination page={page} pageSize={USERS_PAGE_SIZE} total={total} />}
      </Card>
    </>
  )
}
