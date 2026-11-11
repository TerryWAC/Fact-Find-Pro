import { test, expect } from '@playwright/test'
import { mortgageFuturePerfectSchema as schema } from '../../src/lib/forms/schemas/mortgage-future-perfect'
import { mortgageSchema } from '../../src/lib/forms/schemas/mortgage'
import { FORM_VARIANTS, getAllFormSchemas, getFormSchema, getSchemaForSubmission, isFormVariant } from '../../src/lib/forms/registry'
import { answerableFields, defaultValuesFor, isFieldVisible, visibleSteps } from '../../src/lib/forms/engine'
import { prepareSubmission } from '../../src/lib/forms/prepare-submission'
import type { FieldCondition, FormField } from '../../src/lib/forms/types'

const fields = schema.steps.flatMap((step) => step.fields)
const byId = new Map(fields.map((field) => [field.id, field]))
const stepOf = (fieldId: string) => schema.steps.find((step) => step.fields.some((field) => field.id === fieldId))!
const stepIndex = (stepId: string) => schema.steps.findIndex((step) => step.id === stepId)
const labels = (stepId: string) => schema.steps.find((step) => step.id === stepId)!.fields.map((field) => field.label)
const conditionFields = (condition?: FieldCondition): string[] =>
  !condition ? [] : 'all' in condition ? condition.all.flatMap(conditionFields) : 'any' in condition ? condition.any.flatMap(conditionFields) : [condition.field]

test('the variant is a well-formed Mortgage schema: unique ids, resolvable conditions, identity fields', () => {
  expect(schema.type).toBe('mortgage')
  expect(schema.version).not.toBe(mortgageSchema.version)
  expect(new Set(fields.map((field) => field.id)).size).toBe(fields.length)
  for (const step of schema.steps) {
    expect(step.fields.length).toBeGreaterThan(0)
    for (const ref of conditionFields(step.visibleWhen)) expect(byId.has(ref), `${step.id} depends on ${ref}`).toBe(true)
    for (const field of step.fields) {
      for (const ref of conditionFields(field.visibleWhen)) expect(byId.has(ref), `${field.id} depends on ${ref}`).toBe(true)
      for (const rule of field.carryOver ?? []) for (const [target, source] of Object.entries(rule.copy)) {
        expect(byId.has(target) && byId.has(source), `${field.id} carries ${source} → ${target}`).toBe(true)
      }
      if (field.type === 'radio' || field.type === 'select') expect(field.options?.length ?? 0).toBeGreaterThan(1)
    }
  }
  expect(fields.find((field) => field.identity === 'client_name')?.required).toBe(true)
  expect(fields.find((field) => field.identity === 'client_email')?.required).toBe(true)
  // Every long-answer box has room to write and no character limit.
  for (const field of fields.filter((entry) => entry.type === 'textarea')) {
    expect(field.rows ?? 4).toBeGreaterThanOrEqual(3)
    expect(field.validation?.maxLength).toBeUndefined()
  }
})

test('the registry serves the variant only when asked for it and reads submissions by version', () => {
  expect(getFormSchema('mortgage')).toBe(mortgageSchema)
  expect(getFormSchema('mortgage', null)).toBe(mortgageSchema)
  expect(getFormSchema('mortgage', 'future_perfect')).toBe(schema)
  expect(getFormSchema('protection', 'future_perfect')).not.toBe(schema)
  expect(getFormSchema('mortgage', 'no_such_variant')).toBe(mortgageSchema)
  expect(isFormVariant('future_perfect')).toBe(true)
  expect(isFormVariant('standard')).toBe(false)
  expect(Object.keys(FORM_VARIANTS)).toEqual(['future_perfect'])
  // The four standard schemas are unchanged by the variant.
  expect(getAllFormSchemas()).toHaveLength(4)
  expect(getAllFormSchemas()).not.toContain(schema)
  expect(getSchemaForSubmission('mortgage', { schema_version: schema.version })).toBe(schema)
  expect(getSchemaForSubmission('mortgage', { schema_version: mortgageSchema.version })).toBe(mortgageSchema)
  expect(getSchemaForSubmission('mortgage', null)).toBe(mortgageSchema)
})

