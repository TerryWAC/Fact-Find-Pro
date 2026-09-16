import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { directoryCsv, followUpNotes, importStatus, stringFields } from '@/lib/adviser-directory'
import { FACTFIND_TYPES, factFindUrl } from '@/lib/constants'
import { getBaseUrl } from '@/lib/utils'
import type { Database } from '@/lib/supabase/database.types'

export const dynamic = 'force-dynamic'

export async function GET() {
  await requireAdmin()
  const supabase = await createClient()
  const records = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('adviser_imports').select('*').order('source_row').range(offset, offset + 499)
    if (error) return new Response('The directory could not be exported. Please try again.', { status: 503 })
    records.push(...data)
    if (data.length < 500) break
  }
  const forms: Array<Pick<Database['public']['Tables']['factfind_forms']['Row'], 'adviser_id' | 'form_type' | 'unique_slug' | 'is_active'>> = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('factfind_forms').select('adviser_id, form_type, unique_slug, is_active').order('id').range(offset, offset + 499)
    if (error) return new Response('Prepared links could not be exported. Please try again.', { status: 503 })
    forms.push(...data)
    if (data.length < 500) break
  }
  const rows = [['Source row', 'Source ID', 'Name', 'Company', 'Email', 'Phone', 'Record status', 'Mortgage reserved link', 'Protection reserved link', 'Medical reserved link', 'Home reserved link', 'Review notes']]
  for (const record of records) {
    const details = stringFields(record.decision === 'include' ? record.profile_prefill : record.source_profile)
    rows.push([String(record.source_row), record.source_id, record.name, record.company_name, record.email, details.phone ?? '', importStatus(record),
      ...FACTFIND_TYPES.map((type) => { const form = forms.find((f) => record.decision === 'include' && f.adviser_id === record.profile_id && f.form_type === type); return form ? factFindUrl(getBaseUrl(), type, form.unique_slug) : '' }),
      [record.decision_reason, ...followUpNotes(record.follow_up)].join(' | ')])
  }
  return new Response(directoryCsv(rows), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="existing-advisers.csv"', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
}
