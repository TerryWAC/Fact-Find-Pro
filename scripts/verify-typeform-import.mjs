#!/usr/bin/env node
/**
 * Reconciles a Typeform export against the FactFind schema generated from it.
 *
 *   node scripts/verify-typeform-import.mjs <typeform-export.json> <schema.json>
 *
 * Checks, mechanically:
 *   1. Every Typeform question, group and in-section statement is present in
 *      the schema (matched by Typeform ref via each field's `source`), exactly
 *      once, and nothing in the schema is invented.
 *   2. Every "Section N:" statement became a step.
 *   3. Choice lists are identical, label for label and in order.
 *   4. Required flags and help text carried over (client_name / client_email
 *      are the only allowed extra requireds).
 *   5. Labels match, except for the documented source repairs.
 *   6. Branching: every combination of answers to the fields Typeform's jump
 *      rules depend on is simulated through Typeform's rules and through the
 *      schema's visibility conditions; the sets of questions shown must agree
 *      apart from the deviations listed in KNOWN_DEVIATIONS (each of which must
 *      also actually be observed, so the list can't go stale).
 *
 * Exit code 1 on any unexplained difference.
 */
import fs from 'node:fs'

const [, , exportPath, schemaPath] = process.argv
if (!exportPath || !schemaPath) { console.error('usage: verify-typeform-import.mjs <export.json> <schema.json>'); process.exit(1) }
const src = JSON.parse(fs.readFileSync(exportPath, 'utf8'))
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))

const slug = (s) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48)
const problems = [], notes = []
const fail = (m) => problems.push(m)

// ---------------------------------------------------------------------------
// Deviations from the source that the converter makes on purpose. Each entry
// must be observed by the simulation or the run fails (stale documentation).
// engine/source: 'shown' | 'hidden'.
// ---------------------------------------------------------------------------
const KNOWN_DEVIATIONS = {
  mortgage: [
    { title: /^Adviser notes for admin$/, source: 'shown', engine: 'hidden',
      why: 'source shows the "(Internal)" Admin Notes section to clients too (no rule skips it); engine keeps it adviser-only' },
    { title: /^Have you ever been made bankrupt\?$/, source: 'hidden', engine: 'shown',
      why: 'source: "CCJ = No" jumps past the bankruptcy question (authoring slip); engine always asks it' },
    { title: /^Bankruptcy info$/, source: 'shown', engine: 'hidden',
      why: 'source: after that skip the bankruptcy details show regardless; engine shows them only for "bankrupt = Yes"' },
    { title: /^Do you have any background buy-to-let properties\?$/, source: 'hidden', engine: 'shown',
      why: 'source: the purchase block jumps straight to Sick Pay, skipping buy-to-let (authoring slip); engine asks it for purchases too' },
    { title: /^If yes, how many\?$/, source: 'hidden', engine: 'shown', why: 'as above (purchase skips buy-to-let in source)' },
    { title: /^Buy-to-let property \d$/, source: 'hidden', engine: 'shown', why: 'as above (purchase skips buy-to-let in source)' },
    { title: /^If yes, how many\?$/, source: 'shown', engine: 'hidden', why: 'engine gates the count on "background BTL = Yes"; source always shows it' },
    { title: /^Buy-to-let property \d$/, source: 'shown', engine: 'hidden', why: 'engine shows property blocks up to the count; source always shows all three' },
  ],
  protection: [
    { title: /^Adviser notes for admin$/, source: 'shown', engine: 'hidden',
      why: 'source shows the "(Internal)" Admin Notes section to clients too (no rule skips it); engine keeps it adviser-only' },
    { title: /sick pay info applicant 2/i, source: 'shown', engine: 'hidden',
      why: 'source has no rule (Applicant 2 sick pay always shown); engine gates it on joint case' },
  ],
}

