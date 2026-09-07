'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FieldError } from '@/components/shared/field-error'
import { SubmitButton } from '@/components/shared/submit-button'
import { ImagePicker } from './image-picker'
import { StepShell } from './step-shell'
import {
  addTeamMemberAction,
  removeTeamMemberAction,
  type OnboardingActionState,
} from '@/app/(onboarding)/onboarding/actions'
import { TEAM_ROLES, teamRoleLabel } from '@/lib/onboarding'
import type { TeamMember } from '@/lib/supabase/database.types'

const initialState: OnboardingActionState = {}

export function TeamStep({ members }: { members: TeamMember[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useActionState(addTeamMemberAction, initialState)
  const [removing, startRemoving] = useTransition()

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message)
      formRef.current?.reset()
      router.refresh()
    }
  }, [state, router])

  function handleRemove(member: TeamMember) {
    startRemoving(async () => {
      const result = await removeTeamMemberAction(member.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(`${member.name} removed`)
      router.refresh()
    })
  }

  return (
    <StepShell
      title="Your team"
      description="Add the advisers and admin staff who will use FactFind Pro. Each one gets their own set of client links, pointed at the same delivery settings, so every fact find lands in one place. You can add more later under Settings."
    >
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Card className="p-6">
        <h2 className="mb-5 text-base font-semibold">Add a team member</h2>

        <form ref={formRef} action={formAction} className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required aria-invalid={Boolean(state.fieldErrors?.name)} />
              <FieldError message={state.fieldErrors?.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              {/* A native select keeps this usable inside a plain form action. */}
              <select
                id="role"
                name="role"
                defaultValue="adviser"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TEAM_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required aria-invalid={Boolean(state.fieldErrors?.email)} />
              <FieldError message={state.fieldErrors?.email} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" />
              <FieldError message={state.fieldErrors?.phone} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Job title</Label>
              <Input id="job_title" name="job_title" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fca_number">FCA reference (optional)</Label>
              <Input id="fca_number" name="fca_number" />
            </div>
          </div>

          <ImagePicker kind="headshot" label="Headshot" name="headshot_url" defaultValue="" shape="circle" />

          <SubmitButton variant="accent">
            <UserPlus className="h-4 w-4" />
            Add to team
          </SubmitButton>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        {members.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">No team members yet.</p>
        ) : (
          <ul className="divide-y">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-4 px-6 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-xs font-semibold text-accent-strong dark:text-accent">
                  {member.headshot_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- user-supplied URL of unknown origin
                    <img src={member.headshot_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    member.name.slice(0, 2).toUpperCase()
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email}
                    {member.job_title ? ` · ${member.job_title}` : ''}
                  </p>
                </div>

                <Badge variant="secondary">{teamRoleLabel(member.role)}</Badge>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemove(member)}
                  disabled={removing}
                  aria-label={`Remove ${member.name}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="outline">
          <Link href="/onboarding?step=4">Back</Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href="/onboarding?step=6">Skip for now</Link>
          </Button>
          <Button asChild variant="accent" className="sm:min-w-[11rem]">
            <Link href="/onboarding?step=6">Save and continue</Link>
          </Button>
        </div>
      </div>
    </StepShell>
  )
}
