import type { Metadata } from 'next'
import { AlertCircle, Link2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { LinkCard } from './link-card'
import { requireApprovedUser } from '@/lib/auth'
import { getAdviserForms } from '@/lib/queries'
import { factFindUrl } from '@/lib/constants'
import { getBaseUrl } from '@/lib/utils'

export const metadata: Metadata = { title: 'My FactFind Links' }

export default async function LinksPage() {
  const { id, profile } = await requireApprovedUser()
  const forms = await getAdviserForms(id)
  const baseUrl = getBaseUrl()

  return (
    <>
      <PageHeader
        title="My FactFind Links"
        description="Your four unique client links. Share them by email, WhatsApp or QR code — every submission comes straight back to you."
        actions={
          profile.adviser_slug ? (
            <Badge variant="outline" className="font-mono text-xs">
              ID: {profile.adviser_slug}
            </Badge>
          ) : null
        }
      />

      <Alert variant="info">
        <AlertCircle />
        <AlertDescription>
          These links are unique to you and never overlap with another adviser. Anyone who completes one is
          automatically attached to your account.
        </AlertDescription>
      </Alert>

      {forms.length === 0 ? (
        <Card>
          <EmptyState
            icon={Link2}
            title="Your links are being generated"
            description="Links are created automatically when an account is approved. Refresh in a moment, or contact support if this persists."
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {forms.map((form) => (
            <LinkCard
              key={form.id}
              type={form.form_type}
              url={factFindUrl(baseUrl, form.form_type, form.unique_slug)}
              isActive={form.is_active}
            />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How to use your links</CardTitle>
          <CardDescription>A few ways advisers share their FactFinds with clients.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
          <div className="space-y-1">
            <p className="font-medium">1. Send before the meeting</p>
            <p className="leading-relaxed text-muted-foreground">
              Email the link when you book the appointment so the client arrives prepared.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">2. Add to your signature</p>
            <p className="leading-relaxed text-muted-foreground">
              Put your Mortgage link in your email signature for a steady flow of enquiries.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">3. Turn it into a QR code</p>
            <p className="leading-relaxed text-muted-foreground">
              Great for business cards, flyers and in-branch posters.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
