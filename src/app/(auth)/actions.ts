'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdminRecipients, sendEmail } from '@/lib/email/send'
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from '@/lib/validations'
import { getBaseUrl } from '@/lib/utils'
import { isSupabaseConfigured, supabaseConfigMessage } from '@/lib/env'

export interface ActionState {
  ok?: boolean
  error?: string
  message?: string
  fieldErrors?: Record<string, string>
}

/**
 * Guards every auth action. Without Supabase credentials `createClient()`
 * throws deep inside the SDK, which surfaces to the user as an unexplained
 * error page — so catch it here and say exactly what is wrong.
 */
function configGuard(): ActionState | null {
  if (isSupabaseConfigured()) return null
  console.error(`[factfind] ${supabaseConfigMessage()}`)
  return { error: supabaseConfigMessage() }
}

function fieldErrorsFrom(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '')
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
  }
  return fieldErrors
}

// -----------------------------------------------------------------------------
// Sign in
// -----------------------------------------------------------------------------
export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const misconfigured = configGuard()
  if (misconfigured) return misconfigured

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: 'Please check the form and try again.', fieldErrors: fieldErrorsFrom(parsed.error) }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error || !data.user) {
    return { error: 'Incorrect email or password. Please try again.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, onboarding_completed_at')
    .eq('id', data.user.id)
    .maybeSingle()

  const status = profile?.status ?? 'pending'

  if (status !== 'approved') {
    await supabase.auth.signOut()

    if (status === 'rejected') {
      return {
        error:
          'Your registration was not approved. Please contact the Wealthy Advisers Club team if you think this is a mistake.',
      }
    }
    if (status === 'suspended') {
      return { error: 'Your account has been suspended. Please contact the Wealthy Advisers Club team.' }
    }
    return {
      error:
        'Your account is still awaiting approval from the Wealthy Advisers Club team. We will email you as soon as it is approved.',
    }
  }

  const redirectTo = String(formData.get('redirectTo') ?? '')
  const safeRedirect = redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : null

  revalidatePath('/', 'layout')

  // First sign-in goes to setup; middleware would bounce them there anyway, and
  // redirecting once keeps the URL clean.
  if (!profile?.onboarding_completed_at) redirect('/onboarding')

  redirect(safeRedirect ?? (profile.role === 'admin' ? '/admin' : '/dashboard'))
}

// -----------------------------------------------------------------------------
// Sign up
// -----------------------------------------------------------------------------
export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const misconfigured = configGuard()
  if (misconfigured) return misconfigured

  const parsed = signupSchema.safeParse({
    name: formData.get('name'),
    company_name: formData.get('company_name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password'),
    confirm_password: formData.get('confirm_password'),
    terms: formData.get('terms') === 'on' || formData.get('terms') === 'true',
  })

  if (!parsed.success) {
    return { error: 'Please check the form and try again.', fieldErrors: fieldErrorsFrom(parsed.error) }
  }

  const { name, company_name, email, phone, password } = parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, company_name, phone },
      emailRedirectTo: `${getBaseUrl()}/auth/callback`,
    },
  })

  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      return { error: 'An account with that email address already exists. Try signing in instead.' }
    }
    return { error: error.message }
  }

  // An allowlisted admin is approved by the signup trigger itself. Send them
  // straight into setup rather than to the waiting-room screen.
  if (data.session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', data.user?.id ?? '')
      .maybeSingle()

    if (profile?.status === 'approved') {
      revalidatePath('/', 'layout')
      redirect('/onboarding')
    }
  }

  // Notify the admin team that there is someone to approve.
  const recipients = await getAdminRecipients()
  if (recipients.length > 0) {
    await sendEmail('new_registration', recipients, {
      name,
      company_name,
      email,
      phone,
      registered_at: new Date().toLocaleString('en-GB'),
      approvals_url: `${getBaseUrl()}/admin/users?status=pending`,
    })
  }

  // The profile trigger sets status = 'pending'; the user cannot get in yet.
  redirect(`/pending?email=${encodeURIComponent(email)}${data.session ? '' : '&confirm=1'}`)
}

// -----------------------------------------------------------------------------
// Forgot / reset password
// -----------------------------------------------------------------------------
export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const misconfigured = configGuard()
  if (misconfigured) return misconfigured

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') })

  if (!parsed.success) {
    return { error: 'Please check the form and try again.', fieldErrors: fieldErrorsFrom(parsed.error) }
  }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getBaseUrl()}/auth/callback?next=/reset-password`,
  })

  // Always report success — never reveal whether an address is registered.
  return {
    ok: true,
    message:
      'If that email address has a FactFind Pro account, we have sent a password reset link. It expires in 60 minutes.',
  }
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const misconfigured = configGuard()
  if (misconfigured) return misconfigured

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirm_password: formData.get('confirm_password'),
  })

  if (!parsed.success) {
    return { error: 'Please check the form and try again.', fieldErrors: fieldErrorsFrom(parsed.error) }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Your reset link has expired or has already been used. Request a new one to continue.',
    }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: error.message }

  return { ok: true, message: 'Your password has been updated. You can now sign in.' }
}

// -----------------------------------------------------------------------------
// Sign out
// -----------------------------------------------------------------------------
/**
 * Signs the user out server-side.
 *
 * Deliberately a server action rather than a browser Supabase client: it keeps
 * credentials entirely on the server, so the app needs no NEXT_PUBLIC_ variable
 * inlined at build time and works with whatever names a platform integration
 * happens to inject.
 */
export async function signOutAction(redirectTo = '/login') {
  const safeRedirect =
    redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/login'

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }

  revalidatePath('/', 'layout')
  redirect(safeRedirect)
}
