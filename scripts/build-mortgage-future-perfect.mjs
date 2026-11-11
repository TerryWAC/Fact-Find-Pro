#!/usr/bin/env node
/**
 * Builds the Future Perfect variant of the Mortgage FactFind.
 *
 *   node scripts/build-mortgage-future-perfect.mjs [--check]
 *
 * Source of truth, in order:
 *   1. Tom Hunt's own Typeform (tests/fixtures/typeform/future-perfect-mortgage.json),
 *      whose wording is carried over wherever a question survives;
 *   2. the change request of 26 October 2026 (docs/future-perfect-mortgage-variant.md
 *      lists every item and how it is met);
 *   3. shared question definitions from the standard Mortgage schema, so that
 *      applicant, employment, sick pay and protection questions behave exactly
 *      as they do for every other adviser.
 *
 * The output is src/lib/forms/schemas/mortgage-future-perfect.json. The variant
 * is served only to links whose factfind_forms.variant is 'future_perfect'.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const base = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/forms/schemas/mortgage.json'), 'utf8'))
const tomForm = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/typeform/future-perfect-mortgage.json'), 'utf8'))
const outFile = path.join(root, 'src/lib/forms/schemas/mortgage-future-perfect.json')

export const VARIANT_VERSION = '2026.11-future-perfect.1'

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------
const baseFields = new Map(base.steps.flatMap((step) => step.fields.map((field) => [field.id, field])))
const usedIds = new Set()

/** A copy of a standard Mortgage field, with optional changes; it must exist. */
function pick(id, overrides = {}) {
  const field = baseFields.get(id)
  if (!field) throw new Error(`standard mortgage schema has no field "${id}"`)
  const copy = structuredClone(field)
  delete copy.visibleWhen
  delete copy.source
  return finish({ ...copy, ...overrides })
}

/** Tom's question by group title and question title, for provenance and exact wording. */
const tomGroups = []
for (const field of tomForm.fields) {
  const children = field.properties?.fields
  if (children) for (const child of children) tomGroups.push({ group: field.title, ...child })
  else tomGroups.push({ group: null, ...field })
}
function tom(title, group) {
  const hits = tomGroups.filter((entry) => entry.title.trim() === title && (group === undefined || (entry.group ?? '').includes(group)))
  if (hits.length !== 1) throw new Error(`expected exactly one Typeform question titled "${title}"${group ? ` in "${group}"` : ''}, found ${hits.length}`)
  return hits[0]
}

function finish(field) {
  if (usedIds.has(field.id)) throw new Error(`duplicate field id ${field.id}`)
  usedIds.add(field.id)
  return field
}

const eq = (field, value) => ({ field, operator: 'eq', value })
const yes = (field) => eq(field, 'yes')
const all = (...conditions) => ({ all: conditions })

const heading = (id, label) => finish({ id, type: 'heading', label, colSpan: 2 })
const text = (id, label, extra = {}) => finish({ id, type: 'text', label, colSpan: 1, ...extra })
const currency = (id, label, extra = {}) => finish({ id, type: 'currency', label, colSpan: 1, ...extra })
const date = (id, label, extra = {}) => finish({ id, type: 'date', label, colSpan: 1, ...extra })
const yesno = (id, label, extra = {}) => finish({ id, type: 'yesno', label, colSpan: 2, ...extra })
/** Long free text with room to write; no character limit is applied anywhere. */
const notes = (id, label, extra = {}) => finish({ id, type: 'textarea', label, colSpan: 2, rows: 6, ...extra })
const NOT_KNOWN = { value: 'not_known', label: 'Not known' }
const YES_NO_NOT_KNOWN = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, NOT_KNOWN]
const choice = (id, label, options, extra = {}) => finish({ id, type: 'radio', label, options, colSpan: 2, ...extra })

