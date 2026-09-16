import { test, expect, type Page } from '@playwright/test'
import { getFormSchema } from '../../src/lib/forms/registry'
import type { FactFindType } from '../../src/lib/supabase/database.types'

async function completeRequired(page: Page, type: FactFindType) {
  for (const field of getFormSchema(type).steps.flatMap((step) => step.fields).filter((field) => field.required)) {
    const input = page.locator(`[id="${field.id}"]`)
    if (!(await input.isVisible())) continue
    if (field.type === 'checkbox') await input.check()
    else if (field.type === 'radio' || field.type === 'yesno') {
      if (!(await input.locator('input:checked').count())) await input.getByRole('radio').first().check()
    } else if (!(await input.inputValue())) {
      await input.fill(field.type === 'email' ? 'routing@example.test'
        : field.type === 'date' ? '2000-01-01'
        : ['number', 'currency', 'percent'].includes(field.type) ? '100' : 'Routing fixture')
    }
  }
}

async function advanceTo(page: Page, type: FactFindType, heading: string) {
  for (let count = 0; count < 20; count++) {
    if (await page.getByRole('heading', { name: heading, exact: true, level: 2 }).isVisible()) return
    await completeRequired(page, type)
    const review = page.getByRole('button', { name: 'Review answers', exact: true })
    await (await review.isVisible() ? review : page.getByRole('button', { name: 'Continue', exact: true })).click()
  }
  throw new Error(`Did not reach ${heading}`)
}

async function answer(page: Page, id: string, label: string) {
  await page.locator(`[id="${id}"]`).getByRole('radio', { name: label, exact: true }).check()
}

test('mortgage: switching property and credit routes removes stale answers from review and submission', async ({ page, request }) => {
  await page.goto('/f/mortgage/preview')
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  await advanceTo(page, 'mortgage', 'Monthly Expenditure')
  await answer(page, 'has_ccj', 'Yes')
  await page.locator('#ccj_company_name').fill('STALE-CCJ-COMPANY')
  await answer(page, 'has_bankruptcy', 'Yes')
  await page.locator('#bk_date_of_bankruptcy_and_discharge').fill('STALE-BANKRUPTCY-DATE')
  await answer(page, 'has_ccj', 'No')
  await expect(page.locator('#ccj_company_name')).toHaveCount(0)
  await expect(page.locator('#bk_date_of_bankruptcy_and_discharge')).toBeVisible()
  await answer(page, 'has_bankruptcy', 'No')
  await expect(page.locator('#bk_date_of_bankruptcy_and_discharge')).toHaveCount(0)

  await advanceTo(page, 'mortgage', 'Mortgage Info')
  await answer(page, 'mortgage_type', 'Purchase')
  await page.locator('#purchase_source_of_deposit').fill('STALE-PURCHASE-DEPOSIT')
  await answer(page, 'mortgage_type', 'Remortgage')
  await expect(page.locator('#purchase_source_of_deposit')).toHaveCount(0)
  await page.locator('#remortgage_address_of_the_mortgage_property').fill('KEPT-REMORTGAGE-ADDRESS')
  await answer(page, 'has_btl', 'Yes')
  await page.locator('#btl_count').click()
  await page.getByRole('option', { name: '3', exact: true }).click()
  await page.locator('#btl3_address_of_the_mortgage_property').fill('STALE-THIRD-PROPERTY')
  await page.locator('#btl_count').click()
  await page.getByRole('option', { name: '1', exact: true }).click()
  await expect(page.locator('#btl3_address_of_the_mortgage_property')).toHaveCount(0)
  await expect(page.locator('#btl2_address_of_the_mortgage_property')).toHaveCount(0)
  await expect(page.locator('#btl1_address_of_the_mortgage_property')).toBeVisible()
  await answer(page, 'has_btl', 'No')
  await expect(page.locator('#btl_count')).toHaveCount(0)
  await expect(page.locator('#btl1_address_of_the_mortgage_property')).toHaveCount(0)
  await advanceTo(page, 'mortgage', 'Review your answers')
  await expect(page.getByText('KEPT-REMORTGAGE-ADDRESS', { exact: true })).toBeVisible()
  await expect(page.getByText(/STALE-/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Submit FactFind', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'You’re all done. Thank you.' })).toBeVisible()
  const submissions = await (await request.get('http://127.0.0.1:45439/test/submissions')).json()
  const payload = submissions.at(-1).p_submission_data
  expect(payload.answers.remortgage_address_of_the_mortgage_property).toBe('KEPT-REMORTGAGE-ADDRESS')
  expect(Object.keys(payload.answers).filter((id) => /^(purchase_|ccj_|bk_|btl)/.test(id))).toEqual([])
})

test('medical: edited Yes answers disappear; GP details remain reachable after No abroad', async ({ page, request }) => {
  await page.goto('/f/medical/preview')
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  await advanceTo(page, 'medical', 'Client Lifestyle')
  const smoke = 'lifestyle_do_you_currently_smoke'
  const drugs = 'lifestyle_do_you_use_recreational_drugs'
  await answer(page, smoke, 'Yes')
  await page.locator(`#${smoke}_details`).fill('STALE-SMOKING-DETAILS')
  await answer(page, drugs, 'Yes')
  await page.locator(`#${drugs}_details`).fill('EDIT-THIS-DETAIL')
  await answer(page, smoke, 'No')
  await expect(page.locator(`#${smoke}_details`)).toHaveCount(0)
  await expect(page.locator(`#${drugs}_details`)).toBeVisible()
  await advanceTo(page, 'medical', 'Family Health')
  await answer(page, 'family_parents_alive', 'One Deceased')
  await page.locator('#family_if_no_at_what_age_did_they_pass_away').fill('STALE-PARENT-DETAILS')
  await answer(page, 'family_parents_alive', 'Yes')
  await expect(page.locator('#family_if_no_at_what_age_did_they_pass_away')).toHaveCount(0)
  await advanceTo(page, 'medical', 'Your Health Continued (Last 5 Years)')
  const abroad = 'health5_in_the_last_five_years_have_you_spent_more_than'
  await answer(page, abroad, 'Yes')
  await page.locator(`#${abroad}_details`).fill('STALE-TRAVEL-DETAILS')
  await answer(page, abroad, 'No')
  await expect(page.locator(`#${abroad}_details`)).toHaveCount(0)
  await advanceTo(page, 'medical', 'GP info')
  await advanceTo(page, 'medical', 'Review your answers')
  await expect(page.getByText('EDIT-THIS-DETAIL', { exact: true })).toBeVisible()
  await expect(page.getByText(/STALE-/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Edit Client Lifestyle', exact: true }).click()
  await answer(page, drugs, 'No')
  await page.getByRole('button', { name: 'Return to review', exact: true }).click()
  await expect(page.getByText('EDIT-THIS-DETAIL', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Submit FactFind', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'You’re all done. Thank you.' })).toBeVisible()
  const submissions = await (await request.get('http://127.0.0.1:45439/test/submissions')).json()
  const payload = submissions.at(-1).p_submission_data
  expect(payload.steps.some((step: { title: string }) => step.title === 'GP info')).toBe(true)
  for (const id of [`${smoke}_details`, `${drugs}_details`, `${abroad}_details`, 'family_if_no_at_what_age_did_they_pass_away'])
    expect(payload.answers).not.toHaveProperty(id)
})
