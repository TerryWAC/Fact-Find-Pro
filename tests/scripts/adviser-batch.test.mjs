import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { normaliseWebsite, reviewDigest, stageAdviserBatch } from '../../scripts/lib/adviser-batch.mjs'
import { prepareAdviserImport } from '../../scripts/lib/adviser-import.mjs'

const source = (id, overrides = {}) => ({ '#': id, 'Response Type': 'completed', 'Submit Date (UTC)': '2026-09-14 01:00:00',
  name: 'Morgan Rivers', email: 'morgan@fictional-adviser.co.uk', company_name: 'River Advice',
  phone: "'+447700900123", website: 'www.fictional-adviser.co.uk', avatar_url: 'https://api.typeform.com/responses/files/photo.jpg', ...overrides })
const mapping = Object.fromEntries(['name', 'email', 'company_name', 'phone', 'website', 'avatar_url'].map((key) => [key, key]))
const setup = (rows = [source('new')]) => {
  const raw = JSON.stringify(prepareAdviserImport(rows, mapping, { existingEmails: [] }))
  return { raw, decisions: { review_sha256: reviewDigest(raw), records: rows.map((row) => ({ source_id: row['#'], action: 'include', reason: 'Reviewed signup fields.' })) } }
}

test('website normalisation accepts one domain and preserves ambiguous values for confirmation', () => {
  assert.deepEqual(normaliseWebsite('www.fictional-adviser.co.uk'), { value: 'https://www.fictional-adviser.co.uk', action: 'added_https' })
  assert.equal(normaliseWebsite('https://firm.invalid/about').action, 'unchanged')
  for (const value of ['NOT READY', 'a.invalid b.invalid', '@socialname', 'https://a.invalid ' + 'x'.repeat(301),
    'javascript:alert(1)', 'https://user:password@firm.invalid', '//firm.invalid', 'localhost', 'https://127.0.0.1']) {
    assert.deepEqual(normaliseWebsite(value), { value: '', action: 'confirm_website' })
  }
})

test('staging is offline, keeps source assets separate and records every normalisation', () => {
  const { raw, decisions } = setup()
  const result = stageAdviserBatch(raw, decisions, [])
  assert.equal(result.accounts_created, 0)
  assert.equal(result.emails_sent, 0)
  assert.equal(result.activation_ready, false)
  assert.equal(result.selected[0].profile_prefill.phone, '+447700900123')
  assert.equal(result.selected[0].profile_prefill.avatar_url, '')
  assert.ok(result.selected[0].source_assets.avatar_url.includes('api.typeform.com'))
  assert.equal(result.audit[0].profile.phone, "'+447700900123")
  assert.equal(result.selected[0].changes.length, 2)
  for (const forbidden of ['role', 'password', 'status', 'delivery_client_copy', 'terms_accepted_at']) {
    assert.ok(!Object.hasOwn(result.selected[0].profile_prefill, forbidden))
  }
})

test('decisions are tied to exact source bytes and cannot omit or repeat a response', () => {
  const { raw, decisions } = setup()
  assert.throws(() => stageAdviserBatch(raw + ' ', decisions, []), /exact review/)
  assert.throws(() => stageAdviserBatch(raw, { ...decisions, records: [] }, []), /Every source/)
  assert.throws(() => stageAdviserBatch(raw, { ...decisions, records: [{ source_id: 'unknown', action: 'include', reason: 'yes' }] }, []), /Invalid/)
  assert.throws(() => stageAdviserBatch(raw, decisions), /snapshot/)
})

test('duplicate selection requires an explicit winner with the same email and retains the old record', () => {
  const { raw, decisions } = setup([source('new'), source('old')])
  assert.throws(() => stageAdviserBatch(raw, decisions, []), /validation or identity/)
  decisions.records[1] = { source_id: 'old', action: 'supersede', superseded_by: 'new', reason: 'Same email, name and firm; newer profile reviewed.' }
  const result = stageAdviserBatch(raw, decisions, [])
  assert.equal(result.selected.length, 1)
  assert.equal(result.audit.length, 2)
  assert.equal(result.counts.superseded, 1)
  decisions.records[1].superseded_by = 'missing'
  assert.throws(() => stageAdviserBatch(raw, decisions, []), /same email/)
})

test('same person with different emails is held for identity review rather than imported twice', () => {
  const { raw, decisions } = setup([source('first'), source('second', { email: 'other@fictional-adviser.co.uk' })])
  assert.ok(JSON.parse(raw).records.every((r) => r.issues.some((issue) => issue.includes('different emails'))))
  assert.throws(() => stageAdviserBatch(raw, decisions, []), /identity/)
  decisions.records[1] = { source_id: 'second', action: 'supersede', superseded_by: 'first', reason: 'Attempt to assume email identity.' }
  assert.throws(() => stageAdviserBatch(raw, decisions, []), /same email/)
})

test('fresh account collisions, invalid records and partial responses block staging', () => {
  const { raw, decisions } = setup()
  assert.throws(() => stageAdviserBatch(raw, decisions, ['morgan@fictional-adviser.co.uk']), /validation/)
  for (const overrides of [{ 'Response Type': 'partial' }, { email: '' }, { name: 'Testing adviser' }]) {
    const fixture = setup([source('one', overrides)])
    assert.throws(() => stageAdviserBatch(fixture.raw, fixture.decisions, []))
  }
})

test('CLI writes an audited local batch without credentials and refuses to overwrite it', () => {
  const root = mkdtempSync(join(tmpdir(), 'factfind-stage-test-'))
  try {
    const { raw, decisions } = setup()
    const review = join(root, 'review.json'), choice = join(root, 'decisions.json'), emails = join(root, 'emails.json'), output = join(root, 'batch')
    writeFileSync(review, raw); writeFileSync(choice, JSON.stringify(decisions)); writeFileSync(emails, '[]')
    const run = () => spawnSync(process.execPath, ['scripts/stage-adviser-batch.mjs', review, choice, emails, output], { encoding: 'utf8' })
    const first = run()
    assert.equal(first.status, 0, first.stderr)
    const batch = JSON.parse(readFileSync(join(output, 'batch.json'), 'utf8'))
    assert.equal(batch.counts.selected_profiles, 1)
    assert.equal(batch.emails_sent, 0)
    assert.equal(run().status, 1)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
