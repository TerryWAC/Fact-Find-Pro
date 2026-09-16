import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FactFindClient } from './factfind-client'
import { resolvePublicFactFind } from '@/lib/factfind-public'
import { getFormSchema } from '@/lib/forms/registry'
import { FACTFIND_TYPE_META, isFactFindType } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; slug: string }>
}): Promise<Metadata> {
  const { type, slug } = await params
  const form = await resolvePublicFactFind(type, slug)
  if (!isFactFindType(type) || !form) return { title: { absolute: 'FactFind unavailable' }, openGraph: null }
  const firm = form.company_name || form.adviser_name
  const title = `${FACTFIND_TYPE_META[type].label} · ${firm}`
  const icon = `/f/${type}/${slug}/app-icon?size=192`

  return {
    title: { absolute: title },
    description: FACTFIND_TYPE_META[type].description,
    applicationName: firm,
    manifest: `/f/${type}/${slug}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: firm, statusBarStyle: 'default' },
    icons: { icon, apple: `/f/${type}/${slug}/app-icon?size=180` },
    openGraph: { title, siteName: firm, description: FACTFIND_TYPE_META[type].description, type: 'website' },
    robots: { index: false, follow: false },
  }
}

export default async function PublicFactFindPage({
  params,
}: {
  params: Promise<{ type: string; slug: string }>
}) {
  const { type, slug } = await params

  if (!isFactFindType(type)) notFound()
  if (!/^[a-z0-9]{4,32}$/i.test(slug)) notFound()

  // Resolves through a SECURITY DEFINER function — the tables stay private.
  // Cached per request, so the branded layout above shares this lookup.
  const form = await resolvePublicFactFind(type, slug)
  if (!form) notFound()

  const schema = getFormSchema(type)

  return (
    <FactFindClient
      schema={schema}
      formType={type}
      slug={slug}
      adviserName={form.adviser_name}
      companyName={form.company_name}
      adviserPhotoUrl={form.avatar_url}
      practice={form}
    />
  )
}
