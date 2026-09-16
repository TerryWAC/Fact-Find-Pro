import { test, expect } from '@playwright/test'

for (const scenario of [
  { name: 'failed', config: { failApproval: true }, message: /Adviser approved\. 1 email could not be sent/ },
  { name: 'disabled', config: { disabledTemplate: 'approval' }, message: /Adviser approved\. 1 email skipped/ },
  { name: 'accepted', config: {}, message: /Adviser approved\. Approval email accepted for delivery/ },
]) {
  test(`approval remains saved when notification is ${scenario.name}, with an honest outcome`, async ({ page, request }) => {
    await request.post('http://127.0.0.1:45439/test/reset-profiles')
    await request.post('http://127.0.0.1:45439/test/email-scenario', { data: scenario.config })
    await page.goto('/login?redirectTo=%2Fadmin%2Fusers%3Fstatus%3Dpending')
    await page.getByLabel('Email address', { exact: true }).fill('admin@example.test')
    await page.getByLabel('Password', { exact: true }).fill('PreviewOnly!')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.getByRole('row').filter({ hasText: 'pending@example.test' }).getByRole('button', { name: 'Approve', exact: true }).click()
    await expect(page.getByText(scenario.message)).toBeVisible()
    await page.goto('/admin/users?status=approved')
    await expect(page.getByRole('row').filter({ hasText: 'pending@example.test' })).toBeVisible()
    await expect(page.getByText('Adviser approved and notified.', { exact: true })).toHaveCount(0)
  })
}
