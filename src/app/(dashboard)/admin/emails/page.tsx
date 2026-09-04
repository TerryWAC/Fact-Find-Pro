import type { Metadata } from 'next'
import { Mail, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_EMAIL_TEMPLATES, EMAIL_TEMPLATE_KEYS } from '@/lib/email/templates'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Email Templates' }

export default async function AdminEmailsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [templatesResult, logResult] = await Promise.all([
    supabase.from('email_templates').select('*').order('key'),
    supabase
      .from('email_log')
      .select('id, template_key, to_email, subject, status, provider, created_at')
      .order('created_at', { ascending: false })
      .limit(15),
  ])

  const stored = templatesResult.data ?? []
  const log = logResult.data ?? []

  // Fall back to the built-in defaults when a row has not been seeded yet.
  const templates = EMAIL_TEMPLATE_KEYS.map((key) => {
    const row = stored.find((template) => template.key === key)
    const fallback = DEFAULT_EMAIL_TEMPLATES[key]
    return {
      key,
      name: row?.name ?? fallback.name,
      description: row?.description ?? fallback.description,
      subject: row?.subject ?? fallback.subject,
      enabled: row?.enabled ?? true,
      updatedAt: row?.updated_at ?? null,
      source: row ? 'database' : 'built-in default',
      variables: fallback.variables,
    }
  })

  const provider = process.env.RESEND_API_KEY ? 'Resend' : 'Log only (no provider configured)'

  return (
    <>
      <PageHeader
        title="Email templates"
        description="The notifications FactFind Pro sends. Edit the copy in the email_templates table — no deploy required."
      />

      <Alert variant="info">
        <Info />
        <AlertDescription>
          Delivery provider: <strong>{provider}</strong>. Without <code>RESEND_API_KEY</code> emails are
          written to the server log and the <code>email_log</code> table so every flow stays testable.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.key}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                {template.enabled ? (
                  <Badge variant="success">Enabled</Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subject</p>
                <p className="mt-0.5 break-words text-sm">{template.subject}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Available variables
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {template.variables.map((variable) => (
                    <code
                      key={variable}
                      className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                    >
                      {`{{${variable}}}`}
                    </code>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Source: {template.source}
                {template.updatedAt ? ` · updated ${formatDate(template.updatedAt)}` : ''}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <CardHeader className="p-6 pb-4">
          <CardTitle>Recent deliveries</CardTitle>
          <CardDescription>The last 15 notifications FactFind Pro attempted to send.</CardDescription>
        </CardHeader>
        {log.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No emails sent yet"
            description="Approvals, rejections and registration alerts will be logged here."
          />
        ) : (
          <ul className="divide-y border-t">
            {log.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-3 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{entry.subject}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.to_email} · {entry.template_key}
                  </p>
                </div>
                <Badge variant={entry.status === 'sent' ? 'success' : entry.status === 'failed' ? 'destructive' : 'secondary'}>
                  {entry.status}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatDate(entry.created_at, true)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
