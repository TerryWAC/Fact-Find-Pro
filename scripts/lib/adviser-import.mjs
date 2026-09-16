import { z } from 'zod'

// Deliberately independent of Supabase and email: this module only prepares a review.
export const PROFILE_FIELDS = [
  'name', 'email', 'company_name', 'phone', 'job_title', 'fca_number',
  'website', 'business_location', 'avatar_url', 'logo_url', 'brand_colour',
]

export function parseCsv(input) {
  const rows = []
  let row = [], cell = '', quoted = false, closed = false
  const source = input.replace(/^\uFEFF/, '')
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { cell += '"'; i++ }
      else if (char === '"') { quoted = false; closed = true }
      else cell += char
    } else if (char === ',' || char === '\n' || char === '\r') {
      row.push(cell); cell = ''; closed = false
      if (char !== ',') {
        if (row.some((value) => value !== '')) rows.push(row)
        row = []
        if (char === '\r' && source[i + 1] === '\n') i++
      }
    } else if (char === '"' && cell === '' && !closed) quoted = true
    else {
      if (closed || char === '"') throw new Error('Malformed CSV quoting. Export the CSV again.')
      cell += char
    }
  }
  if (quoted) throw new Error('CSV ends inside a quoted field.')
  if (cell !== '' || row.length || closed) { row.push(cell); rows.push(row) }
  if (!rows.length) throw new Error('The CSV is empty.')
  const headers = rows.shift().map((value) => value.trim())
  if (headers.some((value) => !value) || new Set(headers).size !== headers.length) {
    throw new Error('CSV headers must be non-empty and unique. Rename repeated question headings first.')
  }
  return rows.map((values, index) => {
    if (values.length !== headers.length) throw new Error(`CSV row ${index + 2} has the wrong number of columns.`)
    return Object.fromEntries(headers.map((key, column) => [key, values[column]]))
  })
}

function textValue(value) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return ''
}

function answerValue(answer) {
  if (answer.type === 'choice') return textValue(answer.choice?.label)
  if (['text', 'email', 'phone_number', 'url', 'file_url', 'number'].includes(answer.type)) {
    return textValue(answer[answer.type])
  }
  return ''
}

function safeUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !/\s/.test(value)
  } catch { return false }
}

