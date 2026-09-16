import fs from 'node:fs/promises'
import { test, expect } from '@playwright/test'

const ownId = '00000000-0000-4000-8000-000000000003'
const otherId = '00000000-0000-4000-8000-000000000005'

for (const role of ['adviser', 'admin']) {
  test(`${role} can download a branded PDF and receives an honest logged-only email result`, async ({
    page,
  }, testInfo) => {
    const base = role === 'admin' ? '/admin/submissions' : '/submissions'
    await page.goto(`/login?redirectTo=${base}/${ownId}`)
    await page.getByLabel('Email', { exact: false }).fill(`${role}@example.test`)
    await page.getByLabel('Password', { exact: true }).fill('PreviewOnly!')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Sam Taylor', exact: true })).toBeVisible()
    const pdf = await page.request.get(`${base}/${ownId}/pdf`)
    expect(pdf.status()).toBe(200)
    expect(pdf.headers()['content-type']).toBe('application/pdf')
    expect(pdf.headers()['cache-control']).toBe('private, no-store')
    expect(pdf.headers()['content-disposition']).toContain('FF-001234-home-factfind.pdf')
    const bytes = await pdf.body()
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
    expect(bytes.length).toBeGreaterThan(10_000)
    await fs.writeFile(testInfo.outputPath('submission.pdf'), bytes)
    await page.getByRole('button', { name: 'Email PDF to client', exact: true }).click()
    await expect(page.getByRole('dialog')).toContainText('client@example.test')
    await page.getByRole('button', { name: 'Send PDF', exact: true }).click()
    await expect(page.getByText('PDF email logged only', { exact: true })).toBeVisible()
    await expect(
      page.getByText(
        'No email provider is configured. Nothing was sent or queued for later delivery.',
        { exact: true },
      ),
    ).toBeVisible()
    if (role === 'adviser') {
      const other = await page.request.get(`${base}/${otherId}/pdf`)
      expect(other.status()).toBe(404)
    }
  })
}

test('PDF downloads require authentication', async ({ request }) => {
  for (const base of ['/submissions', '/admin/submissions']) {
    const response = await request.get(`${base}/${ownId}/pdf`, {
      maxRedirects: 0,
    })
    expect([303, 307]).toContain(response.status())
    expect(response.headers().location).toContain('/login')
  }
})
