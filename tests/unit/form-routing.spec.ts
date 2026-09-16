import { test, expect } from '@playwright/test'
import assert from 'node:assert/strict'
import {
  buildSubmissionPayload, defaultValuesFor, isFieldVisible, isStepVisible, validateStep,
} from '../../src/lib/forms/engine'
import { getAllFormSchemas, getFormSchema } from '../../src/lib/forms/registry'
import { isPresentational, type FormField, type FormSchema, type FormValues } from '../../src/lib/forms/types'

const medicalGates = [
  'lifestyle_do_you_currently_smoke',
  'lifestyle_do_you_use_recreational_drugs',
  'family_before_age_66_have_any_of_your_parents_or_siblin',
  'health_have_you_ever_had_or_do_you_currently_have_any_o',
  'health_in_the_last_five_years_have_you_had_raised_blood',
  'health5_have_you_visited_your_gp_hospital_or_clinic_for',
  'health5_have_you_been_prescribed_medication_or_treatment',
  'health5_have_you_been_referred_to_any_counselling_or_the',
  'health5_have_you_been_asked_to_attend_a_follow_up_or_reg',
  'health5_have_you_been_referred_to_or_consulted_a_special',
  'health5_in_the_last_five_years_have_you_had_any_other_me',
  'health5_have_you_suffered_any_symptoms_or_tested_positiv',
  'health5_in_the_last_five_years_have_you_been_banned_from',
  'health5_in_the_last_five_years_have_you_spent_more_than',
]

// Expected routes are based on the documented import intent, not visibleWhen.
function expectedStep(title: string, values: FormValues) {
  if (['Adviser Details', 'Client Source', 'Admin Notes'].includes(title)) return values.who_completing === 'adviser'
  if (title === 'Applicant 2 Details') return values.joint_case === 'yes'
  return true
}

function expectedField(type: string, field: FormField, values: FormValues) {
  const id = field.id
  if (type === 'medical') {
    if (id === 'family_if_no_at_what_age_did_they_pass_away') return ['no', 'one_deceased'].includes(String(values.family_parents_alive))
    const gate = medicalGates.find((key) => id === `${key}_details`)
    return gate ? values[gate] === 'yes' : true
  }
  if (type === 'home') return true
  if (/^(a2_emp_|a2_pay_|sp2_)/.test(id) || id === 'if_you_have_worked_there_less_than_2_years_pleas_2') return values.joint_case === 'yes'
  if (id.startsWith('dep_') || id === 'if_you_have_any_more_children_please_provide_det') return values.has_dependants === 'yes'
  if (id === 'pension_do_you_understand_the_consequences_if_you_don_t') return values.pension_has_will === 'no'
  if (type === 'mortgage') {
    if (id.startsWith('ccj_')) return values.has_ccj === 'yes'
    if (id.startsWith('bk_')) return values.has_bankruptcy === 'yes'
    if (id.startsWith('purchase_')) return values.mortgage_type === 'purchase'
    if (id.startsWith('remortgage_')) return values.mortgage_type === 'remortgage'
    if (id === 'btl_count') return values.has_btl === 'yes'
    const property = /^btl([123])_/.exec(id)
    if (property) return values.has_btl === 'yes' && Number(values.btl_count) >= Number(property[1])
  }
  return true
}

function populated(schema: FormSchema): FormValues {
  const values = defaultValuesFor(schema)
  for (const field of schema.steps.flatMap((step) => step.fields)) {
    if (isPresentational(field)) continue
    values[field.id] = field.type === 'checkbox' ? true
      : field.type === 'checkbox-group' ? [field.options![0].value]
      : field.type === 'yesno' ? 'yes'
      : field.options ? field.options[0].value
      : ['number', 'currency', 'percent'].includes(field.type) ? '100'
      : field.type === 'date' ? '2000-01-01'
      : field.type === 'email' ? 'routing@example.test'
      : `saved-${field.id}`
  }
  return values
}

function assertRouting(schema: FormSchema, values: FormValues) {
  const payload = buildSubmissionPayload(schema, values)
  const expectedIds: string[] = []
  const expectedSteps: string[] = []
  for (const step of schema.steps) {
    const stepShown = expectedStep(step.title, values)
    assert.equal(isStepVisible(step, values), stepShown, step.title)
    if (stepShown) expectedSteps.push(step.id)
    const errors = stepShown ? validateStep(step, values).errors : {}
    for (const field of step.fields) {
      const fieldShown = expectedField(schema.type, field, values)
      assert.equal(isFieldVisible(field, values), fieldShown, `${schema.type}: ${field.id}`)
      if (isPresentational(field)) continue
      if (stepShown && fieldShown) expectedIds.push(field.id)
      else assert(!Object.hasOwn(errors, field.id), `Hidden field cannot block navigation: ${field.id}`)
    }
  }
  assert.deepEqual(payload.steps.map((step) => step.id), expectedSteps)
  assert.deepEqual(Object.keys(payload.answers), expectedIds)
  assert.deepEqual(payload.steps.flatMap((step) => step.answers.map((field) => field.id)), expectedIds)
  for (const id of expectedIds) assert.deepEqual(payload.answers[id], values[id])
}

