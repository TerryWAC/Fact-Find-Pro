import { test, expect, type Page } from '@playwright/test'
import { getFormSchema } from '../../src/lib/forms/registry'

/**
 * An adviser can have the "Optional" marker left off their question cards so
 * clients are not nudged to skip questions. Required questions stay marked and
 * nothing becomes mandatory. The preview's 'focused' link belongs to such an
 * adviser; 'preview' is the default.
 */
const markers = (page: Page) => page.locator('.factfind-question-marker')

async function openApplicantPage(page: Page, slug: string) {
  await page.goto(`/f/mortgage/${slug}`)
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Applicant 1 Details' })).toBeVisible()
}

// The Applicant 1 page has no conditional questions, so its required set is fixed.
const applicantStep = getFormSchema('mortgage').steps.find((step) => step.id === 's4_applicant_1_details')!
const requiredCount = applicantStep.fields.filter((field) => field.required).length
const questionCount = applicantStep.fields.filter((field) => !['heading', 'paragraph', 'divider'].includes(field.type)).length

test('the default link marks every question Required or Optional', async ({ page }) => {
  await openApplicantPage(page, 'preview')
  await expect(markers(page).filter({ hasText: 'Required' })).toHaveCount(requiredCount)
  await expect(markers(page).filter({ hasText: 'Optional' })).toHaveCount(questionCount - requiredCount)
})

test('an adviser who hides the marker keeps Required and drops Optional without making anything mandatory', async ({ page }) => {
  await openApplicantPage(page, 'focused')
  await expect(markers(page).filter({ hasText: 'Required' })).toHaveCount(requiredCount)
  await expect(markers(page)).toHaveCount(requiredCount)
  await expect(page.getByText('Optional', { exact: true })).toHaveCount(0)
  // Only the genuinely required answers block the page, exactly as on the default link.
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Applicant 1 Details' })).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: /is required$/ })).toHaveCount(requiredCount)
})
