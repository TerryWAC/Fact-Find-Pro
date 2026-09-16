import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

// Source definitions only: no submitted answers, credentials or network access.
const root = new URL('../', import.meta.url)
const output = new URL('../docs/factfind-question-catalogue.md', import.meta.url)
const read = name => fs.readFileSync(new URL(name, root), 'utf8')
const presentational = new Set(['heading', 'paragraph', 'divider'])
const escape = text => String(text).replace(/[\\`*_{}[\]<>#|]/g, '\\$&')
const quote = text => String(text).split('\n').map(line => `> ${line}`).join('\n')
const code = value => `\`${String(value).replace(/`/g, '\\`')}\``
const lines = [
  '# FactFind Pro — complete question catalogue', '',
  'Generated from the executable app schemas with `node scripts/export-question-catalogue.mjs`. Contains question definitions only, never client answers. Do not edit this generated file; update the reviewed schema and regenerate it.', '',
  'The four original Typeforms contain 400 questions; the app adds a required Medical email question, for 401. The original snapshots were captured on 13 September 2026. Approved wording/routing repairs are documented in [the source notes](../tests/fixtures/typeform/README.md).', '',
  'Each field is shown only when both its section condition and its own field condition match. A missing condition means no extra visibility restriction at that level. Conditions use the stored answer values listed below. All conditions are evaluated by `src/lib/forms/engine.ts`; blank optional answers mean not provided, not No.', '',
  'The stored schemas and original JSON fixtures remain authoritative; this Markdown is a review aid.', '',
]
const counts = {}
for (const type of ['mortgage', 'protection', 'medical', 'home']) {
  const raw = read(`src/lib/forms/schemas/${type}.json`)
  const schema = JSON.parse(raw)
  const original = JSON.parse(read(`tests/fixtures/typeform/${type}.json`))
  const byRef = new Map()
  const addOriginal = fields => {
    for (const field of fields) {
      byRef.set(field.ref, field)
      if (field.properties?.fields) addOriginal(field.properties.fields)
    }
  }
  addOriginal(original.fields)
  let number = 0
  lines.push(`## ${escape(schema.title)}`, '',
    `Schema version: ${code(schema.version)}. Parsed-JSON SHA-256 (JSON.stringify, independent of checkout line endings): ${code(createHash('sha256').update(JSON.stringify(schema)).digest('hex'))}.`, '',
    `Source: ${code(original.id)}. Sections: ${schema.steps.length}.`, '')
  for (const step of schema.steps) {
    lines.push(`### ${escape(step.title)}`, '', `Section ID: ${code(step.id)}.`, '',
      `Section visibility: ${step.visibleWhen ? code(JSON.stringify(step.visibleWhen)) : 'Always available.'}`, '')
    if (step.description) lines.push('Section guidance:', '', quote(step.description), '')
    for (const field of step.fields) {
      if (presentational.has(field.type)) {
        if (field.label) lines.push(`**${field.type === 'heading' ? 'Group heading' : 'Section text'}:** ${escape(field.label)}`, '')
        continue
      }
      number++
      lines.push(`#### ${number}. ${escape(field.label ?? field.id)}`, '',
        `- Field ID: ${code(field.id)}`,
        `- Source reference: ${code(field.source)}`,
        `- Input: ${code(field.type)}; required: **${field.required ? 'Yes' : 'No'}**`,
        `- Field visibility: ${field.visibleWhen ? code(JSON.stringify(field.visibleWhen)) : 'No additional condition.'}`)
      if (field.identity) lines.push(`- Client identity role: ${code(field.identity)}`)
      if (field.defaultValue !== undefined) lines.push(`- Default value: ${code(JSON.stringify(field.defaultValue))}`)
      if (field.validation) lines.push(`- Validation: ${code(JSON.stringify(field.validation))}`)
      lines.push('')
      const options = field.type === 'yesno' ? [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] : field.options
      if (options?.length) {
        lines.push('Choices (label → stored value), in display order:', '')
        for (const option of options) lines.push(`- ${escape(option.label)} → ${code(option.value)}${option.description ? ` — ${escape(option.description)}` : ''}`)
        lines.push('')
      }
      if (field.type === 'checkbox') lines.push('Stored value: boolean (checked = true).', '')
      if (field.placeholder) lines.push(`Placeholder: ${escape(field.placeholder)}`, '')
      if (field.helpText) lines.push('Help text:', '', quote(field.helpText), '')
      const source = byRef.get(field.source)
      if (!source) lines.push('Platform addition; no original Typeform question.', '')
      else if (field.label !== source.title.trim()) lines.push('Original Typeform question title before the documented label repair:', '', quote(source.title), '')
    }
  }
  counts[type] = number
  lines.push(`**${escape(schema.title)}: ${number} app questions.**`, '')
}
const total = Object.values(counts).reduce((sum, value) => sum + value, 0)
lines.splice(8, 0, `Question counts: ${Object.entries(counts).map(([type, count]) => `${type} ${count}`).join(', ')}; total **${total}**.`, '')
fs.writeFileSync(output, lines.join('\n'), 'utf8')
console.log(JSON.stringify({ output: fileURLToPath(output), questions: counts, total, no_network_or_email: true }))
