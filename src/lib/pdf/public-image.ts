import { lookup } from 'node:dns/promises'
import http from 'node:http'
import https from 'node:https'
import ipaddr from 'ipaddr.js'

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

/** Accept ordinary public addresses only, including after DNS resolution. */
export function isPublicAddress(address: string): boolean {
  try {
    return ipaddr.process(address).range() === 'unicast'
  } catch {
    return false
  }
}

export async function resolvePublicImageUrl(
  value: string,
  resolve = (hostname: string) => lookup(hostname, { all: true }),
) {
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port)
    throw new Error('Use a direct public image URL on a standard HTTP or HTTPS port.')
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = ipaddr.isValid(hostname)
    ? [
        {
          address: hostname,
          family: ipaddr.parse(hostname).kind() === 'ipv4' ? 4 : 6,
        },
      ]
    : await resolve(hostname)
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address)))
    throw new Error('Private or reserved image addresses are not allowed.')
  return { url, hostname, ...addresses[0] }
}

/**
 * Pins the connection to the checked IP. No second DNS lookup or redirects can
 * move it onto a private network. The byte/time limits apply while downloading.
 */
export function downloadPublicImage(
  value: string,
  dependencies: {
    resolve?: typeof resolvePublicImageUrl
    get?: typeof https.get
    timeoutMs?: number
  } = {},
): Promise<Buffer | null> {
  return new Promise((resolve) => {
    let request: http.ClientRequest | undefined
    let settled = false
    const finish = (data: Buffer | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(data)
    }
    const timer = setTimeout(() => {
      finish(null)
      request?.destroy()
    }, dependencies.timeoutMs ?? 8000)
    const resolveTarget = dependencies.resolve ?? resolvePublicImageUrl
    resolveTarget(value)
      .then(({ url, hostname, address, family }) => {
        if (settled) return
        const get = dependencies.get ?? (url.protocol === 'https:' ? https.get : http.get)
        request = get(
          url,
          {
            hostname: address,
            family,
            servername: ipaddr.isValid(hostname) ? undefined : hostname,
            headers: { Host: url.host, Accept: 'image/*' },
            agent: false,
          },
          (response) => {
            const contentType = response.headers['content-type']?.split(';')[0].trim() ?? ''
            if (
              response.statusCode !== 200 ||
              !/^image\//i.test(contentType) ||
              Number(response.headers['content-length']) > MAX_IMAGE_BYTES
            ) {
              finish(null)
              response.destroy()
              return
            }
            const chunks: Buffer[] = []
            let size = 0
            response.on('data', (chunk: Buffer) => {
              size += chunk.length
              if (size > MAX_IMAGE_BYTES) {
                finish(null)
                response.destroy()
              } else chunks.push(chunk)
            })
            response.on('end', () => finish(size ? Buffer.concat(chunks) : null))
            response.on('error', () => finish(null))
            response.on('close', () => finish(null))
          },
        )
        request.on('error', () => finish(null))
      })
      .catch(() => finish(null))
  })
}
