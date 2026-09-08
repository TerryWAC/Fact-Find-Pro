import type { FactFindType } from '@/lib/supabase/database.types'

/**
 * FactFind form engine — schema contract.
 *
 * A FactFind is defined entirely by JSON. Real question sets are added later by
 * dropping a new `FormSchema` into `src/lib/forms/schemas` (or loading one from
 * the database / a CMS) — no renderer changes required.
 */

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'checkbox-group'
  | 'yesno'
  // Presentational — rendered, never collected:
  | 'heading'
  | 'paragraph'
  | 'divider'

export interface FieldOption {
  value: string
  label: string
  description?: string
}

export type ConditionOperator = 'eq' | 'neq' | 'in' | 'not_in' | 'truthy' | 'falsy' | 'gt' | 'lt'

/** A single test against another field's answer. */
export interface SimpleCondition {
  field: string
  operator: ConditionOperator
  value?: string | number | boolean | Array<string | number>
}

/**
 * Show a field or step only when the condition holds. Conditions compose:
 *   { all: [...] }  every sub-condition must hold
 *   { any: [...] }  at least one must hold
 */
export type FieldCondition = SimpleCondition | { all: FieldCondition[] } | { any: FieldCondition[] }

export interface FieldValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  message?: string
}

export interface FormField {
  /** Unique within the schema — becomes the key in `submission_data`. */
  id: string
  type: FieldType
  label?: string
  placeholder?: string
  helpText?: string
  required?: boolean
  options?: FieldOption[]
  rows?: number
  /** Layout width on >=sm screens. Defaults to 2 (full width). */
  colSpan?: 1 | 2
  defaultValue?: string | number | boolean | string[]
  validation?: FieldValidation
  visibleWhen?: FieldCondition
  /** Marks the field as a reserved client-identity field. */
  identity?: 'client_name' | 'client_email' | 'client_phone'
  /** Where the field came from when imported (e.g. a Typeform ref). */
  source?: string
}

export interface FormStep {
  id: string
  title: string
  description?: string
  fields: FormField[]
  /** Skip the whole step unless this holds — e.g. an "Applicant 2" section on a sole application. */
  visibleWhen?: FieldCondition
}

export interface FormSchema {
  type: FactFindType
  version: string
  title: string
  subtitle?: string
  intro?: string
  estimatedMinutes?: number
  steps: FormStep[]
  submitLabel?: string
  successTitle?: string
  successMessage?: string
  /** Set false once real questions replace the placeholder sections. */
  placeholder?: boolean
}

export type FieldValue = string | number | boolean | string[] | undefined
export type FormValues = Record<string, FieldValue>

/** Shape persisted to `factfind_submissions.submission_data`. */
export interface SubmissionPayload {
  schema_version: string
  form_type: FactFindType
  placeholder: boolean
  completed_at: string
  steps: Array<{
    id: string
    title: string
    answers: Array<{ id: string; label: string; type: FieldType; value: FieldValue; display: string }>
  }>
  /** Flat id → value map for programmatic access and future exports. */
  answers: FormValues
}

export const PRESENTATIONAL_FIELD_TYPES: FieldType[] = ['heading', 'paragraph', 'divider']

export function isPresentational(field: FormField): boolean {
  return PRESENTATIONAL_FIELD_TYPES.includes(field.type)
}
