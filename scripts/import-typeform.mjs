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
 *   • Splits the form into steps at each header statement ("Section N: …" or
 *     a bare title such as "Property Details"). Forms with no statements at
 *     all (Medical) use their Typeform question groups as steps.
 *   • Groups become a sub-heading plus their fields; statements become copy.
 *   • Maps every Typeform type to an engine field type, upgrading free-text
 *     fields to date / currency / number / email / tel where the title makes
 *     the intent unambiguous. Every upgrade is printed so it can be audited.
 *   • Marks the client's name, email and phone as the client identity.
 *   • Applies branching. Typeform expresses it as jump rules; the engine as
 *     visibility. "Yes → details, No → skip" rules are translated
 *     mechanically; template-wide rules (adviser-only sections, joint case…)
 *     are declared per template in LOGIC below, as intent, because a few of
 *     the source rules are authoring slips that should not be reproduced.
 *
 * Run scripts/verify-typeform-import.mjs afterwards — it proves the result.
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
  s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48).replace(/_+$/g, '')

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
  if (t.includes('contact')) return 'contact'
  if (t.includes('client information')) return 'client'
  if (t.includes('lifestyle')) return 'lifestyle'
  if (t.includes('family health')) return 'family'
  if (t.includes('health continued')) return 'health5'
  if (t.includes('your health')) return 'health'
  if (t.startsWith('gp')) return 'gp'
  if (t.includes('additional')) return 'additional'
  return slug(title).slice(0, 12)
}

