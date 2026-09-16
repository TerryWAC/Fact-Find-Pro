import { test, expect } from '@playwright/test'
import { brandedSender, emailConfiguration, emailConfigurationStatus } from '../../src/lib/email/config'
import { sendResendEmail, type OutgoingEmail } from '../../src/lib/email/transport'
import { interpolate, wrapHtml } from '../../src/lib/email/render'
import { createTestEmail } from '../../src/lib/email/test-message'

const config = emailConfiguration({
  RESEND_API_KEY: 're_fake_test_key',
  EMAIL_FROM: 'FactFind Pro <test@example.com>',
  EMAIL_REPLY_TO: 'support@example.com',
})
const message: OutgoingEmail = {
  to: ['client@example.com'],
  subject: 'Test',
  html: '<p>Test</p>',
  text: 'Test',
  replyTo: 'adviser@example.com',
  attachments: [{ filename: 'test.pdf', content: Buffer.from('%PDF-test') }],
}
const noSleep = async () => undefined

test('configuration trims whitespace and exposes no API key in the public status', () => {
  const privateConfig = emailConfiguration({
    RESEND_API_KEY: '  re_fake_secret  ',
    EMAIL_FROM: '  Team <sender@example.com>  ',
  })
  expect(privateConfig.apiKey).toBe('re_fake_secret')
  expect(privateConfig.error).toBeUndefined()
  expect(JSON.stringify(emailConfigurationStatus(privateConfig))).not.toContain('re_fake_secret')
  expect(emailConfigurationStatus(privateConfig).from).toBe('Team <sender@example.com>')
})

test('missing key stays in log mode without contacting any provider', async () => {
  const fetcher = async () => {
    throw new Error('Should not be called')
  }
  expect(
    await sendResendEmail(emailConfiguration({}), message, 'test-1', { fetch: fetcher }),
  ).toEqual({ ok: true, provider: 'log' })
})

test('malformed key, sender and reply-to are rejected before sending', async () => {
  for (const env of [
    { RESEND_API_KEY: 'bad key' },
    { EMAIL_FROM: 'invalid' },
    { EMAIL_FROM: 'sender@example.com\r\nBcc: attacker@example.com' },
    { EMAIL_REPLY_TO: 'invalid' },
  ]) {
    const parsed = emailConfiguration(env)
    expect(parsed.error).toBeTruthy()
  }
})

test('invalid recipients do not reach Resend', async () => {
  let calls = 0
  const result = await sendResendEmail(config, { ...message, to: ['invalid'] }, 'test-1', {
    fetch: async () => {
      calls++
      return Response.json({ id: 'x' })
    },
  })
  expect(calls).toBe(0)
  expect(result.ok).toBe(false)
})

test('send includes an idempotency key, reply-to, PDF bytes and returns the provider ID', async () => {
  const result = await sendResendEmail(config, message, 'test-123', {
    fetch: async (url, init) => {
      expect(url).toBe('https://api.resend.com/emails')
      expect(init?.redirect).toBe('error')
      expect(init?.signal).toBeTruthy()
      expect(new Headers(init?.headers).get('Idempotency-Key')).toBe('test-123')
      const body = JSON.parse(String(init?.body))
      expect(body.reply_to).toBe('adviser@example.com')
      expect(Buffer.from(body.attachments[0].content, 'base64')).toEqual(
        message.attachments![0].content,
      )
      return Response.json({ id: 'provider-message-123' })
    },
  })
  expect(result).toEqual({ ok: true, provider: 'resend', messageId: 'provider-message-123' })
})

for (const status of [429, 503]) {
  test(`temporary ${status} retries the exact same email body and key once`, async () => {
    const requests: Array<{ body: unknown; key: string | null }> = []
    const result = await sendResendEmail(config, message, 'one-request', {
      sleep: noSleep,
      fetch: async (_url, init) => {
        requests.push({ body: init?.body, key: new Headers(init?.headers).get('Idempotency-Key') })
        return requests.length === 1
          ? Response.json({ message: 'Temporary' }, { status })
          : Response.json({ id: 'accepted' })
      },
    })
    expect(requests.length).toBe(2)
    expect(requests[0]).toEqual(requests[1])
    expect(result.ok).toBe(true)
  })
}

