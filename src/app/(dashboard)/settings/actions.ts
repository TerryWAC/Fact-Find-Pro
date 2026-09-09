'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { brandingSchema, changePasswordSchema, deliverySchema, profileSchema } from '@/lib/validations'

export interface SettingsActionState {
  ok?: boolean
  error?: string
  message?: string
  fieldErrors?: Record<string, string>
}

function fieldErrorsFrom(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '')
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
  }
  return fieldErrors
}

export async function updateProfileAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = profileSchema.safeParse({
    name: formData.get('name'),
    company_name: formData.get('company_name'),
    phone: formData.get('phone'),
  })

  if (!parsed.success) {
    return { error: 'Please check the form and try again.', fieldErrors: fieldErrorsFrom(parsed.error) }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Your session has expired. Please sign in again.' }

  // RLS blocks role/status changes, so this can only ever edit safe fields.
  const { error } = await supabase.from('profiles').update(parsed.data).eq('id', user.id)
  if (error) return { error: error.message }

  // Keep the auth metadata in step with the profile.
  await supabase.auth.updateUser({ data: parsed.data })

  revalidatePath('/settings')
  revalidatePath('/', 'layout')

  return { ok: true, message: 'Your details have been updated.' }
}

export async function changePasswordAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = changePasswordSchema.safeParse({
    current_password: formData.get('current_password'),
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

  if (!user?.email) return { error: 'Your session has expired. Please sign in again.' }

  // Re-authenticate before allowing a password change.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current_password,
  })

  if (signInError) {
    return { error: 'Your current password is incorrect.', fieldErrors: { current_password: 'Incorrect password' } }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: error.message }

  return { ok: true, message: 'Your password has been changed.' }
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

/**
 * Logo, photo and brand colour. Images are uploaded separately through
 * `uploadBrandImageAction`; this stores the resulting URLs and the colour.
 */
export async function updateBrandingAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = brandingSchema.safeParse({
    logo_url: text(formData, 'logo_url'),
    avatar_url: text(formData, 'avatar_url'),
    brand_colour: text(formData, 'brand_colour'),
  })

  if (!parsed.success) {
    return { error: 'Please check the form and try again.', fieldErrors: fieldErrorsFrom(parsed.error) }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Your session has expired. Please sign in again.' }

  const { error } = await supabase
    .from('profiles')
    .update({
      logo_url: parsed.data.logo_url || null,
      avatar_url: parsed.data.avatar_url || null,
      brand_colour: parsed.data.brand_colour || null,
    })
    .eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/settings')
  revalidatePath('/', 'layout')

  return { ok: true, message: 'Your branding has been updated. Client pages and PDFs use it from now on.' }
}

/** Where completed fact finds go: adviser copy, client PDF copy, webhook. */
export async function updateDeliveryAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = deliverySchema.safeParse({
    delivery_email_copy: formData.get('delivery_email_copy') === 'on',
    delivery_client_copy: formData.get('delivery_client_copy') === 'on',
    delivery_webhook_enabled: formData.get('delivery_webhook_enabled') === 'on',
    delivery_webhook_url: text(formData, 'delivery_webhook_url'),
  })

  if (!parsed.success) {
    return { error: 'Please check the form and try again.', fieldErrors: fieldErrorsFrom(parsed.error) }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Your session has expired. Please sign in again.' }

  const values = parsed.data
  const { error } = await supabase
    .from('profiles')
    .update({
      delivery_email_copy: values.delivery_email_copy,
      delivery_client_copy: values.delivery_client_copy,
      delivery_webhook_enabled: values.delivery_webhook_enabled,
      // Clearing the URL alongside the toggle keeps the CHECK constraint happy.
      delivery_webhook_url: values.delivery_webhook_enabled ? values.delivery_webhook_url?.trim() || null : null,
    })
    .eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { ok: true, message: 'Your delivery options have been updated.' }
}
