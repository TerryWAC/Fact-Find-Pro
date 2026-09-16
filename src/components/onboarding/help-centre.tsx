import Link from 'next/link'
import { ArrowUpRight, Globe, LifeBuoy, Mail, Users } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { LEGAL } from '@/lib/legal'
import { getBaseUrl } from '@/lib/utils'

export function HelpCentre() {
  return (
    <section
      id="help-and-contacts"
      aria-labelledby="help-title"
      className="scroll-mt-24 space-y-5"
    >
      <div>
        <p className="onboarding-eyebrow">The right help, in the right place</p>
        <h2
          id="help-title"
          className="mt-2 text-2xl font-semibold tracking-tight"
        >
          Know where to go next.
        </h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 sm:p-6">
          <Users
            className="mb-4 h-6 w-6 text-accent-strong dark:text-accent"
            aria-hidden
          />
          <h3 className="text-lg font-semibold">Who is FactFind Pro for?</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            UK mortgage and protection advisers collecting information before or
            during a client conversation. Medical and Home forms support the
            relevant health-disclosure and insurance enquiries.
          </p>
          <ul className="mt-4 space-y-3 text-xs leading-6">
            <li>
              <strong>Advisers:</strong> choose the form, explain what is
              needed, review the answers and manage the next steps.
            </li>
            <li>
              <strong>Clients:</strong> use their adviser’s link, answer
              accurately and check the review screen before submitting.
            </li>
            <li>
              <strong>Colleagues:</strong> register separately for their own
              workspace. The team directory does not share access.
            </li>
          </ul>
          <p className="mt-4 border-t pt-4 text-xs leading-6 text-muted-foreground">
            FactFind Pro collects and organises information. The adviser
            provides the advice and checks the completed record.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 sm:p-6">
          <LifeBuoy
            className="mb-4 h-6 w-6 text-accent-strong dark:text-accent"
            aria-hidden
          />
          <h3 className="text-lg font-semibold">Who should I contact?</h3>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="font-medium">
                Questions about a client’s answers or advice
              </dt>
              <dd className="mt-1 text-xs leading-6 text-muted-foreground">
                Contact the adviser named on the FactFind. Clients can use the
                business contact details on their form or reply to a PDF-copy
                email.
              </dd>
            </div>
            <div>
              <dt className="font-medium">
                Account access, approval, branding or a technical problem
              </dt>
              <dd className="mt-1 text-xs leading-6 text-muted-foreground">
                Contact the Wealthy Advisers Club / FactFind Pro team. Include
                your account email, form type, submission reference if
                available, and what went wrong.
              </dd>
            </div>
          </dl>
          <a
            href={`mailto:${BRAND.supportEmail}`}
            className="mt-3 inline-flex min-h-11 max-w-full items-center gap-2 rounded text-sm font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden />
            <span className="break-all">{BRAND.supportEmail}</span>
          </a>
          <p className="text-xs leading-6 text-muted-foreground">
            Alternatively, contact Terry at{' '}
            <a
              href={`mailto:${LEGAL.alternateEmail}`}
              className="inline-flex min-h-11 break-all underline underline-offset-4"
            >
              {LEGAL.alternateEmail}
            </a>
            .
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            For an initial support request, share the reference and problem
            description rather than medical answers or a completed FactFind.
          </p>
        </div>
      </div>
      <nav
        aria-label="Useful FactFind Pro links"
        className="grid gap-3 rounded-2xl border bg-muted/20 p-5 sm:grid-cols-3 sm:p-6"
      >
        <a
          href={`${getBaseUrl()}/login`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center gap-2 rounded text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Globe className="h-4 w-4 shrink-0" aria-hidden />
          FactFind Pro website
          <ArrowUpRight className="h-4 w-4" aria-hidden />
          <span className="sr-only"> (new tab)</span>
        </a>
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center rounded text-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Terms of use<span className="sr-only"> (new tab)</span>
        </Link>
        <Link
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center rounded text-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Privacy and data requests<span className="sr-only"> (new tab)</span>
        </Link>
      </nav>
    </section>
  )
}
