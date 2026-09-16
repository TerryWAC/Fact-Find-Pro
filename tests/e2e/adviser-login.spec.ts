import { test, expect } from '@playwright/test'

test('slow loading cannot discard credentials entered before hydration', async ({ page }) => {
  let releaseScripts!: () => void
  const scriptsReady = new Promise<void>((resolve) => { releaseScripts = resolve })
  await page.route('**/_next/static/**/*.js', async (route) => {
    await scriptsReady
    await route.continue()
  })
  try {
    await page.goto('/login', { waitUntil: 'commit' })
    await expect(page.getByLabel('Email address', { exact: true })).toBeDisabled()
    await expect(page.getByLabel('Password', { exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeDisabled()
  } finally {
    releaseScripts()
  }
  await page.getByLabel('Email address', { exact: true }).fill('adviser@example.test')
  await page.getByLabel('Password', { exact: true }).fill('PreviewOnly!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
})

test('adviser sign-in supports password visibility and an accessible retry', async ({ page }, testInfo) => {
  await page.goto('/login?redirectTo=/links')
  await expect(page.getByRole('heading', { name: 'Welcome back.', exact: true })).toBeVisible()
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('adviser-login.png'), fullPage: true })
  const email = page.getByRole('textbox', { name: 'Email address', exact: true })
  const password = page.getByLabel('Password', { exact: true })
  const signIn = page.getByRole('button', { name: 'Sign in', exact: true })
  await email.fill('adviser@example.test')
  await password.fill('FictionalWrongPassword!')
  await page.getByRole('button', { name: 'Show password', exact: true }).click()
  await expect(password).toHaveAttribute('type', 'text')
  await expect(page.getByRole('button', { name: 'Hide password', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Hide password', exact: true }).click()
  await expect(password).toHaveAttribute('type', 'password')
  await signIn.click()
  const error = page.getByRole('alert').filter({ hasText: 'Incorrect email or password' })
  await expect(error).toBeFocused()
  await expect(email).toHaveValue('adviser@example.test')
  await expect(password).toHaveValue('FictionalWrongPassword!')
  await password.fill('PreviewOnly!')
  await signIn.click()
  await expect(page).toHaveURL(/\/links$/)
  await page.getByRole('button', { name: 'Open account menu', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login\?redirectTo=/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('adviser sign-in focuses invalid fields and recovery stays reachable', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Email address', exact: true })).toBeFocused()
  await expect(page.getByRole('textbox', { name: 'Email address', exact: true })).toHaveAttribute('aria-describedby', 'login-email-error')
  await page.getByRole('link', { name: 'Forgot password?', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Forgot your password?', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send reset link', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Back to sign in', exact: true }).click()
  await page.getByRole('link', { name: 'Register your practice', exact: true }).click()
  await expect(page).toHaveURL(/\/signup$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