/** Tom's wording for a question Future Perfect already asked, as a field of the given shape. */
const fromTom = (id, title, shape, extra = {}) => {
  const question = tom(title, extra.group)
  const rest = { ...extra }
  delete rest.group
  const field = { id, type: shape, label: title, colSpan: shape === 'textarea' || shape === 'yesno' ? 2 : 1, source: question.ref, ...rest }
  if (question.properties?.description && !field.helpText) field.helpText = question.properties.description.trim()
  if (shape === 'textarea' && !field.rows) field.rows = 6
  return finish(field)
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------
const steps = []
const step = (id, title, fields, extra = {}) => { steps.push({ id, title, fields, ...extra }); return steps[steps.length - 1] }
const INTERNAL = { description: 'Adviser use only — not shown to clients.', visibleWhen: eq('who_completing', 'adviser') }

// 1. Introduction
step('s1_introduction', 'Introduction', [pick('who_completing')])

// 2. Internal details: Adviser Name removed; appointment date, source and
//    "other" together on one page.
step('s2_internal_details', 'Internal Details', [
  pick('date_of_appointment'),
  pick('source'),
  pick('if_other_please_specify_source_details', { visibleWhen: eq('source', 'other') }),
], INTERNAL)

// 3–4. Applicants: Future Perfect's question set (no residency status or UK
//    arrival questions), with Nationality moved from Health to Personal details.
function applicant(prefix, number, identity) {
  const group = `Applicant ${number}`
  const name = identity ? pick('client_name') : text(`${prefix}_full_name`, 'Full Name')
  const phone = identity ? pick('client_phone') : finish({ id: `${prefix}_phone_number`, type: 'tel', label: 'Phone Number', colSpan: 1 })
  const email = identity ? pick('client_email') : finish({ id: `${prefix}_email`, type: 'email', label: 'Email', colSpan: 1 })
  return [
    heading(`${prefix}_heading`, `Applicant ${number} details`),
    text(`${prefix}_title`, 'Title'),
    name,
    date(`${prefix}_date_of_birth`, 'Date of Birth'),
    text(`${prefix}_gender`, 'Gender'),
    text(`${prefix}_nationality`, 'Nationality', { source: tom('Nationality', `${group} Health`).ref }),
    phone,
    email,
    text(`${prefix}_address`, 'Address', { colSpan: 2 }),
    notes(`${prefix}_previous_addresses`, 'If you have lived here less than 3 years, please provide your previous addresses', {
      rows: 3, source: tom('If lived here less than 3 years provide old addreesses:', `${group} ${number === 1 ? 'details' : 'Details'}`).ref,
    }),
    text(`${prefix}_marital_status`, 'Marital Status'),
    heading(`${prefix}_health_heading`, `Applicant ${number} Health Details`),
    text(`${prefix}_health_smoker_vaper_status`, 'Smoker/Vaper status (include amount/vape)', { colSpan: 2 }),
    text(`${prefix}_health_height`, 'Height'),
    text(`${prefix}_health_weight`, 'Weight'),
    notes(`${prefix}_health_serious_health_issues`, tom('Have you had any serious health issues in the past which may stop you from getting insurance? (Cancer, Heart Attack, Stroke, M.S, etc)', `${group} Health`).title, { rows: 3 }),
  ]
}
step('s3_applicant_1_details', 'Applicant 1 Details', [...applicant('a1', 1, true), pick('joint_case')])
step('s4_applicant_2_details', 'Applicant 2 Details', applicant('a2', 2, false), { visibleWhen: yes('joint_case') })

// 5. Children and dependants: date of birth added, gender removed, wording
//    covers adult dependants.
const DEP = yes('has_dependants')
step('s5_dependants', 'Children and Dependants', [
  yesno('has_dependants', 'Do you have any children or other dependants?', { source: tom('Do you have children or dependants?').ref }),
  heading('dep_heading', 'Dependant details'),
  text('dep_name', 'Dependant’s name', { visibleWhen: DEP }),
  date('dep_date_of_birth', 'Dependant’s date of birth', { visibleWhen: DEP }),
  text('dep_relationship_to_client', 'Relationship to client', { visibleWhen: DEP }),
  text('dep_dependent_on', 'Dependent on (Applicant 1, Applicant 2 or Both)', { visibleWhen: DEP }),
  finish({ id: 'dep_dependent_until_age', type: 'number', label: 'Dependant on you until what age?', colSpan: 1, visibleWhen: DEP }),
  notes('more_dependants_details', 'If you have any more children or dependants, please provide details below for ALL of them.', {
    helpText: 'Name, relationship to client(s), date of birth and dependant until what age', visibleWhen: DEP,
    source: tom('If you have any more children, please provide details below for ALL children.').ref,
  }),
])
steps.at(-1).fields[1].visibleWhen = DEP

// 6. Employment: Future Perfect's questions (no separate job-title question).
const JOINT = yes('joint_case')
const employment = (prefix, pay, number) => [
  pick(`${prefix}_heading`, number === 2 ? { visibleWhen: JOINT } : {}),
  pick(number === 1 ? 'a1_emp_status' : 'a2_emp_applicant_2_employment_status', number === 2 ? { visibleWhen: JOINT } : {}),
  pick(`${prefix}_applicant_${number}_occupation`, number === 2 ? { visibleWhen: JOINT } : {}),
  pick(`${prefix}_applicant_${number}_employer_name`, number === 2 ? { visibleWhen: JOINT } : {}),
  pick(`${prefix}_applicant_${number}_full_time_or_part_time`, number === 2 ? { visibleWhen: JOINT } : {}),
  pick(`${prefix}_applicant_${number}_start_of_employment_date_or_company`, number === 2 ? { visibleWhen: JOINT } : {}),
  pick(number === 1 ? 'if_you_have_worked_there_less_than_2_years_pleas' : 'if_you_have_worked_there_less_than_2_years_pleas_2', {
    helpText: 'Company name, job title, start and end date, income/salary', rows: 4, ...(number === 2 ? { visibleWhen: JOINT } : {}),
  }),
  pick(`${pay}_heading`, number === 2 ? { visibleWhen: JOINT } : {}),
  pick(`${pay}_applicant_${number}_gross_annual_pay`, number === 2 ? { visibleWhen: JOINT } : {}),
  pick(`${pay}_applicant_${number}_net_monthly_pay`, number === 2 ? { visibleWhen: JOINT } : {}),
  pick(`${pay}_applicant_${number}_benefits_received`, number === 2 ? { visibleWhen: JOINT } : {}),
  pick(`${pay}_applicant_${number}_anticipated_retirement_age`, number === 2 ? { visibleWhen: JOINT } : {}),
  pick(`${pay}_please_state_any_additional_income_below_applica`, { colSpan: 2, ...(number === 2 ? { visibleWhen: JOINT } : {}) }),
]
step('s6_employment_info', 'Employment Info', [...employment('a1_emp', 'a1_pay', 1), ...employment('a2_emp', 'a2_pay', 2)])

// 7. Loans: the loan-details page comes straight after "Do you have any
//    loans?" = Yes, then the additional-loans box. (Monthly Expenses deleted.)
const LOANS = yes('has_loans')
const loanFields = [1, 2, 3, 4].flatMap((n) => [
  text(`loan${n}_company_name`, `Loan ${n} Company name`, { visibleWhen: LOANS, source: tom(`Loan ${n} Company name`).ref }),
  currency(`loan${n}_monthly_payment`, `Loan ${n} Monthly payment`, { visibleWhen: LOANS, source: tom(`Loan ${n} Monthly payment`).ref }),
  currency(`loan${n}_outstanding_balance`, `Loan ${n} Outstanding balance`, { visibleWhen: LOANS, source: tom(`Loan ${n} Outstanding balance`).ref }),
])
step('s7_loans', 'Loans', [
  fromTom('has_loans', 'Do you have any loans?', 'yesno'),
  heading('loans_heading', 'Loan details'),
  ...loanFields,
  fromTom('additional_loans_details', 'If you have any additional loans or credit please enter the name of the company, monthly payment & outstanding balance', 'textarea', { visibleWhen: LOANS }),
])
steps.at(-1).fields[1].visibleWhen = LOANS

// 8. Credit cards, plus a large optional box for further cards.
const CARDS = yes('has_credit_cards')
step('s8_credit_cards', 'Credit Cards', [
  fromTom('has_credit_cards', 'Do you have a credit card(s) or store card(s)?', 'yesno'),
  heading('credit_cards_heading', 'Credit and store card details'),
  ...[1, 2, 3].flatMap((n) => [
    text(`cc${n}_name`, `Name of credit card ${n}`, { visibleWhen: CARDS, source: tom(`Name of credit card ${n}`).ref }),
    currency(`cc${n}_outstanding_balance`, `Current outstanding balance credit card ${n}`, { visibleWhen: CARDS, source: tom(`Current outstanding balamce credit card ${n}`).ref }),
    text(`cc${n}_repayments`, `Credit card repayments credit card ${n} (paid off in full, minimum monthly, regular repayment)`, { colSpan: 2, visibleWhen: CARDS, source: tom(`Credit card repayments credit card ${n} (Paid off in full, minimum monthly, regular repayment. Please enter below)`).ref }),
  ]),
  notes('credit_cards_additional_details', 'Further cards or additional information', {
    helpText: 'Optional. Any further cards, balances and repayments, or anything else relevant.', visibleWhen: CARDS,
  }),
])
steps.at(-1).fields[1].visibleWhen = CARDS

// 9. Credit issues replace the separate CCJ and bankruptcy questions.
step('s9_credit_issues', 'Credit Issues', [
  yesno('has_credit_issues', 'Are there any credit issues?'),
  notes('credit_issues_details', 'Please provide details of all credit issues.', { rows: 8, visibleWhen: yes('has_credit_issues') }),
])

// 10. Existing properties, before purchase/remortgage.
const OWNS = yes('owns_properties')
step('s10_existing_properties', 'Existing Properties', [
  yesno('owns_properties', 'Do you own any properties?'),
  heading('prop1_heading', 'Property 1'),
  text('prop1_address', 'Address', { colSpan: 2, visibleWhen: OWNS }),
  currency('prop1_estimated_value', 'Estimated value', { visibleWhen: OWNS }),
  currency('prop1_mortgage_outstanding', 'Mortgage outstanding', { visibleWhen: OWNS }),
  text('prop1_current_lender', 'Current lender', { visibleWhen: OWNS }),
  yesno('prop1_buy_to_let', 'Is this property a buy-to-let?', { visibleWhen: OWNS }),
  currency('prop1_rental_income', 'Rental income (monthly)', { visibleWhen: all(OWNS, yes('prop1_buy_to_let')) }),
  notes('prop1_notes', 'Property 1 notes', { helpText: 'Anything else about this property, its mortgage or its tenancy.', visibleWhen: OWNS }),
  yesno('owns_additional_properties', 'Do you own any other additional properties?', { visibleWhen: OWNS }),
  notes('additional_properties_details', 'Additional properties', {
    rows: 8, helpText: 'For each additional property: address, estimated value, mortgage outstanding, current lender, whether it is let and the rental income.',
    visibleWhen: all(OWNS, yes('owns_additional_properties')),
  }),
])
steps.at(-1).fields[1].visibleWhen = OWNS

// 11. Purchase or remortgage, each page carrying the monthly surplus question;
//     "Other Mortgage Details" replaces "Mortgage Costs (£)".
const PURCHASE = eq('mortgage_type', 'purchase')
const REMORTGAGE = eq('mortgage_type', 'remortgage')
const SURPLUS = 'How much surplus income would you like to have left at the end of each month, after all your monthly commitments have been paid?'
const purchasePicks = ['purchase_heading', 'purchase_purchase_amount', 'purchase_purchase_address', 'purchase_source_of_deposit', 'purchase_property_type',
  'purchase_property_type_2', 'purchase_year_of_build', 'purchase_type_of_construction', 'purchase_number_of_bedrooms', 'purchase_number_of_bathrooms',
  'purchase_estate_agents_details', 'purchase_any_other_relevant_information']
const remortgagePicks = ['remortgage_heading', 'remortgage_estimated_value', 'remortgage_outstanding_loan_amount', 'remortgage_current_lender',
  'remortgage_current_interest_rate', 'remortgage_end_of_fixed_rate', 'remortgage_property_type', 'remortgage_property_type_2', 'remortgage_year_of_build',
  'remortgage_type_of_construction', 'remortgage_number_of_bedrooms', 'remortgage_number_of_bathrooms', 'remortgage_any_other_relevant_information']
step('s11_mortgage_info', 'Purchase or Remortgage', [
  pick('mortgage_type'),
  ...purchasePicks.map((id) => pick(id, { visibleWhen: PURCHASE })),
  currency('purchase_monthly_surplus', SURPLUS, { colSpan: 2, visibleWhen: PURCHASE }),
  yesno('sale_connected', 'Is there a sale connected to the purchase?', { visibleWhen: PURCHASE, source: tom('Is there a sale involved with this purchase?').ref }),
  ...remortgagePicks.map((id) => pick(id, { visibleWhen: REMORTGAGE })),
  currency('remortgage_monthly_surplus', SURPLUS, { colSpan: 2, visibleWhen: REMORTGAGE }),
  notes('other_mortgage_details', 'Other Mortgage Details', {
    helpText: 'Stamp duty, estate agency fees, legal costs, surveys and any other relevant details.', source: tom('Mortgage Costs (£)').ref,
  }),
])

// 12. Connected sale, all on one page; an existing property can be carried
//     across and amended.
const SALE = all(PURCHASE, yes('sale_connected'))
step('s12_connected_sale', 'Sale of Existing Property', [
  finish({
    id: 'sale_property_source', type: 'radio', label: 'Which property is being sold?', colSpan: 2, visibleWhen: OWNS,
    options: [{ value: 'property_1', label: 'Property 1, entered earlier', description: 'Its details are copied below for you to check or amend.' }, { value: 'other', label: 'A different property' }],
    carryOver: [{ whenValue: 'property_1', copy: { sale_address: 'prop1_address', sale_estimated_value: 'prop1_estimated_value', sale_mortgage_outstanding: 'prop1_mortgage_outstanding', sale_current_lender: 'prop1_current_lender' } }],
  }),
  text('sale_address', 'Property address', { colSpan: 2 }),
  fromTom('sale_estimated_value', 'Current estimated property value (£)', 'currency', { label: 'Estimated value' }),
  fromTom('sale_mortgage_outstanding', 'Mortgage outstanding (£)', 'currency', { label: 'Mortgage outstanding' }),
  fromTom('sale_current_lender', 'Current mortgage lender', 'text', { label: 'Current lender' }),
  fromTom('sale_current_interest_rate', 'Current mortgage interest rate (%)', 'percent', { label: 'Current interest rate' }),
  fromTom('sale_mortgage_term_remaining', 'Mortgage term remaining', 'text'),
  fromTom('sale_product_expiry_date', 'Current mortgage product expiry date', 'date'),
  choice('sale_early_repayment_charges', 'Are there any early repayment charges?', YES_NO_NOT_KNOWN, { source: tom('Are there any early repayment charges?').ref }),
  text('sale_early_repayment_charge_details', 'Early repayment charge details', { colSpan: 2, visibleWhen: eq('sale_early_repayment_charges', 'yes') }),
  finish({
    id: 'sale_position', type: 'select', label: 'Current position of the sale', colSpan: 1, source: tom('Current position of the sale').ref,
    options: tom('Current position of the sale').properties.choices.map((c) => ({ value: c.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), label: c.label })),
  }),
  fromTom('sale_notes', 'Sale notes', 'textarea'),
], { visibleWhen: SALE })

