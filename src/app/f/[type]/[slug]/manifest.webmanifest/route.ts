import { resolvePublicFactFind } from '@/lib/factfind-public'
import { appManifest } from '@/lib/app-manifest'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ type: string; slug: string }> }) {
  const { type, slug } = await params
  const form = await resolvePublicFactFind(type, slug)
  if (!form) return new Response('Not found', { status: 404 })
  return Response.json(appManifest(form.company_name || form.adviser_name, `/f/${type}/${slug}`, form.brand_colour), {
    headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'no-store' },
  })
}
