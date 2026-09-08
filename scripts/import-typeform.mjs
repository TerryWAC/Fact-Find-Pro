#!/usr/bin/env node
/**
 * Typeform → FactFind Pro schema converter.
 *
 *   node scripts/import-typeform.mjs <typeform-export.json> <mortgage|protection|medical|home> [out.json]
 *
 * Input is the full form definition from Typeform's Create API
 * (GET https://api.typeform.com/forms/{id}), which carries refs on every
 * field, group children under properties.fields, and refs on choices. The
 * lossy "export" from the Typeform UI is not enough.
 *
 * What it does
 *   • Splits the form into steps at each "Section N:" statement.
 *   • Groups become a sub-heading plus their fields; statements become copy.
 *   • Maps every Typeform type to an engine field type, upgrading free-text
 *     fields to date / currency / number / email / tel where the title makes
 *     the intent unambiguous. Every upgrade is printed so it can be audited.
 *   • Marks Applicant 1's name, email and phone as the client identity.
 *   • Applies branching. Typeform expresses it as jump rules; the engine as
 *     visibility. The rules for this template are declared in LOGIC below —
 *     derived from the jump rules, but written as intent, because two of the
 *     source rules are authoring slips (see comments) that should not be
 *     reproduced.
 */
import fs from 'node:fs'

const [, , input, formType = 'mortgage', output] = process.argv
if (!input) {
  console.error('usage: import-typeform.mjs <export.json> <formType> [out.json]')
  process.exit(1)
}
const src = JSON.parse(fs.readFileSync(input, 'utf8'))

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const slug = (s) =>
  s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48)

const usedIds = new Set()
function uniqueId(base) {
  let id = base || 'field'
  let n = 2
  while (usedIds.has(id)) id = `${base}_${n++}`
  usedIds.add(id)
  return id
}

/** Short prefix for a group so ids stay readable and unique across applicants. */
function groupPrefix(title) {
  const t = title.toLowerCase()
  const m = t.match(/buy-to-let property (\d)/)
  if (m) return `btl${m[1]}`
  if (t.includes('applicant 1')) return t.includes('employment') ? (t.includes('status') ? 'a1_emp' : 'a1_pay') : t.includes('health') ? 'a1_health' : 'a1'
  if (t.includes('applicant 2')) {
    if (t.includes('sick')) return 'sp2'
    return t.includes('employment') ? (t.includes('status') ? 'a2_emp' : 'a2_pay') : t.includes('health') ? 'a2_health' : 'a2'
  }
  if (t.includes('sick pay')) return 'sp1'
  if (t.includes('children')) return 'dep'
  if (t.includes('monthly expenses')) return 'exp'
  if (t.includes('ccj')) return 'ccj'
  if (t.includes('bankrupt')) return 'bk'
  if (t.includes('purchase')) return 'purchase'
  if (t.includes('remortgage')) return 'remortgage'
  if (t.includes('protection')) return 'prot'
  if (t.includes('pension')) return 'pension'
  if (t.includes('admin')) return 'admin'
  return slug(title).slice(0, 12)
}

const audit = { upgrades: [], required: [], dropped: [], visibility: [] }

/** Free-text fields whose title makes a stronger input type unambiguous. */
function upgradeType(tfType, title) {
  const t = title.toLowerCase()
  if (tfType === 'short_text' || tfType === 'long_text') {
    if (/dd\/mm\/yyyy|date of birth|\bd\.o\.b\b|^date /.test(t) && !/and when|and discharge/.test(t)) return 'date'
    if (/^email$/.test(t)) return 'email'
    if (/^phone number$/.test(t)) return 'tel'
    if (/how many|number of (bedrooms|bathrooms)|months missed|year of build|retirement age|until what age/.test(t)) return 'number'
    if (/gross annual pay|net monthly pay|\(monthly\)|purchase amount|estimated value|outstanding loan|ccj amount|rental income|total monthly expenditure|how much sick pay/.test(t)) return 'currency'
    if (/interest rate/.test(t)) return 'percent'
  }
  return null
}