// 13. Solicitor.
step('s13_solicitor', 'Solicitor', [
  yesno('has_solicitor', 'Do you have a solicitor?'),
  heading('solicitor_heading', 'Your solicitor'),
  text('solicitor_firm_name', 'Firm name', { visibleWhen: yes('has_solicitor') }),
  text('solicitor_contact_name', 'Contact name', { visibleWhen: yes('has_solicitor') }),
  finish({ id: 'solicitor_email', type: 'email', label: 'Email', colSpan: 1, visibleWhen: yes('has_solicitor') }),
  finish({ id: 'solicitor_phone', type: 'tel', label: 'Telephone number', colSpan: 1, visibleWhen: yes('has_solicitor') }),
  notes('solicitor_recommendation_notes', 'Solicitor recommendation notes', {
    helpText: 'Optional. Anything useful for your adviser’s solicitor recommendation.', visibleWhen: eq('has_solicitor', 'no'),
  }),
])
steps.at(-1).fields[1].visibleWhen = yes('has_solicitor')

// 14. Plans and future changes, straight after Solicitor.
step('s14_plans_and_future_changes', 'Plans and Future Changes', [
  fromTom('future_changes', 'Are there any expected future changes to your circumstances?', 'yesno'),
  fromTom('future_changes_notes', 'Future changes notes', 'textarea', { visibleWhen: yes('future_changes') }),
])

