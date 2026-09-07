import { redirect } from 'next/navigation'

/**
 * There is no marketing landing page — FactFind Pro is a private tool.
 *
 * Signed-in users never reach this: middleware sends approved users to
 * /dashboard (or /admin) and unapproved users to /pending. Everyone else
 * lands on the sign-in screen.
 */
export default function RootPage() {
  redirect('/login')
}
