import fs from 'node:fs/promises'
import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { reachReview } from '../helpers/factfind'
import type { FactFindType } from '../../src/lib/supabase/database.types'

const mock = 'http://127.0.0.1:45439'
interface Mail {
  from: string
  to: string[]
  subject: string
  html: string
  reply_to?: string
  idempotencyKey: string
  attachments: { filename: string; content: string }[]
}
interface State {
  mail: Mail[]
  emailLog: { template_key: string; status: string; payload: { message_id?: string } }[]
  savedSubmissions: { reference: string; id: string; form_type: string; client_name: string }[]
  adviserReads: number
}
async function state(request: APIRequestContext): Promise<State> {
  return (await request.get(`${mock}/test/email-state`)).json()
}
async function submit(page: Page, type: FactFindType = 'home') {
  await page.goto(`/f/${type}/preview`)
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  await reachReview(page, type)
  await page.getByRole('button', { name: 'Submit FactFind', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'You’re all done. Thank you.' })).toBeVisible()
}

for (const branding of [
  { company_name: 'Sunrise Advice', brand_colour: '#E5B45C' },
  { company_name: null, name: 'Jamie Adviser', brand_colour: null },
]) {
  test(`email and PDF branding follows ${branding.company_name || branding.name}`, async ({ page, request }, testInfo) => {
    await request.post(`${mock}/test/email-scenario`, { data: { branding } })
    await submit(page)
    await expect.poll(async () => (await state(request)).emailLog.length).toBe(2)
    const result = await state(request)
    for (const email of result.mail) {
      const name = branding.company_name || branding.name
      expect(email.from).toMatch(new RegExp(`^"${name}" <`))
      expect(email.html).toContain(`<title>${name}</title>`)
      expect(email.html).toContain(`background-color:${branding.brand_colour || '#0A0A0A'}`)
      expect(email.html).not.toContain('Morgan Financial')
      expect(email.html).not.toMatch(/Wealthy Advis[eo]rs Club|Powered by FactFind Pro/)
    }
    const client = result.mail.find((email) => email.to.includes('client@example.test'))!
    await fs.writeFile(testInfo.outputPath('branded-client.pdf'), Buffer.from(client.attachments[0].content, 'base64'))
    await fs.writeFile(testInfo.outputPath('branded-client.html'), client.html)
  })
}

test.beforeEach(async ({ request }) => {
  await request.post(`${mock}/test/email-scenario`, { data: {} })
})

for (const type of ['home', 'medical', 'protection', 'mortgage'] as const) {
  test(`${type}: completion sends both requested emails with the saved answers in a PDF`, async ({
    page,
    request,
  }, testInfo) => {
    await submit(page, type)
    await expect.poll(async () => (await state(request)).emailLog.length).toBe(2)
    const result = await state(request)
    expect(result.emailLog.every((item) => item.status === 'sent' && item.payload.message_id)).toBe(true)
    expect(result.mail).toHaveLength(2)
    const saved = result.savedSubmissions.at(-1)!
    const client = result.mail.find((mail) => mail.to.includes('client@example.test'))!
    const adviser = result.mail.find((mail) => mail.to.includes('adviser@example.test'))!
    expect(client.reply_to).toBe('adviser@example.test')
    for (const email of [client, adviser]) {
      expect(email.from).toMatch(/^"Morgan Financial" </)
      expect(email.html).toContain('<title>Morgan Financial</title>')
      expect(email.html).toContain('background-color:#6D28D9')
      expect(email.html).not.toMatch(/Wealthy Advis[eo]rs Club|Powered by FactFind Pro/)
      expect(email.html).toContain(saved.reference)
      expect(email.html).toContain(saved.client_name)
      expect(email.attachments).toHaveLength(1)
      expect(email.attachments[0].filename).toBe(`${saved.reference}-${type}-factfind.pdf`)
      const pdf = Buffer.from(email.attachments[0].content, 'base64')
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
      expect(pdf.length).toBeGreaterThan(10000)
    }
    expect(adviser.html).toContain(`/submissions/${saved.id}`)
    await fs.writeFile(
      testInfo.outputPath(`${type}-client.pdf`),
      Buffer.from(client.attachments[0].content, 'base64'),
    )
    await fs.writeFile(testInfo.outputPath(`${type}-client.html`), client.html)
    if (type === 'home') {
      await fs.writeFile(testInfo.outputPath('fictional-email-capture.json'), JSON.stringify(result.mail, null, 2))
      await page.setViewportSize({ width: 360, height: 800 })
      await page.setContent(client.html)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath('client-email-mobile.png'), fullPage: true })
      await page.setViewportSize({ width: 1440, height: 1100 })
      await page.screenshot({ path: testInfo.outputPath('client-email-desktop.png'), fullPage: true })
      await page.setContent(adviser.html)
      await page.screenshot({ path: testInfo.outputPath('adviser-email-desktop.png'), fullPage: true })
    }
  })
}