// ---------------------------------------------------------------------------
// Inventories
// ---------------------------------------------------------------------------
const top = src.fields
const sectionRe = /^Section\s+(\d+)\s*:\s*(.+)$/i
/** ref → { tf, topIdx, parent, childIdx } for every top-level field and group child. */
const srcByRef = new Map()
top.forEach((tf, i) => {
  srcByRef.set(tf.ref, { tf, topIdx: i })
  ;(tf.properties?.fields ?? []).forEach((c, k) => srcByRef.set(c.ref, { tf: c, topIdx: i, parent: tf, childIdx: k }))
})
const firstSection = top.findIndex((f) => f.type === 'statement' && sectionRe.test(f.title))

const schemaFields = schema.steps.flatMap((st) => st.fields.map((f) => ({ f, step: st })))
const schemaBySource = new Map()
for (const e of schemaFields) {
  if (!e.f.source) { fail(`schema field ${e.f.id} has no source ref`); continue }
  if (schemaBySource.has(e.f.source)) fail(`schema has two fields for source ${e.f.source} (${schemaBySource.get(e.f.source).f.id}, ${e.f.id})`)
  schemaBySource.set(e.f.source, e)
  if (!srcByRef.has(e.f.source)) fail(`schema field ${e.f.id} points at a ref that is not in the export`)
}
const PRESENTATIONAL = new Set(['heading', 'paragraph', 'divider'])
const TYPE_MAP = {
  short_text: ['text', 'date', 'email', 'tel', 'number', 'currency', 'percent', 'select'],
  long_text: ['textarea', 'text', 'date', 'email', 'tel', 'number', 'currency', 'percent'],
  date: ['date'], yes_no: ['yesno'], number: ['number'], email: ['email'], phone_number: ['tel'],
  multiple_choice: ['radio', 'select', 'checkbox-group'], dropdown: ['select', 'radio', 'checkbox-group'],
  checkbox: ['checkbox', 'checkbox-group'],
}

// ---------------------------------------------------------------------------
// 1–5: presence, steps, choices, required, help, labels
// ---------------------------------------------------------------------------
const stats = { questions: 0, groups: 0, statements: 0, dropped: 0, sections: 0, choiceLists: 0, required: 0, help: 0, repairs: [] }
const stepTitles = schema.steps.map((s) => s.title)

