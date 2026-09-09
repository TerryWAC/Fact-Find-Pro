import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { isFactFindType } from '@/lib/constants'
import type { Database } from '@/lib/supabase/database.types'

export type PublicFactFind = Database['public']['Functions']['resolve_factfind_form']['Returns'][number]

/**
 * Resolves a public FactFind link to its adviser and branding.
 *
 * Goes through the SECURITY DEFINER `resolve_factfind_form` function, so the
 * anonymous client never reads the profiles table directly. Cached per request
 * so the layout (header branding) and the page (form) share one lookup.
 */
export const resolvePublicFactFind = cache(async (type: string, slug: string): Promise<PublicFactFind | null> => {
  if (!isFactFindType(type)) return null
  if (!/^[a-z0-9]{4,32}$/i.test(slug)) return null

  const supabase = await createClient()
  const { data } = await supabase.rpc('resolve_factfind_form', { p_form_type: type, p_slug: slug })
  const form = Array.isArray(data) ? data[0] : data
  return form ?? null
})