for (const [adviserCopy, clientCopy, recipient] of [
  [true, false, 'adviser@example.test'],
  [false, true, 'client@example.test'],
] as const) {
  test(`delivery preferences send only to ${recipient}`, async ({ page, request }) => {
    await request.post(`${mock}/test/email-scenario`, { data: { adviserCopy, clientCopy } })
    await submit(page)
    await expect.poll(async () => (await state(request)).emailLog.length).toBe(1)
    const result = await state(request)
    expect(result.mail).toHaveLength(1)
    expect(result.mail[0].to).toEqual([recipient])
  })
}

test('both delivery preferences off sends nothing after saving the submission', async ({ page, request }) => {
  await request.post(`${mock}/test/email-scenario`, { data: { adviserCopy: false, clientCopy: false } })
  await submit(page)
  await expect.poll(async () => (await state(request)).adviserReads).toBeGreaterThan(0)
  const result = await state(request)
  expect(result.mail).toHaveLength(0)
  expect(result.emailLog).toHaveLength(0)
})

test('a disabled client template skips that copy and still notifies the adviser', async ({
  page,
  request,
}) => {
  await request.post(`${mock}/test/email-scenario`, { data: { disabledTemplate: 'submission_client_copy' } })
  await submit(page)
  await expect.poll(async () => (await state(request)).emailLog.length).toBe(2)
  const result = await state(request)
  expect(result.mail).toHaveLength(1)
  expect(result.mail[0].to).toEqual(['adviser@example.test'])
  expect(result.emailLog.find((item) => item.template_key === 'submission_client_copy')?.status).toBe(
    'skipped',
  )
})

test('provider rejection for the client does not lose the submission or adviser notification', async ({
  page,
  request,
}) => {
  await request.post(`${mock}/test/email-scenario`, { data: { failClient: true } })
  await submit(page)
  await expect.poll(async () => (await state(request)).emailLog.length).toBe(2)
  const result = await state(request)
  expect(result.emailLog.find((item) => item.template_key === 'submission_client_copy')?.status).toBe(
    'failed',
  )
  expect(result.emailLog.find((item) => item.template_key === 'submission_notification')?.status).toBe('sent')
  expect(result.savedSubmissions.at(-1)?.reference).toMatch(/^FF-/)
})

test('a temporary client-send failure retries the identical email and idempotency key', async ({
  page,
  request,
}) => {
  await request.post(`${mock}/test/email-scenario`, { data: { retryClient: true } })
  await submit(page)
  await expect.poll(async () => (await state(request)).emailLog.length).toBe(2)
  const result = await state(request)
  const attempts = result.mail.filter((mail) => mail.to.includes('client@example.test'))
  expect(attempts).toHaveLength(2)
  expect(attempts[0]).toEqual(attempts[1])
  expect(result.emailLog.every((item) => item.status === 'sent')).toBe(true)
})

