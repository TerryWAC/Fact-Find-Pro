import { requireApprovedUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { renderSubmissionPdf, submissionPdfFilename } from '@/lib/pdf/render'

export const dynamic = 'force-dynamic'

/** Branded PDF of one of the signed-in adviser's submissions. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { id: adviserId, email, profile } = await requireApprovedUser()
  const supabase = await createClient()

  // RLS already scopes this to the adviser; the explicit filter keeps intent clear.
  const { data: submission } = await supabase
    .from('factfind_submissions')
    .select('*')
    .eq('id', id)
    .eq('adviser_id', adviserId)
    .maybeSingle()

  if (!submission) return new Response('Not found', { status: 404 })

  const pdf = await renderSubmissionPdf({
    submission,
    adviser: {
      name: profile.name,
      company_name: profile.company_name,
      email,
      brand_colour: profile.brand_colour,
      logo_url: profile.logo_url,
      avatar_url: profile.avatar_url,
    },
  })

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${submissionPdfFilename(submission)}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