// 15. Sick pay, with "Not known" available.
const sickPay = (prefix, number) => {
  const gate = number === 2 ? { visibleWhen: JOINT } : {}
  return [
    pick(`${prefix}_heading`, gate),
    pick(`${prefix}_do_you_receive_any_sick_pay`, { type: 'radio', options: YES_NO_NOT_KNOWN, colSpan: 2, ...gate }),
    pick(`${prefix}_if_yes_how_much_sick_pay_do_you_receive`, { helpText: 'Monetary amount', ...gate }),
    pick(`${prefix}_how_long_is_sick_pay_received_for`, { helpText: 'Duration in months, or "Not known"', ...gate }),
    pick(`${prefix}_do_you_have_any_savings_or_other_income_that_wou`, { colSpan: 2, ...gate }),
    pick(`${prefix}_if_your_income_stopped_but_your_bills_continued`, { helpText: 'Duration in months, or "Not known"', colSpan: 2, ...gate }),
    pick(`${prefix}_after_your_savings_have_run_out_how_long_could_y`, { helpText: 'Duration in months, or "Not known"', colSpan: 2, ...gate }),
  ]
}
step('s15_sick_pay_info', 'Sick Pay Info', [...sickPay('sp1', 1), ...sickPay('sp2', 2)])

// 16. Other employment benefits, a separate section after Sick Pay.
step('s16_other_employment_benefits', 'Other Employment Benefits', [
  notes('a1_other_employment_benefits', 'Applicant 1: other employment benefits relevant to protection', {
    helpText: 'For example death in service, private medical cover or income protection through work. Enter "Not known" if unsure.',
  }),
  notes('a2_other_employment_benefits', 'Applicant 2: other employment benefits relevant to protection', {
    helpText: 'For example death in service, private medical cover or income protection through work. Enter "Not known" if unsure.', visibleWhen: JOINT,
  }),
])

