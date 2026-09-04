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
