import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { emailAddress, emailConfiguration } from '../src/lib/email/config'
import { sendResendEmail } from '../src/lib/email/transport'

async function main() {
  if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local')
  const args = process.argv.slice(2)
  const send = args.includes('--send')
  const recipientIndex = args.indexOf('--to')
  const to = recipientIndex >= 0 ? args[recipientIndex + 1] : process.env.EMAIL_TEST_TO?.trim()
  if (send && (!to || !emailAddress(to)))
    throw new Error('To send a test, use --send --to your-approved-test-address.')
  const config = emailConfiguration(process.env)
  if (send && (!config.configured || config.error))
    throw new Error(
      config.error ?? 'RESEND_API_KEY is missing. Add it to .env.local or the process environment.',
    )
  const { createTestEmail } = await import('../src/lib/email/test-message')
  const message = await createTestEmail(to ?? 'delivered@resend.dev')
  const dir = path.resolve('test-results', 'email-preview')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'email.html'), message.html)
  fs.writeFileSync(path.join(dir, 'factfind-email-test.pdf'), message.attachments![0].content)
  console.info(`Sample HTML and PDF saved to ${dir}`)
  if (!send) {
    console.info('Preview only. No email sent.')
    return
  }
  const result = await sendResendEmail(config, message, randomUUID())
  if (!result.ok) throw new Error(result.error)
  console.info(
    `Resend accepted the email. Message ID: ${result.messageId}. Confirm receipt and open the PDF in the test inbox.`,
  )
}

main().catch((error: Error) => {
  console.error(error.message)
  process.exitCode = 1
})
