// Node preload used only by the isolated email test server. Production code has
// no test endpoint or alternative provider URL. No request reaches Resend here.
if (process.env.FACTFIND_EMAIL_TESTS !== '1' || process.env.SUPABASE_URL !== 'http://127.0.0.1:45439')
  throw new Error('Email capture requires the isolated preview database.')

const originalFetch = globalThis.fetch
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (url === 'https://api.resend.com/emails') {
    return originalFetch('http://127.0.0.1:45439/test/mail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': new Headers(init?.headers).get('Idempotency-Key') ?? '',
      },
      body: init?.body,
    })
  }
  if (!['127.0.0.1', 'localhost'].includes(new URL(url).hostname))
    throw new Error('External network calls are disabled during email integration tests.')
  return originalFetch(input, init)
}