function convertField(tf, { prefix, colSpanDefault = 1 } = {}) {
  const title = tf.title.trim()
  const tfType = tf.type
  const required = Boolean(tf.validations?.required)
  const help = tf.properties?.description?.trim() || undefined
  const base = prefix ? `${prefix}_${slug(title)}` : slug(title)
  const id = uniqueId(base)
  const f = { id, label: title, source: tf.ref }
  if (help) f.helpText = help
  if (required) f.required = true

  const upgraded = upgradeType(tfType, title)
  if (upgraded) audit.upgrades.push(`${id}: ${tfType} → ${upgraded}`)

  switch (tfType) {
    case 'short_text':
      f.type = upgraded ?? 'text'
      f.colSpan = colSpanDefault
      break
    case 'long_text':
      f.type = upgraded ?? 'textarea'
      f.colSpan = upgraded ? colSpanDefault : 2
      if (!upgraded) f.rows = 3
      break
    case 'date':
      f.type = 'date'
      f.colSpan = colSpanDefault
      break
    case 'yes_no':
      f.type = 'yesno'
      f.colSpan = 2
      break
    case 'multiple_choice':
    case 'dropdown': {
      const choices = tf.properties.choices.map((c) => ({ value: slug(c.label), label: c.label }))
      const multi = Boolean(tf.properties.allow_multiple_selection)
      f.options = choices
      f.type = multi ? 'checkbox-group' : tfType === 'dropdown' || choices.length > 3 ? 'select' : 'radio'
      f.colSpan = f.type === 'radio' && choices.length > 2 ? 2 : colSpanDefault
      break
    }
    case 'checkbox': {
      // Typeform "checkbox" = multi-select. A single required choice is a consent tick.
      const choices = tf.properties.choices
      if (choices.length === 1) {
        f.type = 'checkbox'
        f.label = `${title} — ${choices[0].label}`
        f.colSpan = 2
      } else {
        f.type = 'checkbox-group'
        f.options = choices.map((c) => ({ value: slug(c.label), label: c.label }))
        f.colSpan = 2
      }
      break
    }
    case 'number':
      f.type = 'number'
      f.colSpan = colSpanDefault
      break
    case 'email':
      f.type = 'email'
      f.colSpan = colSpanDefault
      break
    case 'phone_number':
      f.type = 'tel'
      f.colSpan = colSpanDefault
      break
    default:
      throw new Error(`Unhandled Typeform type ${tfType} (${title})`)
  }
  return f
}

// ---------------------------------------------------------------------------
// Steps: split at "Section N:" statements
// ---------------------------------------------------------------------------
const top = src.fields
const sectionRe = /^Section\s+(\d+)\s*:\s*(.+)$/i

const steps = []
let current = null
const topIndexToStep = new Map()

for (let i = 0; i < top.length; i++) {
  const tf = top[i]
  const m = tf.type === 'statement' ? tf.title.match(sectionRe) : null

  if (m) {
    const rawTitle = m[2].trim()
    const internal = /\(internal\)/i.test(rawTitle)
    const title = rawTitle.replace(/\s*\(internal\)\s*/i, '').trim()
    current = { id: `s${m[1]}_${slug(title)}`, title, fields: [], _internal: internal, _n: Number(m[1]) }
    if (internal) current.description = 'Adviser use only — not shown to clients.'
    steps.push(current)
    topIndexToStep.set(i, current)
    continue
  }

  if (!current) {
    // Adviser-specific intro statements before Section 1 — the platform
    // already shows the adviser's name and branding in the page header.
    audit.dropped.push(`#${i} ${tf.type}: ${tf.title.slice(0, 60)}`)
    continue
  }

  topIndexToStep.set(i, current)

  if (tf.type === 'statement') {
    current.fields.push({ id: uniqueId(`${current.id}_note`), type: 'paragraph', label: tf.title, colSpan: 2, source: tf.ref, _top: i })
  } else if (tf.type === 'inline_group') {
    const prefix = groupPrefix(tf.title)
    const heading = tf.title.replace(/^Section \d+:\s*/i, '').replace(/^Please enter (information about your |)/i, '').trim()
    const headingLabel = heading.charAt(0).toUpperCase() + heading.slice(1)
    current.fields.push({ id: uniqueId(`${prefix}_heading`), type: 'heading', label: headingLabel, colSpan: 2, source: tf.ref, _top: i })
    for (const child of tf.properties.fields) {
      const f = convertField(child, { prefix })
      f._top = i
      current.fields.push(f)
    }
  } else {
    const f = convertField(tf, { colSpanDefault: 2 })
    f._top = i
    current.fields.push(f)
  }
}

