import { expect, type Page } from '@playwright/test'
import { getFormSchema } from '../../src/lib/forms/registry'
import { isPresentational, type FormField, type FormValues } from '../../src/lib/forms/types'
import type { FactFindType } from '../../src/lib/supabase/database.types'

function sample(field: FormField): string | boolean | string[] {
  if (field.type === 'checkbox') return true
  if (field.type === 'yesno') return 'no'
  if (field.type === 'checkbox-group') return [field.options![0].value]
  if (field.options) return field.options[0].value
  if (field.type === 'email') return 'client@example.test'
  if (field.type === 'date') return '1990-03-14'
  if (field.type === 'currency') return '1250.75'
  if (field.type === 'percent') return '4.25'
  if (field.type === 'number') return /year.*build|year_built/.test(field.id) ? '1995' : '3'
  if (field.type === 'tel') return '01632960123'
  if (field.type === 'textarea') return 'Fictional information for testing the completed FactFind. No real application or recommendation.'
  if (/address/.test(field.id)) return '1 Fictional Example Road, London, EX1 1AA'
  return 'Fictional test detail'
}

/** Rich, fictional fixtures exercise optional answers as well as mandatory fields. */
export function detailedValues(type: FactFindType): FormValues {
  const fields = getFormSchema(type).steps.flatMap((step) => step.fields).filter((field) => !isPresentational(field))
  return {
    ...Object.fromEntries(fields.map((field) => [field.id, sample(field)])),
    client_name: 'Sam Taylor', client_first_name: 'Sam', client_last_name: 'Taylor',
    client_email: 'client@example.test', a1_title: 'Mr', a2_title: 'Ms', a2_full_name: 'Jordan Example',
    a2_email: 'fictional.joint.applicant.with.a.long.address@example.test',
    who_completing: type === 'mortgage' ? 'adviser' : 'client',
    adviser_name: 'PRIVATE-ADVISER-ENTRY', if_other_please_specify_source_details: 'PRIVATE-CLIENT-SOURCE',
    admin_additional_internal_notes: 'PRIVATE-INTERNAL-NOTE',
    joint_case: 'yes', has_dependants: 'yes', dep_child_name: 'Charlie Example',
    dep_child_date_of_birth_dd_mm_yyyy: '2016-08-21',
    a1_emp_status: 'employed', a2_emp_applicant_2_employment_status: 'self_employed',
    a1_pay_applicant_1_gross_annual_pay: '48000', a2_pay_applicant_2_gross_annual_pay: '36000',
    a2_pay_applicant_2_net_monthly_pay: '2400.55',
    sp2_if_yes_how_much_sick_pay_do_you_receive: '750.25',
    pension_has_will: 'no', pension_do_you_understand_the_consequences_if_you_don_t: 'yes',
    mortgage_type: 'purchase', has_ccj: 'no', has_bankruptcy: 'yes',
    bk_date_of_bankruptcy_and_discharge: 'PUBLIC-BANKRUPTCY-DETAILS: fictional discharge in 2020',
    bk_is_it_spent: 'yes', has_btl: 'yes', btl_count: '3',
    btl3_btl_3_monthly_rental_income_received: '987.65',
    is_there_anything_specific_that_you_would_like_y: ('Fictional client notes to verify that a long answer remains readable across PDF pages. '.repeat(20)) + 'PUBLIC-LONG-NOTE-END',
    lifestyle_do_you_currently_smoke: 'no', lifestyle_do_you_use_recreational_drugs: 'no',
    family_before_age_66_have_any_of_your_parents_or_siblin: 'yes', family_parents_alive: 'one_deceased',
    health_have_you_ever_had_or_do_you_currently_have_any_o: 'yes',
    health5_have_you_visited_your_gp_hospital_or_clinic_for: 'yes',
    health5_have_you_been_prescribed_medication_or_treatment: 'yes',
    health5_have_you_been_asked_to_attend_a_follow_up_or_reg: 'yes',
    health5_in_the_last_five_years_have_you_spent_more_than: 'no',
    gp_what_is_your_gp_s_name: 'Dr Fictional Example',
    history_of_flooding_yes_no: 'yes', history_of_subsidence_yes_no: 'no',
    is_the_property_left_unoccupied_for_more_than_30: 'yes', alarm_systems_present: 'yes',
    what_is_the_total_sum_insured_for_buildings: '475000', what_is_the_contents_sum_insured: '65000',
    do_you_require_accidental_damage_cover: 'no', have_you_made_any_home_insurance_claims_in_the_p: 'yes',
  }
}

export async function completeDetailedFactFind(page: Page, type: FactFindType) {
  const values = detailedValues(type)
  for (let count = 0; count < 20; count++) {
    if (await page.getByRole('heading', { name: 'Review your answers', exact: true }).isVisible()) return values
    const title = await page.getByRole('heading', { level: 2 }).innerText()
    const step = getFormSchema(type).steps.find((entry) => entry.title === title)
    expect(step, `Known section: ${title}`).toBeTruthy()
    for (const field of step!.fields.filter((entry) => !isPresentational(entry))) {
      const input = page.locator(`[id="${field.id}"]`)
      if (!(await input.isVisible())) continue
      const value = values[field.id]
      if (field.type === 'checkbox') await input.check()
      else if (field.type === 'yesno' || field.type === 'radio')
        await input.locator(`input[value="${value}"]`).check()
      else if (field.type === 'select') {
        await input.click()
        await page.getByRole('option', { name: field.options!.find((option) => option.value === value)!.label, exact: true }).click()
      } else if (field.type === 'checkbox-group') await input.getByRole('checkbox').first().check()
      else await input.fill(String(value))
    }
    const review = page.getByRole('button', { name: 'Review answers', exact: true })
    await (await review.isVisible() ? review : page.getByRole('button', { name: 'Continue', exact: true })).click()
    await expect(page.getByRole('alert', { name: 'Answers to check' })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  throw new Error(`Did not finish the ${type} fixture`)
}