// 17. Current protection and pensions, investments and savings.
step('s17_current_protection', 'Current Protection', [
  pick('prot_heading'),
  pick('prot_do_you_have_anything_that_pays_out_a_lump_sum_up', { type: 'radio', options: YES_NO_NOT_KNOWN }),
  pick('prot_do_you_have_anything_that_pays_out_a_lump_sum_up_2', { type: 'radio', options: YES_NO_NOT_KNOWN }),
  pick('prot_do_you_have_anything_that_pays_off_your_mortgage', { options: [...baseFields.get('prot_do_you_have_anything_that_pays_off_your_mortgage').options, NOT_KNOWN] }),
  pick('prot_do_you_have_anything_in_place_that_pays_your_wag', { options: YES_NO_NOT_KNOWN }),
  pick('prot_do_you_have_anything_in_place_that_pays_your_wag_details', { rows: 5, helpText: tom('Enter details of any existing policies you have.').properties.description.trim() }),
  pick('pension_heading', { label: 'Pensions, investments and savings' }),
  choice('pensions_investments_savings', 'Do you have any pensions, investments or savings?', YES_NO_NOT_KNOWN, { source: tom('Do you have pensions or investments?').ref }),
  pick('pension_have_your_pensions_investments_been_reviewed'),
  pick('pension_are_you_happy_with_your_pensions_investments'),
  notes('pensions_investments_savings_details', 'Pensions, Investments and Savings — Details', {
    helpText: 'Providers, current values, contributions and anything else relevant, including savings.', visibleWhen: yes('pensions_investments_savings'),
  }),
  pick('pension_has_will'),
  pick('pension_do_you_understand_the_consequences_if_you_don_t', { visibleWhen: eq('pension_has_will', 'no') }),
  pick('pension_are_you_concerned_about_care_fees'),
])

