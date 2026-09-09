import 'server-only'

import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { pdfFontFamily } from './fonts'
import { loadPdfImage } from './images'
import { SubmissionPdf, type PdfAdviser } from './submission-document'
import { normaliseSubmissionData } from '@/lib/submission-data'
import { BRAND_BANNER } from '@/lib/constants'
import { getBaseUrl } from '@/lib/utils'
import type { FactFindSubmission } from '@/lib/supabase/database.types'

export interface RenderSubmissionPdfInput {
  submission: FactFindSubmission
  adviser: PdfAdviser & { logo_url: string | null; avatar_url: string | null }
}

/** File name for a submission PDF, e.g. FF-000123-mortgage-factfind.pdf */
export function submissionPdfFilename(submission: Pick<FactFindSubmission, 'reference' | 'form_type'>): string {
  return `${submission.reference}-${submission.form_type}-factfind.pdf`.replace(/[^a-z0-9.-]+/gi, '-')
}

/**
 * Renders a submission as a branded PDF: the adviser's logo (or the Wealthy
 * Advisers Club banner), photo and colour, then every section and answer.
 */
export async function renderSubmissionPdf({ submission, adviser }: RenderSubmissionPdfInput): Promise<Buffer> {
  const fontFamily = pdfFontFamily()
  const [logo, photo] = await Promise.all([
    loadPdfImage(adviser.logo_url ?? (BRAND_BANNER ? `${getBaseUrl()}${BRAND_BANNER}` : null)),
    loadPdfImage(adviser.avatar_url, 300),
  ])

  const element = createElement(SubmissionPdf, {
    submission,
    adviser,
    steps: normaliseSubmissionData(submission.submission_data),
    logo,
    photo,
    fontFamily,
    generatedAt: new Date(),
  })

  // renderToBuffer's typing expects a DocumentProps element; the component returns one.
  return Buffer.from(await renderToBuffer(element as unknown as Parameters<typeof renderToBuffer>[0]))
}
