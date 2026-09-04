import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SubmissionDetail } from '@/components/submissions/submission-detail'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Submission' }

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireAdmin()
  const supabase = await createClient()

  const { data: submission } = await supabase
    .from('factfind_submissions')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!submission) notFound()

  const { data: adviser } = await supabase
    .from('profiles')
    .select('name, company_name, email')
    .eq('id', submission.adviser_id)
    .maybeSingle()

  return (
    <SubmissionDetail
      submission={submission}
      adviser={adviser}
      backHref="/admin/submissions"
      backLabel="Back to all submissions"
      showAdviser
    />
  )
}
