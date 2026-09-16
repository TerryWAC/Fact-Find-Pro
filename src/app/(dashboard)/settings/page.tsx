import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/page-header'
import { UserStatusBadge } from '@/components/shared/status-badge'
import { ProfileForm } from './profile-form'
import { PasswordForm } from './password-form'
import { BrandingForm } from './branding-form'
import { DeliveryForm } from './delivery-form'
import { requireApprovedUser } from '@/lib/auth'
import { formatDate } from '@/lib/utils'
import { emailConfiguration } from '@/lib/email/config'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InstallApp } from '@/components/shared/install-app'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const { profile, email } = await requireApprovedUser()
  const mail = emailConfiguration(process.env)

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your details, security and branding."
        actions={
          <Button asChild variant="outline">
            <Link href="/onboarding?step=1">
              <Wand2 className="h-4 w-4" />
              Re-run setup
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Colleague directory</CardTitle>
              <CardDescription>Keep contact details for your team. Directory entries do not grant access to client records; advisers register separately.</CardDescription>
            </CardHeader>
            <CardContent><Button asChild variant="outline"><Link href="/onboarding?step=5">Manage colleagues</Link></Button></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Your details</CardTitle>
              <CardDescription>
                These appear on your account and client-facing pages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                defaultValues={{
                  name: profile.name,
                  company_name: profile.company_name ?? '',
                  phone: profile.phone ?? '',
                  job_title: profile.job_title,
                  website: profile.website,
                  fca_number: profile.fca_number,
                  business_location: profile.business_location,
                  contact_email: profile.contact_email,
                  services: profile.services,
                  client_focus: profile.client_focus,
                }}
                email={email}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>
                Your firm’s identity on client pages, emails and PDFs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandingForm
                defaultValues={{
                  logo_url: profile.logo_url ?? '',
                  avatar_url: profile.avatar_url ?? '',
                  brand_colour: profile.brand_colour ?? '',
                }}
                companyName={profile.company_name ?? profile.name}
                adviserName={profile.name}
                email={profile.email}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery</CardTitle>
              <CardDescription>
                Where completed fact finds go. PDF downloads and copying answers as JSON are always available.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(!mail.configured || mail.error) && (
                <Alert className="mb-5" variant="warning">
                  <AlertDescription>
                    Email delivery is not enabled for this workspace yet. Your preferences can be
                    saved, but PDF emails will not be delivered until an admin connects Resend.
                  </AlertDescription>
                </Alert>
              )}
              <DeliveryForm
                defaultValues={{
                  delivery_email_copy: profile.delivery_email_copy,
                  delivery_client_copy: profile.delivery_client_copy,
                  delivery_webhook_enabled: profile.delivery_webhook_enabled,
                  delivery_webhook_url: profile.delivery_webhook_url ?? '',
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change the password you use to sign in.</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                <UserStatusBadge status={profile.status} />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Role</span>
                <Badge variant="secondary" className="capitalize">
                  {profile.role}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Adviser ID</span>
                <span className="font-mono text-xs">{profile.adviser_slug ?? '—'}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Member since</span>
                <span>{formatDate(profile.created_at)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Made for your day</CardTitle>
              <CardDescription>Use your workspace on phone, tablet or desktop.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">Add a shortcut for quick access. Your account and submissions stay protected by your usual sign-in.</p>
              <InstallApp name="FactFind Pro" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-accent-strong dark:text-accent" />
                Need help?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              The Wealthy Advisers Club team is on hand if you need anything changed on your
              account.
              <Link href="/how-it-works#help-and-contacts" className="mt-3 flex min-h-11 items-center font-medium text-foreground underline underline-offset-4">Support contacts and guidance</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
