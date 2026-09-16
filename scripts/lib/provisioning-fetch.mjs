/** An explicit transport allowlist makes invitations and other email endpoints unreachable. */
export function provisioningFetch(projectUrl, transport = fetch) {
  const origin = new URL(projectUrl).origin
  return async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url ?? String(input))
    const method = (init?.method ?? (typeof input === 'object' ? input.method : null) ?? 'GET').toUpperCase()
    const rest = url.pathname.match(/^\/rest\/v1\/(adviser_imports|profiles|factfind_forms|admin_allowlist|email_log)$/)?.[1]
    const allowed = url.origin === origin && (
      (url.pathname === '/auth/v1/admin/users' && ['GET', 'POST'].includes(method)) ||
      (rest && ['GET', 'HEAD'].includes(method)) ||
      (['adviser_imports', 'factfind_forms'].includes(rest) && method === 'POST') ||
      (['profiles', 'adviser_imports'].includes(rest) && method === 'PATCH') ||
      (url.pathname.startsWith('/storage/v1/object/adviser-imports/') && method === 'POST')
    )
    if (!allowed) throw new Error(`Provisioning transport blocked ${method} ${url.pathname}. Email and activation operations are not allowed.`)
    if (url.pathname === '/auth/v1/admin/users' && method === 'POST') {
      const body = JSON.parse(init.body)
      if (body.password || body.email_confirm !== false || body.ban_duration !== '876000h' ||
          !body.app_metadata?.factfind_import_source_id || !body.app_metadata?.factfind_import_digest) {
        throw new Error('Imported users must be unconfirmed, banned and have an auditable source marker, without a shared password.')
      }
    }
    return transport(input, init)
  }
}
