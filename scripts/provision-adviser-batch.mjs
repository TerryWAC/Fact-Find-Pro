#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, join, relative, isAbsolute } from 'node:path'
import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { provisioningFetch } from './lib/provisioning-fetch.mjs'
import { PROFILE_FIELDS, prepareAdviserImport } from './lib/adviser-import.mjs'

const hash = (data) => createHash('sha256').update(data).digest('hex')
const types = ['mortgage', 'protection', 'medical', 'home']
const check = (result, label) => { if (result.error) throw new Error(`${label}: ${result.error.message}`); return result.data }

try {
  const [folder, confirm] = process.argv.slice(2)
  if (!folder || !confirm || process.argv.length !== 4) throw new Error('Usage: node --env-file=.env.local scripts/provision-adviser-batch.mjs <private-batch-folder> --project=<expected-project-ref>')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || confirm !== `--project=${new URL(url).hostname.split('.')[0]}`) throw new Error('Server credentials and the exact expected project reference are required.')
  const root = resolve(folder)
  const batchBytes = readFileSync(join(root, 'batch.json'))
  const batch = JSON.parse(batchBytes)
  const digest = hash(batchBytes)
  const inspection = JSON.parse(readFileSync(join(root, 'asset-inspection.json'), 'utf8'))
  const visual = JSON.parse(readFileSync(join(root, 'visual-review.json'), 'utf8'))
  if (batch.mode !== 'staged_local_only' || batch.activation_ready !== false || batch.accounts_created !== 0 || batch.emails_sent !== 0) throw new Error('Only an audited local preparation batch can be provisioned.')
  if (batch.selected.length !== batch.counts.selected_profiles || batch.audit.length !== batch.counts.source_responses) throw new Error('Batch counts do not match.')
  const validation = prepareAdviserImport(batch.selected.map((s) => s.profile_prefill), Object.fromEntries(PROFILE_FIELDS.map((key) => [key, key])), { existingEmails: [] })
  if (validation.counts.needs_review) throw new Error('Selected profiles contain unresolved validation issues.')
  const readAsset = (path) => {
    const absolute = resolve(root, path)
    const child = relative(root, absolute)
    if (child.startsWith('..') || isAbsolute(child)) throw new Error('Asset path leaves the reviewed batch.')
    return readFileSync(absolute)
  }
  for (const asset of inspection.assets) if (asset.status === 'downloaded' && hash(readAsset(asset.file)) !== asset.sha256) throw new Error('An original asset changed after review.')
  const selected = new Map(batch.selected.map((s) => [s.source_id, s]))
  if (selected.size !== batch.selected.length || new Set(batch.audit.map((s) => s.source_id)).size !== batch.audit.length) throw new Error('Repeated source identity.')
  for (const record of batch.audit) if ((record.decision.action === 'include') !== selected.has(record.source_id)) throw new Error('Source decisions and selected profiles disagree.')
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: provisioningFetch(url) } })
  const listAll = async (table) => {
    const rows = []
    for (let offset = 0; ; offset += 500) {
      const data = check(await client.from(table).select('*').range(offset, offset + 499), `Read ${table}`)
      rows.push(...data)
      if (data.length < 500) return rows
    }
  }
  const users = []
  for (let page = 1; ; page++) {
    const data = check(await client.auth.admin.listUsers({ page, perPage: 1000 }), 'Read existing auth accounts')
    users.push(...data.users)
    if (data.users.length < 1000) break
  }
  const [previous, profiles, allowlist, beforeMail] = await Promise.all([
    listAll('adviser_imports'), listAll('profiles'), listAll('admin_allowlist'),
    client.from('email_log').select('id', { head: true, count: 'exact' }),
  ])
  check(beforeMail, 'Read email count')
  const userByEmail = new Map(users.map((u) => [u.email?.toLowerCase(), u]))
  const profileById = new Map(profiles.map((p) => [p.id, p]))
  const previousById = new Map(previous.map((r) => [r.source_id, r]))
  for (const row of batch.audit) {
    const old = previousById.get(row.source_id)
    if (old && old.batch_sha256 !== digest) throw new Error(`Source row ${row.row} already belongs to a different batch.`)
  }
  for (const entry of batch.selected) {
    const user = userByEmail.get(entry.profile_prefill.email)
    if (allowlist.some((r) => r.email.toLowerCase() === entry.profile_prefill.email)) throw new Error(`Source row ${entry.row} is on the admin allowlist; stop for review.`)
    if (user && (user.app_metadata?.factfind_import_source_id !== entry.source_id || user.app_metadata?.factfind_import_digest !== digest)) throw new Error(`Source row ${entry.row} collides with an existing account; nothing will be overwritten.`)
    if (user && (user.email_confirmed_at || !user.banned_until || new Date(user.banned_until) <= new Date() || profileById.get(user.id)?.status !== 'pending')) throw new Error(`Source row ${entry.row} is no longer a dormant imported account.`)
  }
  const directory = batch.audit.map((row) => {
    const entry = selected.get(row.source_id)
    return { source_id: row.source_id, source_form_id: 'tldwHmoM', batch_label: 'Typeform Adviser Onboarding · September 2026', batch_sha256: digest,
      source_row: row.row, decision: row.decision.action, decision_reason: row.decision.reason, superseded_by: row.decision.superseded_by || null,
      name: row.profile.name, email: row.profile.email, company_name: row.profile.company_name,
      source_submitted_at: row.submitted_at ? `${row.submitted_at.replace(' ', 'T').replace(/Z$/, '')}Z` : null,
      source_profile: row.profile, profile_prefill: entry?.profile_prefill || {},
      follow_up: [...(entry?.follow_up || row.follow_up || []), ...(visual.notes.find((n) => n.source_row === row.row)?.notes || [])],
      asset_paths: {}, profile_id: null }
  })
  check(await client.from('adviser_imports').upsert(directory, { onConflict: 'source_id', ignoreDuplicates: true }), 'Record complete source directory')
  const receiptPath = join(root, 'provisioning-receipt.json')
  const receipt = { mode: 'prepared_not_invited', batch_sha256: digest, emails_sent: 0, created: [], verified: [] }
  if (existsSync(receiptPath)) {
    const old = JSON.parse(readFileSync(receiptPath, 'utf8'))
    if (old.batch_sha256 !== digest) throw new Error('The local receipt belongs to another batch.')
    receipt.created = old.created
  }
  const save = () => writeFileSync(receiptPath, JSON.stringify(receipt, null, 2))
  for (const entry of batch.selected) {
    let user = userByEmail.get(entry.profile_prefill.email)
    if (!user) {
      const data = check(await client.auth.admin.createUser({ email: entry.profile_prefill.email, email_confirm: false, ban_duration: '876000h',
        app_metadata: { factfind_import_source_id: entry.source_id, factfind_import_digest: digest },
        user_metadata: { name: entry.profile_prefill.name, company_name: entry.profile_prefill.company_name, phone: entry.profile_prefill.phone } }), `Create dormant account for source row ${entry.row}`)
      user = data.user
      userByEmail.set(user.email.toLowerCase(), user)
      receipt.created.push({ source_id: entry.source_id, profile_id: user.id }); save()
    }
    if (user.email_confirmed_at || !user.banned_until || new Date(user.banned_until) <= new Date()) throw new Error(`Source row ${entry.row} did not remain unconfirmed and dormant.`)
    const values = Object.fromEntries(PROFILE_FIELDS.filter((k) => !['avatar_url', 'logo_url', 'brand_colour'].includes(k)).map((k) => [k, entry.profile_prefill[k] || null]))
    const profile = check(await client.from('profiles').update({ ...values, import_pending: true }).eq('id', user.id).eq('status', 'pending').eq('role', 'adviser').select('id, adviser_slug, import_pending').single(), `Prefill source row ${entry.row}`)
    check(await client.from('factfind_forms').upsert(types.map((type) => ({ adviser_id: user.id, form_type: type, unique_slug: profile.adviser_slug, is_active: false })), { onConflict: 'adviser_id,form_type', ignoreDuplicates: true }), 'Reserve four FactFinds')
    const forms = check(await client.from('factfind_forms').select('*').eq('adviser_id', user.id), 'Verify reserved FactFinds')
    if (forms.length !== 4 || new Set(forms.map((f) => f.form_type)).size !== 4 || forms.some((f) => f.is_active || f.unique_slug !== profile.adviser_slug)) throw new Error(`Source row ${entry.row} has inconsistent FactFinds.`)
    const paths = {}
    for (const asset of inspection.assets.filter((a) => a.source_row === entry.row && a.preview)) {
      const bytes = readAsset(asset.preview)
      if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Only decoded PNG previews can be uploaded.')
      const path = `${entry.source_id}/${asset.kind}-${hash(bytes).slice(0, 20)}.png`
      const result = await client.storage.from('adviser-imports').upload(path, bytes, { contentType: 'image/png', upsert: false })
      if (result.error && !/already exists|duplicate/i.test(result.error.message)) throw new Error(`Source row ${entry.row} asset upload failed: ${result.error.message}`)
      paths[asset.kind] = path
    }
    check(await client.from('adviser_imports').update({ profile_id: user.id, asset_paths: paths }).eq('source_id', entry.source_id).eq('batch_sha256', digest), 'Link directory to prepared account')
    receipt.verified.push({ source_id: entry.source_id, profile_id: user.id, slug: profile.adviser_slug, form_count: forms.length, assets: Object.keys(paths).length }); save()
    if (receipt.verified.length % 10 === 0) console.log(JSON.stringify({ prepared: receipt.verified.length, total: batch.selected.length, emails_sent: 0 }))
  }
  const afterMail = await client.from('email_log').select('id', { head: true, count: 'exact' })
  check(afterMail, 'Verify email count')
  receipt.completed_at = new Date().toISOString()
  receipt.source_records = directory.length
  receipt.email_log_count_before = beforeMail.count
  receipt.email_log_count_after = afterMail.count
  save()
  console.log(JSON.stringify({ source_records: directory.length, prepared_accounts: receipt.verified.length, reserved_forms: receipt.verified.length * 4, emails_sent: 0, email_log_unchanged: beforeMail.count === afterMail.count }))
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Provisioning stopped; consult the private receipt before resuming.')
  process.exitCode = 1
}
