import { CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { BRAND } from '@/lib/constants'

const HIGHLIGHTS = [
  'Four unique client FactFind links per adviser',
  'Every submission tied to the adviser who owns the link',
  'Search, filter and export your client submissions',
  'Approved by the Wealthy Advisors Club team',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="brand-surface relative hidden flex-col justify-between p-10 lg:flex">
        <Logo variant="light" href="/login" />

        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            <span className="text-brand-gold">Sell more.</span> Protect more families.
            <br />
            Grow your business.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/65">{BRAND.tagline}</p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/50">
          © {new Date().getFullYear()} {BRAND.organisation}
        </p>

        <div className="gold-rule absolute inset-x-0 bottom-0 h-1" />
      </aside>

      {/* Form panel */}
      <main className="flex flex-col bg-background">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Logo href="/login" className="lg:invisible" />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
  )
}
