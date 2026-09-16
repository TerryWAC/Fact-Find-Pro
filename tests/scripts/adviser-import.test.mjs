import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseCsv, prepareAdviserImport, renderAdviserReview } from '../../scripts/lib/adviser-import.mjs'

const mapping = { name: 'Full name', email: 'Email', avatar_url: 'Photo' }
const person = { 'Full name': 'Morgan Rivers', Email: 'morgan@fictional-adviser.co.uk', Photo: '' }

test('Typeform CSV preserves names with commas, quotes, Unicode and multiline fields', () => {
  const rows = parseCsv('\uFEFFFull name,Email,Photo,Company\r\n"Zoë, O""Brien",zoe@fictional-adviser.co.uk,,"Rivers\r\nAdvice"\r\n')
  assert.equal(rows[0]['Full name'], 'Zoë, O"Brien')
  assert.equal(rows[0].Company, 'Rivers\r\nAdvice')
  assert.equal(rows[0].Photo, '')
})

test('malformed CSV and ambiguous headers fail instead of shifting personal data', () => {
  for (const csv of ['Name,Name\na,b', 'Name,Email\na', 'Name,Email\n"unfinished,x', 'Name,Email\n"a"oops,x', 'Name,\na,b']) {
    assert.throws(() => parseCsv(csv))
  }
})

test('mapping is explicit and excludes privileges, consent and delivery changes', () => {
  assert.throws(() => prepareAdviserImport([person], { name: 'Full name' }), /name and email/)
  assert.throws(() => prepareAdviserImport([person], { ...mapping, email: 'Wrong heading' }), /not found/)
  for (const key of ['role', 'status', 'password', 'terms', 'delivery_client_copy', '__proto__']) {
    const unsafeMapping = Object.fromEntries([...Object.entries(mapping), [key, 'Email']])
    assert.throws(() => prepareAdviserImport([person], unsafeMapping), /Unsupported/)
  }
})

test('same email with case and whitespace variations flags every row without choosing a winner', () => {
  const report = prepareAdviserImport([person, { ...person, Email: ' MORGAN@FICTIONAL-ADVISER.CO.UK ', 'Full name': 'Different Person' }], mapping)
  assert.equal(report.counts.candidates, 0)
  assert.equal(report.records.length, 2)
  assert.ok(report.records.every((r) => r.issues.some((issue) => issue.includes('Duplicate email'))))
})

test('missing emails and test entries are held; missing optional pictures are follow-up items', () => {
  const report = prepareAdviserImport([person, { ...person, Email: '' }, { ...person, 'Full name': 'ZZ Test', Email: 'zz@example.com' }], mapping)
  assert.equal(report.counts.candidates, 1)
  assert.equal(report.counts.needs_review, 2)
  assert.ok(report.records[0].follow_up.includes('Add a photo if wanted'))
})

test('only explicit existing-account data enables matching; collisions never overwrite', () => {
  assert.equal(prepareAdviserImport([person], mapping).existing_accounts_checked, false)
  const report = prepareAdviserImport([person], mapping, { existingEmails: [' MORGAN@FICTIONAL-ADVISER.CO.UK '] })
  assert.equal(report.existing_accounts_checked, true)
  assert.equal(report.counts.candidates, 0)
  assert.ok(report.records[0].issues.some((issue) => issue.includes('Account already exists')))
  assert.throws(() => prepareAdviserImport([person], mapping, { existingEmails: 'incorrect' }))
})

const response = (id = 'source-1') => ({
  response_id: id, response_type: 'completed', submitted_at: '2026-09-13T21:00:00Z',
  answers: [
    { field: { id: 'f1', ref: 'first_name' }, type: 'text', text: 'Morgan' },
    { field: { id: 'f2', ref: 'last_name' }, type: 'text', text: 'Rivers' },
    { field: { id: 'f3', ref: 'adviser_email' }, type: 'email', email: person.Email },
    { field: { id: 'f4', ref: 'photo' }, type: 'file_url', file_url: 'https://api.typeform.com/responses/files/photo.png' },
  ],
})
const apiMapping = { name: ['first_name', 'last_name'], email: 'f3', avatar_url: 'photo' }

