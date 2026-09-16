import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const script = fileURLToPath(new URL('../../scripts/create-transfer-pack.mjs', import.meta.url))
const verifier = fileURLToPath(new URL('../../scripts/verify-transfer-pack.py', import.meta.url))
function fixture(t) {
  const folder = mkdtempSync(path.join(tmpdir(), 'factfind-transfer-'))
  t.after(() => {
    assert.ok(path.resolve(folder).startsWith(path.resolve(tmpdir()) + path.sep))
    rmSync(folder, { recursive: true, force: true })
  })
  const repo = path.join(folder, 'repo')
  mkdirSync(path.join(repo, 'docs'), { recursive: true })
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe', windowsHide: true })
  git('init')
  git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.test')
  git('config', 'core.autocrlf', 'false')
  writeFileSync(path.join(repo, '.gitignore'), '.env.local\n')
  writeFileSync(path.join(repo, 'docs/transfer-and-launch.md'), 'Fictional transfer guide\n')
  writeFileSync(path.join(repo, 'source.js'), 'export const value = 1\n')
  const commit = () => { git('add', '.'); git('commit', '-m', 'Fixture') }
  commit()
  const output = path.join(folder, 'pack')
  const run = () => spawnSync(process.execPath, [script, output], { cwd: repo, encoding: 'utf8', windowsHide: true })
  return { repo, output, commit, run, git }
}

test('source pack excludes ignored credentials and records reproducible source/archive hashes', t => {
  const f = fixture(t)
  f.git('config', 'core.autocrlf', 'true')
  writeFileSync(path.join(f.repo, '.env.local'), 'SUPABASE_SECRET_KEY=fixture-secret-value-123456\n')
  const result = f.run(); assert.equal(result.status, 0, result.stderr)
  const manifest = JSON.parse(readFileSync(path.join(f.output, 'manifest.json'), 'utf8'))
  assert.ok(manifest.files.every(file => !file.path.startsWith('.env')))
  assert.equal(manifest.files.find(file => file.path === 'source.js').sha256,
    createHash('sha256').update('export const value = 1\n').digest('hex'))
  assert.equal(manifest.archive.sha256,
    createHash('sha256').update(readFileSync(path.join(f.output, manifest.archive.name))).digest('hex'))
  assert.ok(existsSync(path.join(f.output, 'START-HERE.md')))
  const verified = spawnSync('python', [verifier, f.output], { encoding: 'utf8', windowsHide: true })
  assert.equal(verified.status, 0, verified.stderr)
  assert.notEqual(f.run().status, 0, 'Existing output must not be overwritten')
})
test('uncommitted changes cannot become an unidentifiable release', t => {
  const f = fixture(t); writeFileSync(path.join(f.repo, 'source.js'), 'changed')
  const result = f.run(); assert.notEqual(result.status, 0)
  assert.match(result.stderr, /working changes/); assert.ok(!existsSync(f.output))
})
test('tracked environment files stop packaging before any archive is created', t => {
  const f = fixture(t); writeFileSync(path.join(f.repo, '.env.production'), 'NAME=fixture\n'); f.commit()
  const result = f.run(); assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Private or generated file/); assert.ok(!existsSync(f.output))
})
test('a configured secret inside source is refused without printing its value', t => {
  const f = fixture(t); const secret = 'fixture-secret-value-123456'
  writeFileSync(path.join(f.repo, '.env.local'), `RESEND_API_KEY=${secret}\n`)
  writeFileSync(path.join(f.repo, 'source.js'), `export const key = '${secret}'\n`); f.commit()
  const result = f.run(); assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Configured secret/)
  assert.ok(!result.stderr.includes(secret)); assert.ok(!existsSync(f.output))
})
