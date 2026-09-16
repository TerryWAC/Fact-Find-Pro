import { test, expect } from '@playwright/test'
import { getFormSchema } from '../../src/lib/forms/registry'
import { completeVisibleRequiredFields } from '../helpers/factfind'

test('firm identity, app manifest and form controls fit the device', async ({ page, request }, testInfo) => {
  await page.goto('/f/home/violet')
  await expect(page).toHaveTitle('Home FactFind · Morgan Financial')
  await expect(page.getByTestId('firm-name')).toHaveText('Morgan Financial')
  await expect(page.locator('footer')).not.toContainText(/FactFind Pro|Wealthy Advis[eo]rs Club/)
  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute('href')
  const response = await request.get(manifestUrl!)
  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toContain('no-store')
  const manifest = await response.json()
  expect(manifest.name).toBe('Morgan Financial')
  expect(manifest.start_url).toBe('/f/home/violet')
  const icon = await request.get(manifest.icons[0].src)
  expect(icon.headers()['content-type']).toContain('image/png')
  expect((await icon.body()).length).toBeGreaterThan(500)
  expect((await request.get('/f/home/inactive/manifest.webmanifest')).status()).toBe(404)
  expect((await request.get('/manifest.webmanifest')).status()).toBe(200)
  expect((await request.get('/app-icon?size=512')).headers()['content-type']).toContain('image/png')
  await page.getByRole('button', { name: 'Add to home screen' }).click()
  await expect(page.getByRole('dialog')).toContainText('iPhone or iPad')
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  await page.getByRole('textbox', { name: 'First Name', exact: true }).fill('Sam')
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeInViewport()
  expect(await page.getByRole('textbox', { name: 'First Name', exact: true }).evaluate((input) => parseFloat(getComputedStyle(input).fontSize))).toBeGreaterThanOrEqual(16)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('branded-form.png'), fullPage: true })
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('branded-controls.png') })
})

test('settings, live email preview and navigation fit the device', async ({ page }, testInfo) => {
  await page.goto('/login?redirectTo=/settings')
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('adviser-login.png'), fullPage: true })
  await page.getByLabel('Email', { exact: false }).fill('adviser@example.test')
  await page.getByLabel('Password', { exact: true }).fill('PreviewOnly!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/settings$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Gold', exact: true }).click()
  await page.getByRole('button', { name: 'Preview client email' }).click()
  const email = page.frameLocator('iframe[title="Client email preview"]')
  await expect(email.getByRole('heading', { name: 'Your Mortgage FactFind', exact: true })).toBeVisible()
  await expect(email.locator('body')).toContainText('Morgan Financial')
  await expect(email.locator('body')).not.toContainText('Wealthy Advisers Club')
  expect(await email.locator('body').evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true)
  expect(await email.locator('.email-pad').first().evaluate((cell) => getComputedStyle(cell).backgroundColor)).toBe('rgb(229, 180, 92)')
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('email-preview.png'), fullPage: true })
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  const nav = page.getByRole('button', { name: 'Open navigation' })
  if (await nav.isVisible()) {
    await nav.click()
    await page.getByRole('dialog').getByRole('link', { name: 'Dashboard', exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
})

test('all four forms keep Yes/No choices together with usable touch and keyboard targets', async ({ page }, testInfo) => {
  for (const type of ['mortgage', 'protection', 'medical', 'home'] as const) {
    await page.goto(`/f/${type}/violet`)
    await page.getByRole('button', { name: 'Start your FactFind' }).click()
    let checked = false
    const choices = getFormSchema(type).steps.flatMap((step) => step.fields).filter((field) =>
      field.type === 'yesno' || (field.type === 'radio' && field.options?.length === 2 && field.options.every((option) => /^(yes|no)$/i.test(option.label))),
    )
    for (let step = 0; step < 6 && !checked; step++) {
      for (const field of choices) {
        const group = page.locator(`[id="${field.id}"]`)
        if (!(await group.isVisible())) continue
        await group.scrollIntoViewIfNeeded()
        const yes = group.getByRole('radio', { name: 'Yes', exact: true })
        const no = group.getByRole('radio', { name: 'No', exact: true })
        const targets = await group.locator('label').evaluateAll((labels) => labels.map((label) => {
          const { width, height, top } = label.getBoundingClientRect()
          return { width, height, top }
        }))
        expect(targets).toHaveLength(2)
        expect(targets[0].top).toBe(targets[1].top)
        expect(targets.every((target) => target.width >= 44 && target.height >= 44)).toBe(true)
        await yes.check()
        await yes.press('ArrowRight')
        await expect(no).toBeChecked()
        await expect(no).toBeFocused()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        await page.screenshot({ path: testInfo.outputPath(`${type}-choices.png`) })
        checked = true
        break
      }
      if (!checked) {
        await completeVisibleRequiredFields(page, type)
        await page.getByRole('button', { name: 'Continue', exact: true }).click()
      }
    }
    expect(checked, `${type} Yes/No controls reached`).toBe(true)
  }
})