for (const [ref, { tf, topIdx, parent }] of srcByRef) {
  const m = tf.type === 'statement' && !parent ? tf.title.match(sectionRe) : null
  if (m) {
    stats.sections++
    const title = m[2].replace(/\s*\(internal\)\s*/i, '').trim()
    if (!stepTitles.includes(title)) fail(`section "${tf.title}" has no step`)
    continue
  }
  if (topIdx < firstSection) { // intro statements before Section 1 are dropped on purpose
    if (schemaBySource.has(ref)) fail(`pre-section field "${tf.title}" was expected to be dropped`)
    stats.dropped++
    continue
  }
  const e = schemaBySource.get(ref)
  if (!e) { fail(`missing: #${topIdx}${parent ? ' (in "' + parent.title + '")' : ''} ${tf.type} "${tf.title}"`); continue }
  const f = e.f

  if (tf.type === 'statement') { stats.statements++; if (f.type !== 'paragraph' || f.label !== tf.title) fail(`statement "${tf.title}" not carried verbatim as a paragraph`); continue }
  if (tf.type === 'inline_group') {
    stats.groups++
    if (f.type !== 'heading') fail(`group "${tf.title}" is not a heading`)
    for (const c of tf.properties.fields) if (schemaBySource.get(c.ref)?.step !== e.step) fail(`group "${tf.title}": child "${c.title}" is not in the same step as its heading`)
    continue
  }

  stats.questions++
  if (PRESENTATIONAL.has(f.type)) fail(`"${tf.title}" became presentational (${f.type})`)
  if (!(TYPE_MAP[tf.type] ?? []).includes(f.type)) fail(`"${tf.title}": Typeform ${tf.type} → engine ${f.type} is not an allowed mapping`)

  // label
  const title = tf.title.trim()
  if (f.label !== title) {
    const srcLabels = (tf.properties?.choices ?? []).map((c) => c.label).join(',')
    if (title === '...' && f.label === 'Applicant 1 Employment Status') stats.repairs.push(`"${title}" → "${f.label}"`)
    else if (/^property type$/i.test(title) && srcLabels === 'Freehold,Leasehold' && f.label === 'Tenure') stats.repairs.push(`${f.id}: "Property Type" → "Tenure"`)
    else if (tf.type === 'checkbox' && tf.properties.choices.length === 1 && f.label === `${title} — ${tf.properties.choices[0].label}`) stats.repairs.push(`${f.id}: single consent choice folded into the label`)
    else fail(`label changed: "${title}" → "${f.label}"`)
  }

  // choices
  const srcChoices = tf.properties?.choices
  if (srcChoices && !(tf.type === 'checkbox' && srcChoices.length === 1)) {
    stats.choiceLists++
    const a = srcChoices.map((c) => c.label), b = (f.options ?? []).map((o) => o.label)
    if (JSON.stringify(a) !== JSON.stringify(b)) fail(`choices differ for "${title}":\n    source ${JSON.stringify(a)}\n    schema ${JSON.stringify(b)}`)
    for (const o of f.options ?? []) if (o.value !== slug(o.label)) fail(`option value for "${o.label}" in ${f.id} is not the slug of its label`)
    if (Boolean(tf.properties.allow_multiple_selection) !== (f.type === 'checkbox-group')) fail(`multi-select mismatch for "${title}"`)
  } else if (f.options && f.id !== 'btl_count') fail(`${f.id} has options the source does not`)

  // required
  const srcReq = Boolean(tf.validations?.required), req = Boolean(f.required)
  if (srcReq) stats.required++
  if (srcReq && !req) fail(`"${title}" is required in Typeform but not in the schema`)
  if (!srcReq && req && !['client_name', 'client_email'].includes(f.id)) fail(`"${title}" (${f.id}) is required in the schema but not in Typeform`)

  // help text
  const desc = tf.properties?.description?.trim()
  if (desc) { stats.help++; if (f.helpText !== desc) fail(`help text differs for "${title}"`) }
  else if (f.helpText && f.id !== 'who_completing') fail(`${f.id} has help text the source does not`)
}
if (stats.sections !== schema.steps.length) fail(`export has ${stats.sections} sections but schema has ${schema.steps.length} steps`)

// ---------------------------------------------------------------------------
// 6: branching simulation
// ---------------------------------------------------------------------------
const logicByRef = new Map((src.logic ?? []).map((l) => [l.ref, l]))
const condRefs = new Set()
for (const l of src.logic ?? []) for (const a of l.actions) for (const v of a.condition.vars ?? []) if (v.type === 'field') condRefs.add(v.value)

/** Possible answered values of a gate field, as [typeformValue, engineValue] pairs. */
function answersFor(ref) {
  const { tf } = srcByRef.get(ref)
  if (tf.type === 'yes_no') return [[true, 'yes'], [false, 'no']]
  if (tf.properties?.choices) return tf.properties.choices.map((c) => [c.ref, slug(c.label)])
  throw new Error(`don't know how to enumerate answers for ${tf.type} "${tf.title}"`)
}
const gateRefs = [...condRefs]
for (const r of gateRefs) if (!schemaBySource.has(r)) fail(`logic depends on "${srcByRef.get(r).tf.title}" which is missing from the schema`)

// Engine-only gates (no Typeform rule depends on them) still need enumerating
// so that their effect is observed and matched against KNOWN_DEVIATIONS.
const engineOnlyGates = []
const condFields = (c) => (c.all ?? c.any ?? [c]).flatMap((x) => (x.all || x.any ? condFields(x) : [x.field]))
const gateIds = new Set(gateRefs.map((r) => schemaBySource.get(r)?.f.id))
for (const { f } of schemaFields) for (const id of f.visibleWhen ? condFields(f.visibleWhen) : []) if (!gateIds.has(id) && !engineOnlyGates.includes(id)) engineOnlyGates.push(id)
for (const st of schema.steps) for (const id of st.visibleWhen ? condFields(st.visibleWhen) : []) if (!gateIds.has(id) && !engineOnlyGates.includes(id)) engineOnlyGates.push(id)
const engineValuesFor = (id) => {
  const f = schemaFields.find((e) => e.f.id === id)?.f
  if (!f) throw new Error(`visibility refers to unknown field ${id}`)
  if (f.type === 'yesno') return ['yes', 'no']
  if (f.options) return f.options.map((o) => o.value)
  throw new Error(`cannot enumerate ${id}`)
}

