import test from 'node:test'
import assert from 'node:assert/strict'
import { provisioningFetch } from '../../scripts/lib/provisioning-fetch.mjs'

const origin = 'https://fictional.supabase.co'
test('provisioning transport refuses all email and credential activation endpoints', async () => {
  let calls = 0
  const guarded = provisioningFetch(origin, async () => { calls++; return new Response('{}') })
  for (const path of ['/auth/v1/signup', '/auth/v1/invite', '/auth/v1/recover', '/auth/v1/admin/generate_link', '/auth/v1/otp', '/auth/v1/user', '/rest/v1/email_log']) {
    await assert.rejects(() => guarded(`${origin}${path}`, { method: 'POST' }), /blocked/)
  }
  await assert.rejects(() => guarded('https://api.resend.com/emails', { method: 'POST' }), /blocked/)
  await assert.rejects(() => guarded(`${origin}/auth/v1/admin/users/someone`, { method: 'PUT' }), /blocked/)
  assert.equal(calls, 0)
})

test('account creation requires a dormant unconfirmed account without a password', async () => {
  let calls = 0
  const guarded = provisioningFetch(origin, async () => { calls++; return new Response('{}') })
  const user = { email: 'person@fictional-adviser.co.uk', email_confirm: false, ban_duration: '876000h', app_metadata: { factfind_import_source_id: 'source', factfind_import_digest: 'digest' } }
  for (const changes of [{ email_confirm: true }, { ban_duration: 'none' }, { password: 'SharedPassword!' }, { app_metadata: {} }]) {
    await assert.rejects(() => guarded(`${origin}/auth/v1/admin/users`, { method: 'POST', body: JSON.stringify({ ...user, ...changes }) }), /Imported users/)
  }
  assert.equal(calls, 0)
  await guarded(`${origin}/auth/v1/admin/users`, { method: 'POST', body: JSON.stringify(user) })
  assert.equal(calls, 1)
})

test('only preparation reads, profile writes, reserved forms and private assets are allowed', async () => {
  const guarded = provisioningFetch(origin, async () => new Response('{}'))
  for (const [method, path] of [['GET', '/rest/v1/profiles'], ['HEAD', '/rest/v1/email_log'], ['PATCH', '/rest/v1/profiles'], ['POST', '/rest/v1/adviser_imports'], ['POST', '/rest/v1/factfind_forms'], ['POST', '/storage/v1/object/adviser-imports/source/photo.png']]) {
    assert.equal((await guarded(`${origin}${path}`, { method })).status, 200)
  }
  for (const [method, path] of [['DELETE', '/rest/v1/profiles'], ['POST', '/storage/v1/object/branding/photo.png'], ['POST', '/rest/v1/factfind_submissions']]) {
    await assert.rejects(() => guarded(`${origin}${path}`, { method }), /blocked/)
  }
})