test('a failed submission sends no email; retry saves and sends once', async ({ page, request }) => {
  await page.goto('/f/home/preview')
  await page.getByRole('button', { name: 'Start your FactFind' }).click()
  await reachReview(page, 'home')
  await request.post(`${mock}/test/fail-next`)
  await page.getByRole('button', { name: 'Submit FactFind', exact: true }).click()
  await expect(
    page.getByText('We could not submit your FactFind. Please try again in a moment.'),
  ).toBeVisible()
  expect((await state(request)).mail).toHaveLength(0)
  await page.getByRole('button', { name: 'Submit FactFind', exact: true }).click()
  await expect.poll(async () => (await state(request)).emailLog.length).toBe(2)
  expect((await state(request)).mail).toHaveLength(2)
})

for (const type of ['mortgage', 'protection'] as const) {
  test(`${type}: adviser-completed forms produce separate client copies for automatic and manual sends`, async ({ page, request }, testInfo) => {
    await page.goto(`/f/${type}/preview`)
    await page.getByRole('button', { name: 'Start your FactFind' }).click()
    await page.locator('#who_completing').getByRole('radio', { name: 'Adviser', exact: true }).check()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await page.locator('#adviser_name').fill('PRIVATE-ADVISER-ENTRY')
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await page.locator('#if_other_please_specify_source_details').fill('PRIVATE-CLIENT-SOURCE')
    await reachReview(page, type)
    await page.getByRole('button', { name: 'Edit Admin Notes', exact: true }).click()
    await page.locator('#admin_additional_internal_notes').fill('PRIVATE-INTERNAL-NOTE')
    await page.getByRole('button', { name: 'Return to review', exact: true }).click()
    if (type === 'mortgage') {
      await page.getByRole('button', { name: 'Edit Monthly Expenditure', exact: true }).click()
      await page.locator('#has_ccj').getByRole('radio', { name: 'No', exact: true }).check()
      await page.locator('#has_bankruptcy').getByRole('radio', { name: 'Yes', exact: true }).check()
      await page.locator('#bk_date_of_bankruptcy_and_discharge').fill('PUBLIC-BANKRUPTCY-DETAILS')
      await page.getByRole('button', { name: 'Return to review', exact: true }).click()
    }
    await expect(page.getByText('PRIVATE-INTERNAL-NOTE', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Submit FactFind', exact: true }).click()
    await expect.poll(async () => (await state(request)).emailLog.length).toBe(2)
    const result = await state(request)
    const adviser = result.mail.find((email) => email.to.includes('adviser@example.test'))!
    const client = result.mail.find((email) => email.to.includes('client@example.test'))!
    expect(result.emailLog.every((entry) => entry.status === 'sent')).toBe(true)
    expect(adviser.attachments[0].content).not.toBe(client.attachments[0].content)
    for (const [audience, email] of [['adviser', adviser], ['client', client]] as const)
      await fs.writeFile(testInfo.outputPath(`${type}-${audience}-private-check.pdf`), Buffer.from(email.attachments[0].content, 'base64'))

    const saved = result.savedSubmissions.at(-1)!
    await page.goto(`/login?redirectTo=/submissions/${saved.id}`)
    await page.getByLabel('Email', { exact: false }).fill('adviser@example.test')
    await page.getByLabel('Password', { exact: true }).fill('PreviewOnly!')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.getByRole('button', { name: 'Email PDF to client', exact: true }).click()
    await page.getByRole('button', { name: 'Send PDF', exact: true }).click()
    await expect.poll(async () => (await state(request)).emailLog.length).toBe(3)
    const manual = (await state(request)).mail.at(-1)!
    expect(manual.to).toEqual(['client@example.test'])
    await fs.writeFile(testInfo.outputPath(`${type}-manual-client-private-check.pdf`), Buffer.from(manual.attachments[0].content, 'base64'))
  })
}