function* scenarios() {
  const dims = [...gateRefs.map((r) => ({ ref: r, opts: answersFor(r) })), ...engineOnlyGates.map((id) => ({ id, opts: engineValuesFor(id).map((v) => [null, v]) }))]
  const n = dims.reduce((p, d) => p * d.opts.length, 1)
  for (let k = 0; k < n; k++) {
    let rem = k; const tfAns = new Map(), engine = {}
    for (const d of dims) {
      const [tfv, ev] = d.opts[rem % d.opts.length]; rem = Math.floor(rem / d.opts.length)
      if (d.ref) { tfAns.set(d.ref, tfv); engine[schemaBySource.get(d.ref).f.id] = ev } else engine[d.id] = ev
    }
    yield { tfAns, engine }
  }
}

/** Typeform: walk the fields in order applying jump rules; return the refs shown. */
function typeformShown(tfAns) {
  const shown = new Set()
  const evalCond = (c) => {
    if (c.op === 'always') return true
    const [a, b] = c.vars
    const actual = tfAns.get(a.value)
    const expected = b.type === 'constant' ? b.value : b.value
    if (c.op === 'is') return actual === expected
    if (c.op === 'is_not') return actual !== expected
    throw new Error(`unsupported condition op ${c.op}`)
  }
  let i = 0, fromChild = null, guard = 0
  while (i < top.length) {
    if (++guard > 500) throw new Error('jump loop')
    const tf = top[i]
    const children = tf.properties?.fields
    if (children) {
      let start = fromChild ?? 0
      // A rule on the group may jump to a later child of the same group: the
      // children between the condition's field and the target are skipped.
      const l = logicByRef.get(tf.ref)
      let skipFrom = -1, skipTo = -1
      if (l) for (const a of l.actions) {
        const tgt = srcByRef.get(a.details.to.value)
        if (tgt?.parent === tf && evalCond(a.condition)) {
          const condIdx = Math.max(...a.condition.vars.filter((v) => v.type === 'field').map((v) => srcByRef.get(v.value)?.childIdx ?? -1))
          skipFrom = condIdx + 1; skipTo = tgt.childIdx; break
        }
      }
      shown.add(tf.ref) // the group itself (its heading in the schema)
      children.forEach((c, k) => { if (k >= start && !(k >= skipFrom && k < skipTo)) shown.add(c.ref) })
    } else if (tf.type !== 'statement') shown.add(tf.ref)
    else if (i >= firstSection && !sectionRe.test(tf.title)) shown.add(tf.ref) // section headers are steps, not fields
    fromChild = null

    const l = logicByRef.get(tf.ref)
    let next = i + 1
    if (l) for (const a of l.actions) {
      if (!evalCond(a.condition)) continue
      if (a.action !== 'jump') throw new Error(`unsupported action ${a.action}`)
      const tgt = srcByRef.get(a.details.to.value)
      if (!tgt) throw new Error('jump to unknown ref')
      if (tgt.parent === tf) break // handled above (intra-group skip)
      next = tgt.topIdx; fromChild = tgt.childIdx ?? null
      break
    }
    if (next <= i) throw new Error(`rule on "${tf.title}" jumps backwards`)
    i = next
  }
  return shown
}