test('authentication errors are not retried and raw provider text is not exposed', async () => {
  let calls = 0
  const result = await sendResendEmail(config, message, 'one-request', {
    fetch: async () => {
      calls++
      return Response.json(
        { name: 'invalid_api_key', message: 'Secret: re_fake_test_key' },
        { status: 401 },
      )
    },
  })
  expect(calls).toBe(1)
  expect(result.error).toContain('authenticate')
  expect(result.error).not.toContain('re_fake_test_key')
})

test('an ambiguous successful response is not reported as accepted', async () => {
  const result = await sendResendEmail(config, message, 'one-request', {
    fetch: async () => Response.json({}),
  })
  expect(result.ok).toBe(false)
  expect(result.messageId).toBeUndefined()
})

test('network failures are bounded to two attempts and delivery remains unconfirmed', async () => {
  let calls = 0
  const result = await sendResendEmail(config, message, 'one-request', {
    sleep: noSleep,
    fetch: async () => {
      calls++
      throw new Error('network')
    },
  })
  expect(calls).toBe(2)
  expect(result.ok).toBe(false)
  expect(result.error).toContain('unconfirmed')
})

test('HTML variables are escaped while plain text and subject stay readable', () => {
  const name = `<img src=x onerror='bad()'> & "quoted"`
  expect(interpolate('<p>{{name}}</p>', { name }, true)).toBe(
    '<p>&lt;img src=x onerror=&#39;bad()&#39;&gt; &amp; &quot;quoted&quot;</p>',
  )
  expect(interpolate('Hi {{name}}', { name })).toBe(`Hi ${name}`)
})

test('client email uses valid adviser branding and escapes the company name', () => {
  const html = wrapHtml('<p>Hello</p>', 'Preview', {
    colour: '#6D28D9',
    companyName: '<Morgan & Co>',
  })
  expect(html).toContain('background-color:#6D28D9')
  expect(html).toContain('&lt;Morgan &amp; Co&gt;')
  expect(html).not.toContain('<Morgan & Co>')
  expect(wrapHtml('<p>Test</p>', undefined, { colour: 'invalid' })).toContain(
    'background-color:#0A0A0A',
  )
})

test('test message has a real PDF attachment and no client data', async () => {
  const email = await createTestEmail('delivered@resend.dev')
  expect(email.attachments![0].content.subarray(0, 5).toString()).toBe('%PDF-')
  expect(email.attachments![0].content.length).toBeGreaterThan(1000)
  expect(email.html).toContain('No client information is included')
})

test('firm display names keep the verified sender address and cannot inject headers', () => {
  expect(brandedSender('Platform <notifications@factfindpro.com>', 'Morgan Financial')).toBe('"Morgan Financial" <notifications@factfindpro.com>')
  const sender = brandedSender('notifications@factfindpro.com', 'Morgan "Advice"\r\nBcc: other@example.com')
  expect(sender).not.toMatch(/[\r\n]/)
  expect(sender).toContain('\\"Advice\\"')
  expect(sender).toMatch(/<notifications@factfindpro\.com>$/)
})

test('branded mail includes firm contact and never falls back to the platform identity', () => {
  const html = wrapHtml('<h2>Your record</h2><p>Thank you</p>', 'Record attached', {
    companyName: 'Morgan Financial', adviserName: 'Alex Morgan', replyTo: 'alex@example.com', logoUrl: 'https://example.com/logo.png', colour: '#E5B45C',
  })
  expect(html).toContain('src="https://example.com/logo.png"')
  expect(html).toContain('mailto:alex@example.com')
  expect(html).toContain('<title>Morgan Financial</title>')
  expect(html).not.toMatch(/FactFind Pro|Wealthy Advis[eo]rs Club|support@/)
  expect(wrapHtml('<p>Hi</p>', undefined, {})).not.toContain('FactFind Pro')
})

test('unsafe logo URLs are excluded and saved inline styling is retained', () => {
  const html = wrapHtml('<h2 style="font-size:20px">Custom title</h2>', undefined, { logoUrl: 'javascript:alert(1)' })
  expect(html).not.toContain('javascript:')
  expect(html).toContain('<h2 style="font-size:20px">')
  const button = wrapHtml('<p><a href="https://example.com">View submission</a></p>')
  expect(button).toContain('mso-padding-alt:16px 24px')
  expect(button).toContain('href="https://example.com"')
})
