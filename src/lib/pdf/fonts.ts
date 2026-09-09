import 'server-only'

import fs from 'node:fs'
import path from 'node:path'
import { Font } from '@react-pdf/renderer'

let registered: string | null = null

/**
 * Registers Poppins (the app's typeface) for PDF rendering and returns the
 * family name to use. Falls back to the built-in Helvetica when the font files
 * are not available on the server, rather than failing the download.
 *
 * The .ttf files ship with the app (src/lib/pdf/fonts) and are pulled into the
 * serverless bundle by `outputFileTracingIncludes` in next.config.ts.
 */
export function pdfFontFamily(): string {
  if (registered) return registered

  const dir = path.join(process.cwd(), 'src', 'lib', 'pdf', 'fonts')
  const faces = [
    { file: 'Poppins-Regular.ttf', fontWeight: 400 },
    { file: 'Poppins-SemiBold.ttf', fontWeight: 600 },
    { file: 'Poppins-Bold.ttf', fontWeight: 700 },
  ] as const

  try {
    Font.register({
      family: 'Poppins',
      fonts: faces.map((face) => ({
        src: `data:font/ttf;base64,${fs.readFileSync(path.join(dir, face.file)).toString('base64')}`,
        fontWeight: face.fontWeight,
      })),
    })
    // Keep words whole — hyphenating "Remortgage" across lines reads badly.
    Font.registerHyphenationCallback((word) => [word])
    registered = 'Poppins'
  } catch (error) {
    console.warn(`[pdf] Poppins not available (${(error as Error).message}); using Helvetica.`)
    registered = 'Helvetica'
  }
  return registered
}
