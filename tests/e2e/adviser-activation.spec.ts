import { test, expect } from '@playwright/test'

/**
 * Activation of a prepared adviser, end to end against the isolated preview:
 * an admin issues the link, the adviser activates with it, lands signed in on
 * their dashboard, and the link cannot be used twice.
 */
test('admin invites a prepared adviser and the adviser activates with the one-time link', async ({ page, browser }, testInfo) => {
  // The desktop and mobile projects share one preview server; start from a prepared, uninvited adviser.
  await page.request.post('http://127.0.0.1:45439/test/reset-activation')
  await page.goto('/login?redirectTo=/admin/imports')
  await page.getByLabel('Email', { exact: false }).fill('admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('PreviewOnly!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  // Directory shows what is waiting and offers the bulk invite.
  const panel = page.getByTestId('activation-panel')
  await expect(panel).toContainText('1 prepared adviser has not been invited yet')
  await expect(page.getByTestId('invite-all')).toBeEnabled()
  await expect(page.getByRole('link', { name: /Morgan Prepared/ })).toContainText('Not invited')

  // Issue one link from the adviser's page.
  await page.getByRole('link', { name: /Morgan Prepared/ }).click()
  await expect(page.getByTestId('activation-card')).toContainText('No activation link has been sent')
  await page.getByTestId('invite-adviser').click()
  await expect(page.getByRole('dialog')).toContainText('prepared@example.test')
  await page.getByTestId('confirm-invite').click()
  const issued = page.getByTestId('activation-link')
  await expect(issued).toBeVisible()
  const activationUrl = (await issued.locator('p.font-mono').innerText()).trim()
  expect(activationUrl).toMatch(/^http:\/\/localhost:3008\/activate\/[A-Za-z0-9_-]{40,}$/)
  await page.reload()
  await expect(page.getByTestId('activation-card')).toContainText('Activation link sent')
  await expect(page.getByTestId('invite-adviser')).toHaveText(/Send a new activation link/)

  // The adviser opens the link in their own browser, with no admin session.
  const adviserContext = await browser.newContext()
  const adviser = await adviserContext.newPage()
  await adviser.goto(activationUrl)
  await expect(adviser.getByRole('heading', { name: 'Activate your FactFind Pro v2 account' })).toBeVisible()
  await expect(adviser.getByLabel('Full name')).toHaveValue('Morgan Prepared')
  await expect(adviser.getByLabel('Company name')).toHaveValue('Morgan Financial')
  await expect(adviser.getByLabel('Email address')).toHaveValue('prepared@example.test')
  await expect(adviser.getByAltText('Supplied adviser photo')).toBeVisible()

  // Terms are required and passwords must match before anything happens.
  await adviser.getByLabel('Password', { exact: true }).fill('Activate-Me-2026')
  await adviser.getByLabel('Confirm password').fill('Activate-Me-2027')
  await adviser.getByRole('button', { name: 'Activate my account' }).click()
  await expect(adviser.getByText('Passwords do not match')).toBeVisible()
  await expect(adviser.getByText('You must accept the terms to activate your account')).toBeVisible()

  // A rejected submission clears the password boxes, as on any sign-up form.
  await adviser.getByLabel('Password', { exact: true }).fill('Activate-Me-2026')
  await adviser.getByLabel('Confirm password').fill('Activate-Me-2026')
  await adviser.getByLabel('Business location').fill('Leeds and remote')
  await adviser.getByLabel(/Send the client a PDF copy/).check()
  await adviser.getByLabel(/I confirm I am an FCA-authorised adviser/).check()
  await adviser.screenshot({ path: testInfo.outputPath('activation-form.png'), fullPage: true, animations: 'disabled' })
  await adviser.getByRole('button', { name: 'Activate my account' }).click()

  // Signed in and live, with the four links now public.
  await adviser.waitForURL(/\/dashboard/)
  await adviser.goto('/links')
  await expect(adviser.getByText(/\/f\/mortgage\/reservedmock/)).toBeVisible()
  await expect(adviser.getByText('Active').first()).toBeVisible()

  // The link is single use.
  await adviser.goto(activationUrl)
  await expect(adviser.getByRole('heading', { name: 'This account has already been activated' })).toBeVisible()
  await adviserContext.close()

  // The admin sees the result without doing anything else.
  await page.goto('/admin/imports')
  await expect(page.getByRole('link', { name: /Morgan Prepared/ })).toContainText('Activated')
  await expect(page.getByTestId('invite-all')).toBeDisabled()
  await expect(page.getByTestId('activation-panel')).toContainText('Every prepared adviser has been sent an activation link')
})

test('bulk invite works through everyone waiting and reports the planned total throughout', async ({ page }) => {
  await page.request.post('http://127.0.0.1:45439/test/reset-activation')
  await page.goto('/login?redirectTo=/admin/imports')
  await page.getByLabel('Email', { exact: false }).fill('admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('PreviewOnly!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  await page.getByTestId('invite-all').click()
  await expect(page.getByRole('dialog')).toContainText('Email activation links to 1 advisers?')
  await page.getByTestId('confirm-invite-all').click()
  // The page revalidates mid-run; the dialog keeps the total it started with.
  await expect(page.getByRole('dialog')).toContainText('Finished. 1 sent of 1.')
  await page.getByRole('button', { name: 'Close and refresh' }).click()
  await expect(page.getByTestId('activation-panel')).toContainText('Every prepared adviser has been sent an activation link')
  await expect(page.getByRole('link', { name: /Morgan Prepared/ })).toContainText('Invited')
})

test('a malformed or unknown activation link explains itself without touching any account', async ({ page }) => {
  await page.goto('/activate/not-a-real-token')
  await expect(page.getByRole('heading', { name: 'This activation link is not valid' })).toBeVisible()
  await page.goto(`/activate/${'a'.repeat(43)}`)
  await expect(page.getByRole('heading', { name: 'This activation link is not valid' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Go to sign in' })).toBeVisible()
})
