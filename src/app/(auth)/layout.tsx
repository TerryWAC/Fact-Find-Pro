import { ArrowUpRight, Check, FileText, Layers3 } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { BRAND } from '@/lib/constants'
import styles from './auth-layout.module.css'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.brand}>
        <div className={styles.brandHeader}>
          <Logo variant="light" href="/login" showOrganisation={false} />
          <span className={styles.edition}>The adviser platform</span>
        </div>

        <div className={styles.story}>
          <p className={styles.eyebrow}><span /> A clearer beginning</p>
          <h2>A clearer picture.<em>A better beginning.</em></h2>
          <p className={styles.description}>Give every client a thoughtful first step. Bring their answers together, ready for your next conversation.</p>

          <div className={styles.illustration} aria-hidden="true">
            <div className={styles.orbit} />
            <div className={styles.paperBack} />
            <div className={styles.paper}>
              <div className={styles.paperHeader}><span><Layers3 size={16} /> YOUR CLIENT WORKSPACE</span><span className={styles.paperDots}>···</span></div>
              <p className={styles.paperTitle}>The details. All together.</p>
              <div className={styles.documentRow}>
                <span className={styles.documentIcon}><FileText size={20} /></span>
                <div><strong>Mortgage FactFind</strong><span>Answers organised for your review</span></div>
                <ArrowUpRight size={17} />
              </div>
              <div className={styles.paperLines}><i /><i /><i /></div>
              <div className={styles.paperFooter}><span><Check size={13} /> Branded for your practice</span><span>PDF</span></div>
            </div>
            <div className={styles.note}><span className={styles.noteIcon}><Check size={16} /></span><div><strong>Ready for the next step</strong><span>From answers to conversation</span></div></div>
          </div>
        </div>

        <div className={styles.brandFooter}>
          <p>Four FactFinds. One workspace.</p>
          <div><span>Mortgage</span><span>Protection</span><span>Medical</span><span>Home</span></div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.mainHeader}>
          <div className="lg:hidden"><Logo href="/login" showOrganisation={false} /></div>
          <span className={styles.workspaceLabel}>Your adviser workspace</span>
          <ThemeToggle />
        </header>
        <div className={styles.formArea}>
          <div className={styles.formCard}>{children}</div>
        </div>
        <footer className={styles.footer}><span>FactFind Pro</span><span>By {BRAND.organisation}</span></footer>
      </main>
    </div>
  )
}
