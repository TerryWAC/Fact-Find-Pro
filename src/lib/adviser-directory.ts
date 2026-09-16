import type { AdviserImport, Json } from '@/lib/supabase/database.types'

export const IMPORT_DECISIONS = {
  include: 'Prepared adviser', hold: 'Needs identity review', exclude_test: 'Test / internal',
  exclude_invalid: 'Missing identity', supersede: 'Superseded duplicate',
} as const

export function importStatus(record: Pick<AdviserImport, 'decision' | 'profile_id'>) {
  return record.decision === 'include' && !record.profile_id ? 'Preparation incomplete' : IMPORT_DECISIONS[record.decision]
}

export function stringFields(value: Json): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
}

export function followUpNotes(value: Json): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

/** Protect spreadsheet users from formula interpretation without losing the source value. */
export function csvCell(value: unknown): string {
  const text = String(value ?? '')
  const safe = /^[\s]*[=+@-]|^[\t\r\n]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

export function directoryCsv(rows: unknown[][]) {
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