test('Responses API field IDs and refs support split names and authenticated photo source references', () => {
  const report = prepareAdviserImport({ total_items: 1, items: [response()] }, apiMapping)
  assert.equal(report.records[0].profile.name, 'Morgan Rivers')
  assert.equal(report.counts.with_photo, 1)
  assert.ok(report.records[0].follow_up.some((value) => value.includes('Copy and verify images')))
  assert.equal(report.accounts_created, 0)
  assert.equal(report.emails_sent, 0)
})

test('partial exports, incomplete responses and repeated source responses are surfaced', () => {
  const item = response()
  const partial = { ...response(), response_type: 'partial' }
  const report = prepareAdviserImport({ total_items: 10, items: [item, partial] }, apiMapping)
  assert.ok(report.warnings.some((value) => value.includes('partial page')))
  assert.ok(report.records[1].issues.includes('Incomplete Typeform response'))
  assert.ok(report.records.every((r) => r.issues.some((value) => value.includes('Repeated source'))))
})

test('the real Typeform CSV metadata shape preserves response IDs and holds partial responses', () => {
  const csvRow = { ...person, '#': 'csv-source-one', 'Response Type': 'completed', 'Submit Date (UTC)': '2026-09-13 21:00:00' }
  const report = prepareAdviserImport([csvRow, { ...csvRow, '#': 'csv-source-two', Email: 'other@fictional-adviser.co.uk', 'Response Type': 'partial', 'Submit Date (UTC)': '' }], mapping)
  assert.equal(report.source_format, 'typeform_responses_csv')
  assert.equal(report.records[0].source_id, 'csv-source-one')
  assert.equal(report.records[0].submitted_at, '2026-09-13 21:00:00')
  assert.equal(report.records[1].review_status, 'needs_review')
  assert.ok(report.records[1].issues.includes('Incomplete Typeform response'))
})

test('PDF source uploads remain identifiable for conversion instead of being treated as ready images', () => {
  const report = prepareAdviserImport([{ ...person, Photo: 'https://api.typeform.com/responses/files/headshot.pdf' }], mapping)
  assert.ok(report.records[0].follow_up.some((value) => value.includes('Photo was supplied as a PDF')))
})

test('URLs and colours are checked without fetching external content', () => {
  for (const Photo of ['javascript:alert(1)', 'file:///C:/private.png', 'https://user:password@host.invalid/photo']) {
    assert.ok(prepareAdviserImport([{ ...person, Photo }], mapping).records[0].issues.includes('Invalid avatar_url'))
  }
  const report = prepareAdviserImport([{ ...person, Colour: '1e3a5f' }], { ...mapping, brand_colour: 'Colour' })
  assert.equal(report.records[0].profile.brand_colour, '#1E3A5F')
})

test('HTML review escapes untrusted names and never embeds source images or scripts', () => {
  const report = prepareAdviserImport([{ ...person, 'Full name': '<script>alert("x")</script>', Photo: 'https://private.invalid/image.png' }], mapping)
  const html = renderAdviserReview(report)
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(!html.includes('<script>'))
  assert.ok(!html.includes('<img'))
  assert.ok(!html.includes('private.invalid'))
  assert.ok(html.includes("default-src 'none'"))
})

test('CLI creates local preview outputs and refuses to overwrite an earlier batch', () => {
  const root = mkdtempSync(join(tmpdir(), 'factfind-import-test-'))
  try {
    const input = join(root, 'input.csv'), fields = join(root, 'mapping.json'), output = join(root, 'review')
    writeFileSync(input, 'Full name,Email,Photo\nMorgan Rivers,morgan@fictional-adviser.co.uk,\n')
    writeFileSync(fields, JSON.stringify(mapping))
    const run = () => spawnSync(process.execPath, ['scripts/prepare-adviser-import.mjs', input, fields, output], { encoding: 'utf8' })
    const first = run()
    assert.equal(first.status, 0, first.stderr)
    const report = JSON.parse(readFileSync(join(output, 'review.json'), 'utf8'))
    assert.equal(report.mode, 'preview_only')
    assert.equal(report.accounts_created, 0)
    assert.equal(report.emails_sent, 0)
    assert.ok(readFileSync(join(output, 'review.html'), 'utf8').includes('Morgan Rivers'))
    assert.equal(run().status, 1)
  } finally {
    // Only the exact directory returned by mkdtemp above belongs to this test.
    rmSync(root, { recursive: true, force: true })
  }
})
