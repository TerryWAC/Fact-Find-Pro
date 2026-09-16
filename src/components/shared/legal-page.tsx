import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { Logo } from './logo'
import { LEGAL } from '@/lib/legal'

export function LegalPage({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b"><div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-6"><Logo href="/" showOrganisation={false} /><Link className="text-sm underline underline-offset-4" href="/signup">Create an account</Link></div></header>
      <main className="mx-auto max-w-4xl px-5 py-10 sm:py-16">
        <Link href="/signup" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to registration</Link>
        <p className="text-xs font-medium uppercase tracking-widest text-accent-strong">FactFind Pro · Version {LEGAL.version} · {LEGAL.updatedAt}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-10 space-y-8 text-sm leading-7 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_a]:underline [&_a]:underline-offset-4">{children}</div>
        <aside className="mt-10 rounded-xl border bg-muted/30 p-5 text-sm leading-6">
          <p className="font-medium">Questions or a deletion request?</p>
          <p className="mt-2">Contact your adviser about a client record, or contact {LEGAL.operator} about the platform. Include your submission reference if you have one; please do not email medical details or a copy of your FactFind with an initial request.</p>
          <a className="mt-2 inline-flex min-h-11 items-center gap-2 break-all underline underline-offset-4" href={`mailto:${LEGAL.privacyEmail}`}><Mail className="h-4 w-4 shrink-0" />{LEGAL.privacyEmail}</a>
          <p>Alternatively: <a className="inline-flex min-h-11 items-center break-all underline underline-offset-4" href={`mailto:${LEGAL.alternateEmail}`}>{LEGAL.alternateEmail}</a>.</p>
        </aside>
      </main>
      <footer className="border-t"><nav aria-label="Policies" className="mx-auto flex max-w-4xl flex-wrap gap-6 px-5 py-6 text-sm"><Link className="min-h-11 content-center underline" href="/terms">Terms of use</Link><Link className="min-h-11 content-center underline" href="/privacy">Privacy notice</Link></nav></footer>
    </div>
  )
}