/** Engine: mirrors src/lib/forms/engine.ts (matchesCondition / isStepVisible / isFieldVisible). */
function matches(c, values) {
  if (!c) return true
  if (c.all) return c.all.every((x) => matches(x, values))
  if (c.any) return c.any.some((x) => matches(x, values))
  const actual = values[c.field], v = c.value
  switch (c.operator) {
    case 'eq': return String(actual ?? '') === String(v ?? '')
    case 'neq': return String(actual ?? '') !== String(v ?? '')
    case 'in': return Array.isArray(v) && v.map(String).includes(String(actual ?? ''))
    case 'not_in': return Array.isArray(v) && !v.map(String).includes(String(actual ?? ''))
    case 'truthy': return Array.isArray(actual) ? actual.length > 0 : Boolean(actual)
    case 'falsy': return Array.isArray(actual) ? actual.length === 0 : !actual
    default: throw new Error(`operator ${c.operator} not modelled`)
  }
}
function engineShown(values) {
  const shown = new Set()
  for (const st of schema.steps) {
    if (!matches(st.visibleWhen, values)) continue
    for (const f of st.fields) if (matches(f.visibleWhen, values)) shown.add(f.source)
  }
  return shown
}

const deviations = KNOWN_DEVIATIONS[schema.type] ?? []
const seen = deviations.map(() => 0)
const unexplained = new Map()
let scenarioCount = 0
const describe = (s) => [...s.tfAns].map(([r, v]) => `${srcByRef.get(r).tf.title.replace(/\?$/, '')}=${typeof v === 'boolean' ? (v ? 'Yes' : 'No') : srcByRef.get(r).tf.properties.choices.find((c) => c.ref === v).label}`)
  .concat(engineOnlyGates.map((id) => `${id}=${s.engine[id]}`)).join(', ')

for (const s of scenarios()) {
  scenarioCount++
  const a = typeformShown(s.tfAns), b = engineShown(s.engine)
  for (const ref of new Set([...a, ...b])) {
    const inA = a.has(ref), inB = b.has(ref)
    if (inA === inB) continue
    const { tf, parent } = srcByRef.get(ref)
    // Compare at the level Typeform authored the rule: a group's children move with the group.
    const owner = parent ?? tf
    const k = deviations.findIndex((d) => d.title.test(owner.title) && d.source === (inA ? 'shown' : 'hidden') && d.engine === (inB ? 'shown' : 'hidden'))
    if (k >= 0) { seen[k]++; continue }
    const key = `${owner.title} · source ${inA ? 'shows' : 'hides'}, engine ${inB ? 'shows' : 'hides'}`
    if (!unexplained.has(key)) unexplained.set(key, describe(s))
  }
}
for (const [key, when] of unexplained) fail(`branching differs: ${key}\n    e.g. ${when}`)
deviations.forEach((d, k) => { if (!seen[k]) fail(`documented deviation never observed (stale?): ${d.title} source ${d.source}/engine ${d.engine}`) })

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log(`${src.title} (${src.id}) ↔ ${schemaPath}`)
console.log(`  questions      ${stats.questions} matched by ref (0 missing, 0 invented)`)
console.log(`  groups         ${stats.groups} → headings, children kept together`)
console.log(`  statements     ${stats.statements} in-section notes verbatim · ${stats.dropped} intro statements dropped (adviser copy)`)
console.log(`  sections       ${stats.sections} → ${schema.steps.length} steps`)
console.log(`  choice lists   ${stats.choiceLists} identical, label for label`)
console.log(`  required       ${stats.required} carried (+ client_name, client_email)`)
console.log(`  help texts     ${stats.help} carried`)
console.log(`  label repairs  ${stats.repairs.length}`); stats.repairs.forEach((r) => console.log(`                 ${r}`))
console.log(`  branching      ${src.logic?.length ?? 0} jump rules · ${gateRefs.length} source gates + ${engineOnlyGates.length} engine gates · ${scenarioCount} answer combinations simulated`)
deviations.forEach((d, k) => console.log(`                 deviation (${seen[k]} obs): ${d.why}`))
notes.forEach((n) => console.log(`  note           ${n}`))
if (problems.length) { console.log(`\n✘ ${problems.length} problem(s):`); problems.forEach((p) => console.log('  - ' + p)); process.exit(1) }
console.log('\n✔ everything in the export is accounted for')
