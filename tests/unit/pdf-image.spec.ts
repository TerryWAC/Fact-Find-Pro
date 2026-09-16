import { test, expect } from '@playwright/test'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import type http from 'node:http'
import type https from 'node:https'
import {
  downloadPublicImage,
  isPublicAddress,
  MAX_IMAGE_BYTES,
  resolvePublicImageUrl,
} from '../../src/lib/pdf/public-image'

test('image URLs block local, private, mapped and reserved addresses', async () => {
  for (const address of [
    '127.0.0.1',
    '10.0.0.1',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '::1',
    'fe80::1',
    'fc00::1',
    '::ffff:127.0.0.1',
    '2001:db8::1',
  ])
    expect(isPublicAddress(address), address).toBe(false)
  for (const url of [
    'http://2130706433/x',
    'http://127.1/x',
    'http://[::1]/x',
    'http://[::ffff:127.0.0.1]/x',
    'file:///x',
    'ftp://example.com/x',
    'https://user:password@example.com/x',
    'https://example.com:1234/x',
  ])
    await expect(resolvePublicImageUrl(url)).rejects.toThrow()
})

test('all DNS answers are checked and empty/private resolutions fail closed', async () => {
  for (const addresses of [
    [],
    [{ address: '127.0.0.1', family: 4 }],
    [
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.1', family: 4 },
    ],
  ])
    await expect(
      resolvePublicImageUrl('https://example.com/logo.png', async () => addresses),
    ).rejects.toThrow()
  const target = await resolvePublicImageUrl('https://example.com/logo.png', async () => [
    { address: '93.184.216.34', family: 4 },
  ])
  expect(target.address).toBe('93.184.216.34')
})

const resolve = async (value: string) => ({
  url: new URL(value),
  hostname: 'example.com',
  address: '93.184.216.34',
  family: 4,
})
function response(statusCode: number, headers: Record<string, string>, chunks: Buffer[]) {
  return Object.assign(Readable.from(chunks), {
    statusCode,
    headers,
  }) as unknown as http.IncomingMessage
}
function stubGet(
  incoming: http.IncomingMessage,
  inspect?: (options: https.RequestOptions) => void,
): typeof https.get {
  return ((
    _url: URL,
    options: https.RequestOptions,
    callback: (res: http.IncomingMessage) => void,
  ) => {
    inspect?.(options)
    const request = Object.assign(new EventEmitter(), { destroy() {} })
    queueMicrotask(() => callback(incoming))
    return request
  }) as typeof https.get
}

test('download pins the verified IP while preserving the TLS hostname and Host header', async () => {
  const bytes = Buffer.from('example image bytes')
  const result = await downloadPublicImage('https://example.com/logo.png', {
    resolve,
    get: stubGet(response(200, { 'content-type': 'image/png' }, [bytes]), (options) => {
      expect(options.hostname).toBe('93.184.216.34')
      expect(options.servername).toBe('example.com')
      expect(options.headers).toMatchObject({ Host: 'example.com' })
      expect(options.agent).toBe(false)
    }),
  })
  expect(result).toEqual(bytes)
})

test('redirects, non-images and oversized Content-Length are refused', async () => {
  for (const incoming of [
    response(302, { location: 'http://169.254.169.254/' }, []),
    response(200, { 'content-type': 'text/html' }, [Buffer.from('<html>')]),
    response(
      200,
      {
        'content-type': 'image/png',
        'content-length': String(MAX_IMAGE_BYTES + 1),
      },
      [],
    ),
  ])
    expect(
      await downloadPublicImage('https://example.com/logo', {
        resolve,
        get: stubGet(incoming),
      }),
    ).toBeNull()
})

test('chunked image data is stopped at the byte limit without trusting headers', async () => {
  const incoming = response(200, { 'content-type': 'image/png' }, [
    Buffer.alloc(MAX_IMAGE_BYTES),
    Buffer.alloc(1),
  ])
  expect(
    await downloadPublicImage('https://example.com/logo', {
      resolve,
      get: stubGet(incoming),
    }),
  ).toBeNull()
  expect(incoming.destroyed).toBe(true)
})

test('a stalled DNS lookup is bounded by the same overall timeout', async () => {
  const started = Date.now()
  expect(
    await downloadPublicImage('https://example.com/logo', {
      resolve: () => new Promise(() => {}),
      timeoutMs: 20,
    }),
  ).toBeNull()
  expect(Date.now() - started).toBeLessThan(1000)
})
