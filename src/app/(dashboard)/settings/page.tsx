import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, Mail, Wand2 } from 'lucide-react'
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

export const metadata: Metadata = { title: 'Settings' }

const FUTURE_FEATURES = [
  {
    icon: Mail,
    title: 'Email templates',
    description: 'Personalise the emails clients receive after they submit a FactFind.',
  },
]

export default async function SettingsPage() {
  const { profile, email } = await requireApprovedUser()

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
              <CardTitle>Your details</CardTitle>
              <CardDescription>These appear on your account and client-facing pages.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                defaultValues={{
                  name: profile.name,
                  company_name: profile.company_name ?? '',
                  phone: profile.phone ?? '',
                }}
                email={email}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>
                Your logo, photo and colour on every client FactFind page and PDF.
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
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery</CardTitle>
              <CardDescription>Where completed fact finds go. PDF and CSV downloads are always on.</CardDescription>
            </CardHeader>
            <CardContent>
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
              <CardTitle>Coming soon</CardTitle>
              <CardDescription>On the roadmap.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {FUTURE_FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3 opacity-70">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <feature.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{feature.title}</p>
                      <Badge variant="outline" className="text-[10px]">
                        Soon
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
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
              The Wealthy Advisers Club team is on hand if you need anything changed on your account.
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
