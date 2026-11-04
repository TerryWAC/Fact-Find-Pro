import { test, expect } from '@playwright/test'

/**
 * The one-off Version 1 retirement notice: sent from the directory in batches,
 * recorded in the email log, and never sent to the same adviser twice.
 */
test('admin sends the Version 1 retirement notice once to every prepared adviser', async ({ page }) => {
  await page.request.post('http://127.0.0.1:45439/test/reset-activation')
  await page.goto('/login?redirectTo=/admin/imports')
  await page.getByLabel('Email', { exact: false }).fill('admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('PreviewOnly!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  const panel = page.getByTestId('notice-panel')
  await expect(panel).toContainText('1 of 1 prepared adviser has not been sent the notice')
  await page.getByTestId('notice-all').click()
  await expect(page.getByRole('dialog')).toContainText('Version 1 retirement notice to 1 advisers')
  await page.getByTestId('confirm-notice-all').click()
  await expect(page.getByRole('dialog')).toContainText('Finished. 1 sent of 1.')

  // Recorded against the adviser's address with the template that was used.
  const state = await (await page.request.get('http://127.0.0.1:45439/test/email-state')).json()
  const notices = state.emailLog.filter((entry: { template_key: string }) => entry.template_key === 'v1_retirement_notice')
  expect(notices).toHaveLength(1)
  expect(notices[0].to_email).toBe('prepared@example.test')
  expect(notices[0].subject).toBe('Important Notice: Fact Find Version 1 Retiring Tomorrow – Please Switch to Version 2')

  // A second visit shows it as done and the button cannot send again.
  await page.getByRole('button', { name: 'Close and refresh' }).click()
  await expect(page.getByTestId('notice-panel')).toContainText('Every prepared adviser has been sent the notice (1 of 1)')
  await expect(page.getByTestId('notice-all')).toBeDisabled()
})