// 18. General insurance, on one page, with "Not known" possible throughout.
step('s18_general_insurance', 'General Insurance', [
  fromTom('gi_provider', 'Current GI provider', 'text', { label: 'Current general insurance provider', helpText: 'Enter "Not known" if unsure.' }),
  fromTom('gi_renewal_date', 'GI renewal date', 'date', { label: 'Renewal date', helpText: 'Leave blank if not known.' }),
  fromTom('gi_current_premium', 'Current premium paid (£)', 'text', { helpText: 'Amount in £, or "Not known".' }),
  fromTom('gi_premium_frequency', 'Premium frequency', 'text', { helpText: 'Monthly or annually, or "Not known".' }),
])

// 19. Additional services and the declaration.
step('s19_additional_services', 'Additional Services', [
  pick('is_there_anything_specific_that_you_would_like_y', { rows: 5 }),
  pick('please_ensure_that_all_information_you_have_prov'),
])

// Section 13 (Admin Notes) is deliberately absent.

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------
const schema = {
  type: 'mortgage',
  version: VARIANT_VERSION,
  title: base.title,
  subtitle: base.subtitle,
  intro: base.intro,
  estimatedMinutes: base.estimatedMinutes,
  steps,
  submitLabel: base.submitLabel,
  successTitle: base.successTitle,
  successMessage: base.successMessage,
  placeholder: false,
}
for (const key of Object.keys(schema)) if (schema[key] === undefined) delete schema[key]

