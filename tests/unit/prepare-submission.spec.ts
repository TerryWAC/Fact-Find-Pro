import { test, expect } from '@playwright/test'
import { prepareSubmission } from '../../src/lib/forms/prepare-submission'
import { buildSubmissionPayload, defaultValuesFor, validateStep } from '../../src/lib/forms/engine'
import { getAllFormSchemas, getFormSchema } from '../../src/lib/forms/registry'
import type { FormSchema, FormValues } from '../../src/lib/forms/types'

function complete(schema: FormSchema): FormValues {
  const values = defaultValuesFor(schema)
  for (const field of schema.steps.flatMap((step) => step.fields).filter((field) => field.required)) {
    values[field.id] = field.type === 'checkbox' ? true
      : field.type === 'yesno' ? 'no'
      : field.options ? field.options[0].value
      : field.type === 'email' ? 'client@example.test'
      : field.type === 'date' ? '2000-01-01' : 'Sam Taylor'
  }
  return values
}

for (const schema of getAllFormSchemas()) {
  test(`${schema.type}: server accepts the real answers and rebuilds canonical presentation`, () => {
    const values = complete(schema)
    const incoming = { ...buildSubmissionPayload(schema, values), completed_at: 'forged-date', steps: [{ title: 'Forged section', answers: [{ label: 'Forged question', display: 'Forged answer' }] }] }
    incoming.answers.unknown_field = 'Unrecognised data'
    const result = prepareSubmission(schema, incoming)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.identity.client_email).toBe('client@example.test')
    expect(result.payload.completed_at).not.toBe('forged-date')
    expect(result.payload.steps.some((step) => step.title === 'Forged section')).toBe(false)
    expect(result.payload.answers).not.toHaveProperty('unknown_field')
    expect(result.payload.answers.client_email).toBe(result.identity.client_email)
  })
}

test('hidden applicant answers cannot enter the saved payload, even if posted directly', () => {
  const schema = getFormSchema('mortgage')
  const values = { ...complete(schema), joint_case: 'no', a2_date_you_moved_into_your_current_address_dd_mm_y: 'bad-date', a2_full_name: 'STALE NAME' }
  const result = prepareSubmission(schema, { schema_version: schema.version, form_type: schema.type, answers: values })
  expect(result.ok).toBe(true)
  if (result.ok) expect(Object.keys(result.payload.answers).filter((id) => id.startsWith('a2_') || id.startsWith('sp2_'))).toEqual([])
})

test('newly revealed required answers return the step and question that need attention', () => {
  const schema = getFormSchema('mortgage')
  const values = { ...complete(schema), has_dependants: 'yes', dep_child_date_of_birth_dd_mm_yyyy: '' }
  const result = prepareSubmission(schema, { schema_version: schema.version, form_type: schema.type, answers: values })
  expect(result).toMatchObject({ ok: false, stepId: 's6_dependants', fieldErrors: { dep_child_date_of_birth_dd_mm_yyyy: expect.any(String) } })
})

test('server rejects arbitrary routes, mismatched schemas and malformed answer values', () => {
  const schema = getFormSchema('mortgage')
  const input = { schema_version: schema.version, form_type: schema.type, answers: complete(schema) }
  expect(prepareSubmission(schema, { ...input, answers: { ...input.answers, mortgage_type: 'invented' } })).toMatchObject({ ok: false, fieldErrors: { mortgage_type: 'Choose a listed option' } })
  for (const invalid of [null, [], {}, { ...input, form_type: 'medical' }, { ...input, schema_version: 'old' }, { ...input, answers: [] }, { ...input, answers: { client_email: { forged: true } } }])
    expect(prepareSubmission(schema, invalid).ok).toBe(false)
})

test('server normalises identity and returns a useful field error for an incomplete name', () => {
  const schema = getFormSchema('home')
  const values = { ...complete(schema), client_email: ' client@example.test ', client_first_name: 'S', client_last_name: '' }
  let result = prepareSubmission(schema, { schema_version: schema.version, form_type: schema.type, answers: values })
  expect(result).toMatchObject({ ok: false, fieldErrors: { client_last_name: expect.any(String) } })
  values.client_last_name = 'Taylor'
  result = prepareSubmission(schema, { schema_version: schema.version, form_type: schema.type, answers: values })
  expect(result.ok).toBe(true)
  if (result.ok) expect(result.identity).toMatchObject({ client_name: 'S Taylor', client_email: 'client@example.test', client_phone: '' })
})

test('calendar dates and numeric answers reject impossible values without changing optional fields', () => {
  const date = { id: 'date', title: 'Date', fields: [{ id: 'dob', type: 'date' as const, label: 'Date of birth' }] }
  for (const value of ['', '2024-02-29', '2000-01-01']) expect(validateStep(date, { dob: value }).ok).toBe(true)
  for (const value of ['2023-02-29', '2026-04-31', '0000-01-01', 'not-a-date']) expect(validateStep(date, { dob: value }).ok).toBe(false)
  const amount = { id: 'amount', title: 'Amount', fields: [{ id: 'cost', type: 'currency' as const }] }
  for (const value of ['', '0', '100.25']) expect(validateStep(amount, { cost: value }).ok).toBe(true)
  for (const value of ['Infinity', '-Infinity', 'NaN', 'text']) expect(validateStep(amount, { cost: value }).ok).toBe(false)
})
