import fs from 'node:fs/promises'
import { test, expect } from '@playwright/test'
import { completeDetailedFactFind } from '../helpers/detailed-factfind'
import type { SubmissionPayload } from '../../src/lib/forms/types'

interface CapturedMail {
  to: string[]; html: string; attachments: { filename: string; content: string }[]
}
interface CapturedState {
  mail: CapturedMail[]
  emailLog: { status: string }[]
  savedSubmissions: { id: string; reference: string; submission_data: SubmissionPayload }[]
}
const mock = 'http://127.0.0.1:45439'

for (const type of ['mortgage', 'protection', 'medical', 'home'] as const) {
  test(`${type}: fully answered journey retains detailed logic, pence and both PDF audiences`, async ({ page, request }, testInfo) => {
    test.setTimeout(120000)
    await request.post(`${mock}/test/email-scenario`, { data: {} })
    if (type === 'home' || type === 'medical') await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/f/${type}/violet`)
    await page.getByRole('button', { name: 'Start your FactFind' }).click()
    const values = await completeDetailedFactFind(page, type)
    await expect(page.getByText('Not provided', { exact: true })).toHaveCount(0)
    await expect(page.getByText('no', { exact: true })).toHaveCount(0)
    if (type === 'mortgage' || type === 'protection') {
      await expect(page.getByText('Jordan Example', { exact: true })).toBeVisible()
      await expect(page.getByText('£2,400.55', { exact: true })).toBeVisible()
      await expect(page.getByText('£750.25', { exact: true })).toBeVisible()
    }
    await page.screenshot({ path: testInfo.outputPath(`${type}-review.png`), fullPage: true })
    await page.getByRole('button', { name: 'Submit FactFind', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'You’re all done. Thank you.' })).toBeVisible()
    const state = async (): Promise<CapturedState> => (await request.get(`${mock}/test/email-state`)).json()
    await expect.poll(async () => (await state()).emailLog.length).toBe(2)
    const result = await state()
    expect(result.mail).toHaveLength(2)
    expect(result.emailLog.every((entry) => entry.status === 'sent')).toBe(true)
    const saved = result.savedSubmissions.at(-1)!
    const payload = saved.submission_data
    expect(payload.steps.flatMap((step) => step.answers).every((answer) => answer.display !== '—')).toBe(true)
    for (const [id, value] of Object.entries(payload.answers)) expect(value, id).toEqual(values[id])
    if (type === 'mortgage') {
      expect(payload.answers.has_ccj).toBe('no')
      expect(payload.answers.has_bankruptcy).toBe('yes')
      expect(payload.answers).not.toHaveProperty('ccj_company_name')
      expect(payload.answers).not.toHaveProperty('remortgage_estimated_value')
      expect(payload.answers.btl3_btl_3_monthly_rental_income_received).toBe('987.65')
    }
    if (type === 'protection') {
      expect(payload.answers).not.toHaveProperty('admin_additional_internal_notes')
      expect(payload.answers).not.toHaveProperty('adviser_name')
      expect(payload.answers.a2_pay_applicant_2_net_monthly_pay).toBe('2400.55')
    }
    if (type === 'medical') {
      expect(payload.answers).not.toHaveProperty('lifestyle_do_you_currently_smoke_details')
      expect(payload.answers).not.toHaveProperty('health5_in_the_last_five_years_have_you_spent_more_than_details')
      expect(payload.answers.gp_what_is_your_gp_s_name).toBe('Dr Fictional Example')
      expect(payload.answers.family_if_no_at_what_age_did_they_pass_away).toBeTruthy()
    }
    for (const [audience, recipient] of [['client', 'client@example.test'], ['adviser', 'adviser@example.test']] as const) {
      const email = result.mail.find((entry) => entry.to.includes(recipient))!
      expect(email.attachments[0].filename).toBe(`${saved.reference}-${type}-factfind.pdf`)
      const bytes = Buffer.from(email.attachments[0].content, 'base64')
      expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
      await fs.writeFile(testInfo.outputPath(`${type}-${audience}.pdf`), bytes)
      await fs.writeFile(testInfo.outputPath(`${type}-${audience}.html`), email.html)
    }
    await fs.writeFile(testInfo.outputPath(`${type}-saved.json`), JSON.stringify(saved, null, 2))
  })
}
