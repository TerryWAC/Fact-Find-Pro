import { z } from 'zod'

const ukPhone = z
  .string()
  .trim()
  .min(7, 'Enter a valid phone number')
  .max(24, 'Enter a valid phone number')
  .regex(/^[+()\-\s\d]+$/, 'Enter a valid phone number')

export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[a-z]/, 'Include at least one lowercase letter')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/\d/, 'Include at least one number')

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(120),
    company_name: z.string().trim().min(2, 'Enter your company name').max(160),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    phone: ukPhone,
    password: passwordSchema,
    confirm_password: z.string().min(1, 'Confirm your password'),
    terms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms to continue' }),
    }),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
export type SignupValues = z.infer<typeof signupSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
})
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm_password: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(120),
  company_name: z.string().trim().min(2, 'Enter your company name').max(160),
  phone: ukPhone,
})
export type ProfileValues = z.infer<typeof profileSchema>

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password'),
    password: passwordSchema,
    confirm_password: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

/** Client-facing FactFind identity fields — always collected, whatever the question set. */
export const clientIdentitySchema = z.object({
  client_name: z.string().trim().min(2, 'Please enter your full name').max(160),
  client_email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  client_phone: z.string().trim().max(24).optional().or(z.literal('')),
})
export type ClientIdentityValues = z.infer<typeof clientIdentitySchema>

// -----------------------------------------------------------------------------
// Onboarding
// -----------------------------------------------------------------------------

const optionalText = (max = 160) => z.string().trim().max(max).optional().or(z.literal(''))

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((value) => value === '' || /^https?:\/\/[^\s]+$/i.test(value), 'Enter a full URL starting with http:// or https://')
  .optional()
  .or(z.literal(''))

/** Step 2 — Your details. Everything is optional so the step can be skipped. */
export const onboardingDetailsSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(120),
  job_title: optionalText(120),
  phone: optionalText(24),
  company_name: optionalText(160),
  fca_number: optionalText(40),
  website: optionalUrl,
  business_location: optionalText(160),
})
export type OnboardingDetailsValues = z.infer<typeof onboardingDetailsSchema>

/** Step 3 — Your brand. Images may be uploaded or supplied as a URL. */
export const onboardingBrandSchema = z.object({
  logo_url: optionalUrl,
  avatar_url: optionalUrl,
})
export type OnboardingBrandValues = z.infer<typeof onboardingBrandSchema>

/** Step 4 — Delivery. A webhook URL is required when the webhook is enabled. */
export const onboardingDeliverySchema = z
  .object({
    delivery_email_copy: z.boolean(),
    delivery_webhook_enabled: z.boolean(),
    delivery_webhook_url: optionalUrl,
  })
  .refine(
    (values) => !values.delivery_webhook_enabled || Boolean(values.delivery_webhook_url),
    { message: 'Enter the webhook URL to send fact finds to', path: ['delivery_webhook_url'] },
  )
export type OnboardingDeliveryValues = z.infer<typeof onboardingDeliverySchema>

/** Step 5 — Your team. */
export const teamMemberSchema = z.object({
  name: z.string().trim().min(2, 'Enter their full name').max(120),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  phone: optionalText(24),
  job_title: optionalText(120),
  fca_number: optionalText(40),
  role: z.enum(['adviser', 'administrator', 'paraplanner']),
  headshot_url: optionalUrl,
})
export type TeamMemberValues = z.infer<typeof teamMemberSchema>
