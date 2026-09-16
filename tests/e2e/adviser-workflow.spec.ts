import { test, expect, type Page } from '@playwright/test'

async function signIn(page: Page, destination = '/dashboard', role = 'adviser') {
  await page.goto(`/login?redirectTo=${encodeURIComponent(destination)}`)
  await page.getByLabel('Email', { exact: false }).fill(`${role}@example.test`)
  await page.getByLabel('Password', { exact: true }).fill('PreviewOnly!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(destination.split('?')[0]))
}

function entries(page: Page, mobile: boolean) {
  return mobile
    ? page.getByRole('list', { name: 'Submissions', exact: true }).getByRole('listitem')
    : page.getByRole('table', { name: 'Submissions', exact: true }).locator('tbody tr')
}

test('dashboard prioritises the oldest new work and scopes counts to the adviser', async ({
  page,
  isMobile,
}, testInfo) => {
  await signIn(page)
  await expect(page.getByRole('link', { name: /Needs review 6/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /In review 2/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Completed 3/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /All submissions 13/ })).toBeVisible()
  const queue = page.getByRole('region', { name: 'Ready for your review' })
  await expect(queue.getByRole('listitem')).toHaveCount(5)
  await expect(queue.getByRole('listitem').first()).toContainText('Priya Shah')
  await expect(queue).not.toContainText('Casey Other')
  await expect(page.getByRole('link', { name: 'Start next review', exact: true })).toHaveAttribute('href', '/submissions/00000000-0000-4000-8000-000000000100')
  const clientExperience = page.getByRole('region', { name: 'Your client experience', exact: true })
  await expect(clientExperience).toContainText('Morgan Financial')
  await expect(clientExperience.getByText('Adviser PDF copy', { exact: true })).toBeVisible()
  await expect(page.locator('body')).not.toContainText('MVP')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('dashboard.png'), fullPage: true })
  await page.getByRole('button', { name: 'Change theme' }).click()
  await page.getByRole('menuitem', { name: 'Dark', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('dashboard-dark.png'), fullPage: true })
  await queue.getByRole('link', { name: 'View all new submissions' }).click()
  await expect(page).toHaveURL(/status=new&sort=oldest/)
  await expect(page.getByRole('button', { name: 'New', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(entries(page, isMobile)).toHaveCount(6)
  await expect(entries(page, isMobile).first()).toContainText('Priya Shah')
  await expect(entries(page, isMobile).last()).toContainText('Sam Taylor')
})

test('dashboard never presents a failed count as zero or claims the review queue is clear', async ({ page, request }) => {
  await signIn(page)
  await request.post('http://127.0.0.1:45439/test/submission-read-error', { data: { enabled: true } })
  try {
    await page.reload()
    await expect(page.getByRole('link', { name: /Needs review —/ })).toBeVisible()
    await expect(page.getByText('Submissions could not be loaded', { exact: true })).toBeVisible()
    await expect(page.getByText('No new submissions waiting', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Start next review', exact: true })).toHaveCount(0)
    await request.post('http://127.0.0.1:45439/test/submission-read-error', { data: { enabled: false } })
    await page.getByRole('button', { name: 'Try again', exact: true }).click()
    await expect(page.getByRole('link', { name: /Needs review 6/ })).toBeVisible()
  } finally {
    await request.post('http://127.0.0.1:45439/test/submission-read-error', { data: { enabled: false } })
  }
})

test('search, type and status filters combine, including a typed but unsubmitted search', async ({
  page,
  isMobile,
}) => {
  await signIn(page, '/submissions')
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByRole('combobox', { name: 'Filter by FactFind type' }).click()
  await page.getByRole('option', { name: 'Home', exact: true }).click()
  await expect(entries(page, isMobile)).toHaveCount(2)
  await page.getByRole('textbox', { name: 'Search submissions' }).fill('FF-001234')
  await page.getByRole('combobox', { name: 'Sort submissions' }).click()
  await page.getByRole('option', { name: 'Oldest first' }).click()
  await expect(entries(page, isMobile)).toHaveCount(1)
  await expect(entries(page, isMobile).first()).toContainText('Sam Taylor')
  await expect(page).toHaveURL(/q=FF-001234/)
  await expect(page.getByRole('status').filter({ hasText: '1 matching submission' })).toBeVisible()
})

test('punctuation searches work and empty results offer a clear recovery', async ({ page, isMobile }) => {
  await signIn(page, '/submissions')
  const search = page.getByRole('textbox', { name: 'Search submissions' })
  await search.fill('Taylor, Alex (Jr.)')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(entries(page, isMobile)).toHaveCount(1)
  await expect(entries(page, isMobile).first()).toContainText('Taylor, Alex (Jr.)')
  await search.fill('Nobody "here", (test)')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.getByText('No matching submissions', { exact: true })).toBeVisible()
  await expect(page.getByText('No submissions yet', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await expect(entries(page, isMobile)).toHaveCount(10)
  await expect(search).toHaveValue('')
  await page.goBack()
  await expect(search).toHaveValue('Nobody "here", (test)')
  await expect(page.getByText('No matching submissions', { exact: true })).toBeVisible()
})

test('pagination keeps ordering and recovers from a stale bookmark', async ({ page, isMobile }) => {
  await signIn(page, '/submissions?sort=oldest')
  await expect(entries(page, isMobile).first()).toContainText('Priya Shah')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page).toHaveURL(/sort=oldest&page=2/)
  await expect(entries(page, isMobile)).toHaveCount(3)
  await expect(page.getByText('Page 2 of 2', { exact: true })).toBeVisible()
  await page.goto('/submissions?sort=oldest&page=999&status=invalid')
  await expect(entries(page, isMobile)).toHaveCount(3)
  await expect(page.getByText('Page 2 of 2', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'All submissions', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'Previous', exact: true }).click()
  await expect(entries(page, isMobile)).toHaveCount(10)
  await expect(entries(page, isMobile).first()).toContainText('Priya Shah')
})

test('failed loads are distinct from empty results and retry retains the search', async ({
  page,
  request,
  isMobile,
}) => {
  await signIn(page, '/submissions')
  await request.post('http://127.0.0.1:45439/test/submission-read-error', { data: { enabled: true } })
  try {
    await page.goto('/submissions?q=Sam&status=new')
    await expect(page.getByText('Submissions could not be loaded', { exact: true })).toBeVisible()
    await expect(page.getByText('No matching submissions', { exact: true })).toHaveCount(0)
    await request.post('http://127.0.0.1:45439/test/submission-read-error', { data: { enabled: false } })
    await page.getByRole('button', { name: 'Try again', exact: true }).click()
    await expect(entries(page, isMobile)).toHaveCount(1)
    await expect(page.getByRole('textbox', { name: 'Search submissions' })).toHaveValue('Sam')
    await expect(page.getByRole('button', { name: 'New', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  } finally {
    await request.post('http://127.0.0.1:45439/test/submission-read-error', { data: { enabled: false } })
  }
})

test('admin submission lists retain adviser identity and fit the viewport', async ({
  page,
  isMobile,
}, testInfo) => {
  await signIn(page, '/admin/submissions', 'admin')
  await expect(page.getByRole('status').filter({ hasText: '14 submissions' })).toBeVisible()
  await expect(entries(page, isMobile).filter({ hasText: 'Sam Taylor' })).toContainText('Alex Morgan')
  await expect(entries(page, isMobile).filter({ hasText: 'Casey Other' })).toContainText('Jordan Other')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('submissions.png'), fullPage: true })
  if (isMobile) {
    await expect(entries(page, true).first()).toContainText('12 Sept 2026')
    await expect(entries(page, true).first()).toContainText('New')
    await expect(entries(page, true).first()).toContainText('Home')
  }
})
