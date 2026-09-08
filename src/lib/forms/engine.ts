import { z } from 'zod'
import type {
  FieldCondition,
  FieldValue,
  FormField,
  FormSchema,
  FormStep,
  FormValues,
  SimpleCondition,
  SubmissionPayload,
} from './types'
import { isPresentational } from './types'

/** Evaluates a field's `visibleWhen` rule against the current answers. */
export function isFieldVisible(field: FormField, values: FormValues): boolean {
  if (!field.visibleWhen) return true
  return matchesCondition(field.visibleWhen, values)
}

export function matchesCondition(condition: FieldCondition, values: FormValues): boolean {
  if ('all' in condition) return condition.all.every((entry) => matchesCondition(entry, values))
  if ('any' in condition) return condition.any.some((entry) => matchesCondition(entry, values))
  return matchesSimple(condition, values)
}

function matchesSimple(condition: SimpleCondition, values: FormValues): boolean {
  const actual = values[condition.field]
  const { operator, value } = condition

  switch (operator) {
    case 'truthy':
      return Array.isArray(actual) ? actual.length > 0 : Boolean(actual)
    case 'falsy':
      return Array.isArray(actual) ? actual.length === 0 : !actual
    case 'eq':
      return String(actual ?? '') === String(value ?? '')
    case 'neq':
      return String(actual ?? '') !== String(value ?? '')
    case 'in':
      return Array.isArray(value) && value.map(String).includes(String(actual ?? ''))
    case 'not_in':
      return Array.isArray(value) && !value.map(String).includes(String(actual ?? ''))
    case 'gt':
      return Number(actual) > Number(value)
    case 'lt':
      return Number(actual) < Number(value)
    default:
      return true
  }
}

/** The collectable (non-presentational, currently visible) fields of a step. */
export function visibleFields(step: FormStep, values: FormValues): FormField[] {
  return step.fields.filter((field) => isFieldVisible(field, values))
}

/** Whether a whole step should be shown given the answers so far. */
export function isStepVisible(step: FormStep, values: FormValues): boolean {
  if (!step.visibleWhen) return true
  return matchesCondition(step.visibleWhen, values)
}

/** The steps a respondent will actually pass through, in order. */
export function visibleSteps(schema: FormSchema, values: FormValues): FormStep[] {
  return schema.steps.filter((step) => isStepVisible(step, values))
}

export function answerableFields(schema: FormSchema): FormField[] {
  return schema.steps.flatMap((step) => step.fields.filter((field) => !isPresentational(field)))
}

/** Default values for every answerable field in the schema. */
export function defaultValuesFor(schema: FormSchema): FormValues {
  const values: FormValues = {}

  for (const field of answerableFields(schema)) {
    if (field.defaultValue !== undefined) {
      values[field.id] = field.defaultValue
      continue
    }
    switch (field.type) {
      case 'checkbox':
        values[field.id] = false
        break
      case 'checkbox-group':
        values[field.id] = []
        break
      default:
        values[field.id] = ''
    }
  }

  return values
}

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

function fieldSchema(field: FormField): z.ZodTypeAny {
  const v = field.validation ?? {}
  const requiredMessage = v.message ?? `${field.label ?? 'This field'} is required`

  switch (field.type) {
    case 'checkbox':
      return field.required
        ? z.literal(true, { errorMap: () => ({ message: v.message ?? 'Please confirm to continue' }) })
        : z.boolean().optional()

    case 'checkbox-group': {
      const base = z.array(z.string())
      return field.required ? base.min(v.min ?? 1, requiredMessage) : base.optional()
    }

    case 'number':
    case 'currency':
    case 'percent': {
      let base: z.ZodTypeAny = z
        .string()
        .trim()
        .refine((value) => value === '' || !Number.isNaN(Number(value)), 'Enter a number')

      if (v.min !== undefined) {
        const min = v.min
        base = base.refine((value: string) => value === '' || Number(value) >= min, `Must be ${min} or more`)
      }
      if (v.max !== undefined) {
        const max = v.max
        base = base.refine((value: string) => value === '' || Number(value) <= max, `Must be ${max} or less`)
      }

      return field.required
        ? base.refine((value: string) => value !== '', requiredMessage)
        : base.optional()
    }

    case 'email': {
      const base = z.string().trim()
      return field.required
        ? base.min(1, requiredMessage).email('Enter a valid email address')
        : base.email('Enter a valid email address').optional().or(z.literal(''))
    }

    default: {
      let base: z.ZodString = z.string().trim()
      if (v.minLength !== undefined) base = base.min(v.minLength, v.message)
      if (v.maxLength !== undefined) base = base.max(v.maxLength, v.message)
      if (v.pattern) base = base.regex(new RegExp(v.pattern), v.message ?? 'Enter a valid value')
      return field.required ? base.min(1, requiredMessage) : base.optional().or(z.literal(''))
    }
  }
}