export function prepareAdviserImport(input, mapping, options = {}) {
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) throw new Error('Provide an explicit field mapping.')
  for (const [key, selectors] of Object.entries(mapping)) {
    if (!PROFILE_FIELDS.includes(key)) throw new Error(`Unsupported destination field: ${key}`)
    if (!(typeof selectors === 'string' && selectors.trim()) &&
        !(Array.isArray(selectors) && selectors.length && selectors.every((s) => typeof s === 'string' && s.trim()))) {
      throw new Error(`Invalid source mapping for ${key}.`)
    }
  }
  if (!mapping.name || !mapping.email) throw new Error('Map both name and email before preparing an import.')
  const isTypeform = !Array.isArray(input) && Array.isArray(input?.items)
  const items = isTypeform ? input.items : input
  if (!Array.isArray(items) || !items.length) throw new Error('No adviser records were supplied.')
  if (items.length > 10000) throw new Error('Limit each review batch to 10,000 records.')
  const isTypeformCsv = !isTypeform && items.every((item) => item &&
    ['#', 'Response Type', 'Submit Date (UTC)'].every((key) => Object.hasOwn(item, key)))
  const sourceKeys = new Set()
  const records = items.map((item, index) => {
    const values = new Map()
    if (isTypeform) {
      for (const answer of item.answers ?? []) {
        for (const key of [answer.field?.id, answer.field?.ref].filter(Boolean)) {
          sourceKeys.add(key)
          const value = answerValue(answer)
          if (values.has(key) && values.get(key) !== value) throw new Error(`Ambiguous Typeform field in record ${index + 1}.`)
          values.set(key, value)
        }
      }
    } else {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`Invalid record ${index + 1}.`)
      for (const [key, value] of Object.entries(item)) { sourceKeys.add(key); values.set(key, textValue(value)) }
    }
    const profile = Object.fromEntries(PROFILE_FIELDS.map((key) => {
      const selectors = mapping[key] ? [mapping[key]].flat() : []
      return [key, selectors.map((selector) => values.get(selector) || '').filter(Boolean).join(' ')]
    }))
    profile.email = profile.email.toLowerCase()
    if (/^#?[0-9a-f]{6}$/i.test(profile.brand_colour)) profile.brand_colour = `#${profile.brand_colour.replace('#', '').toUpperCase()}`
    const issues = []
    if (profile.name.length < 2 || profile.name.length > 120) issues.push('Name is missing or exceeds 120 characters')
    if (!z.string().email().safeParse(profile.email).success) issues.push('Missing or invalid email')
    const limits = { company_name: 160, phone: 24, job_title: 120, fca_number: 40, website: 300, business_location: 160 }
    for (const [key, limit] of Object.entries(limits)) if (profile[key].length > limit) issues.push(`${key} exceeds ${limit} characters`)
    for (const key of ['website', 'avatar_url', 'logo_url']) if (profile[key] && !safeUrl(profile[key])) issues.push(`Invalid ${key}`)
    if (profile.brand_colour && !/^#[0-9A-F]{6}$/.test(profile.brand_colour)) issues.push('Invalid brand colour')
    const responseType = isTypeform ? item.response_type : isTypeformCsv ? item['Response Type'] : undefined
    const submittedAt = isTypeform ? item.submitted_at : isTypeformCsv ? item['Submit Date (UTC)'] : undefined
    if ((isTypeform || isTypeformCsv) && ((responseType && responseType !== 'completed') || !submittedAt || (isTypeformCsv && !responseType))) {
      issues.push('Incomplete Typeform response')
    }
    if (/\b(test|testing|demo|dummy|lorem ipsum)\b/i.test(`${profile.name} ${profile.company_name}`) ||
        /(^test([+._-]|@)|\+factfind-test|@(example\.(com|org|net)|test\.invalid)$)/i.test(profile.email)) {
      issues.push('Possible test entry: review before including')
    }
    return { row: index + 1, source_id: textValue(isTypeformCsv ? item['#'] : item.response_id ?? item.token),
      response_type: textValue(responseType), submitted_at: textValue(submittedAt), profile, issues,
      follow_up: [!profile.avatar_url && 'Add a photo if wanted', !profile.company_name && 'Confirm company name',
        (profile.avatar_url || profile.logo_url) && 'Copy and verify images before activation; source links may require Typeform access',
        /\.pdf(?:\?|$)/i.test(profile.avatar_url) && 'Photo was supplied as a PDF: inspect and convert before using',
        /\.pdf(?:\?|$)/i.test(profile.logo_url) && 'Logo was supplied as a PDF: inspect and convert before using',
        'Confirm current details and delivery preferences; accept current terms on activation'].filter(Boolean) }
  })
  for (const selectors of Object.values(mapping)) {
    for (const selector of [selectors].flat()) if (!sourceKeys.has(selector)) throw new Error(`Mapped source field not found: ${selector}`)
  }
  const emails = new Map()
  const sourceIds = new Map()
  const identities = new Map()
  const identityKey = (profile) => profile.company_name && `${profile.name}::${profile.company_name}`.toLowerCase().replace(/\s+/g, ' ').trim()
  for (const record of records) {
    if (record.profile.email) emails.set(record.profile.email, (emails.get(record.profile.email) || 0) + 1)
    if (record.source_id) sourceIds.set(record.source_id, (sourceIds.get(record.source_id) || 0) + 1)
    const key = identityKey(record.profile)
    if (key && record.profile.email) {
      if (!identities.has(key)) identities.set(key, new Set())
      identities.get(key).add(record.profile.email)
    }
  }
  const existing = options.existingEmails
  if (existing !== undefined && (!Array.isArray(existing) || existing.some((value) => typeof value !== 'string'))) {
    throw new Error('Existing emails must be a JSON array of strings.')
  }
  const existingSet = new Set((existing ?? []).map((email) => email.trim().toLowerCase()))
  for (const record of records) {
    if ((emails.get(record.profile.email) || 0) > 1) record.issues.push('Duplicate email in this batch: resolve manually')
    if (record.source_id && sourceIds.get(record.source_id) > 1) record.issues.push('Repeated source response: resolve manually')
    if (existingSet.has(record.profile.email)) record.issues.push('Account already exists: review without overwriting')
    if ((identities.get(identityKey(record.profile))?.size || 0) > 1) record.issues.push('Same name and company with different emails: confirm account identity')
    record.review_status = record.issues.length ? 'needs_review' : 'candidate'
  }
  return {
    mode: 'preview_only', accounts_created: 0, emails_sent: 0,
    source_format: isTypeform ? 'typeform_responses_json' : isTypeformCsv ? 'typeform_responses_csv' : 'mapped_rows',
    existing_accounts_checked: existing !== undefined,
    warnings: [existing === undefined && 'Existing accounts have not been checked.',
      isTypeform && input.total_items > items.length && 'This export is a partial page; retrieve all pages before migration.',
      'Candidate means structurally valid only. Membership, ownership of each email, and image access still need verification.'].filter(Boolean),
    counts: { total: records.length, candidates: records.filter((r) => !r.issues.length).length,
      needs_review: records.filter((r) => r.issues.length).length,
      with_photo: records.filter((r) => r.profile.avatar_url).length },
    records,
  }
}

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

export function renderAdviserReview(report) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>Existing advisers · Import review</title><style>
body{margin:0;background:#f5f6f8;color:#17212d;font:16px/1.55 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:36px 20px}h1{font-size:34px;line-height:1.15}h2{font-size:19px;margin:0}p{margin:8px 0}small{color:#516072}.notice,article{background:white;border:1px solid #dbe1e8;border-radius:14px;padding:20px;margin:16px 0}.badge{display:inline-block;background:#edf2f7;border-radius:6px;padding:3px 9px;font-size:13px;margin:8px 0}ul{padding-left:22px}.email{overflow-wrap:anywhere}.stats{font-weight:650}.warning{color:#854a0e}a{color:#164a81}</style>
<main><small>FACTFIND PRO · PRIVATE REVIEW</small><h1>Bring your existing advisers with you</h1>
<div class="notice"><strong>Preview only. No accounts created. No emails sent.</strong><p>Proposed activation: choose a password, confirm imported details and images, accept current terms, review delivery choices, then open the dashboard.</p></div>
<p class="stats">${report.counts.total} records · ${report.counts.candidates} candidates · ${report.counts.needs_review} need review · ${report.counts.with_photo} include a photo link</p>
<ul>${report.warnings.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul>
${report.records.map((record) => `<article><small>Source row ${record.row}</small><h2>${escapeHtml(record.profile.name || 'Name missing')}</h2>
<p class="email">${escapeHtml(record.profile.email || 'Email missing')}</p><p>${escapeHtml(record.profile.company_name || 'Company to confirm')}</p>
<span class="badge">${record.review_status === 'candidate' ? 'Candidate for review' : 'Needs attention'}</span>
<ul class="warning">${record.issues.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul>
<small>${record.profile.avatar_url ? 'Photo link supplied (not downloaded or verified).' : 'No photo link supplied.'} ${record.profile.logo_url ? 'Logo link supplied (not downloaded or verified).' : ''}</small>
<ul>${record.follow_up.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul></article>`).join('')}</main></html>`
}
