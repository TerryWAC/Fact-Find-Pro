'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { completeActivation } from '@/lib/adviser-activation'
import { activationSchema } from '@/lib/validations'
import type { ActionState } from '@/app/(auth)/actions'

function fieldErrorsFrom(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '')
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
  }
  return fieldErrors
}

const text = (formData: FormData, key: string) => {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}
const ticked = (formData: FormData, key: string) => ['on', 'true'].includes(text(formData, key))

/** Activates a prepared adviser account from its one-time link, then signs the adviser in. */
export async function activateAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = activationSchema.safeParse({
    token: text(formData, 'token'),
    name: text(formData, 'name'),
    company_name: text(formData, 'company_name'),
    phone: text(formData, 'phone'),
    job_title: text(formData, 'job_title'),
    website: text(formData, 'website'),
    business_location: text(formData, 'business_location'),
    password: text(formData, 'password'),
    confirm_password: text(formData, 'confirm_password'),
    terms: ticked(formData, 'terms'),
    delivery_email_copy: ticked(formData, 'delivery_email_copy'),
    delivery_client_copy: ticked(formData, 'delivery_client_copy'),
    use_photo: ticked(formData, 'use_photo'),
    use_logo: ticked(formData, 'use_logo'),
  })
  // Zod skips the password-match refinement when another field fails, so
  // check it directly and show every problem in one pass.
  const fieldErrors = parsed.success ? {} : fieldErrorsFrom(parsed.error)
  if (!fieldErrors.confirm_password && text(formData, 'password') !== text(formData, 'confirm_password')) {
    fieldErrors.confirm_password = 'Passwords do not match'
  }
  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { error: 'Please check the form and try again.', fieldErrors }
  }

  const result = await completeActivation(parsed.data)
  if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors }

  // Sign the adviser straight in with the password they just chose.
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email: result.email, password: parsed.data.password })
  revalidatePath('/', 'layout')
  redirect(error ? '/login?activated=1' : '/dashboard')
}
