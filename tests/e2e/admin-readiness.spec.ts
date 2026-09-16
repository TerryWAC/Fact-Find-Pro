import { test, expect, type Page } from '@playwright/test'

const mock = 'http://127.0.0.1:45439'
async function admin(page: Page, path = '/admin') {
  await page.goto(`/login?redirectTo=${encodeURIComponent(path)}`)
  await page.getByLabel('Email address', { exact: true }).fill('admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('PreviewOnly!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(path.split('?')[0]))
}

test.beforeEach(async ({ request }) => { await request.post(`${mock}/test/reset-profiles`) })

test('admin searches handle firm punctuation and recover a stale page', async ({ page }) => {
  await admin(page, '/admin/users?q=Audit%20Firm%2C%20North%20%28UK%29&page=99')
  await expect(page.getByRole('row').filter({ hasText: 'pending@example.test' })).toBeVisible()
  await expect(page.getByText('No users found', { exact: true })).toHaveCount(0)
})

test('admin outages show unavailable states and retry instead of empty results', async ({ page, request }) => {
  await admin(page)
  await request.post(`${mock}/test/submission-read-error`, { data: { enabled: true } })
  await request.post(`${mock}/test/admin-read-error`, { data: { enabled: true } })
  try {
    await page.reload()
    await expect(page.getByRole('link').filter({ hasText: 'Total submissions' })).toContainText('—')
    await expect(page.getByText('All caught up', { exact: true })).toHaveCount(0)
    for (const text of ['Submissions could not be loaded', 'Registrations could not be loaded', 'Activity could not be loaded']) await expect(page.getByText(text, { exact: true })).toBeVisible()
    await expect(page.getByText('No submissions yet', { exact: true })).toHaveCount(0)
    await page.goto('/admin/users?q=Audit')
    await expect(page.getByText('Users could not be loaded', { exact: true })).toBeVisible()
    await expect(page.getByText('No users found', { exact: true })).toHaveCount(0)
    await request.post(`${mock}/test/admin-read-error`, { data: { enabled: false } })
    await page.getByRole('button', { name: 'Try again', exact: true }).click()
    await expect(page.getByRole('row').filter({ hasText: 'pending@example.test' })).toBeVisible()
    await expect(page).toHaveURL(/q=Audit/)
  } finally {
    await request.post(`${mock}/test/submission-read-error`, { data: { enabled: false } })
    await request.post(`${mock}/test/admin-read-error`, { data: { enabled: false } })
  }
})

test('approval is saved but log-only notification is reported honestly and can be retried', async ({ page }) => {
  await admin(page, '/admin/users?status=pending')
  const row = page.getByRole('row').filter({ hasText: 'pending@example.test' })
  await row.getByRole('button', { name: 'Approve', exact: true }).click()
  await expect(page.getByText(/Adviser approved\. 1 email logged only/)).toBeVisible()
  await expect(page.getByText('Adviser approved and notified.', { exact: true })).toHaveCount(0)
  await page.goto('/admin/users?status=approved')
  const approved = page.getByRole('row').filter({ hasText: 'pending@example.test' })
  await expect(approved).toBeVisible()
  await approved.getByRole('button').last().click()
  await page.getByRole('menuitem', { name: 'Resend approval email', exact: true }).click()
  await expect(page.getByText(/^1 email logged only/)).toBeVisible()
})

test('policies are readable before signup and do not discard registration details', async ({ page, context }) => {
  await page.goto('/signup')
  await page.getByLabel('Full name', { exact: true }).fill('Fictional adviser')
  for (const [name, heading] of [['FactFind Pro terms of use', 'Terms of use'], ['privacy notice', 'Privacy notice']]) {
    const newPage = context.waitForEvent('page')
    await page.getByRole('link', { name, exact: true }).click()
    const policy = await newPage
    await expect(policy.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    expect(await policy.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await policy.close()
  }
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Fictional adviser')
  await admin(page, '/settings')
  await page.getByRole('link', { name: 'Manage colleagues', exact: true }).click()
  await expect(page.getByText(/does not create a login, client links or access/)).toBeVisible()
})

test('direct database submissions are denied before reaching saved data', async ({ request }) => {
  const before = await (await request.get(`${mock}/test/submissions`)).json()
  const response = await request.post(`${mock}/rest/v1/rpc/submit_factfind`, { headers: { apikey: 'local-preview-only' }, data: { p_form_type: 'medical', p_slug: 'preview', p_client_name: 'Bypass attempt', p_client_email: 'test@example.test', p_submission_data: {} } })
  expect(response.status()).toBe(403)
  expect(await (await request.get(`${mock}/test/submissions`)).json()).toHaveLength(before.length)
})

test('clients can read privacy and deletion information without losing unfinished answers', async ({ page, context }) => {
  await page.goto('/f/home/violet')
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  const firstName = page.getByRole('textbox', { name: 'First Name', exact: true })
  await firstName.fill('Sam')
  for (const name of ['Privacy notice', 'Your data and deletion requests']) {
    const opened = context.waitForEvent('page')
    await page.getByRole('navigation', { name: 'Form privacy information' }).getByRole('link', { name: new RegExp(name) }).click()
    const policy = await opened
    await expect(policy.getByRole('heading', { name: 'Privacy notice', exact: true })).toBeVisible()
    if (name.startsWith('Your data')) {
      await expect(policy).toHaveURL(/\/privacy#retention$/)
      await expect(policy.getByRole('heading', { name: '8. Retention and deletion requests', exact: true })).toBeInViewport()
    }
    expect(await policy.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await policy.close()
    await expect(firstName).toHaveValue('Sam')
    await expect(page).toHaveURL(/\/f\/home\/violet$/)
  }
})
