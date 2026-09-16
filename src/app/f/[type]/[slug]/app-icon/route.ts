import { resolvePublicFactFind } from '@/lib/factfind-public'
import { appIcon } from '@/lib/app-icon'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ type: string; slug: string }> }) {
  const { type, slug } = await params
  const form = await resolvePublicFactFind(type, slug)
  if (!form) return new Response('Not found', { status: 404 })
  return appIcon(form.company_name || form.adviser_name, form.brand_colour, new URL(request.url).searchParams.get('size'))
}
