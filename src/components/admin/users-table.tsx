'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Loader2, MoreHorizontal, Undo2, UserX, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { UserStatusBadge } from '@/components/shared/status-badge'
import { RejectDialog } from './reject-dialog'
import { approveUsers, rejectUsers, setUserStatus } from '@/app/(dashboard)/admin/actions'
import type { UserRole, UserStatus } from '@/lib/supabase/database.types'
import { formatDate } from '@/lib/utils'

export interface AdminUserRow {
  id: string
  name: string
  company_name: string | null
  email: string
  phone: string | null
  role: UserRole
  status: UserStatus
  adviser_slug: string | null
  created_at: string
}

export function UsersTable({
  users,
  currentAdminId,
}: {
  users: AdminUserRow[]
  currentAdminId: string
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [rejectTarget, setRejectTarget] = useState<string[] | null>(null)
  const [isPending, startTransition] = useTransition()

  // Only pending registrations can be bulk approved or rejected.
  const selectableIds = useMemo(
    () => users.filter((user) => user.status === 'pending').map((user) => user.id),
    [users],
  )

  const allSelected = selectableIds.length > 0 && selected.length === selectableIds.length
  const someSelected = selected.length > 0 && !allSelected

  function toggleAll() {
    setSelected(allSelected ? [] : selectableIds)
  }

  function toggleOne(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )
  }

  function runApprove(ids: string[]) {
    startTransition(async () => {
      const result = await approveUsers(ids)
      if (!result.ok) {
        toast.error(result.error ?? 'Could not approve')
        return
      }
      toast.success(result.message ?? 'Approved')
      setSelected([])
      router.refresh()
    })
  }

  function runReject(ids: string[], reason: string) {
    startTransition(async () => {
      const result = await rejectUsers(ids, reason)
      if (!result.ok) {
        toast.error(result.error ?? 'Could not reject')
        return
      }
      toast.success(result.message ?? 'Rejected')
      setSelected([])
      setRejectTarget(null)
      router.refresh()
    })
  }

  function runStatusChange(id: string, status: UserStatus) {
    startTransition(async () => {
      const result = await setUserStatus(id, status)
      if (!result.ok) {
        toast.error(result.error ?? 'Could not update the user')
        return
      }
      toast.success(result.message ?? 'Updated')
      router.refresh()
    })
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={UserX}
        title="No users found"
        description="Try adjusting your search or filters."
      />
    )
  }

  return (
    <>
      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-accent/10 px-4 py-3">
          <p className="text-sm font-medium">
            {selected.length} registration{selected.length === 1 ? '' : 's'} selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="success" onClick={() => runApprove(selected)} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Bulk approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setRejectTarget(selected)}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
              Bulk reject
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])} disabled={isPending}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={toggleAll}
                disabled={selectableIds.length === 0}
                aria-label="Select all pending registrations"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Company</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead className="hidden lg:table-cell">Phone</TableHead>
            <TableHead className="hidden xl:table-cell">Registered</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user) => {
            const isSelf = user.id === currentAdminId
            const isPendingUser = user.status === 'pending'

            return (
              <TableRow key={user.id} data-state={selected.includes(user.id) ? 'selected' : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(user.id)}
                    onCheckedChange={() => toggleOne(user.id)}
                    disabled={!isPendingUser}
                    aria-label={`Select ${user.name}`}
                  />
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.name}</span>
                    {user.role === 'admin' && <Badge variant="default">Admin</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground md:hidden">{user.company_name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                </TableCell>

                <TableCell className="hidden md:table-cell text-sm">{user.company_name ?? '—'}</TableCell>

                <TableCell className="hidden sm:table-cell">
                  <a href={`mailto:${user.email}`} className="text-sm text-muted-foreground hover:underline">
                    {user.email}
                  </a>
                </TableCell>

                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {user.phone ?? '—'}
                </TableCell>

                <TableCell className="hidden xl:table-cell whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(user.created_at)}
                </TableCell>

                <TableCell>
                  <UserStatusBadge status={user.status} />
                </TableCell>

                <TableCell className="text-right">
                  {isPendingUser ? (
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => runApprove([user.id])}
                        disabled={isPending}
                      >
                        <Check className="h-4 w-4" />
                        <span className="hidden sm:inline">Approve</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectTarget([user.id])}
                        disabled={isPending}
                      >
                        <X className="h-4 w-4" />
                        <span className="hidden sm:inline">Reject</span>
                      </Button>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" disabled={isSelf} aria-label="More actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.status !== 'approved' && (
                          <DropdownMenuItem onSelect={() => runApprove([user.id])}>
                            <Check className="h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                        )}
                        {user.status === 'approved' && (
                          <DropdownMenuItem onSelect={() => runStatusChange(user.id, 'suspended')}>
                            <UserX className="h-4 w-4" />
                            Suspend access
                          </DropdownMenuItem>
                        )}
                        {user.status === 'suspended' && (
                          <DropdownMenuItem onSelect={() => runStatusChange(user.id, 'approved')}>
                            <Undo2 className="h-4 w-4" />
                            Reinstate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setRejectTarget([user.id])}
                          className="text-destructive focus:text-destructive"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <RejectDialog
        open={rejectTarget !== null}
        count={rejectTarget?.length ?? 0}
        pending={isPending}
        onCancel={() => setRejectTarget(null)}
        onConfirm={(reason) => rejectTarget && runReject(rejectTarget, reason)}
      />
    </>
  )
}
