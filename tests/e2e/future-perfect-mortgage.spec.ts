import { test, expect, type Page } from '@playwright/test'

/**
 * The bespoke Mortgage FactFind served only by a link whose variant is
 * 'future_perfect'. Walks a purchase with a connected sale through every
 * changed section and checks the submission records the variant's version.
 */
const yesNo = (page: Page, question: string | RegExp, answer: 'Yes' | 'No' | 'Not known') =>
  page.getByRole('radiogroup', { name: question }).getByLabel(answer, { exact: true }).check()
const section = (page: Page) => page.getByRole('heading', { level: 2, name: /.+/ }).first()
const next = async (page: Page) => page.getByRole('button', { name: /^(Continue|Review answers)$/ }).click()

test('the Future Perfect mortgage link serves the bespoke question set end to end', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/f/mortgage/bespoke')
  await page.getByRole('button', { name: 'Start your FactFind' }).click()

  // Section 1: a client never sees the internal details page.
  await expect(section(page)).toHaveText('Introduction')
  await next(page)
  await expect(section(page)).toHaveText('Applicant 1 Details')
  await expect(page.getByLabel('Nationality')).toBeVisible()
  await expect(page.getByText('Were you born in the UK?')).toHaveCount(0)
  await page.getByLabel('Full Name').fill('Jo Client')
  // Required labels carry a visual asterisk, so match the control's accessible name.
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('jo@example.test')
  await yesNo(page, 'Is this a joint case?', 'No')
  await next(page)

  await expect(section(page)).toHaveText('Children and Dependants')
  await yesNo(page, 'Do you have any children or other dependants?', 'Yes')
  await expect(page.getByLabel('Dependant’s date of birth')).toBeVisible()
  await expect(page.getByText(/gender/i)).toHaveCount(0)
  await next(page)

  await expect(section(page)).toHaveText('Employment Info')
  await next(page)

  // No Monthly Expenditure page: loans come next, details before the extra box.
  await expect(section(page)).toHaveText('Loans')
  await yesNo(page, 'Do you have any loans?', 'Yes')
  await expect(page.getByLabel('Loan 1 Company name')).toBeVisible()
  await expect(page.getByLabel(/additional loans or credit/)).toBeVisible()
  const loanIds = await page.locator('.factfind-fields [id^="loan1_"], .factfind-fields [id="additional_loans_details"]').evaluateAll((nodes) => nodes.map((node) => node.id))
  expect(loanIds.indexOf('loan1_company_name')).toBeLessThan(loanIds.indexOf('additional_loans_details'))
  await next(page)

  await expect(section(page)).toHaveText('Credit Cards')
  await yesNo(page, 'Do you have a credit card(s) or store card(s)?', 'Yes')
  await expect(page.getByLabel('Further cards or additional information')).toBeVisible()
  await next(page)

  await expect(section(page)).toHaveText('Credit Issues')
  await expect(page.getByText(/CCJ|bankrupt/i)).toHaveCount(0)
  await yesNo(page, 'Are there any credit issues?', 'Yes')
  await page.getByLabel('Please provide details of all credit issues.').fill('One missed payment in 2022, since cleared.')
  await next(page)

  // Existing properties before purchase/remortgage.
  await expect(section(page)).toHaveText('Existing Properties')
  await yesNo(page, 'Do you own any properties?', 'Yes')
  await page.getByLabel('Address', { exact: true }).fill('1 High Street, Solihull')
  await page.getByLabel('Estimated value').fill('350000')
  await page.getByLabel('Mortgage outstanding').fill('120000')
  await page.getByLabel('Current lender').fill('Halifax')
  await yesNo(page, 'Is this property a buy-to-let?', 'Yes')
  await page.getByLabel('Rental income (monthly)').fill('1200')
  await yesNo(page, 'Do you own any other additional properties?', 'No')
  await page.screenshot({ path: test.info().outputPath('existing-properties.png'), fullPage: true, animations: 'disabled' })
  await next(page)

  await expect(section(page)).toHaveText('Purchase or Remortgage')
  await page.getByRole('radiogroup', { name: 'Is this a purchase or a remortgage?' }).getByLabel('Purchase').check()
  await expect(page.getByLabel(/How much surplus income would you like/)).toBeVisible()
  await expect(page.getByText(/budget/i)).toHaveCount(0)
  await expect(page.getByLabel('Other Mortgage Details')).toBeVisible()
  await yesNo(page, 'Is there a sale connected to the purchase?', 'Yes')
  await next(page)

  // The sale page carries Property 1 across and lets the client amend it.
  await expect(section(page)).toHaveText('Sale of Existing Property')
  await page.getByRole('radiogroup', { name: 'Which property is being sold?' }).getByLabel(/Property 1, entered earlier/).check()
  await expect(page.getByLabel('Property address')).toHaveValue('1 High Street, Solihull')
  await expect(page.getByLabel('Current lender')).toHaveValue('Halifax')
  await expect(page.getByLabel('Estimated value')).toHaveValue('350000')
  await page.getByLabel('Property address').fill('1 High Street, Solihull B91 1AA')
  await page.getByRole('radiogroup', { name: 'Are there any early repayment charges?' }).getByLabel('Not known', { exact: true }).check()
  await expect(page.getByLabel('Sale notes')).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('sale-page.png'), fullPage: true, animations: 'disabled' })
  await next(page)

  await expect(section(page)).toHaveText('Solicitor')
  await yesNo(page, 'Do you have a solicitor?', 'No')
  await expect(page.getByLabel('Solicitor recommendation notes')).toBeVisible()
  await next(page)

  await expect(section(page)).toHaveText('Plans and Future Changes')
  await next(page)

  await expect(section(page)).toHaveText('Sick Pay Info')
  await page.getByRole('radiogroup', { name: 'Do you receive any sick pay?' }).getByLabel('Not known', { exact: true }).check()
  await next(page)

  await expect(section(page)).toHaveText('Other Employment Benefits')
  await next(page)

  await expect(section(page)).toHaveText('Current Protection')
  await yesNo(page, 'Do you have any pensions, investments or savings?', 'Yes')
  await expect(page.getByLabel('Pensions, Investments and Savings — Details')).toBeVisible()
  await next(page)

  await expect(section(page)).toHaveText('General Insurance')
  await page.getByLabel('Current general insurance provider').fill('Not known')
  await next(page)

  await expect(section(page)).toHaveText('Additional Services')
  await page.getByLabel(/Please ensure that all information you have provided/).check()
  await next(page)

  // Review: no expenditure or admin sections anywhere, then send.
  await expect(section(page)).toHaveText('Review your answers')
  await expect(page.getByText('Monthly Expenditure')).toHaveCount(0)
  await expect(page.getByText('Admin Notes')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Credit Issues' })).toBeVisible()
  await page.getByRole('button', { name: 'Submit FactFind' }).click()
  await expect(page.getByRole('heading', { name: 'You’re all done. Thank you.' })).toBeVisible()

  const submissions = await (await page.request.get('http://127.0.0.1:45439/test/submissions')).json()
  const last = submissions.at(-1)
  expect(last.p_slug).toBe('bespoke')
  expect(last.p_submission_data.schema_version).toBe('2026.11-future-perfect.1')
  expect(last.p_submission_data.answers.sale_address).toBe('1 High Street, Solihull B91 1AA')
  expect(last.p_submission_data.answers.sale_property_source).toBe('property_1')
  expect(last.p_submission_data.answers.credit_issues_details).toBe('One missed payment in 2022, since cleared.')
  expect(last.p_submission_data.steps.map((step: { id: string }) => step.id)).not.toContain('s2_internal_details')
})

test('the standard mortgage link is untouched by the variant', async ({ page }) => {
  await page.goto('/f/mortgage/preview')
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  await next(page)
  await expect(section(page)).toHaveText('Applicant 1 Details')
  await expect(page.getByText('Were you born in the UK?')).toBeVisible()
})