// ---------------------------------------------------------------------------
// Identity + gate ids (stable names the logic below refers to)
// ---------------------------------------------------------------------------
const all = steps.flatMap((s) => s.fields)
const byTop = (i) => all.filter((f) => f._top === i)
function rename(field, newId) {
  usedIds.delete(field.id)
  field.id = newId
  usedIds.add(newId)
}
function findByLabel(re, topIdx) {
  return all.find((f) => (topIdx === undefined || f._top === topIdx) && re.test(f.label ?? ''))
}

const gates = {
  who: findByLabel(/^Who is completing this form\?$/),
  joint: findByLabel(/^Is this a joint case\?$/),
  children: findByLabel(/^Do you have children or dependants\?$/),
  ccj: findByLabel(/^Have you ever had a CCJ\?$/),
  bankrupt: findByLabel(/^Have you ever been made bankrupt\?$/),
  mortgageType: findByLabel(/^Is this a purchase or a remortgage\?$/),
  btl: findByLabel(/background buy-to-let/i),
  btlCount: findByLabel(/^If yes, how many\?$/),
  will: findByLabel(/^Do you have a will\?$/),
}
for (const [k, v] of Object.entries(gates)) if (!v) throw new Error(`gate not found: ${k}`)
rename(gates.who, 'who_completing'); rename(gates.joint, 'joint_case'); rename(gates.children, 'has_dependants')
rename(gates.ccj, 'has_ccj'); rename(gates.bankrupt, 'has_bankruptcy'); rename(gates.mortgageType, 'mortgage_type')
rename(gates.btl, 'has_btl'); rename(gates.btlCount, 'btl_count'); rename(gates.will, 'pension_has_will')

// A client-facing link defaults to "Client"; an adviser filling it in switches.
gates.who.defaultValue = 'client'
gates.who.helpText = 'Choose "Adviser" to unlock the internal sections.'

// "How many buy-to-lets" drives which property blocks appear — make it a pick.
gates.btlCount.type = 'select'
gates.btlCount.options = [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }]
gates.btlCount.colSpan = 1

// Applicant 1 identity — the submission is bound to the client through these.
const a1Name = findByLabel(/^Full Name$/, 11), a1Email = findByLabel(/^Email$/, 11), a1Phone = findByLabel(/^Phone Number$/, 11)
rename(a1Name, 'client_name'); a1Name.identity = 'client_name'; a1Name.required = true
rename(a1Email, 'client_email'); a1Email.identity = 'client_email'; a1Email.type = 'email'; a1Email.required = true
rename(a1Phone, 'client_phone'); a1Phone.identity = 'client_phone'; a1Phone.type = 'tel'
audit.required.push('client_name, client_email (were optional in Typeform; a submission must identify the client)')

// ---------------------------------------------------------------------------
// Branching — declared as intent, derived from the Typeform jump rules.
// ---------------------------------------------------------------------------
const eq = (field, value) => ({ field, operator: 'eq', value })
const yes = (field) => eq(field, 'yes')
const IS_ADVISER = eq('who_completing', 'adviser')

const stepByN = (n) => steps.find((s) => s._n === n)
function stepVisible(n, cond, why) { stepByN(n).visibleWhen = cond; audit.visibility.push(`step ${n} "${stepByN(n).title}": ${why}`) }
function topVisible(i, cond, why) {
  const fs = byTop(i); if (!fs.length) throw new Error(`no fields for top #${i}`)
  for (const f of fs) f.visibleWhen = cond
  audit.visibility.push(`#${i} ${top[i].title.slice(0, 40)}: ${why}`)
}

