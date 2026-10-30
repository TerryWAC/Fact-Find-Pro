import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ActivationForm } from './activation-form'
import { ACTIVATION_MESSAGES, loadActivation } from '@/lib/adviser-activation'
import { LEGAL } from '@/lib/legal'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Activate your account', robots: { index: false, follow: false } }

export default async function ActivateAccountPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const lookup = await loadActivation(token)

  if (lookup.kind !== 'ready') {
    const message = ACTIVATION_MESSAGES[lookup.kind]
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{message.title}</h1>
          <p className="text-sm text-muted-foreground">{message.body}</p>
        </div>
        <Alert>
          <AlertCircle />
          <AlertDescription>
            Need help? Email{' '}
            <a className="underline underline-offset-4" href={`mailto:${LEGAL.privacyEmail}`}>
              {LEGAL.privacyEmail}
            </a>
            .
          </AlertDescription>
        </Alert>
        <Button asChild className="w-full" size="lg">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    )
  }

  const { profile, prefill, images } = lookup
  return (
    <ActivationForm
      token={lookup.token}
      email={profile.email}
      expiresOn={formatDate(lookup.expiresAt)}
      defaults={{
        name: profile.name || prefill.name || '',
        company_name: profile.company_name || prefill.company_name || '',
        phone: profile.phone || prefill.phone || '',
        job_title: profile.job_title || prefill.job_title || '',
        website: profile.website || prefill.website || '',
        business_location: profile.business_location || prefill.business_location || '',
      }}
      images={images}
    />
  )
}