test('internal details: adviser name removed; appointment date, source and other together on one adviser-only page', () => {
  const internal = schema.steps[1]
  expect(internal.title).toBe('Internal Details')
  expect(internal.visibleWhen).toEqual({ field: 'who_completing', operator: 'eq', value: 'adviser' })
  expect(internal.fields.map((field) => field.id)).toEqual(['date_of_appointment', 'source', 'if_other_please_specify_source_details'])
  expect(byId.has('adviser_name')).toBe(false)
  expect(schema.steps.filter((step) => conditionFields(step.visibleWhen).includes('who_completing'))).toHaveLength(1)
  expect(schema.steps.some((step) => /admin notes/i.test(step.title))).toBe(false)
  expect(fields.some((field) => field.id.startsWith('admin_'))).toBe(false)
})

test('applicants: nationality sits with personal details, not health, for both applicants', () => {
  for (const prefix of ['a1', 'a2']) {
    const ids = stepOf(`${prefix}_nationality`).fields.map((field) => field.id)
    expect(ids.indexOf(`${prefix}_nationality`)).toBeLessThan(ids.indexOf(`${prefix}_health_heading`))
    expect(ids.some((id) => id.includes('health_nationality'))).toBe(false)
  }
  expect(schema.steps[3].visibleWhen).toEqual({ field: 'joint_case', operator: 'eq', value: 'yes' })
})

test('dependants: date of birth added, gender gone, wording covers adults', () => {
  const dep = labels('s5_dependants')
  expect(dep).toContain('Dependant’s date of birth')
  expect(byId.get('dep_date_of_birth')?.type).toBe('date')
  expect(dep.join(' ')).not.toMatch(/gender/i)
  expect(byId.get('more_dependants_details')?.helpText).not.toMatch(/gender/i)
  expect(byId.get('has_dependants')?.label).toBe('Do you have any children or other dependants?')
  expect(byId.get('more_dependants_details')?.label).toMatch(/children or dependants/)
})

test('monthly expenses are gone; loans show their details before the additional-loans box', () => {
  expect(schema.steps.some((step) => /expenditure/i.test(step.title))).toBe(false)
  expect(fields.some((field) => field.id.startsWith('exp_'))).toBe(false)
  const loans = schema.steps.find((step) => step.id === 's7_loans')!.fields.map((field) => field.id)
  expect(loans.indexOf('loan1_company_name')).toBeLessThan(loans.indexOf('additional_loans_details'))
  expect(loans.indexOf('loan4_outstanding_balance')).toBeLessThan(loans.indexOf('additional_loans_details'))
  const yesLoans = { ...defaultValuesFor(schema), has_loans: 'yes' }
  const shown = schema.steps.find((step) => step.id === 's7_loans')!.fields.filter((field) => isFieldVisible(field, yesLoans)).map((field) => field.id)
  expect(shown).toContain('loan1_company_name')
  expect(shown).toContain('additional_loans_details')
  const noLoans = { ...defaultValuesFor(schema), has_loans: 'no' }
  expect(schema.steps.find((step) => step.id === 's7_loans')!.fields.filter((field) => isFieldVisible(field, noLoans)).map((field) => field.id)).toEqual(['has_loans'])
})

test('credit cards gain a large optional box; CCJ and bankruptcy become one credit-issues question', () => {
  const cards = schema.steps.find((step) => step.id === 's8_credit_cards')!.fields
  const extra = cards.at(-1)!
  expect(extra.id).toBe('credit_cards_additional_details')
  expect(extra.type).toBe('textarea')
  expect(extra.required).toBeFalsy()
  expect((extra.rows ?? 0) >= 6).toBe(true)
  expect(byId.get('cc1_outstanding_balance')?.label).toBe('Current outstanding balance credit card 1')
  expect(fields.some((field) => /ccj|bankrupt/i.test(field.id))).toBe(false)
  expect(labels('s9_credit_issues')).toEqual(['Are there any credit issues?', 'Please provide details of all credit issues.'])
  expect(byId.get('credit_issues_details')?.visibleWhen).toEqual({ field: 'has_credit_issues', operator: 'eq', value: 'yes' })
})

