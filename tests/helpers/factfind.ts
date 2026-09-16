import type { Page } from '@playwright/test'
import { getFormSchema } from '../../src/lib/forms/registry'
import type { FactFindType } from '../../src/lib/supabase/database.types'

export async function completeVisibleRequiredFields(page: Page, type: FactFindType) {
  for (const field of getFormSchema(type)
    .steps.flatMap((step) => step.fields)
    .filter((field) => field.required)) {
    const input = page.locator(`[id="${field.id}"]`)
    if (!(await input.isVisible())) continue
    if (field.type === 'checkbox') await input.check()
    else if (field.type === 'radio' || field.type === 'yesno') await input.getByRole('radio').first().check()
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

export async function reachReview(page: Page, type: FactFindType) {
  for (let count = 0; count < 20; count++) {
    if (await page.getByRole('heading', { name: 'Review your answers', exact: true }).isVisible()) return
    await completeVisibleRequiredFields(page, type)
    const review = page.getByRole('button', { name: 'Review answers', exact: true })
    if (await review.isVisible()) await review.click()
    else await page.getByRole('button', { name: 'Continue', exact: true }).click()
  }
  throw new Error('Did not reach review')
}
