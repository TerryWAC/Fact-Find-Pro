import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SubmissionDetail } from '@/components/submissions/submission-detail'
import { requireApprovedUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Submission' }

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: submissionId } = await params
  const { id: adviserId } = await requireApprovedUser()
  const supabase = await createClient()

  // RLS already scopes this to the adviser; the explicit filter keeps intent clear.
  const { data: submission } = await supabase
    .from('factfind_submissions')
    .select('*')
    .eq('id', submissionId)
    .eq('adviser_id', adviserId)
    .maybeSingle()

  if (!submission) notFound()

  return <SubmissionDetail submission={submission} backHref="/submissions" pdfHref={`/submissions/${submission.id}/pdf`} />
}
