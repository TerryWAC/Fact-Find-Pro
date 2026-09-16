#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { stageAdviserBatch } from './lib/adviser-batch.mjs'

try {
  const args = process.argv.slice(2)
  if (args.length !== 4) throw new Error('Usage: node scripts/stage-adviser-batch.mjs <review.json> <decisions.json> <existing-emails.json> <new-private-output-folder>')
  const [reviewPath, decisionsPath, emailsPath, outputPath] = args
  const batch = stageAdviserBatch(readFileSync(reviewPath, 'utf8'),
    JSON.parse(readFileSync(decisionsPath, 'utf8')), JSON.parse(readFileSync(emailsPath, 'utf8')))
  const output = resolve(outputPath)
  mkdirSync(output, { recursive: false })
  writeFileSync(join(output, 'batch.json'), JSON.stringify(batch, null, 2), { flag: 'wx' })
  console.log(JSON.stringify({ mode: batch.mode, ...batch.counts, accounts_created: 0, emails_sent: 0, output }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Could not stage the batch.')
  process.exitCode = 1
}
