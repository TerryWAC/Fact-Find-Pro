import { test, expect } from '@playwright/test'
import { completeVisibleRequiredFields, reachReview } from '../helpers/factfind'
import { getFormSchema } from '../../src/lib/forms/registry'

const storage = 'http://127.0.0.1:45439/test/submissions'

test('long forms keep navigation in reach without hiding fields', async ({ page }) => {
  await page.goto('/f/home/preview')
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  const next = page.getByRole('button', { name: 'Continue', exact: true })
  await expect(next).toBeInViewport()
  await expect(page.getByText('Next:', { exact: false })).toContainText('Property Details')
  await next.click()
  await expect(page.locator('#client_first_name')).toBeFocused()
  await expect(page.locator('#client_first_name')).toBeInViewport()
  await completeVisibleRequiredFields(page, 'home')
  const lastQuestion = page.getByRole('combobox', { name: 'What is your marital status?', exact: true })
  await lastQuestion.scrollIntoViewIfNeeded()
  await expect(lastQuestion).toBeInViewport()
  // The action bar must not cover the final input or intercept its pointer events.
  await lastQuestion.click()
  await page.getByRole('option').first().click()
  await next.click()
  await expect(page.getByRole('heading', { name: 'Property Details', exact: true, level: 2 })).toBeFocused()
})

test('compact review keeps unanswered questions available and submits the full answers', async ({ page, request }, testInfo) => {
  await page.goto('/f/home/preview')
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  await reachReview(page, 'home')
  const submit = page.getByRole('button', { name: 'Submit FactFind', exact: true })
  await expect(submit).toBeInViewport()
  await expect(page.getByText('Not provided', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Sam', { exact: true })).toBeVisible()
  const section = page.getByRole('region', { name: 'About the Proposer', exact: true })
  const expand = section.getByRole('button', { name: 'Show unanswered questions in About the Proposer', exact: true })
  // Safari does not focus buttons on pointer clicks. Verify retained keyboard focus.
  await expand.focus()
  await expand.press('Enter')
  await expect(section.getByRole('button', { name: 'Hide unanswered questions in About the Proposer', exact: true })).toBeFocused()
  await expect(section.getByText('Not provided', { exact: true }).first()).toBeVisible()
  await section.getByRole('button', { name: 'Hide unanswered questions in About the Proposer', exact: true }).click()
  const search = page.getByRole('searchbox', { name: 'Search your answers' })
  await search.fill('Phone Number')
  await expect(section.getByText('Phone Number', { exact: true })).toBeVisible()
  await expect(section.getByText('Not provided', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await page.screenshot({ path: testInfo.outputPath('compact-review.png'), fullPage: true })
  await submit.click()
  await expect(page.getByRole('heading', { name: 'You’re all done. Thank you.' })).toBeVisible()
  const saved = (await (await request.get(storage)).json()).at(-1)
  expect(saved.p_client_name).toBe('Sam Taylor')
  expect(saved.p_submission_data.answers.client_phone).toBe('')
  expect(saved.p_submission_data.answers.client_email).toBe('client@example.test')
})

test('review search never submits the form and editing a filtered section opens the right step', async ({ page, request }, testInfo) => {
  await page.goto('/f/home/preview')
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  await reachReview(page, 'home')
  await page.screenshot({ path: testInfo.outputPath('review-overview.png') })
  const before = (await (await request.get(storage)).json()).length
  const search = page.getByRole('searchbox', { name: 'Search your answers' })
  await search.fill('Property Details')
  await search.press('Enter')
  await expect(page.getByRole('heading', { name: 'Review your answers', exact: true })).toBeVisible()
  expect((await (await request.get(storage)).json()).length).toBe(before)
  await page.getByRole('button', { name: 'Edit Property Details', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Property Details', exact: true, level: 2 })).toBeVisible()
  await page.getByRole('button', { name: 'Return to review', exact: true }).click()
  await page.getByRole('button', { name: 'Answered only', exact: true }).click()
  await expect(page.getByText('Not provided', { exact: true })).toHaveCount(0)
  await search.fill('no-such-answer-12345')
  await expect(page.getByText('No answers match this search.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await expect(search).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Answered only', exact: true })).toHaveAttribute('aria-pressed', 'false')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('validation summary links focus the selected question', async ({ page }) => {
  await page.goto('/f/home/preview')
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  const summary = page.getByRole('alert', { name: 'Answers to check' })
  await expect(summary).toBeVisible()
  await summary.getByRole('link', { name: 'Last Name', exact: true }).click()
  await expect(page.locator('#client_last_name')).toBeFocused()
})

test('server checks a changed request and lets the client correct it without losing answers', async ({ page, request }) => {
  await page.goto('/f/home/preview')
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  await reachReview(page, 'home')
  const before = (await (await request.get(storage)).json()).length
  const schema = getFormSchema('home')
  const field = schema.steps.flatMap((step) => step.fields).find((entry) => entry.type === 'yesno')!
  let intercepted = false
  await page.route('**/f/home/preview', async (route) => {
    if (route.request().method() !== 'POST' || !route.request().headers()['next-action']) return route.continue()
    const body = JSON.parse(route.request().postData()!)
    body[0].submissionData.answers[field.id] = 'not-a-listed-choice'
    intercepted = true
    await route.continue({ postData: JSON.stringify(body) })
  })
  await page.getByRole('button', { name: 'Submit FactFind', exact: true }).click()
  await expect(page.getByText('Choose a listed option', { exact: true })).toBeVisible()
  expect(intercepted).toBe(true)
  expect((await (await request.get(storage)).json()).length).toBe(before)
  await page.unroute('**/f/home/preview')
  await page.locator(`[id="${field.id}"]`).getByRole('radio', { name: 'No', exact: true }).check()
  await page.getByRole('button', { name: 'Return to review', exact: true }).click()
  await page.getByRole('button', { name: 'Submit FactFind', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'You’re all done. Thank you.' })).toBeVisible()
  const submissions = await (await request.get(storage)).json()
  expect(submissions.length).toBe(before + 1)
  expect(submissions.at(-1).p_submission_data.answers[field.id]).toBe('no')
  expect(submissions.at(-1).p_client_email).toBe('client@example.test')
})
