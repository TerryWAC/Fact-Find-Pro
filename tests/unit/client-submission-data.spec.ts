import { expect, test } from '@playwright/test'
import { clientSubmissionSteps } from '../../src/lib/client-submission-data'
import { normaliseSubmissionData } from '../../src/lib/submission-data'
import { getFormSchema } from '../../src/lib/forms/registry'
import { buildSubmissionPayload, defaultValuesFor } from '../../src/lib/forms/engine'
import type { Json } from '../../src/lib/supabase/database.types'

for (const type of ['mortgage', 'protection'] as const) {
  test(`${type}: internal notes stay in the adviser copy and never enter the client copy`, () => {
    const schema = getFormSchema(type)
    const payload = buildSubmissionPayload(schema, {
      ...defaultValuesFor(schema), who_completing: 'adviser', joint_case: 'yes',
      client_name: 'Public Client', client_email: 'client@example.test',
      adviser_name: 'PRIVATE-ADVISER-FORM-ENTRY',
      if_other_please_specify_source_details: 'PRIVATE-SOURCE',
      admin_additional_internal_notes: 'PRIVATE-INTERNAL-NOTE',
      has_bankruptcy: 'yes', bk_date_of_bankruptcy_and_discharge: 'PUBLIC-BANKRUPTCY-DETAILS',
    }) as unknown as Json
    const adviser = JSON.stringify(normaliseSubmissionData(payload))
    const client = JSON.stringify(clientSubmissionSteps(type, payload))
    expect(adviser).toContain('PRIVATE-INTERNAL-NOTE')
    expect(client).not.toContain('PRIVATE-')
    expect(client).not.toContain('Admin Notes')
    expect(client).not.toContain('Client Source')
    expect(client).toContain('Public Client')
    if (type === 'mortgage') expect(client).toContain('PUBLIC-BANKRUPTCY-DETAILS')
    expect(JSON.stringify(normaliseSubmissionData(payload))).toBe(adviser)
  })
}

test('legacy flat maps and misplaced internal answers are also excluded by ID or label', () => {
  for (const data of [
    { answers: { client_name: 'Public Client', admin_additional_internal_notes: 'PRIVATE-NOTE' } },
    { client_name: 'Public Client', admin_additional_internal_notes: 'PRIVATE-NOTE' },
    { steps: [{ id: 'legacy', title: 'Responses', answers: [
      { id: 'client_name', label: 'Full name', display: 'Public Client' },
      { id: 'admin_additional_internal_notes', label: 'Renamed label', display: 'PRIVATE-NOTE' },
      { label: 'Additional internal notes', display: 'PRIVATE-LEGACY-NOTE' },
    ] }] },
    { steps: [{ id: 'legacy', title: 'Responses', answers: {
      client_name: 'Public Client', admin_additional_internal_notes: 'PRIVATE-NOTE',
    } }] },
  ]) {
    const client = JSON.stringify(clientSubmissionSteps('mortgage', data))
    expect(client).toContain('Public Client')
    expect(client).not.toContain('PRIVATE-')
  }
})

for (const type of ['home', 'medical'] as const) {
  test(`${type}: client answers are preserved when there are no internal sections`, () => {
    const schema = getFormSchema(type)
    const values = defaultValuesFor(schema)
    for (const field of schema.steps.flatMap((step) => step.fields))
      values[field.id] = field.type === 'yesno' ? 'yes' : `answer-${field.id}`
    const data = buildSubmissionPayload(schema, values) as unknown as Json
    expect(clientSubmissionSteps(type, data)).toEqual(normaliseSubmissionData(data))
  })
}
