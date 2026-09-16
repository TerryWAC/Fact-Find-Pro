import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseEnv } from 'node:util'

// Offline source packaging only. No provider, database, upload or email calls.
const git = (args, options = {}) => execFileSync('git', args, {
  encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, windowsHide: true, ...options,
})
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const fail = message => { throw new Error(message) }

try {
  const destination = process.argv[2]
  if (!destination || process.argv.length !== 3) fail('Usage: node scripts/create-transfer-pack.mjs <new-output-folder>')
  const root = git(['rev-parse', '--show-toplevel']).trim()
  process.chdir(root)
  if (git(['status', '--porcelain', '--untracked-files=normal']).trim())
    fail('Commit or isolate the working changes before packaging. Only a clean committed release can be exported.')
  const output = path.resolve(destination)
  if (existsSync(output)) fail('Output folder already exists; choose a new release folder.')
  const commit = git(['rev-parse', 'HEAD']).trim()
  const entries = git(['ls-tree', '-rz', '--full-tree', 'HEAD'], { encoding: null })
    .toString('utf8').split('\0').filter(Boolean).map(line => {
      const [header, file] = [line.slice(0, line.indexOf('\t')), line.slice(line.indexOf('\t') + 1)]
      const [mode, type, object] = header.split(' ')
      return { mode, type, object, file }
    })
  for (const entry of entries) {
    if (!['100644', '100755'].includes(entry.mode) || entry.type !== 'blob') fail(`Unsupported source entry: ${entry.file}`)
    if (entry.file.split('/').some(part => ['..', '.git', '.vercel', 'node_modules', 'test-results', 'playwright-report', 'backups'].includes(part)) ||
        /(^|\/)(\.env($|\.)|.*\.(pem|key|p12|pfx|backup|dump|patch)$)/i.test(entry.file) && entry.file !== '.env.example')
      fail(`Private or generated file is tracked: ${entry.file}`)
  }
  const configured = { ...process.env, ...(existsSync('.env.local') ? parseEnv(readFileSync('.env.local', 'utf8')) : {}) }
  const secrets = Object.entries(configured).filter(([key, value]) =>
    !key.startsWith('NEXT_PUBLIC_') && /SECRET|PASSWORD|TOKEN|SERVICE.*KEY|RESEND_API_KEY/.test(key) && value?.length >= 12)
  const raw = git(['cat-file', '--batch'], { input: entries.map(entry => entry.object).join('\n') + '\n', encoding: null })
  let offset = 0
  const files = []
  let guide
  for (const entry of entries) {
    const end = raw.indexOf(10, offset)
    const [object, type, size] = raw.subarray(offset, end).toString('utf8').split(' ')
    if (object !== entry.object || type !== 'blob' || !/^\d+$/.test(size)) fail('Unexpected Git object response.')
    const bytes = raw.subarray(end + 1, end + 1 + Number(size))
    offset = end + 2 + Number(size)
    const content = bytes.toString('utf8')
    if (secrets.some(([, secret]) => content.includes(secret))) fail(`Configured secret found in ${entry.file}; no archive was created.`)
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content) || /\b(?:sb_secret_|sbp_)[A-Za-z0-9_-]{24,}/.test(content))
      fail(`Credential pattern found in ${entry.file}; no archive was created.`)
    files.push({ path: entry.file, bytes: bytes.length, sha256: sha256(bytes) })
    if (entry.file === 'docs/transfer-and-launch.md') guide = bytes
  }
  if (!guide) fail('Missing docs/transfer-and-launch.md; add a handover guide before packaging.')
  mkdirSync(output, { recursive: true })
  const archive = path.join(output, 'FactFind-Pro-source.zip')
  git(['-c', 'core.autocrlf=false', 'archive', '--format=zip', '--prefix=FactFind-Pro/', `--output=${archive}`, 'HEAD'])
  const digest = sha256(readFileSync(archive))
  writeFileSync(path.join(output, 'manifest.json'), JSON.stringify({
    format: 1, created_at: new Date().toISOString(), commit,
    archive: { name: path.basename(archive), sha256: digest },
    includes: 'Committed source, migration SQL, tests and documentation only.',
    excludes: 'Git history, credentials, hosted accounts, production records, storage objects and private Typeform exports.',
    files,
  }, null, 2) + '\n')
  writeFileSync(path.join(output, 'START-HERE.md'), guide)
  writeFileSync(path.join(output, 'SHA256SUMS.txt'), `${digest}  FactFind-Pro-source.zip\n`)
  console.log(JSON.stringify({ output, commit, source_files: files.length, archive_sha256: digest, no_network_or_email: true }, null, 2))
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