// Every condition must point at a real field, and ids must be unique.
const ids = new Set(steps.flatMap((s) => s.fields.map((f) => f.id)))
const refs = (condition) => condition ? ('all' in condition ? condition.all.flatMap(refs) : 'any' in condition ? condition.any.flatMap(refs) : [condition.field]) : []
for (const s of steps) {
  for (const ref of refs(s.visibleWhen)) if (!ids.has(ref)) throw new Error(`step ${s.id} depends on unknown field ${ref}`)
  for (const f of s.fields) {
    for (const ref of refs(f.visibleWhen)) if (!ids.has(ref)) throw new Error(`${f.id} depends on unknown field ${ref}`)
    for (const rule of f.carryOver ?? []) for (const [target, source] of Object.entries(rule.copy)) if (!ids.has(target) || !ids.has(source)) throw new Error(`${f.id} carries over unknown fields ${source} → ${target}`)
  }
}

const json = JSON.stringify(schema, null, 2) + '\n'
if (process.argv.includes('--check')) {
  const current = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : ''
  if (current !== json) { console.error(`${path.relative(root, outFile)} is out of date; run node scripts/build-mortgage-future-perfect.mjs`); process.exit(1) }
  console.log(`${path.relative(root, outFile)} is up to date (${steps.length} steps, ${ids.size} fields)`)
} else {
  fs.writeFileSync(outFile, json)
  console.log(`wrote ${path.relative(root, outFile)}: ${steps.length} steps, ${ids.size} fields`)
}
