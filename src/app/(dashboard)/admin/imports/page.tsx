import type { Metadata } from 'next'
import Link from 'next/link'
import { Download, ArrowRight, Users, FileText, CirclePause } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SubmissionLoadError } from '@/components/submissions/submission-load-error'
import { IMPORT_DECISIONS, importStatus } from '@/lib/adviser-directory'
import { textSearchFilter } from '@/lib/postgrest-search'
import { Pagination } from '@/components/shared/pagination'
import { submissionPage } from '@/lib/submission-search'
import type { AdviserImport } from '@/lib/supabase/database.types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Existing advisers' }
const PAGE_SIZE = 25

export default async function AdviserDirectoryPage({ searchParams }: { searchParams: Promise<{ q?: string; decision?: string; page?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const supabase = await createClient()
  const buildQuery = () => {
    let query = supabase.from('adviser_imports').select('source_id, source_row, name, email, company_name, decision, decision_reason, profile_id', { count: 'exact' }).order('source_row')
    if (params.q?.trim()) query = query.or(textSearchFilter(['name', 'email', 'company_name'], params.q.trim()))
    if (params.decision && Object.hasOwn(IMPORT_DECISIONS, params.decision)) query = query.eq('decision', params.decision as AdviserImport['decision'])
    return query
  }
  let page = submissionPage(params.page)
  const [totals, initial] = await Promise.all([
    supabase.from('adviser_imports').select('decision, profile_id'),
    buildQuery().range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
  ])
  let result = initial
  if (page > 1 && (result.error?.code === 'PGRST103' || (!result.error && !result.data?.length))) {
    page = 1
    result = await buildQuery().range(0, PAGE_SIZE - 1)
  }
  const prepared = totals.data?.filter((r) => r.decision === 'include' && r.profile_id).length
  const held = totals.data?.filter((r) => r.decision === 'hold').length
  return <>
    <PageHeader title="Existing advisers" description="The complete Typeform signup directory, with every record accounted for." actions={<Button variant="outline" asChild><a href="/admin/imports/export" download><Download className="h-4 w-4" />Download full list</a></Button>} />
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Source responses" value={totals.error ? '—' : totals.data?.length ?? 0} icon={Users} />
      <StatCard label="Prepared advisers" value={totals.error ? '—' : prepared ?? 0} description="Four reserved FactFinds per adviser" icon={FileText} />
      <StatCard label="Held for review" value={totals.error ? '—' : held ?? 0} icon={CirclePause} />
    </div>
    <div className="rounded-xl border border-accent/25 bg-accent/5 p-5 text-sm"><strong>Prepared privately · no invitations sent.</strong><p className="mt-1 text-muted-foreground">Open an adviser to see their details, source branding and four FactFind previews. Accounts and client links remain inactive until activation is released. Test entries and unresolved identities are listed separately.</p></div>
    <Card className="overflow-hidden p-0">
      <form className="flex flex-wrap items-end gap-3 border-b p-4" action="/admin/imports">
        <label className="min-w-48 flex-1 text-xs font-medium">Search advisers<Input name="q" defaultValue={params.q} placeholder="Name, firm or email" className="mt-1" /></label>
        <label className="text-xs font-medium">Record type<select name="decision" defaultValue={params.decision ?? ''} className="mt-1 block h-10 rounded-md border bg-background px-3 text-sm"><option value="">All records</option>{Object.entries(IMPORT_DECISIONS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <Button type="submit">Filter</Button><Button variant="ghost" asChild><Link href="/admin/imports">Reset</Link></Button>
      </form>
      {result.error ? <SubmissionLoadError title="Adviser directory could not be loaded" /> : result.data?.length ? <ul className="divide-y">{result.data.map((row) => <li key={row.source_id}>
        <Link href={`/admin/imports/${row.source_id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40">
          <span className="hidden w-9 shrink-0 text-xs tabular-nums text-muted-foreground sm:block">#{row.source_row}</span>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{row.name || 'Name missing'}</p><Badge variant={row.decision === 'include' ? 'outline' : 'secondary'}>{importStatus(row)}</Badge></div><p className="mt-1 break-words text-xs text-muted-foreground">{row.company_name || 'Company not supplied'} · {row.email || 'Email missing'}</p></div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link></li>)}</ul> : <p className="p-8 text-center text-sm text-muted-foreground">No adviser records match these filters.</p>}
      {!result.error && !!result.count && <Pagination page={page} pageSize={PAGE_SIZE} total={result.count} />}
    </Card>
  </>
}
