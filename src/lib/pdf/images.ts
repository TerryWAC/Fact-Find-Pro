import 'server-only'

import sharp from 'sharp'

export interface PdfImage {
  data: Buffer
  format: 'png'
}

const MAX_BYTES = 4 * 1024 * 1024

/**
 * Fetches an adviser image and converts it to PNG for the PDF renderer, which
 * only understands PNG and JPEG (logos are often SVG or WEBP). Any failure —
 * unreachable URL, unsupported file, oversized download — returns null so the
 * PDF still renders, just without the picture.
 */
export async function loadPdfImage(url: string | null | undefined, maxWidth = 900): Promise<PdfImage | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: 'no-store' })
    if (!response.ok) return null
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length === 0 || bytes.length > MAX_BYTES) return null
    const data = await sharp(bytes, { density: 200 })
      .resize({ width: maxWidth, withoutEnlargement: true })
      .png()
      .toBuffer()
    return { data, format: 'png' }
  } catch {
    return null
  }
}
