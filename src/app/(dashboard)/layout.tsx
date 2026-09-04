import { SidebarNav } from '@/components/layout/sidebar-nav'
import { Topbar } from '@/components/layout/topbar'
import { requireApprovedUser } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireApprovedUser()
  const isAdmin = profile.role === 'admin'

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar — the mobile sheet lives in the topbar */}
      <aside className="sticky top-0 hidden h-screen lg:block">
        <SidebarNav isAdmin={isAdmin} />
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
        <Topbar profile={profile} isAdmin={isAdmin} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl animate-fade-in space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
