import { test, expect, type Page } from '@playwright/test'
import { getFormSchema } from '../../src/lib/forms/registry'
import type { FactFindType } from '../../src/lib/supabase/database.types'

const mockUrl = 'http://127.0.0.1:45439'

async function completeVisibleRequiredFields(page: Page, type: FactFindType) {
  for (const field of getFormSchema(type)
    .steps.flatMap((step) => step.fields)
    .filter((field) => field.required)) {
    const input = page.locator(`[id="${field.id}"]`)
    if (!(await input.isVisible())) continue
    if (field.type === 'checkbox') await input.check()
    else if (field.type === 'radio' || field.type === 'yesno')
      await input.getByRole('radio').first().check()
    else
      await input.fill(
        field.type === 'email'
          ? 'client@example.test'
          : field.type === 'date'
            ? '2020-01-02'
            : field.identity === 'client_last_name'
              ? 'Taylor'
              : 'Sam',
      )
  }
}

async function reachReview(page: Page, type: FactFindType) {
  for (let count = 0; count < 20; count++) {
    if (await page.getByRole('heading', { name: 'Review your answers', exact: true }).isVisible())
      return
    await completeVisibleRequiredFields(page, type)
    const review = page.getByRole('button', { name: 'Review answers', exact: true })
    if (await review.isVisible()) await review.click()
    else await page.getByRole('button', { name: 'Continue', exact: true }).click()
  }
  throw new Error('Did not reach review')
}

for (const type of ['home', 'medical', 'protection', 'mortgage'] as const) {
  test(`${type}: welcome, review, edit and submit`, async ({ page, request }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`/f/${type}/preview`)
    await expect(page.getByRole('heading', { name: 'Good advice starts with you.' })).toBeVisible()
    await expect(page.getByText('Alex Morgan', { exact: true })).toBeVisible()
    const before = (await (await request.get(`${mockUrl}/test/submissions`)).json()).length
    await page.screenshot({ path: testInfo.outputPath(`${type}-welcome.png`), fullPage: true })
    await page.getByRole('button', { name: 'Start your FactFind' }).click()
    await reachReview(page, type)
    expect((await (await request.get(`${mockUrl}/test/submissions`)).json()).length).toBe(before)
    await expect(page.getByRole('button', { name: 'Submit FactFind' })).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath(`${type}-review.png`), fullPage: true })
    const identityStep = getFormSchema(type).steps.find((step) =>
      step.fields.some((field) => field.identity === 'client_email'),
    )!
    await page.getByRole('button', { name: `Edit ${identityStep.title}`, exact: true }).click()
    const nameField = identityStep.fields.find((field) =>
      ['client_name', 'client_first_name'].includes(field.identity ?? ''),
    )!
    await page.locator(`[id="${nameField.id}"]`).fill('Robin')
    await page.getByRole('button', { name: 'Return to review' }).click()
    await expect(page.getByText('Robin', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Submit FactFind' }).click()
    await expect(page.getByRole('heading', { name: 'You’re all done. Thank you.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'You’re all done. Thank you.' })).toBeFocused()
    await expect(page.getByRole('button', { name: 'Copy reference' })).toBeVisible()
    const submissions = await (await request.get(`${mockUrl}/test/submissions`)).json()
    expect(submissions.length).toBe(before + 1)
    expect(submissions.at(-1).p_client_name).toContain('Robin')
    await page.screenshot({ path: testInfo.outputPath(`${type}-success.png`), fullPage: true })
    expect(errors).toEqual([])
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  })
}

test('required-field focus, navigation preserves answers, failed send can be retried', async ({
  page,
  request,
}) => {
  await page.goto('/f/home/preview')
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'First Name', exact: true })).toBeFocused()
  await expect(page.getByText('First Name is required', { exact: true })).toBeVisible()
  await completeVisibleRequiredFields(page, 'home')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'First Name', exact: true })).toHaveValue('Sam')
  await reachReview(page, 'home')
  await request.post(`${mockUrl}/test/fail-next`)
  await page.getByRole('button', { name: 'Submit FactFind' }).click()
  await expect(
    page.getByText('We could not submit your FactFind. Please try again in a moment.'),
  ).toBeVisible()
  await expect(page.getByText('Sam', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Submit FactFind' }).click()
  await expect(page.getByRole('heading', { name: 'You’re all done. Thank you.' })).toBeVisible()
})

test('custom branding and dark theme stay within a narrow viewport', async ({ page }, testInfo) => {
  await page.goto('/f/home/violet')
  await expect(page.locator('[data-brand="custom"]')).toBeVisible()
  await page.getByRole('button', { name: /theme/i }).click()
  await page.getByRole('menuitem', { name: 'Dark', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.screenshot({ path: testInfo.outputPath('branded-welcome.png'), fullPage: true })
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  await expect(page.getByRole('heading', { name: 'About the Proposer', exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('branded-form.png'), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})

test('inactive link offers a clear next step', async ({ page }) => {
  await page.goto('/f/home/inactive')
  await expect(page.getByRole('button', { name: 'Start your FactFind' })).toHaveCount(0)
  await expect(page.getByText(/check with your adviser/i)).toBeVisible()
})

test('changing a joint application hides the second applicant from review and submission', async ({
  page,
  request,
}) => {
  await page.goto('/f/mortgage/preview')
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page
    .getByRole('radiogroup', { name: 'Is this a joint case?' })
    .getByRole('radio', { name: 'Yes', exact: true })
    .check()
  await completeVisibleRequiredFields(page, 'mortgage')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Applicant 2 Details', exact: true, level: 2 }),
  ).toBeVisible()
  await completeVisibleRequiredFields(page, 'mortgage')
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page
    .getByRole('radiogroup', { name: 'Is this a joint case?' })
    .getByRole('radio', { name: 'No', exact: true })
    .check()
  await reachReview(page, 'mortgage')
  await expect(
    page.getByRole('button', { name: 'Edit Applicant 2 Details', exact: true }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Submit FactFind' }).click()
  await expect(page.getByRole('heading', { name: 'You’re all done. Thank you.' })).toBeVisible()
  const submissions = await (await request.get(`${mockUrl}/test/submissions`)).json()
  expect(
    submissions
      .at(-1)
      .p_submission_data.steps.some(
        (step: { title: string }) => step.title === 'Applicant 2 Details',
      ),
  ).toBe(false)
})
