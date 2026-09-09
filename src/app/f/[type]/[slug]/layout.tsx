import { PublicShell } from '@/components/public/public-shell'
import { resolvePublicFactFind } from '@/lib/factfind-public'

export const dynamic = 'force-dynamic'

/**
 * Paints the client-facing page in the adviser's branding. A link that does
 * not resolve still gets the default shell, so the not-found page has a frame.
 */
export default async function BrandedFactFindLayout({
  params,
  children,
}: {
  params: Promise<{ type: string; slug: string }>
  children: React.ReactNode
}) {
  const { type, slug } = await params
  const form = await resolvePublicFactFind(type, slug)

  return (
    <PublicShell logoUrl={form?.logo_url} brandColour={form?.brand_colour} companyName={form?.company_name}>
      {children}
    </PublicShell>
  )
}
