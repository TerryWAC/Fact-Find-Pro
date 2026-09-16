import 'server-only'

import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'
import { BRAND_BANNER } from '@/lib/constants'
import { downloadPublicImage, MAX_IMAGE_BYTES } from './public-image'

export interface PdfImage {
  data: Buffer
  format: 'png'
}

async function convertImage(bytes: Buffer, maxWidth: number): Promise<PdfImage | null> {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return null
  const data = await sharp(bytes, {
    density: 144,
    limitInputPixels: 16_000_000,
  })
    .resize({
      width: maxWidth,
      height: maxWidth,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png()
    .toBuffer()
  return { data, format: 'png' }
}

/** The house banner is a bundled asset, never a request back to the app server. */
export async function loadHouseBanner(): Promise<PdfImage | null> {
  if (!BRAND_BANNER) return null
  try {
    const bytes = await fs.readFile(path.join(process.cwd(), 'public', BRAND_BANNER))
    return await convertImage(bytes, 900)
  } catch {
    return null
  }
}

/**
 * Fetches an adviser image and converts it to PNG for the PDF renderer, which
 * only understands PNG and JPEG (logos are often SVG or WEBP). Any failure —
 * unreachable URL, unsupported file, oversized download — returns null so the
 * PDF still renders, just without the picture.
 */
export async function loadPdfImage(
  url: string | null | undefined,
  maxWidth = 900,
): Promise<PdfImage | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null
  try {
    const bytes = await downloadPublicImage(url)
    return bytes ? await convertImage(bytes, maxWidth) : null
  } catch {
    return null
  }
}
