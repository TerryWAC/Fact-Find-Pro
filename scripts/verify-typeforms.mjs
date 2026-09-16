#!/usr/bin/env node
/** Reconcile all four checked-in published Typeform definitions without network access. */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
let failed = false
for (const type of ['mortgage', 'protection', 'medical', 'home']) {
  // Preload tsx so the verifier can import the TypeScript engine on every
  // Node release; newer Node versions otherwise try to load .ts files natively
  // and fail on the engine's extensionless imports.
  const result = spawnSync(process.execPath, [
    '--import', 'tsx',
    'scripts/verify-typeform-import.mjs',
    `tests/fixtures/typeform/${type}.json`,
    `src/lib/forms/schemas/${type}.json`,
  ], { cwd: root, stdio: 'inherit' })
  if (result.error) console.error(result.error.message)
  if (result.status !== 0) failed = true
}
process.exitCode = failed ? 1 : 0
