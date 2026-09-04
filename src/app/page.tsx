import Link from 'next/link'
import { ArrowRight, CheckCircle2, Link2, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/shared/logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { BRAND, FACTFIND_TYPE_META, FACTFIND_TYPES } from '@/lib/constants'

const FEATURES = [
  {
    icon: Link2,
    title: 'Four unique client links',
    body: 'Every approved adviser gets their own Mortgage, Protection, Medical and Home FactFind URLs. Share them by email, WhatsApp or QR code.',
  },
  {
    icon: Users,
    title: 'Submissions bound to you',
    body: 'Every client submission is attached to the adviser whose link was used — and only they can see it.',
  },
  {
    icon: ShieldCheck,
    title: 'Approved advisers only',
    body: 'New registrations are reviewed by the Wealthy Advisors Club team before access is granted.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Logo href="/" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Create account</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="brand-surface relative overflow-hidden">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
              {BRAND.organisation}
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              <span className="text-brand-gold">Sell More Protection.</span>
              <br />
              Protect More Families. Grow Your Business.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65">
              {BRAND.product} gives every adviser their own branded client FactFind links, a single place to
              track submissions, and a workflow your compliance team will actually like.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/signup">
                  Register your practice
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/login">Adviser sign in</Link>
              </Button>
            </div>
          </div>
          <div className="gold-rule h-1 w-full" />
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-xl border bg-card p-6 shadow-sm">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent-strong dark:text-accent">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h2 className="text-base font-semibold tracking-tight">{feature.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t bg-secondary/40">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-xl font-semibold tracking-tight">Four FactFinds, one platform</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Each FactFind is defined by a JSON schema, so question sets can be updated without redeploying
              the platform.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FACTFIND_TYPES.map((type) => {
                const meta = FACTFIND_TYPE_META[type]
                return (
                  <div key={type} className="rounded-xl border bg-card p-5 shadow-sm">
                    <p className="text-sm font-semibold">{meta.label}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{meta.description}</p>
                    <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent-strong dark:text-accent" />
                      Unique link per adviser
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {BRAND.organisation}. All rights reserved.
          </p>
          <a href={`mailto:${BRAND.supportEmail}`} className="hover:text-foreground">
            {BRAND.supportEmail}
          </a>
        </div>
      </footer>
    </div>
  )
}
