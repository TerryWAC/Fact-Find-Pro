import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/database.types'

export interface SessionUser {
  id: string
  email: string
  profile: Profile
}

/**
 * Resolves the signed-in user and their profile. Cached per request so that
 * layouts and pages in the same render do not re-query.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()

  if (!profile) return null

  return { id: user.id, email: user.email ?? profile.email, profile }
})

/** Requires an approved account of any role. */
export async function requireApprovedUser(): Promise<SessionUser> {
  const session = await getSessionUser()
  if (!session) redirect('/login')
  if (session.profile.status !== 'approved') redirect('/pending')
  return session
}

/** Requires an approved admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireApprovedUser()
  if (session.profile.role !== 'admin') redirect('/dashboard')
  return session
}

export function isAdmin(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin' && profile.status === 'approved'
}
