import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { renderSubmissionPdf, submissionPdfFilename } from '@/lib/pdf/render'

export const dynamic = 'force-dynamic'

/** Branded PDF of any submission, in the owning adviser's branding (admin only). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAdmin()
  const supabase = await createClient()

  const { data: submission } = await supabase.from('factfind_submissions').select('*').eq('id', id).maybeSingle()
  if (!submission) return new Response('Not found', { status: 404 })

  const { data: adviser } = await supabase
    .from('profiles')
    .select('name, company_name, email, brand_colour, logo_url, avatar_url')
    .eq('id', submission.adviser_id)
    .maybeSingle()

  const pdf = await renderSubmissionPdf({
    submission,
    adviser: adviser ?? { name: 'Adviser', company_name: null, email: '', brand_colour: null, logo_url: null, avatar_url: null },
  })

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${submissionPdfFilename(submission)}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