/** Adviser intro copy at the top of every template — the platform shows the adviser's own branding instead. */
const INTRO_RE = /^(My name is|We're delighted)/i
/** "Yes → details" follow-ups; their id is derived from the question they follow. */
const DETAILS_RE = /^(if yes,? )?(please )?(provide|enter) (details|information|all relevant info)/i

const audit = { upgrades: [], required: [], dropped: [], added: [], visibility: [], repairs: [] }

/** Free-text fields whose title makes a stronger input type unambiguous. */
function upgradeType(tfType, title) {
  const t = title.toLowerCase()
  if (tfType === 'short_text' || tfType === 'long_text') {
    if (/dd\/mm\/yyyy|date of birth|\bd\.o\.b\b|^date /.test(t) && !/and when|and discharge/.test(t)) return 'date'
    if (/^email( address)?$/.test(t)) return 'email'
    if (/^phone number$/.test(t)) return 'tel'
    if (/how many|number of (bedrooms|bathrooms)|months missed|year (of build|built)|retirement age|until what age/.test(t)) return 'number'
    if (/gross annual pay|net monthly pay|\(monthly\)|housing costs|purchase amount|estimated value|outstanding loan|ccj amount|rental income|total monthly expenditure|how much sick pay/.test(t)) return 'currency'
    if (/interest rate/.test(t)) return 'percent'
  }
  if (tfType === 'number' && /sum insured/.test(t)) return 'currency'
  return null
}

function convertField(tf, { prefix, colSpanDefault = 1, prev } = {}) {
  let title = tf.title.trim()
  // Stray outline numbering in the source ("2d. Do you currently smoke?").
  const numbered = title.match(/^\d+[a-z]\.\s+(.*)$/)
  if (numbered) { title = numbered[1]; audit.repairs.push(`"${tf.title.trim()}" → "${title}" (outline number dropped)`) }
  const tfType = tf.type
  const required = Boolean(tf.validations?.required)
  const help = tf.properties?.description?.trim() || undefined
  const base = DETAILS_RE.test(title) && prev && ['yesno', 'radio', 'select'].includes(prev.type)
    ? `${prev.id}_details`
    : prefix ? `${prefix}_${slug(title)}` : slug(title)
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
      f.type = upgraded ?? 'number'
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
// Steps
//   • Every statement that is not adviser intro copy is a step header
//     ("Section 4: Applicant 1 Details" or just "Property Details").
//   • A form with no header statements (Medical) uses its top-level question
//     groups as steps instead.
// ---------------------------------------------------------------------------
const top = src.fields
const sectionRe = /^Section\s+(\d+)\s*:\s*(.+)$/i
const GROUP_TYPES = new Set(['inline_group', 'group', 'contact_info'])
const isHeader = (tf) => tf.type === 'statement' && !INTRO_RE.test(tf.title)
const headerless = !top.some(isHeader)

const steps = []
let current = null
const topIndexToStep = new Map()
const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1)

function openStep(tf, rawTitle, n) {
  const internal = /\(internal\)/i.test(rawTitle)
  const title = rawTitle.replace(/\s*\(internal\)\s*/i, '').trim()
  current = { id: `s${n}_${slug(title)}`, title, source: tf.ref, fields: [], _internal: internal }
  if (internal) current.description = 'Adviser use only — not shown to clients.'
  steps.push(current)
}

for (let i = 0; i < top.length; i++) {
  const tf = top[i]

  if (tf.type === 'statement') {
    if (INTRO_RE.test(tf.title)) { audit.dropped.push(`#${i} ${tf.type}: ${tf.title.slice(0, 60)}`); continue }
    const m = tf.title.match(sectionRe)
    openStep(tf, m ? m[2].trim() : tf.title.trim(), m ? Number(m[1]) : steps.length + 1)
    topIndexToStep.set(i, current)
    continue
  }

  if (headerless && GROUP_TYPES.has(tf.type)) {
    // The group is the step; its questions sit directly in it.
    openStep(tf, tf.title.trim(), steps.length + 1)
    topIndexToStep.set(i, current)
    const prefix = groupPrefix(tf.title)
    let prev = null
    for (const child of tf.properties.fields) {
      const f = convertField(child, { prefix, prev })
      f._top = i
      current.fields.push(f)
      prev = f
    }
    continue
  }

  if (!current) throw new Error(`question "${tf.title}" appears before the first section header`)
  topIndexToStep.set(i, current)

  if (GROUP_TYPES.has(tf.type)) {
    const prefix = groupPrefix(tf.title)
    const heading = tf.title.replace(/^Section \d+:\s*/i, '').replace(/^Please enter (information about your |)/i, '').trim()
    const headingLabel = /sick pay info applicant 2/i.test(tf.title) ? 'Applicant 2'
      : /sick pay info/i.test(tf.title) ? 'Applicant 1'
      : titleCase(heading)
    current.fields.push({ id: uniqueId(`${prefix}_heading`), type: 'heading', label: headingLabel, colSpan: 2, source: tf.ref, _top: i })
    let prev = null
    for (const child of tf.properties.fields) {
      const f = convertField(child, { prefix, prev })
      f._top = i
      current.fields.push(f)
      prev = f
    }
  } else {
    const prevField = current.fields[current.fields.length - 1]
    const f = convertField(tf, { colSpanDefault: 2, prev: prevField })
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
  parents: findByLabel(/^Are both of your parents still alive\?$/),
}
const GATE_IDS = { who: 'who_completing', joint: 'joint_case', children: 'has_dependants', ccj: 'has_ccj',
  bankrupt: 'has_bankruptcy', mortgageType: 'mortgage_type', btl: 'has_btl', btlCount: 'btl_count', will: 'pension_has_will',
  parents: 'family_parents_alive' }
for (const [k, f] of Object.entries(gates)) if (f) rename(f, GATE_IDS[k])
const need = (k) => { if (!gates[k]) throw new Error(`this form has no "${k}" gate but its logic needs one`); return GATE_IDS[k] }

if (gates.who) {
  // A client-facing link defaults to "Client"; an adviser filling it in switches.
  gates.who.defaultValue = 'client'
  gates.who.helpText = 'Choose "Adviser" to unlock the internal sections.'
}
if (gates.btlCount) {
  // "How many buy-to-lets" drives which property blocks appear — make it a pick.
  gates.btlCount.type = 'select'
  gates.btlCount.options = [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }]
  gates.btlCount.colSpan = 1
}

// Client identity — the submission is bound to the client through these. The
// first matching field in document order is the client's (Applicant 1's).
const idName = findByLabel(/^Full Name$/)
const idFirst = findByLabel(/^(First Name|What is your first name\?)$/)
const idLast = findByLabel(/^(Last Name|What is your surname\?)$/)
const idEmail = findByLabel(/^(Email|Email Address)$/)
const idPhone = findByLabel(/^Phone Number$/)
const requiredOverrides = []
function markIdentity(f, id, extra = {}) {
  rename(f, id); f.identity = id; Object.assign(f, extra)
  if (!f.required) { f.required = true; requiredOverrides.push(id) }
}
if (idName) markIdentity(idName, 'client_name')
else if (idFirst && idLast) { markIdentity(idFirst, 'client_first_name'); markIdentity(idLast, 'client_last_name') }
else throw new Error('cannot find the client name field(s)')
if (idEmail) markIdentity(idEmail, 'client_email', { type: 'email' })
else {
  // The platform needs an email to deliver the submission and to bind it to
  // the client. Medical has none in Typeform — add one after the name.
  const anchor = idLast ?? idName
  const step = steps.find((s) => s.fields.includes(anchor))
  const added = { id: 'client_email', label: 'Email address', type: 'email', colSpan: anchor.colSpan ?? 1, required: true,
    identity: 'client_email', source: 'factfind-pro:client_email', _top: anchor._top }
  usedIds.add('client_email')
  step.fields.splice(step.fields.indexOf(anchor) + 1, 0, added)
  all.splice(all.indexOf(anchor) + 1, 0, added)
  audit.added.push('client_email: no email question in the Typeform template; the platform needs one to deliver the submission')
}
if (idPhone) { rename(idPhone, 'client_phone'); idPhone.identity = 'client_phone'; idPhone.type = 'tel' }
audit.required.push(`${requiredOverrides.join(', ')} (were optional in Typeform; a submission must identify the client)`)

// Source-data repairs — flaws in the Typeform templates themselves.
// 1. Applicant 1's employment-status dropdown is titled literally "..." in
//    Typeform (Applicant 2's is titled properly). Give it its real name.
const a1Status = all.find((f) => f.label === '...' && f.type === 'select')
if (a1Status) { rename(a1Status, 'a1_emp_status'); a1Status.label = 'Applicant 1 Employment Status'; audit.repairs.push('a1_emp_status: label was "..." in Typeform') }
// 2. Property blocks ask "Property type" twice: once for the building
//    (Detached, Flat…) and once for Freehold/Leasehold. The second is tenure.
for (const f of all) {
  const labels = (f.options ?? []).map((o) => o.label).join(',')
  if (/^property type$/i.test(f.label ?? '') && labels === 'Freehold,Leasehold') { f.label = 'Tenure'; audit.repairs.push(`${f.id}: "Property Type" (Freehold/Leasehold) relabelled "Tenure"`) }
}

// ---------------------------------------------------------------------------
// Branching
// ---------------------------------------------------------------------------
const eq = (field, value) => ({ field, operator: 'eq', value })
const yes = (field) => eq(field, 'yes')

const stepByTitle = (re) => { const st = steps.find((x) => re.test(x.title)); if (!st) throw new Error(`no step matching ${re}`); return st }
const topByTitle = (re, nth = 0) => { const hits = top.map((f, i) => (re.test(f.title) ? i : -1)).filter((i) => i >= 0); if (hits.length <= nth) throw new Error(`no top-level field #${nth} matching ${re}`); return hits[nth] }
function stepVisible(re, cond, why) { const st = stepByTitle(re); st.visibleWhen = cond; audit.visibility.push(`step "${st.title}": ${why}`) }
function topVisible(i, cond, why) {
  const fs = byTop(i); if (!fs.length) throw new Error(`no fields for top #${i}`)
  for (const f of fs) f.visibleWhen = cond
  audit.visibility.push(`#${i} ${top[i].title.slice(0, 40)}: ${why}`)
}
const internalSteps = () => steps.filter((st) => st._internal)

/**
 * Mechanical translation of "Yes → follow-up, No → skip it" rules, which is
 * how the Medical template phrases all of its branching. A rule on question
 * G whose positive branch lands on the next question(s) and whose negative
 * branch lands further on gates everything in between on G = Yes.
 */
function applyDetailsGates() {
  const order = [] // every question in document order, by ref
  for (const tf of top) { if (GROUP_TYPES.has(tf.type)) for (const c of tf.properties.fields) order.push(c.ref); else order.push(tf.ref) }
  const bySource = new Map(all.map((f) => [f.source, f]))
  const pos = (ref) => order.indexOf(ref)
  let n = 0
  for (const rule of src.logic ?? []) {
    const gate = bySource.get(rule.ref)
    if (!gate || ['heading', 'paragraph'].includes(gate.type)) continue
    const isYes = (c) => c.op === 'is' && ((c.vars[1].type === 'constant' && c.vars[1].value === true) || (c.vars[1].type === 'choice' && /^yes$/i.test(choiceLabel(rule.ref, c.vars[1].value))))
    const isNo = (c) => (c.op === 'is_not' && c.vars[1].value === true) || (c.op === 'is' && c.vars[1].value === false)
    const own = (c) => c.vars?.[0]?.value === rule.ref
    const yesA = rule.actions.find((a) => own(a.condition) && isYes(a.condition))
    const noA = rule.actions.find((a) => own(a.condition) && isNo(a.condition))
    const always = rule.actions.find((a) => a.condition.op === 'always')
    if (!yesA && !noA) continue // plain "always → next": nothing to gate
    const yesTo = pos((yesA ?? always).details.to.value), noTo = pos((noA ?? always).details.to.value)
    const g = pos(rule.ref)
    if (yesTo !== g + 1) throw new Error(`rule on "${gate.label}": positive branch does not lead to the next question`)
    if (noTo <= yesTo) throw new Error(`rule on "${gate.label}": negative branch does not skip anything`)
    // Only the follow-ups in the gate's own group are gated. A negative branch
    // that also jumps over a later group is an authoring slip in the source
    // (Medical's "30 days abroad = No" skips the whole GP block) — reported,
    // not reproduced.
    const groupOf = (ref) => top.find((tf) => GROUP_TYPES.has(tf.type) && tf.properties.fields.some((c) => c.ref === ref)) ?? top.find((tf) => tf.ref === ref)
    const home = groupOf(rule.ref)
    const skipped = order.slice(yesTo, noTo)
    const inGroup = skipped.filter((r) => groupOf(r) === home)
    const beyond = skipped.filter((r) => groupOf(r) !== home)
    const gated = inGroup.map((r) => bySource.get(r))
    for (const f of gated) f.visibleWhen = yes(gate.id)
    audit.visibility.push(`${gate.id}: Yes → ${gated.map((f) => `"${f.label.slice(0, 40)}"`).join(', ')}`)
    if (beyond.length) audit.repairs.push(`${gate.id}: source's "No" branch also skips "${groupOf(beyond[0]).title}" (${beyond.length} questions) — treated as a slip, not reproduced`)
    n++
  }
  return n
}
function choiceLabel(fieldRef, choiceRef) {
  for (const tf of top) for (const q of GROUP_TYPES.has(tf.type) ? tf.properties.fields : [tf]) if (q.ref === fieldRef) return q.properties.choices.find((c) => c.ref === choiceRef)?.label ?? ''
  return ''
}

/** Shared by the Mortgage and Protection templates: internal sections, joint case, dependants, will. */
function applyCommonLogic() {
  const who = need('who'), joint = need('joint')
  // "Who is completing?" Client → jump past the (Internal) sections.
  for (const st of internalSteps()) { st.visibleWhen = eq(who, 'adviser'); audit.visibility.push(`step "${st.title}": adviser only`) }
  // Joint case: No → past Section 5, and past Applicant 2 employment.
  stepVisible(/^Applicant 2 Details$/i, yes(joint), 'joint applications only')
  topVisible(topByTitle(/^Applicant 2 Employment Status$/i), yes(joint), 'joint applications only')
  topVisible(topByTitle(/worked there less than 2 years/i, 1), yes(joint), 'joint applications only')
  topVisible(topByTitle(/^Applicant 2 Employment Info$/i), yes(joint), 'joint applications only')
  // Applicant 2 sick pay. Mortgage gates it on joint; Protection's source has
  // no rule (always shown) — the joint gate is the evident intent for both.
  topVisible(topByTitle(/sick pay info applicant 2/i), yes(joint), 'joint applications only')
  // Dependants: No → jump to Employment.
  if (gates.children) { const c = need('children')
    topVisible(topByTitle(/^Children & Dependent Details$/i), yes(c), 'has dependants')
    topVisible(topByTitle(/any more children/i), yes(c), 'has dependants') }
  // Pension: has a will → skip the "consequences" question.
  if (gates.will) { const w = need('will'); const q = findByLabel(/consequences if you don't have a will/i)
    q.visibleWhen = eq(w, 'no'); audit.visibility.push(`${q.id}: only when no will`) }
}

const LOGIC = {
  mortgage() {
    applyCommonLogic()
    // CCJ: Yes → details. (Source's No-branch jumps *past* the bankruptcy
    // question — an authoring slip; the question is kept.)
    topVisible(topByTitle(/^Please enter CCJ information/i), yes(need('ccj')), 'has a CCJ')
    topVisible(topByTitle(/^Bankruptcy info$/i), yes(need('bankrupt')), 'has been bankrupt')
    // Purchase or remortgage. (Source's fallback loops to its own header when
    // unanswered — not reproduced. Its purchase branch also jumps past the
    // buy-to-let questions — treated as a slip; they are asked for both.)
    const mt = need('mortgageType')
    topVisible(topByTitle(/about your mortgage purchase/i), eq(mt, 'purchase'), 'purchase')
    topVisible(topByTitle(/about your remortgage/i), eq(mt, 'remortgage'), 'remortgage')
    // Buy-to-let: no jump rule in the source (blocks always shown); gating
    // them on the count is the evident intent.
    const btl = need('btl'), n = need('btlCount')
    topVisible(topByTitle(/^If yes, how many\?$/), yes(btl), 'has BTL')
    for (const k of [1, 2, 3]) topVisible(topByTitle(new RegExp(`^Buy-to-let property ${k}$`, 'i')),
      { all: [yes(btl), { field: n, operator: 'in', value: ['1', '2', '3'].slice(k - 1) }] }, `BTL count ≥ ${k}`)
  },
  protection() {
    applyCommonLogic()
  },
  medical() {
    applyDetailsGates()
    // "If no, at what age did they pass away?" has no rule in the source
    // (always shown); asking it only when a parent has died is the evident intent.
    const p = need('parents'), q = findByLabel(/^If no, at what age did they pass away\?$/)
    q.visibleWhen = { field: p, operator: 'in', value: ['no', 'one_deceased'] }
    audit.visibility.push(`${q.id}: only when a parent has died`)
  },
  home() {
    // No branching in the source.
  },
}
if (!LOGIC[formType]) throw new Error(`no branching rules defined for form type "${formType}"`)
LOGIC[formType]()

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------
for (const s of steps) delete s._internal
for (const f of all) delete f._top

const COPY = {
  mortgage: { subtitle: 'A few sections so your adviser can find the right mortgage and protection for you.', minutes: 20 },
  protection: { subtitle: 'A few sections so your adviser can find the right protection for you and your family.', minutes: 15 },
  medical: { subtitle: 'Your health and lifestyle details, so your adviser can find the right cover for you.', minutes: 10 },
  home: { subtitle: 'A few details about you and your property, so your adviser can arrange the right home insurance.', minutes: 5 },
}
const schema = {
  type: formType,
  version: `1.0.0-typeform-${src.id}`,
  title: `${titleCase(formType)} FactFind`,
  subtitle: COPY[formType].subtitle,
  intro: 'Your answers are saved when you submit and go straight to your adviser. Sections that do not apply to you are skipped automatically.',
  estimatedMinutes: COPY[formType].minutes,
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
console.log(`\nAdded (${audit.added.length}):`); audit.added.forEach((l) => console.log('  ' + l))
console.log(`\nVisibility rules (${audit.visibility.length}):`); audit.visibility.forEach((l) => console.log('  ' + l))
console.log(`\nSource repairs (${audit.repairs.length}):`); audit.repairs.forEach((l) => console.log('  ' + l))