test('existing properties come before purchase/remortgage with the requested Property 1 page and additional-properties box', () => {
  expect(stepIndex('s10_existing_properties')).toBeLessThan(stepIndex('s11_mortgage_info'))
  expect(byId.get('owns_properties')?.label).toBe('Do you own any properties?')
  const props = labels('s10_existing_properties')
  for (const label of ['Address', 'Estimated value', 'Mortgage outstanding', 'Current lender', 'Is this property a buy-to-let?', 'Rental income (monthly)', 'Property 1 notes', 'Do you own any other additional properties?', 'Additional properties'])
    expect(props).toContain(label)
  expect(byId.get('prop1_rental_income')?.visibleWhen).toEqual({ all: [{ field: 'owns_properties', operator: 'eq', value: 'yes' }, { field: 'prop1_buy_to_let', operator: 'eq', value: 'yes' }] })
  expect(byId.get('additional_properties_details')?.type).toBe('textarea')
  expect(fields.some((field) => field.id.startsWith('btl') || /^prop[2-9]_/.test(field.id))).toBe(false)
})

test('purchase asks about a connected sale; the sale page is one page with carry-across from Property 1', () => {
  const mortgage = schema.steps.find((step) => step.id === 's11_mortgage_info')!.fields
  expect(mortgage[0].id).toBe('mortgage_type')
  expect(byId.get('sale_connected')?.label).toBe('Is there a sale connected to the purchase?')
  expect(byId.get('sale_connected')?.visibleWhen).toEqual({ field: 'mortgage_type', operator: 'eq', value: 'purchase' })
  const sale = schema.steps.find((step) => step.id === 's12_connected_sale')!
  expect(sale.visibleWhen).toEqual({ all: [{ field: 'mortgage_type', operator: 'eq', value: 'purchase' }, { field: 'sale_connected', operator: 'eq', value: 'yes' }] })
  const saleLabels = sale.fields.map((field) => field.label)
  for (const label of ['Property address', 'Estimated value', 'Mortgage outstanding', 'Current lender', 'Current interest rate', 'Mortgage term remaining', 'Current mortgage product expiry date', 'Are there any early repayment charges?', 'Early repayment charge details', 'Current position of the sale', 'Sale notes'])
    expect(saleLabels).toContain(label)
  expect(byId.get('sale_early_repayment_charges')?.options?.map((option) => option.value)).toEqual(['yes', 'no', 'not_known'])
  const picker = byId.get('sale_property_source') as FormField
  expect(picker.carryOver).toEqual([{ whenValue: 'property_1', copy: { sale_address: 'prop1_address', sale_estimated_value: 'prop1_estimated_value', sale_mortgage_outstanding: 'prop1_mortgage_outstanding', sale_current_lender: 'prop1_current_lender' } }])
  // Without an existing property there is nothing to carry across, so the picker is not shown.
  expect(isFieldVisible(picker, { ...defaultValuesFor(schema), owns_properties: 'no' })).toBe(false)
  // A remortgage never shows the sale page.
  const remortgage = { ...defaultValuesFor(schema), mortgage_type: 'remortgage', sale_connected: 'yes' }
  expect(visibleSteps(schema, remortgage).some((step) => step.id === 's12_connected_sale')).toBe(false)
})

