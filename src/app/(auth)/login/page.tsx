import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string; reset?: string }>
}) {
  const params = await searchParams

  return <LoginForm redirectTo={params.redirectTo} notice={params.error} reset={params.reset === '1'} />
}
