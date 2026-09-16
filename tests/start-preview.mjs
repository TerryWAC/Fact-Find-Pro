// Isolated local database. Mail is disabled unless the explicit live test flag is used.
import http from 'node:http'
import { spawn } from 'node:child_process'

const submissions = []
const savedSubmissions = []
const emailTests = process.argv.includes('--email-tests')
const liveEmailTest = process.argv.includes('--live-email-test')
if (liveEmailTest && (emailTests || !process.argv.includes('--production')))
  throw new Error('Use --live-email-test only with --production, separately from captured email tests.')
const mail = []
const emailLog = []
let emailScenario = {}
let adviserReads = 0
const testAdviserId = '00000000-0000-4000-8000-000000000004'
const preparedAdviserId = '00000000-0000-4000-8000-000000000008'
const sessions = new Map()
let failNext = false
let failSubmissionReads = false
let failAdminReads = false
const profileEdits = new Map()
const mock = http.createServer(async (req, res) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}
  res.setHeader('Content-Type', 'application/json')
  const send = (data, status = 200) => {
    res.statusCode = status
    res.end(JSON.stringify(data))
  }
  const requestUrl = new URL(req.url, 'http://localhost')
  const pathname = requestUrl.pathname
  const filterRows = (rows) =>
    rows.filter((row) =>
      [...requestUrl.searchParams].every(([key, value]) => {
        if (value.startsWith('eq.')) return String(row[key]) === value.slice(3)
        if (value.startsWith('neq.')) return String(row[key]) !== value.slice(4)
        if (value.startsWith('in.(')) return value.slice(4, -1).split(',').includes(String(row[key]))
        if (value.startsWith('gte.')) return String(row[key]) >= value.slice(4)
        if (key === 'or') {
          const expressions = [
            ...value.matchAll(/(client_name|client_email|reference|name|email|company_name)\.ilike\."((?:\\.|[^"\\])*)"/g),
          ]
          return expressions.some(([, column, quoted]) => {
            const pattern = JSON.parse(`"${quoted}"`)
            let regex = ''
            const escape = (char) => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            for (let index = 0; index < pattern.length; index++) {
              const char = pattern[index]
              if (char === '\\' && index + 1 < pattern.length) regex += escape(pattern[++index])
              else regex += char === '%' || char === '*' ? '.*' : char === '_' ? '.' : escape(char)
            }
            return new RegExp(`^${regex}$`, 'i').test(row[column])
          })
        }
        return true
      }),
    )
  const sendRows = (rows) => {
    const filtered = filterRows(rows)
    const orders = (requestUrl.searchParams.get('order') ?? '').split(',').filter(Boolean)
    filtered.sort((a, b) => {
      for (const order of orders) {
        const [column, direction] = order.split('.')
        const comparison = String(a[column]).localeCompare(String(b[column]))
        if (comparison) return direction === 'desc' ? -comparison : comparison
      }
      return 0
    })
    const offset = Number(requestUrl.searchParams.get('offset') ?? 0)
    const limit = Number(requestUrl.searchParams.get('limit') ?? filtered.length)
    const page = filtered.slice(offset, offset + limit)
    res.setHeader(
      'Content-Range',
      `${page.length ? `${offset}-${offset + page.length - 1}` : '*'}/${filtered.length}`,
    )
    if (offset > 0 && offset >= filtered.length)
      return send({ code: 'PGRST103', message: 'Range not satisfiable' }, 416)
    return send(page)
  }
  const bearer = req.headers.authorization?.replace('Bearer ', '')
  const service = req.headers.apikey === 'local-preview-service-only'
  const user = sessions.get(bearer)
  if (pathname === '/auth/v1/token') {
    if (
      !['admin@example.test', 'adviser@example.test'].includes(body.email) ||
      body.password !== 'PreviewOnly!'
    )
      return send({ message: 'Invalid preview credentials' }, 400)
    const role = body.email.startsWith('admin') ? 'admin' : 'adviser'
    const id =
      role === 'admin' ? '00000000-0000-4000-8000-000000000002' : '00000000-0000-4000-8000-000000000004'
    const account = {
      id,
      email: body.email,
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: '2026-01-01T00:00:00Z',
      profileRole: role,
    }
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
    const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.preview`
    sessions.set(token, account)
    return send({
      access_token: token,
      refresh_token: 'preview-refresh',
      token_type: 'bearer',
      expires_in: 3600,
      user: account,
    })
  }
  if (pathname === '/auth/v1/user') return user ? send(user) : send({ message: 'Not signed in' }, 401)
  if (pathname === '/auth/v1/logout') {
    if (user) sessions.delete(bearer)
    return send({})
  }
  if (pathname === '/rest/v1/profiles') {
    if (service && requestUrl.searchParams.has('id')) adviserReads++
    const requestedId = requestUrl.searchParams.get('id')?.replace(/^eq\./, '')
    if (failAdminReads && !requestedId) return send({ code: 'XX000', message: 'Simulated admin read failure' }, 503)
    const defaults = { name: 'Alex Morgan', status: 'approved', role: 'adviser', import_pending: false, company_name: 'Morgan Financial', phone: '', avatar_url: null, logo_url: null, brand_colour: '#6D28D9', adviser_slug: 'preview', created_at: '2026-01-01T00:00:00Z', onboarding_completed_at: '2026-01-01T00:00:00Z', delivery_email_copy: emailScenario.adviserCopy ?? true, delivery_client_copy: emailScenario.clientCopy ?? true, delivery_webhook_enabled: false, delivery_webhook_url: null }
    const rows = [
      { ...defaults, id: testAdviserId, email: liveEmailTest ? process.env.EMAIL_TEST_TO : 'adviser@example.test', ...(emailScenario.branding ?? {}) },
      { ...defaults, id: '00000000-0000-4000-8000-000000000002', role: 'admin', email: 'admin@example.test' },
      { ...defaults, id: '00000000-0000-4000-8000-000000000007', name: 'Jamie Audit', company_name: 'Audit Firm, North (UK)', status: 'pending', email: 'pending@example.test' },
      { ...defaults, id: preparedAdviserId, name: 'Morgan Prepared', email: 'prepared@example.test', status: 'pending', import_pending: true, adviser_slug: 'reservedmock', onboarding_completed_at: null },
    ].map(row => ({ ...row, ...profileEdits.get(row.id) })).filter(row => service || (user && (user.profileRole === 'admin' || row.id === user.id)))
    if (req.method === 'PATCH') {
      const updated = filterRows(rows).map(row => { profileEdits.set(row.id, { ...profileEdits.get(row.id), ...body }); return { ...row, ...body } })
      return sendRows(updated)
    }
    return sendRows(rows)
  }
  if (pathname === '/rest/v1/factfind_submissions') {
    if (failSubmissionReads) return send({ code: 'XX000', message: 'Simulated read failure' }, 503)
    const longAnswer =
      'These are fictional notes for checking that longer client answers continue safely onto the next PDF page. '.repeat(
        110,
      ) + 'END-OF-LONG-ANSWER'
    const fixture = {
      id: '00000000-0000-4000-8000-000000000003',
      adviser_id: '00000000-0000-4000-8000-000000000004',
      form_id: '00000000-0000-4000-8000-000000000001',
      reference: 'FF-001234',
      form_type: 'home',
      status: 'new',
      client_name: 'Sam Taylor',
      client_email: 'client@example.test',
      client_phone: null,
      submitted_at: '2026-09-12T10:00:00Z',
      created_at: '2026-09-12T10:00:00Z',
      meta: {},
      submission_data: {
        steps: [
          {
            id: 'notes',
            title: 'Client notes',
            answers: [
              { label: 'Additional details', display: longAnswer },
              { label: 'Date of birth', display: '02/01/1990' },
            ],
          },
        ],
      },
    }
    const rows = [
      fixture,
      ...savedSubmissions,
      {
        ...fixture,
        id: '00000000-0000-4000-8000-000000000005',
        adviser_id: '00000000-0000-4000-8000-000000000006',
        client_name: 'Casey Other',
      },
      ...[
        ['Priya Shah', 'new', 'mortgage'],
        ['Oliver Reed', 'in_review', 'protection'],
        ['Ava Wilson', 'completed', 'home'],
        ['Noah Ahmed', 'archived', 'medical'],
        ['Mia Patel', 'new', 'mortgage'],
        ['George Clark', 'new', 'protection'],
        ['Isla Thompson', 'in_review', 'home'],
        ['Arthur Lewis', 'completed', 'medical'],
        ['Florence Evans', 'completed', 'mortgage'],
        ['Leo Martin', 'archived', 'protection'],
        ['Grace Walker', 'new', 'medical'],
        ['Taylor, Alex (Jr.)', 'new', 'home'],
      ].map(([client_name, status, form_type], index) => ({
        ...fixture,
        id: `00000000-0000-4000-8000-${String(100 + index).padStart(12, '0')}`,
        reference: `FF-${String(1200 + index).padStart(6, '0')}`,
        client_name,
        client_email: `preview${index + 1}@example.test`,
        status,
        form_type,
        submitted_at: `2026-09-${String(index + 1).padStart(2, '0')}T09:00:00Z`,
      })),
    ]
    return sendRows(
      rows
        .filter((row) => service || (user && (user.profileRole === 'admin' || user.id === row.adviser_id)))
        .map((row) => ({
          ...row,
          adviser: {
            name: row.adviser_id === '00000000-0000-4000-8000-000000000004' ? 'Alex Morgan' : 'Jordan Other',
            company_name: 'Morgan Financial',
          },
        })),
    )
  }
  if (pathname === '/rest/v1/activity_log') return failAdminReads ? send({ code: 'XX000', message: 'Simulated activity failure' }, 503) : sendRows([])
  if (pathname === '/rest/v1/adviser_imports') {
    if (failAdminReads) return send({ code: 'XX000', message: 'Simulated directory failure' }, 503)
    const record = { source_form_id: 'fixture', batch_label: 'Fictional import fixture', batch_sha256: 'fixture', source_submitted_at: '2026-01-01T00:00:00Z', created_at: '2026-09-14T00:00:00Z', superseded_by: null, asset_paths: {}, follow_up: ['Confirm current details during activation.'], source_profile: { phone: '+447700900123' }, profile_prefill: { phone: '+447700900123', job_title: 'Mortgage adviser' } }
    return sendRows(user?.profileRole === 'admin' ? [
      { ...record, source_id: 'fixture-prepared', source_row: 1, name: 'Morgan Prepared', email: 'prepared@example.test', company_name: 'Morgan Financial', decision: 'include', decision_reason: 'Completed fictional signup reviewed.', profile_id: preparedAdviserId },
      { ...record, source_id: 'fixture-held', source_row: 2, name: 'Jordan Held', email: 'held@example.test', company_name: 'Held Financial', decision: 'hold', decision_reason: 'Confirm the preferred email before creating an account.', profile_id: null },
      { ...record, source_id: 'fixture-excluded', source_row: 3, name: 'Demo Entry', email: 'demo@example.test', company_name: 'Demo Firm', decision: 'exclude_test', decision_reason: 'Explicit test entry.', profile_id: null },
    ] : [])
  }
  if (pathname === '/rest/v1/factfind_forms') {
    return sendRows(
      user
        ? ['mortgage', 'protection', 'medical', 'home'].flatMap((form_type, index) => [{
            id: `00000000-0000-4000-8000-${String(200 + index).padStart(12, '0')}`,
            adviser_id: user.id,
            form_type,
            unique_slug: 'preview',
            is_active: true,
            created_at: '2026-01-01T00:00:00Z',
          }, ...(user.profileRole === 'admin' ? [{ id: `00000000-0000-4000-8000-${String(300 + index).padStart(12, '0')}`, adviser_id: preparedAdviserId, form_type, unique_slug: 'reservedmock', is_active: false, created_at: '2026-09-14T00:00:00Z' }] : [])])
        : [],
    )
  }
  if (pathname === '/rest/v1/email_templates') {
    const key = requestUrl.searchParams.get('key')?.replace(/^eq\./, '')
    return send(
      key && key === emailScenario.disabledTemplate
        ? [{ key, enabled: false, subject: '', body_html: '', body_text: '' }]
        : [],
    )
  }
  if (pathname === '/rest/v1/email_log' && (emailTests || liveEmailTest)) {
    if (req.method === 'POST' && service) {
      emailLog.push(body)
      return send(null, 201)
    }
    return sendRows(service || user?.profileRole === 'admin' ? emailLog : [])
  }
  if (pathname === '/rest/v1/email_log')
    return send(
      user?.profileRole === 'admin'
        ? [
            {
              id: 'preview-log',
              template_key: 'submission_client_copy',
              to_email: 'client@example.test',
              subject: 'Your completed FactFind',
              status: 'logged',
              provider: 'log',
              created_at: '2026-09-12T09:00:00Z',
            },
          ]
        : [],
    )
  if (req.url === '/test/submissions') return send(submissions)
  if (pathname === '/test/email-state') return send({ mail, emailLog, savedSubmissions, adviserReads })
  if (pathname === '/test/email-scenario' && emailTests) {
    emailScenario = body
    adviserReads = 0
    mail.length = 0
    emailLog.length = 0
    return send({ ok: true })
  }
  if (pathname === '/test/mail' && emailTests) {
    const attempt = { ...body, idempotencyKey: req.headers['idempotency-key'] }
    mail.push(attempt)
    if (emailScenario.failApproval && /account has been approved/i.test(body.subject)) return send({ name: 'validation_error' }, 403)
    const clientCopy = body.to?.includes('client@example.test')
    if (emailScenario.failClient && clientCopy) return send({ name: 'validation_error' }, 403)
    if (
      emailScenario.retryClient &&
      clientCopy &&
      mail.filter((item) => item.to?.includes('client@example.test')).length === 1
    )
      return send({ name: 'rate_limit_exceeded' }, 429)
    return send({ id: `captured-${mail.length}` })
  }
  if (pathname === '/test/submission-read-error') {
    failSubmissionReads = Boolean(body.enabled)
    return send({ ok: true })
  }
  if (pathname === '/test/admin-read-error') { failAdminReads = Boolean(body.enabled); return send({ ok: true }) }
  if (pathname === '/test/reset-profiles') { profileEdits.clear(); return send({ ok: true }) }
  if (req.url === '/test/fail-next') {
    failNext = true
    return send({ ok: true })
  }
  if (req.url === '/rest/v1/rpc/resolve_factfind_form') {
    if (!['preview', 'violet'].includes(body.p_slug)) return send([])
    const practice = profileEdits.get(testAdviserId) ?? {}
    return send([
      {
        form_id: '00000000-0000-4000-8000-000000000001',
        adviser_id: '00000000-0000-4000-8000-000000000002',
        adviser_name: 'Alex Morgan',
        company_name: 'Morgan Financial',
        logo_url: null,
        avatar_url: null,
        brand_colour: body.p_slug === 'violet' ? '#6D28D9' : null,
        job_title: practice.job_title ?? null,
        website: practice.website ?? null,
        business_location: practice.business_location ?? null,
        contact_phone: practice.phone ?? null,
        contact_email: practice.contact_email ?? null,
        services: practice.services ?? null,
        client_focus: practice.client_focus ?? null,
        form_type: body.p_form_type,
        is_active: true,
      },
    ])
  }
  if (req.url === '/rest/v1/rpc/submit_factfind') {
    if (!service) return send({ code: '42501', message: 'Permission denied for submit_factfind' }, 403)
    if (failNext) {
      failNext = false
      return send({ code: 'XX000', message: 'Simulated connection failure' }, 503)
    }
    if (!['preview', 'violet'].includes(body.p_slug))
      return send({ code: 'P0002', message: 'Inactive link' }, 404)
    submissions.push(body)
    const id =
      emailTests || liveEmailTest
        ? `00000000-0000-4000-8000-${String(10000 + submissions.length).padStart(12, '0')}`
        : '00000000-0000-4000-8000-000000000003'
    const reference = `FF-${String(1000 + submissions.length).padStart(6, '0')}`
    if (emailTests || liveEmailTest)
      savedSubmissions.push({
        id,
        reference,
        adviser_id: testAdviserId,
        form_id: '00000000-0000-4000-8000-000000000001',
        client_name: body.p_client_name,
        client_email: liveEmailTest ? process.env.EMAIL_TEST_TO : body.p_client_email,
        client_phone: body.p_client_phone,
        form_type: body.p_form_type,
        status: 'new',
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        submission_data: body.p_submission_data,
        meta: {},
      })
    return send([
      {
        submission_id: id,
        reference,
      },
    ])
  }
  return send({ message: 'Not available in local preview' }, 404)
})
mock.listen(45439, '127.0.0.1', () => {
  if (liveEmailTest) {
    process.loadEnvFile('.env.local')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.EMAIL_TEST_TO ?? '') || !process.env.RESEND_API_KEY)
      throw new Error('Live email tests need an approved EMAIL_TEST_TO and RESEND_API_KEY.')
  }
  const env = {
    ...process.env,
    FACTFIND_PREVIEW: '1',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:45439',
    SUPABASE_URL: 'http://127.0.0.1:45439',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-preview-only',
    SUPABASE_ANON_KEY: 'local-preview-only',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3008',
  }
  for (const key of [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_SECRET_KEY',
    'RESEND_API_KEY',
  ])
    env[key] = ''
  // Saving a validated submission always requires a server key; mail remains
  // disabled unless explicitly enabled for captured/live email tests.
  env.SUPABASE_SERVICE_ROLE_KEY = 'local-preview-service-only'
  if (emailTests || liveEmailTest) {
    env.SUPABASE_SERVICE_ROLE_KEY = 'local-preview-service-only'
    env.RESEND_API_KEY = liveEmailTest ? process.env.RESEND_API_KEY : 're_isolated_test_only'
    env.EMAIL_FROM = liveEmailTest ? process.env.EMAIL_FROM : 'FactFind Pro <notifications@example.test>'
    env.EMAIL_REPLY_TO = liveEmailTest ? process.env.EMAIL_REPLY_TO : 'adviser@example.test'
    env.FACTFIND_EMAIL_TESTS = '1'
  }
  const command = process.argv.includes('--build')
    ? ['build']
    : [process.argv.includes('--production') ? 'start' : 'dev', '-p', '3008', '-H', '127.0.0.1']
  const preload = emailTests ? ['--import', new URL('./capture-email.mjs', import.meta.url).href] : []
  const app = spawn(process.execPath, [...preload, 'node_modules/next/dist/bin/next', ...command], {
    env,
    stdio: 'inherit',
    windowsHide: true,
  })
  const stop = () => {
    app.kill()
    mock.close()
    process.exit()
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  app.on('exit', (code) => {
    mock.close()
    process.exit(code ?? 0)
  })
})
