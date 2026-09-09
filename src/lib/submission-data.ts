import type { Json } from '@/lib/supabase/database.types'

export interface AnswerRow {
  label: string
  display: string
}

export interface StepBlock {
  id: string
  title: string
  answers: AnswerRow[]
}

function humanise(key: string): string {
  return key
    .replace(/__/g, ' — ')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function toDisplay(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.length ? value.map(String).join(', ') : '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * Normalises `submission_data` into displayable steps.
 *
 * Tolerates both the form-engine payload (`answers` as an array of
 * `{ label, display }`) and a plain `{ key: value }` map, so historic and
 * seeded submissions render correctly alongside new ones.
 */
export function normaliseSubmissionData(data: Json | null | undefined): StepBlock[] {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return []

  const record = data as Record<string, unknown>
  const steps = record.steps

  if (!Array.isArray(steps)) {
    // Fall back to a flat answers map.
    const answers = (record.answers ?? record) as Record<string, unknown>
    const rows = Object.entries(answers)
      .filter(([key]) => !['steps', 'placeholder', 'schema_version', 'form_type', 'completed_at', 'note'].includes(key))
      .map(([key, value]) => ({ label: humanise(key), display: toDisplay(value) }))

    return rows.length ? [{ id: 'responses', title: 'Responses', answers: rows }] : []
  }

  return steps.map((step, index) => {
    const stepRecord = (step ?? {}) as Record<string, unknown>
    const rawAnswers = stepRecord.answers

    let answers: AnswerRow[] = []

    if (Array.isArray(rawAnswers)) {
      answers = rawAnswers.map((answer) => {
        const entry = (answer ?? {}) as Record<string, unknown>
        return {
          label: String(entry.label ?? humanise(String(entry.id ?? ''))),
          display: String(entry.display ?? toDisplay(entry.value)),
        }
      })
    } else if (rawAnswers && typeof rawAnswers === 'object') {
      answers = Object.entries(rawAnswers as Record<string, unknown>).map(([key, value]) => ({
        label: humanise(key),
        display: toDisplay(value),
      }))
    }

    return {
      id: String(stepRecord.id ?? `step-${index}`),
      title: String(stepRecord.title ?? `Section ${index + 1}`),
      answers,
    }
  })
}