/** Builds a zod schema for one step, honouring conditional visibility. */
export function stepValidationSchema(step: FormStep, values: FormValues) {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of step.fields) {
    if (isPresentational(field)) continue
    if (!isFieldVisible(field, values)) continue
    shape[field.id] = fieldSchema(field)
  }

  return z.object(shape)
}

export interface StepValidationResult {
  ok: boolean
  errors: Record<string, string>
}

export function validateStep(step: FormStep, values: FormValues): StepValidationResult {
  const result = stepValidationSchema(step, values).safeParse(values)
  if (result.success) return { ok: true, errors: {} }

  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '')
    if (key && !errors[key]) errors[key] = issue.message
  }
  return { ok: false, errors }
}

// -----------------------------------------------------------------------------
// Submission payload
// -----------------------------------------------------------------------------

export function displayValue(field: FormField, value: FieldValue): string {
  if (value === undefined || value === null || value === '') return '—'

  if (field.type === 'checkbox') return value ? 'Yes' : 'No'

  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    return value
      .map((entry) => field.options?.find((option) => option.value === entry)?.label ?? entry)
      .join(', ')
  }

  if (field.options) {
    return field.options.find((option) => option.value === String(value))?.label ?? String(value)
  }

  if (field.type === 'currency') {
    const numeric = Number(value)
    if (!Number.isNaN(numeric)) {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(numeric)
    }
  }

  if (field.type === 'percent') {
    const numeric = Number(value)
    if (!Number.isNaN(numeric)) return `${numeric}%`
  }

  return String(value)
}

/** Normalises raw form state into the JSON persisted against a submission. */
export function buildSubmissionPayload(schema: FormSchema, values: FormValues): SubmissionPayload {
  const answers: FormValues = {}

  const steps = visibleSteps(schema, values).map((step) => ({
    id: step.id,
    title: step.title,
    answers: step.fields
      .filter((field) => !isPresentational(field) && isFieldVisible(field, values))
      .map((field) => {
        const value = values[field.id]
        answers[field.id] = value
        return {
          id: field.id,
          label: field.label ?? field.id,
          type: field.type,
          value: value ?? '',
          display: displayValue(field, value),
        }
      }),
  }))

  return {
    schema_version: schema.version,
    form_type: schema.type,
    placeholder: schema.placeholder ?? false,
    completed_at: new Date().toISOString(),
    steps,
    answers,
  }
}

/** Pulls the reserved client identity fields out of the answers. */
export function extractClientIdentity(schema: FormSchema, values: FormValues) {
  const fields = answerableFields(schema)
  const find = (identity: FormField['identity']) => fields.find((field) => field.identity === identity)

  const nameField = find('client_name')
  const emailField = find('client_email')
  const phoneField = find('client_phone')

  return {
    client_name: String(values[nameField?.id ?? 'client_name'] ?? '').trim(),
    client_email: String(values[emailField?.id ?? 'client_email'] ?? '').trim(),
    client_phone: String(values[phoneField?.id ?? 'client_phone'] ?? '').trim() || null,
  }
}

/** Percentage complete for the progress bar (steps are 0-indexed). */
export function stepProgress(currentStep: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0
  return Math.round((currentStep / totalSteps) * 100)
}
