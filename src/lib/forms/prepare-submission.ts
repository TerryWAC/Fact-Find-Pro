import { z } from 'zod'
import { clientIdentitySchema } from '../validations'
import { answerableFields, buildSubmissionPayload, defaultValuesFor, extractClientIdentity, stepValidationSchema, visibleSteps } from './engine'
import type { FormSchema, FormValues, SubmissionPayload } from './types'

const submittedAnswers = z.record(z.union([z.string(), z.number().finite(), z.boolean(), z.array(z.string())]))

type PreparedSubmission =
  | { ok: true; payload: SubmissionPayload; identity: z.infer<typeof clientIdentitySchema> }
  | { ok: false; error: string; stepId?: string; fieldErrors?: Record<string, string> }

/** Rebuild the web submission from trusted question definitions before persistence. */
export function prepareSubmission(schema: FormSchema, input: unknown): PreparedSubmission {
  const parsed = z.object({
    schema_version: z.literal(schema.version),
    form_type: z.literal(schema.type),
    answers: submittedAnswers,
  }).safeParse(input)
  if (!parsed.success) return { ok: false, error: 'We could not validate this form. Your answers are still here; please check them before sending again.' }

  const values: FormValues = defaultValuesFor(schema)
  // Unknown answer IDs and client-provided labels, display text and sections are ignored.
  for (const field of answerableFields(schema)) {
    if (Object.hasOwn(parsed.data.answers, field.id)) values[field.id] = parsed.data.answers[field.id]
  }
  for (const step of visibleSteps(schema, values)) {
    const result = stepValidationSchema(step, values).safeParse(values)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const id = String(issue.path[0] ?? '')
        if (id && !fieldErrors[id]) fieldErrors[id] = issue.message
      }
      return { ok: false, error: `Please check the highlighted answers in ${step.title}.`, stepId: step.id, fieldErrors }
    }
    Object.assign(values, result.data)
  }
  const extracted = extractClientIdentity(schema, values)
  const identity = clientIdentitySchema.safeParse({ ...extracted, client_phone: extracted.client_phone ?? '' })
  if (!identity.success) {
    const issue = identity.error.issues[0]
    const identityKey = issue.path[0]
    const field = answerableFields(schema).find((entry) => entry.identity === identityKey)
      ?? answerableFields(schema).find((entry) => entry.identity === 'client_first_name')
    return {
      ok: false, error: issue.message,
      ...(field ? {
        stepId: schema.steps.find((step) => step.fields.includes(field))?.id,
        fieldErrors: { [field.id]: issue.message },
      } : {}),
    }
  }
  return { ok: true, payload: buildSubmissionPayload(schema, values), identity: identity.data }
}
