import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { UserFilters } from '@/components/admin/user-filters'
import { UsersTable } from '@/components/admin/users-table'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { USERS_PAGE_SIZE } from '@/lib/constants'
import { escapeLike } from '@/lib/utils'
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

  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)
  const from = (page - 1) * USERS_PAGE_SIZE

  let query = supabase
    .from('profiles')
    .select('id, name, company_name, email, phone, role, status, adviser_slug, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, from + USERS_PAGE_SIZE - 1)

  if (params.status && STATUSES.includes(params.status as UserStatus)) {
    query = query.eq('status', params.status as UserStatus)
  }
  if (params.role && ROLES.includes(params.role as UserRole)) {
    query = query.eq('role', params.role as UserRole)
  }

  const term = params.q?.trim()
  if (term) {
    const safe = escapeLike(term)
    query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,company_name.ilike.%${safe}%`)
  }

  const { data, count } = await query
  const users = data ?? []
  const total = count ?? 0

  const { count: pendingCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <>
      <PageHeader
        title="User approvals"
        description={
          pendingCount && pendingCount > 0
            ? `${pendingCount} registration${pendingCount === 1 ? '' : 's'} awaiting your decision.`
            : 'Everyone has been reviewed — nothing is waiting for approval.'
        }
      />

      <Card className="overflow-hidden p-0">
        <UserFilters />
        <UsersTable users={users} currentAdminId={adminId} />
        {total > 0 && <Pagination page={page} pageSize={USERS_PAGE_SIZE} total={total} />}
      </Card>
    </>
  )
}
