import { activationState, latestActivation } from '@/lib/activation-token'

/** What an admin needs to know about one prepared adviser's activation. */
export interface ProfileActivation {
  /** False once the account has been activated. */
  importPending: boolean
  latest: { sent_at: string; expires_at: string; used_at: string | null } | null
}

export interface ActivationSummary {
  activated: number
  invited: number
  /** Prepared, still pending, never sent a link. */
  waiting: number
  byProfile: Map<string, ProfileActivation>
}

/** Rolls the raw profile and activation rows up into counts and a per-profile view. */
export function summariseActivation(
  preparedIds: readonly string[],
  profiles: readonly { id: string; import_pending: boolean }[],
  activations: readonly { profile_id: string; sent_at: string; expires_at: string; used_at: string | null }[],
): ActivationSummary {
  const pendingById = new Map(profiles.map((row) => [row.id, row.import_pending]))
  const rowsByProfile = new Map<string, typeof activations>()
  for (const row of activations) rowsByProfile.set(row.profile_id, [...(rowsByProfile.get(row.profile_id) ?? []), row])

  const byProfile = new Map<string, ProfileActivation>()
  let activated = 0
  let invited = 0
  let waiting = 0
  for (const id of preparedIds) {
    const importPending = pendingById.get(id) ?? true
    const latest = latestActivation(rowsByProfile.get(id) ?? [])
    byProfile.set(id, { importPending, latest })
    if (!importPending) activated++
    else if (latest) invited++
    else waiting++
  }
  return { activated, invited, waiting, byProfile }
}

export interface ActivationBadge {
  label: string
  tone: 'success' | 'secondary' | 'outline' | 'destructive'
}

/** The badge shown next to a prepared adviser in the directory. */
export function activationLabel(entry: ProfileActivation | undefined, now: number = Date.now()): ActivationBadge | null {
  if (!entry) return null
  if (!entry.importPending) return { label: 'Activated', tone: 'success' }
  if (!entry.latest) return { label: 'Not invited', tone: 'secondary' }
  const state = activationState(entry.latest, now)
  if (state === 'expired') return { label: 'Link expired', tone: 'destructive' }
  return { label: 'Invited', tone: 'outline' }
}
