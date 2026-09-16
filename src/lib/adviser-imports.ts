import 'server-only'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { stringFields } from '@/lib/adviser-directory'

export async function getAdviserImport(sourceId: string) {
  await requireAdmin()
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(sourceId)) notFound()
  const supabase = await createClient()
  const { data: record, error } = await supabase.from('adviser_imports').select('*').eq('source_id', sourceId).maybeSingle()
  if (error) throw new Error('The adviser directory could not be loaded. Please try again.')
  if (!record) notFound()
  const [profileResult, formsResult] = record.profile_id ? await Promise.all([
    supabase.from('profiles').select('*').eq('id', record.profile_id).maybeSingle(),
    supabase.from('factfind_forms').select('*').eq('adviser_id', record.profile_id).order('form_type'),
  ]) : [{ data: null, error: null }, { data: [], error: null }]
  if (profileResult.error || formsResult.error) throw new Error('Prepared FactFinds could not be loaded. Please try again.')
  const paths = stringFields(record.asset_paths)
  const images: Record<string, string> = {}
  await Promise.all(Object.entries(paths).map(async ([key, path]) => {
    if (!['avatar_url', 'logo_url'].includes(key) || !path.startsWith(`${record.source_id}/`)) return
    const { data, error: imageError } = await supabase.storage.from('adviser-imports').createSignedUrl(path, 300)
    if (!imageError && data) images[key] = data.signedUrl
  }))
  return { record, profile: profileResult.data, forms: formsResult.data ?? [], images }
}
