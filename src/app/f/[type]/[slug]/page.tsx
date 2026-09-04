import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FactFindClient } from './factfind-client'
import { createClient } from '@/lib/supabase/server'
import { getFormSchema } from '@/lib/forms/registry'
import { FACTFIND_TYPE_META, isFactFindType } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; slug: string }>
}): Promise<Metadata> {
  const { type } = await params
  if (!isFactFindType(type)) return { title: 'FactFind' }

  return {
    title: FACTFIND_TYPE_META[type].label,
    description: FACTFIND_TYPE_META[type].description,
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
  const supabase = await createClient()
  const { data } = await supabase.rpc('resolve_factfind_form', {
    p_form_type: type,
    p_slug: slug,
  })

  const form = Array.isArray(data) ? data[0] : data
  if (!form) notFound()

  const schema = getFormSchema(type)

  return (
    <FactFindClient
      schema={schema}
      formType={type}
      slug={slug}
      adviserName={form.adviser_name}
      companyName={form.company_name}
    />
  )
}