// Rule "Who is completing?": Client → jump past sections 2–3.
stepVisible(2, IS_ADVISER, 'adviser only'); stepVisible(3, IS_ADVISER, 'adviser only')
// Section 13 has no jump rule in the source but is labelled (Internal) — treated the same.
stepVisible(13, IS_ADVISER, 'adviser only (labelled Internal)')
// Rule "joint case": No → jump past Section 5; and past Applicant 2 employment; and past Applicant 2 sick pay.
stepVisible(5, yes('joint_case'), 'joint applications only')
for (const i of [25, 26, 27]) topVisible(i, yes('joint_case'), 'joint applications only')
topVisible(45, yes('joint_case'), 'joint applications only')
// Rule "children": No → jump to Section 7.
for (const i of [19, 20]) topVisible(i, yes('has_dependants'), 'has dependants')
// Rule "CCJ": Yes → CCJ details. (Source's No-branch jumps *past* the bankruptcy
// question — an authoring slip; the question is kept.)
topVisible(31, yes('has_ccj'), 'has a CCJ')
// Rule "bankrupt": Yes → bankruptcy details.
topVisible(33, yes('has_bankruptcy'), 'has been bankrupt')
// Rule "purchase or remortgage". (Source's fallback loops back to the section
// header when unanswered — not reproduced.)
topVisible(36, eq('mortgage_type', 'purchase'), 'purchase'); topVisible(37, eq('mortgage_type', 'remortgage'), 'remortgage')
// Buy-to-let: count gates the property blocks. No jump rule in the source —
// the blocks were always shown; gating them on the count is the evident intent.
topVisible(39, yes('has_btl'), 'has BTL')
topVisible(40, { all: [yes('has_btl'), { field: 'btl_count', operator: 'in', value: ['1', '2', '3'] }] }, 'BTL count ≥ 1')
topVisible(41, { all: [yes('has_btl'), { field: 'btl_count', operator: 'in', value: ['2', '3'] }] }, 'BTL count ≥ 2')
topVisible(42, { all: [yes('has_btl'), { field: 'btl_count', operator: 'in', value: ['3'] }] }, 'BTL count = 3')
// Rule in Pension group: has a will → skip "do you understand the consequences".
const consequences = findByLabel(/consequences if you don't have a will/i)
consequences.visibleWhen = eq('pension_has_will', 'no'); audit.visibility.push(`${consequences.id}: only when no will`)

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------
for (const s of steps) { delete s._internal; delete s._n }
for (const f of all) delete f._top

const schema = {
  type: formType,
  version: `1.0.0-typeform-${src.id}`,
  title: `${formType.charAt(0).toUpperCase() + formType.slice(1)} FactFind`,
  subtitle: 'A few sections so your adviser can find the right mortgage and protection for you.',
  intro: 'Your answers are saved when you submit and go straight to your adviser. Sections that do not apply to you are skipped automatically.',
  estimatedMinutes: 20,
  placeholder: false,
  submitLabel: 'Submit FactFind',
  successTitle: 'Thank you — your FactFind has been submitted',
  successMessage: (src.thankyou_screens?.[0]?.title) || 'Your adviser will be in touch shortly.',
  steps,
}

const out = output ?? `src/lib/forms/schemas/${formType}.json`
fs.writeFileSync(out, JSON.stringify(schema, null, 2) + '\n')

const leaf = all.filter((f) => !['heading', 'paragraph', 'divider'].includes(f.type))
console.log(`✔ ${src.title} → ${out}`)
console.log(`  ${steps.length} steps · ${leaf.length} questions · ${all.length - leaf.length} headings/notes`)
console.log(`\nType upgrades (${audit.upgrades.length}):`); audit.upgrades.forEach((l) => console.log('  ' + l))
console.log(`\nRequired overrides:`); audit.required.forEach((l) => console.log('  ' + l))
console.log(`\nDropped (${audit.dropped.length}):`); audit.dropped.forEach((l) => console.log('  ' + l))
console.log(`\nVisibility rules (${audit.visibility.length}):`); audit.visibility.forEach((l) => console.log('  ' + l))
