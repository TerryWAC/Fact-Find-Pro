#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, extname, join } from 'node:path'
import { parseCsv, prepareAdviserImport, renderAdviserReview } from './lib/adviser-import.mjs'

const usage = 'Usage: node scripts/prepare-adviser-import.mjs <source.csv|responses.json> <mapping.json> <new-private-output-folder> [existing-emails.json]'

try {
  const args = process.argv.slice(2)
  if (args.length < 3 || args.length > 4) throw new Error(usage)
  const [inputPath, mappingPath, outputPath, existingPath] = args
  const raw = readFileSync(inputPath, 'utf8')
  const input = extname(inputPath).toLowerCase() === '.csv' ? parseCsv(raw) : JSON.parse(raw)
  const mapping = JSON.parse(readFileSync(mappingPath, 'utf8'))
  const existingEmails = existingPath ? JSON.parse(readFileSync(existingPath, 'utf8')) : undefined
  const report = prepareAdviserImport(input, mapping, { existingEmails })
  const output = resolve(outputPath)
  // A new directory keeps a review from overwriting its source or an earlier batch.
  mkdirSync(output, { recursive: false })
  writeFileSync(join(output, 'review.json'), JSON.stringify(report, null, 2), { flag: 'wx' })
  writeFileSync(join(output, 'review.html'), renderAdviserReview(report), { flag: 'wx' })
  console.log(JSON.stringify({ mode: report.mode, ...report.counts, accounts_created: 0, emails_sent: 0, output }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Could not prepare the import review.')
  process.exitCode = 1
}
