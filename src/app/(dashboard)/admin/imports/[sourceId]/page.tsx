import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Eye, LockKeyhole, BadgeCheck, MailCheck } from 'lucide-react'
import { getAdviserImport } from '@/lib/adviser-imports'
import { followUpNotes, importStatus, stringFields } from '@/lib/adviser-directory'
import { activationLabel } from '@/lib/activation-status'
import { latestActivation } from '@/lib/activation-token'
import { createClient } from '@/lib/supabase/server'
import { FACTFIND_TYPE_META, factFindUrl } from '@/lib/constants'
import { getBaseUrl, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/shared/copy-button'
import { InviteAdviserButton } from '@/components/admin/invite-adviser-button'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Prepared adviser' }

export default async function PreparedAdviserPage({ params }: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await params
  const { record, profile, forms, images } = await getAdviserImport(sourceId)
  const details = stringFields(record.decision === 'include' ? record.profile_prefill : record.source_profile)
  const notes = followUpNotes(record.follow_up)
  const supabase = await createClient()
  const { data: activationRows } = profile
    ? await supabase.from('adviser_activations').select('sent_at, expires_at, used_at').eq('profile_id', profile.id)
    : { data: [] }
  const latest = latestActivation(activationRows ?? [])
  const stage = profile ? activationLabel({ importPending: profile.import_pending, latest }) : null
  return <>
    <Button variant="ghost" size="sm" asChild><Link href="/admin/imports"><ArrowLeft className="h-4 w-4" />All existing advisers</Link></Button>
    <PageHeader title={record.name || 'Name missing'} description={record.company_name || 'Company not supplied'} actions={<span className="flex flex-wrap gap-2"><Badge variant="outline">{importStatus(record)}</Badge>{stage && <Badge variant={stage.tone}>{stage.label}</Badge>}</span>} />
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card><CardHeader><CardTitle>Adviser details</CardTitle></CardHeader><CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">{(['avatar_url', 'logo_url'] as const).map((key) => <figure key={key}><div className="flex h-36 items-center justify-center rounded-xl border bg-muted/20 p-3">{images[key] ?
          // eslint-disable-next-line @next/next/no-img-element -- private signed image, never sent to an optimisation cache
          <img src={images[key]} alt={key === 'avatar_url' ? 'Supplied adviser photo' : 'Supplied company logo'} className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-muted-foreground">No usable image supplied</span>}</div><figcaption className="mt-2 text-xs text-muted-foreground">{key === 'avatar_url' ? 'Source photo' : 'Source logo'} · private preview</figcaption></figure>)}</div>
        <dl className="space-y-3 text-sm">{[['Email', record.email], ['Phone', details.phone], ['Job title', details.job_title], ['Website', details.website], ['Business location', details.business_location], ['Typeform submitted', record.source_submitted_at ? formatDate(record.source_submitted_at) : 'Incomplete response']].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words">{value || 'Not supplied'}</dd></div>)}</dl>
        <p className="text-xs text-muted-foreground">Source response #{record.source_row} · {record.batch_label}</p>
      </CardContent></Card>
      <div className="space-y-6">
      {profile && record.decision === 'include' && <Card data-testid="activation-card"><CardHeader><CardTitle>Activation</CardTitle></CardHeader><CardContent className="space-y-4">
        {!profile.import_pending ? <p className="flex items-start gap-2 text-sm"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />Activated{latest?.used_at ? ` on ${formatDate(latest.used_at, true)}` : ''}. The account is live and the four FactFind links are public.</p>
          : <>
            <p className="flex items-start gap-2 text-sm text-muted-foreground"><MailCheck className="mt-0.5 h-4 w-4 shrink-0" />{latest
              ? `Activation link sent ${formatDate(latest.sent_at, true)}; it ${new Date(latest.expires_at).getTime() > Date.now() ? `expires ${formatDate(latest.expires_at)}` : `expired ${formatDate(latest.expires_at)}`}. Not yet activated.`
              : 'No activation link has been sent. The account and its FactFind links stay inactive until the adviser activates.'}</p>
            <InviteAdviserButton profileId={profile.id} name={profile.name} email={profile.email} resend={Boolean(latest)} />
          </>}
      </CardContent></Card>}
      <Card><CardHeader><CardTitle>Prepared FactFinds</CardTitle></CardHeader><CardContent className="space-y-4">
        {profile && forms.length ? <><p className="flex items-start gap-2 text-sm text-muted-foreground"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />{profile.import_pending ? 'Reserved links. Not public until the adviser activates. Admin previews cannot save submissions or send emails.' : 'Live client links; the adviser also sees them on their own links page.'}</p>
          {forms.map((form) => { const url = factFindUrl(getBaseUrl(), form.form_type, form.unique_slug); return <div key={form.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{FACTFIND_TYPE_META[form.form_type].label}</h3><span className="flex gap-2">{form.variant && <Badge variant="outline">Bespoke questions: {form.variant.replace(/_/g, ' ')}</Badge>}<Badge variant={form.is_active ? 'success' : 'outline'}>{form.is_active ? 'Active' : 'Reserved'}</Badge></span></div><p className="mt-2 break-all font-mono text-[11px] text-muted-foreground">{url}</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" asChild><Link href={`/admin/imports/${sourceId}/preview/${form.form_type}`}><Eye className="h-4 w-4" />Preview</Link></Button><CopyButton value={url} label={form.is_active ? 'Copy link' : 'Copy reserved link'} toastMessage={form.is_active ? 'Link copied' : 'Reserved link copied. It remains inactive.'} /></div></div> })}</> : <p className="text-sm text-muted-foreground">{record.decision === 'include' ? 'Preparation is incomplete. This record has no reserved FactFinds yet.' : 'No account or FactFinds have been created for this source response.'}</p>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Review notes</CardTitle></CardHeader><CardContent><p className="text-sm">{record.decision_reason}</p>{record.superseded_by && <Link className="mt-2 block text-sm underline" href={`/admin/imports/${record.superseded_by}`}>View the selected response</Link>}<ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">{notes.map((note, index) => <li key={index}>{note}</li>)}</ul><p className="mt-4 text-xs text-muted-foreground">Delivery preferences and current terms are confirmed by the adviser on activation.</p></CardContent></Card></div>
    </div>
  </>
}
