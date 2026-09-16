import { createHash } from 'node:crypto'
import { PROFILE_FIELDS, prepareAdviserImport } from './adviser-import.mjs'

// Preparation only: deliberately no network, database, authentication or mail client.
export const reviewDigest = (raw) => createHash('sha256').update(raw).digest('hex')

export function normaliseWebsite(raw) {
  const value = raw.trim()
  if (!value) return { value: '', action: 'unchanged' }
  if (value.length <= 300 && !/[\s\\]/.test(value) && !value.startsWith('/')) {
    const candidate = /^(?:https?):\/\//i.test(value) ? value : `https://${value}`
    try {
      const url = new URL(candidate)
      const domain = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i
      if (['http:', 'https:'].includes(url.protocol) && domain.test(url.hostname) &&
          !url.username && !url.password && !url.port && candidate.length <= 300) {
        return { value: candidate, action: candidate === value ? 'unchanged' : 'added_https' }
      }
    } catch { /* Preserve the original in the audit, leave the optional prefill blank. */ }
  }
  return { value: '', action: 'confirm_website' }
}

export function stageAdviserBatch(rawReview, decisions, existingEmails) {
  const review = JSON.parse(rawReview)
  if (review.mode !== 'preview_only' || !Array.isArray(review.records) || !review.records.length) {
    throw new Error('Supply an original preview review.')
  }
  if (decisions.review_sha256 !== reviewDigest(rawReview)) throw new Error('Decisions do not match this exact review file.')
  if (!Array.isArray(decisions.records) || decisions.records.length !== review.records.length) {
    throw new Error('Every source response needs one explicit decision.')
  }
  if (!Array.isArray(existingEmails)) throw new Error('Supply the existing-account email snapshot.')
  const records = new Map(), choices = new Map()
  for (const record of review.records) {
    if (!record.source_id || records.has(record.source_id)) throw new Error('Source IDs must be present and unique.')
    records.set(record.source_id, record)
  }
  for (const decision of decisions.records) {
    if (!records.has(decision.source_id) || choices.has(decision.source_id) ||
        !['include', 'hold', 'exclude_test', 'exclude_invalid', 'supersede'].includes(decision.action) ||
        typeof decision.reason !== 'string' || !decision.reason.trim()) {
      throw new Error('Invalid, repeated or unexplained source decision.')
    }
    choices.set(decision.source_id, decision)
  }
  for (const decision of choices.values()) {
    if (decision.action !== 'supersede') continue
    const original = records.get(decision.source_id), winner = records.get(decision.superseded_by)
    if (!winner || choices.get(winner.source_id)?.action !== 'include' ||
        !original.profile.email || original.profile.email !== winner.profile.email) {
      throw new Error('A superseded response must name an included response with the same email.')
    }
  }
  const selected = [], audit = []
  for (const record of review.records) {
    const decision = choices.get(record.source_id)
    const changes = [], followUp = [
      'Confirm current membership and ownership of the selected email before activation.',
      'Adviser must confirm details, accept current terms and choose delivery preferences.',
    ]
    if (decision.action === 'include') {
      if (record.response_type !== 'completed' || !record.submitted_at) throw new Error(`Source row ${record.row} is incomplete.`)
      const profile = Object.fromEntries(PROFILE_FIELDS.map((key) => [key, record.profile[key] || '']))
      const website = normaliseWebsite(profile.website)
      if (website.action !== 'unchanged') {
        changes.push({ field: 'website', from: profile.website, to: website.value, reason: website.action })
        if (website.action === 'confirm_website') followUp.push('Confirm the website; ambiguous source value retained in the audit.')
        profile.website = website.value
      }
      if (/^'\+?[\d ()-]+$/.test(profile.phone)) {
        changes.push({ field: 'phone', from: profile.phone, to: profile.phone.slice(1), reason: 'removed_csv_text_prefix' })
        profile.phone = profile.phone.slice(1)
      }
      const sourceAssets = { avatar_url: profile.avatar_url, logo_url: profile.logo_url }
      profile.avatar_url = ''; profile.logo_url = ''
      followUp.push('Source images are separate from the profile prefill; verify and transfer them before activation.')
      selected.push({ source_id: record.source_id, row: record.row, submitted_at: record.submitted_at,
        profile_prefill: profile, source_assets: sourceAssets, changes, follow_up: followUp })
    }
    audit.push({ ...record, decision: { ...decision }, changes })
  }
  if (!selected.length) throw new Error('The batch has no included profiles.')
  const mapping = Object.fromEntries(PROFILE_FIELDS.map((key) => [key, key]))
  const checked = prepareAdviserImport(selected.map((entry) => entry.profile_prefill), mapping, { existingEmails })
  if (checked.counts.needs_review) {
    const rows = checked.records.filter((r) => r.issues.length).map((r) => selected[r.row - 1].row)
    throw new Error(`Included source rows still have validation or identity issues: ${rows.join(', ')}.`)
  }
  return {
    mode: 'staged_local_only', activation_ready: false, accounts_created: 0, emails_sent: 0,
    review_sha256: reviewDigest(rawReview), existing_accounts_checked: existingEmails.length,
    counts: { source_responses: review.records.length, selected_profiles: selected.length,
      held: audit.filter((r) => r.decision.action === 'hold').length,
      excluded_test: audit.filter((r) => r.decision.action === 'exclude_test').length,
      excluded_invalid: audit.filter((r) => r.decision.action === 'exclude_invalid').length,
      superseded: audit.filter((r) => r.decision.action === 'supersede').length,
      websites_normalised: selected.filter((r) => r.changes.some((c) => c.reason === 'added_https')).length,
      websites_to_confirm: selected.filter((r) => r.changes.some((c) => c.reason === 'confirm_website')).length,
      phones_normalised: selected.filter((r) => r.changes.some((c) => c.field === 'phone')).length },
    remaining: ['Owner review of held identities and current membership.',
      'Verify images and transfer them to adviser-owned storage when accounts are created.',
      'Implement and test account activation before releasing invitations.'],
    selected, audit,
  }
}