test('monthly surplus replaces the combined budget question on both purchase and remortgage pages', () => {
  const surplus = 'How much surplus income would you like to have left at the end of each month, after all your monthly commitments have been paid?'
  expect(byId.get('purchase_monthly_surplus')?.label).toBe(surplus)
  expect(byId.get('remortgage_monthly_surplus')?.label).toBe(surplus)
  expect(byId.get('purchase_monthly_surplus')?.type).toBe('currency')
  expect(stepOf('purchase_monthly_surplus').id).toBe('s11_mortgage_info')
  expect(fields.some((field) => /budget/i.test(field.label ?? ''))).toBe(false)
  expect(byId.get('other_mortgage_details')?.type).toBe('textarea')
  expect(byId.get('other_mortgage_details')?.helpText).toMatch(/stamp duty/i)
  expect(fields.some((field) => /mortgage costs/i.test(field.label ?? ''))).toBe(false)
})

test('solicitor follows the mortgage pages and plans and future changes follows solicitor', () => {
  expect(schema.steps.map((step) => step.id).slice(stepIndex('s11_mortgage_info'), stepIndex('s11_mortgage_info') + 4))
    .toEqual(['s11_mortgage_info', 's12_connected_sale', 's13_solicitor', 's14_plans_and_future_changes'])
  expect(labels('s13_solicitor')).toEqual(expect.arrayContaining(['Do you have a solicitor?', 'Firm name', 'Contact name', 'Email', 'Telephone number', 'Solicitor recommendation notes']))
  expect(byId.get('solicitor_recommendation_notes')?.visibleWhen).toEqual({ field: 'has_solicitor', operator: 'eq', value: 'no' })
  expect(byId.get('solicitor_recommendation_notes')?.required).toBeFalsy()
  expect(schema.steps.find((step) => step.id === 's14_plans_and_future_changes')?.title).toBe('Plans and Future Changes')
})

test('protection section: other employment benefits after sick pay, pensions wording widened, not-known choices, general insurance on one page', () => {
  expect(stepIndex('s16_other_employment_benefits')).toBe(stepIndex('s15_sick_pay_info') + 1)
  expect(byId.get('a2_other_employment_benefits')?.visibleWhen).toEqual({ field: 'joint_case', operator: 'eq', value: 'yes' })
  expect(byId.get('pensions_investments_savings')?.label).toBe('Do you have any pensions, investments or savings?')
  expect(byId.get('pensions_investments_savings_details')?.label).toBe('Pensions, Investments and Savings — Details')
  expect(byId.get('pensions_investments_savings_details')?.visibleWhen).toEqual({ field: 'pensions_investments_savings', operator: 'eq', value: 'yes' })
  for (const id of ['sp1_do_you_receive_any_sick_pay', 'sp2_do_you_receive_any_sick_pay', 'prot_do_you_have_anything_that_pays_out_a_lump_sum_up', 'prot_do_you_have_anything_in_place_that_pays_your_wag', 'pensions_investments_savings', 'prot_do_you_have_anything_that_pays_off_your_mortgage'])
    expect(byId.get(id)?.options?.some((option) => option.value === 'not_known'), id).toBe(true)
  expect(labels('s18_general_insurance')).toEqual(['Current general insurance provider', 'Renewal date', 'Current premium paid (£)', 'Premium frequency'])
})

test('a bespoke submission validates against the variant and never against the standard schema', () => {
  const values = { ...defaultValuesFor(schema), client_name: 'Jo Client', client_email: 'jo@example.test', please_ensure_that_all_information_you_have_prov: true, has_credit_issues: 'yes', credit_issues_details: 'A default in 2021, now satisfied.' }
  const payload = { schema_version: schema.version, form_type: 'mortgage', answers: values }
  const ok = prepareSubmission(schema, payload)
  expect(ok.ok).toBe(true)
  if (ok.ok) {
    expect(ok.payload.schema_version).toBe(schema.version)
    expect(ok.payload.steps.some((step) => step.id === 's9_credit_issues')).toBe(true)
    expect(ok.payload.steps.some((step) => step.id === 's2_internal_details')).toBe(false)
  }
  expect(prepareSubmission(mortgageSchema, payload).ok).toBe(false)
  expect(answerableFields(schema).length).toBeGreaterThan(150)
})
