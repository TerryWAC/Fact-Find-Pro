import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, Mail, MailCheck, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { SignOutButton } from './sign-out-button'
import { BRAND } from '@/lib/constants'
import { getSessionUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Awaiting approval' }

const STEPS = [
  {
    icon: MailCheck,
    title: 'Account created',
    body: 'Your details are stored securely and your registration has been logged.',
    done: true,
  },
  {
    icon: Clock,
    title: 'Awaiting approval',
    body: 'The Wealthy Advisers Club team reviews your registration. We will email you when a decision is made.',
    done: false,
  },
  {
    icon: ShieldCheck,
    title: 'Make it yours',
    body: 'Once approved, sign in to add your logo, colours and adviser details, and choose your PDF email preferences.',
    done: false,
  },
  {
    icon: ShieldCheck,
    title: 'Share your four links',
    body: 'Your Mortgage, Protection, Medical and Home links are created automatically on approval. Copy them from your dashboard after setup.',
    done: false,
  },
]

export default async function PendingPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; confirm?: string }>
}) {
  const params = await searchParams
  const session = await getSessionUser()
  const email = params.email ?? session?.email
  const needsEmailConfirmation = params.confirm === '1'
  const status = session?.profile.status

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {status === 'rejected' ? 'Registration not approved' : 'Your setup is in progress'}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {status === 'rejected'
            ? `Your FactFind Pro registration was not approved. Contact the ${BRAND.organisation} team if you believe this is a mistake.`
            : 'Your account has been created and is awaiting approval from the Wealthy Advisers Club team.'}
        </p>
      </div>

      {email && status !== 'rejected' && (
        <Alert variant="info">
          <Mail />
          <AlertDescription>
            {needsEmailConfirmation ? (
              <>
                Please confirm your email address using the link we sent to{' '}
                <strong className="font-medium">{email}</strong>, then wait for approval.
              </>
            ) : (
              <>
                Watch <strong className="font-medium">{email}</strong> for your approval email, then sign in
                to finish setting up your practice.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {status !== 'rejected' && (
        <ol className="space-y-4">
          {STEPS.map((step) => (
            <li key={step.title} className="flex gap-3.5">
              <span
                className={
                  step.done
                    ? 'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-strong dark:text-accent'
                    : 'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground'
                }
                aria-hidden
              >
                <step.icon className="h-4 w-4" />
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-col gap-2 border-t pt-6 sm:flex-row">
        {session ? <SignOutButton /> : null}
        <Button asChild variant="outline" className="sm:flex-1">
          <a href={`mailto:${BRAND.supportEmail}`}>Contact support</a>
        </Button>
        {!session && (
          <Button asChild className="sm:flex-1">
            <Link href="/login">Back to sign in</Link>
          </Button>
        )}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        You can read the <Link href="/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">terms of use</Link> and{' '}
        <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">privacy notice</Link> here at any time.
      </p>
    </div>
  )
}
