import { test, expect, type Page } from '@playwright/test'

/**
 * An admin can replace an approved adviser's logo from the user directory.
 * The upload lands in the adviser's own branding folder, the profile points
 * at it, and the adviser's public FactFind pages show it straight away.
 */
const mock = 'http://127.0.0.1:45439'
// A 1×1 transparent PNG.
const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

async function admin(page: Page, path: string) {
  await page.goto(`/login?redirectTo=${encodeURIComponent(path)}`)
  await page.getByLabel('Email address', { exact: true }).fill('admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('PreviewOnly!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(path.split('?')[0]))
}

test.beforeEach(async ({ request }) => { await request.post(`${mock}/test/reset-profiles`) })

test('admin replaces an adviser logo and the public link shows it', async ({ page }) => {
  await admin(page, '/admin/users?q=adviser%40example.test')
  const row = page.getByRole('row').filter({ hasText: 'Alex Morgan' })
  await row.getByRole('button', { name: 'More actions' }).click()
  await page.getByRole('menuitem', { name: 'Replace logo' }).click()

  await expect(page.getByRole('heading', { name: 'Replace Alex Morgan’s logo' })).toBeVisible()
  const save = page.getByRole('button', { name: 'Save logo' })
  await expect(save).toBeDisabled()
  await page.locator('#brand-image-file').setInputFiles({ name: 'new-logo.png', mimeType: 'image/png', buffer: tinyPng })
  await expect(page.getByTestId('brand-image-preview')).toBeVisible()
  await save.click()
  await expect(page.getByText('Logo updated for Alex Morgan.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Replace Alex Morgan’s logo' })).toHaveCount(0)

  await page.goto('/f/mortgage/preview')
  const logo = page.getByTestId('adviser-logo')
  await expect(logo).toBeVisible()
  await expect(logo).toHaveAttribute('src', /\/storage\/v1\/object\/public\/branding\/00000000-0000-4000-8000-000000000004\/logo-\d+\.png$/)
})

test('the dialog refuses a file that is not an image', async ({ page }) => {
  await admin(page, '/admin/users?q=adviser%40example.test')
  await page.getByRole('row').filter({ hasText: 'Alex Morgan' }).getByRole('button', { name: 'More actions' }).click()
  await page.getByRole('menuitem', { name: 'Replace photo' }).click()
  await page.locator('#brand-image-file').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') })
  await page.getByRole('button', { name: 'Save photo' }).click()
  await expect(page.getByText('Use a PNG, JPG, WEBP or SVG image.')).toBeVisible()
})
