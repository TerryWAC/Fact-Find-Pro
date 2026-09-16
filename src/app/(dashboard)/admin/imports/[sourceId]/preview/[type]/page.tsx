import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAdviserImport } from '@/lib/adviser-imports'
import { isFactFindType } from '@/lib/constants'
import { getFormSchema } from '@/lib/forms/registry'
import { FactFindClient } from '@/app/f/[type]/[slug]/factfind-client'
import { PublicShell } from '@/components/public/public-shell'

export const dynamic = 'force-dynamic'

export default async function PreparedFactFindPreview({ params }: { params: Promise<{ sourceId: string; type: string }> }) {
  const { sourceId, type } = await params
  const { record, profile, forms, images } = await getAdviserImport(sourceId)
  if (!isFactFindType(type) || record.decision !== 'include' || !profile) notFound()
  const form = forms.find((entry) => entry.form_type === type)
  if (!form) notFound()
  return <>
    <div className="rounded-xl border bg-muted/40 p-4 text-sm"><strong>Admin preview · submissions and emails disabled.</strong><p className="mt-1">Explore the original Typeform question logic with this adviser’s supplied branding.</p><Link href={`/admin/imports/${sourceId}`} className="mt-2 inline-block underline">Back to {record.name}</Link></div>
    <div className="overflow-hidden rounded-2xl border"><PublicShell companyName={profile.company_name || profile.name} logoUrl={images.logo_url} brandColour={profile.brand_colour}>
      <FactFindClient schema={getFormSchema(type)} formType={type} slug={form.unique_slug} adviserName={profile.name} companyName={profile.company_name} adviserPhotoUrl={images.avatar_url} previewOnly />
    </PublicShell></div>
  </>
}