for (const type of ['mortgage', 'protection'] as const) {
  test(`${type}: adviser, joint, dependants and will routes, including blank gates and stale answers`, () => {
    const schema = getFormSchema(type)
    const values = populated(schema)
    for (const who of ['', 'client', 'adviser'])
      for (const joint of ['', 'no', 'yes'])
        for (const dependants of ['', 'no', 'yes'])
          for (const will of ['', 'no', 'yes']) {
            assertRouting(schema, { ...values, who_completing: who, joint_case: joint, has_dependants: dependants, pension_has_will: will })
          }
  })
}

test('mortgage: independent credit questions and purchase/remortgage/BTL switching', () => {
  const schema = getFormSchema('mortgage')
  const values = populated(schema)
  for (const ccj of ['', 'no', 'yes'])
    for (const bankruptcy of ['', 'no', 'yes'])
      assertRouting(schema, { ...values, has_ccj: ccj, has_bankruptcy: bankruptcy })
  for (const mortgage of ['', 'purchase', 'remortgage'])
    for (const btl of ['', 'no', 'yes'])
      for (const count of ['', '1', '2', '3'])
        assertRouting(schema, { ...values, mortgage_type: mortgage, has_btl: btl, btl_count: count })
})

test('medical: all 14 follow-ups respond independently; GP is never skipped', () => {
  const schema = getFormSchema('medical')
  const values = populated(schema)
  const allNo = Object.fromEntries(medicalGates.map((id) => [id, 'no']))
  for (const gate of medicalGates) {
    expect(schema.steps.flatMap((step) => step.fields).find((field) => field.id === `${gate}_details`)).toBeTruthy()
    for (const answer of ['', 'no', 'yes']) {
      assertRouting(schema, { ...values, [gate]: answer })
      assertRouting(schema, { ...values, ...allNo, [gate]: answer })
    }
  }
  for (const parents of ['', 'yes', 'no', 'one_deceased'])
    assertRouting(schema, { ...values, family_parents_alive: parents })
})

test('home: all five sections remain available with complete or blank answers', () => {
  const schema = getFormSchema('home')
  expect(schema.steps).toHaveLength(5)
  assertRouting(schema, populated(schema))
  assertRouting(schema, defaultValuesFor(schema))
})

for (const schema of getAllFormSchemas()) {
  test(`${schema.type}: choice validation rejects unknown routes and honours optional questions`, () => {
    for (const field of schema.steps.flatMap((step) => step.fields)) {
      if (!['yesno', 'radio', 'select', 'checkbox-group'].includes(field.type)) continue
      const options = field.type === 'yesno' ? ['yes', 'no'] : field.options!.map((option) => option.value)
      // Isolate validation from routing so every branch's controls are exercised.
      const step = { id: 'choice', title: 'Choice', fields: [{ ...field, visibleWhen: undefined }] }
      const multi = field.type === 'checkbox-group'
      for (const value of options) expect(validateStep(step, { [field.id]: multi ? [value] : value }).ok, field.id).toBe(true)
      expect(validateStep(step, { [field.id]: multi ? ['invented-route'] : 'invented-route' }).ok, field.id).toBe(false)
      expect(validateStep(step, { [field.id]: multi ? [] : '' }).ok, field.id).toBe(!field.required)
      if (multi) expect(validateStep(step, { [field.id]: [options[0], 'invented-route'] }).ok).toBe(false)
    }
  })
}

test('hidden required follow-ups never block continuation or enter the submission', () => {
  const schema = structuredClone(getFormSchema('medical'))
  const gate = medicalGates[0]
  const field = schema.steps.flatMap((step) => step.fields).find((entry) => entry.id === `${gate}_details`)!
  field.required = true
  const step = schema.steps.find((entry) => entry.fields.includes(field))!
  const values = { ...populated(schema), [field.id]: '', [gate]: 'yes' }
  expect(validateStep(step, values).errors).toHaveProperty(field.id)
  values[gate] = 'no'
  expect(validateStep(step, values).errors).not.toHaveProperty(field.id)
  expect(buildSubmissionPayload(schema, values).answers).not.toHaveProperty(field.id)
  values[gate] = 'yes'
  expect(validateStep(step, values).errors).toHaveProperty(field.id)
})
