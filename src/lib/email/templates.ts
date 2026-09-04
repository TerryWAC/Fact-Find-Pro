import type { FactFindType } from '@/lib/supabase/database.types'

export type EmailTemplateKey =
  | 'new_registration'
  | 'approval'
  | 'rejection'
  | 'submission_notification'
  | 'password_reset'

export interface EmailTemplateDefinition {
  key: EmailTemplateKey
  name: string
  description: string
  subject: string
  bodyHtml: string
  bodyText: string
  variables: string[]
}

/**
 * Built-in fallbacks. The live copy lives in `public.email_templates` so it can
 * be edited without a deploy; these are used when a row is missing.
 */
export const DEFAULT_EMAIL_TEMPLATES: Record<EmailTemplateKey, EmailTemplateDefinition> = {
  new_registration: {
    key: 'new_registration',
    name: 'New registration (to admin)',
    description: 'Sent to the Wealthy Advisors Club admin inbox when an adviser signs up.',
    subject: 'New FactFind Pro registration — {{name}}',
    bodyHtml: `<h2>New adviser registration</h2>
<p>A new adviser has registered for FactFind Pro and is awaiting approval.</p>
<ul>
  <li><strong>Name:</strong> {{name}}</li>
  <li><strong>Company:</strong> {{company_name}}</li>
  <li><strong>Email:</strong> {{email}}</li>
  <li><strong>Phone:</strong> {{phone}}</li>
  <li><strong>Registered:</strong> {{registered_at}}</li>
</ul>
<p><a href="{{approvals_url}}">Review pending approvals</a></p>`,
    bodyText: `New adviser registration awaiting approval.

Name: {{name}}
Company: {{company_name}}
Email: {{email}}
Phone: {{phone}}
Registered: {{registered_at}}

Review: {{approvals_url}}`,
    variables: ['name', 'company_name', 'email', 'phone', 'registered_at', 'approvals_url'],
  },
  approval: {
    key: 'approval',
    name: 'Account approved (to adviser)',
    description: 'Sent to the adviser when an admin approves their registration.',
    subject: 'Your FactFind Pro account has been approved',
    bodyHtml: `<h2>Welcome to FactFind Pro</h2>
<p>Hi {{name}},</p>
<p>Your FactFind Pro account has been approved.</p>
<p>You can now sign in and share your four unique client FactFind links — Mortgage, Protection, Medical and Home.</p>
<p><a href="{{login_url}}">Sign in to FactFind Pro</a></p>
<p>— The Wealthy Advisors Club team</p>`,
    bodyText: `Hi {{name}},

Your FactFind Pro account has been approved. Sign in at {{login_url}}

— The Wealthy Advisors Club team`,
    variables: ['name', 'company_name', 'login_url'],
  },
  rejection: {
    key: 'rejection',
    name: 'Registration rejected (to adviser)',
    description: 'Sent to the adviser when an admin rejects their registration.',
    subject: 'Your FactFind Pro registration',
    bodyHtml: `<h2>FactFind Pro registration</h2>
<p>Hi {{name}},</p>
<p>Thank you for your interest in FactFind Pro. Unfortunately we are unable to approve your account at this time.</p>
<p>{{reason}}</p>
<p>If you believe this is a mistake, reply to this email and the Wealthy Advisors Club team will take another look.</p>`,
    bodyText: `Hi {{name}},

We are unable to approve your FactFind Pro account at this time.

{{reason}}

Reply to this email if you believe this is a mistake.`,
    variables: ['name', 'company_name', 'reason'],
  },
  submission_notification: {
    key: 'submission_notification',
    name: 'New FactFind submission (to adviser)',
    description: 'Sent to the adviser when a client completes one of their FactFind links.',
    subject: 'New {{form_type}} FactFind from {{client_name}}',
    bodyHtml: `<h2>New {{form_type}} FactFind received</h2>
<p>Hi {{name}},</p>
<p><strong>{{client_name}}</strong> ({{client_email}}) has submitted your {{form_type}} FactFind.</p>
<ul>
  <li><strong>Reference:</strong> {{reference}}</li>
  <li><strong>Submitted:</strong> {{submitted_at}}</li>
</ul>
<p><a href="{{submission_url}}">View the submission</a></p>`,
    bodyText: `Hi {{name}},

{{client_name}} ({{client_email}}) submitted your {{form_type}} FactFind.

Reference: {{reference}}
Submitted: {{submitted_at}}

View: {{submission_url}}`,
    variables: [
      'name',
      'client_name',
      'client_email',
      'form_type',
      'reference',
      'submitted_at',
      'submission_url',
    ],
  },
  password_reset: {
    key: 'password_reset',
    name: 'Password reset (to user)',
    description: 'Reference copy. Supabase Auth sends the live password reset email.',
    subject: 'Reset your FactFind Pro password',
    bodyHtml: `<h2>Reset your password</h2>
<p>Hi {{name}},</p>
<p>Use the link below to choose a new FactFind Pro password. It expires in 60 minutes.</p>
<p><a href="{{reset_url}}">Reset my password</a></p>
<p>If you did not request this, you can safely ignore this email.</p>`,
    bodyText: `Hi {{name}},

Reset your FactFind Pro password: {{reset_url}}

If you did not request this, ignore this email.`,
    variables: ['name', 'reset_url'],
  },
}

export const EMAIL_TEMPLATE_KEYS = Object.keys(DEFAULT_EMAIL_TEMPLATES) as EmailTemplateKey[]

/** Variable payload shapes, so callers get compile-time safety per template. */
export interface EmailVariablesMap {
  new_registration: {
    name: string
    company_name: string
    email: string
    phone: string
    registered_at: string
    approvals_url: string
  }
  approval: { name: string; company_name: string; login_url: string }
  rejection: { name: string; company_name: string; reason: string }
  submission_notification: {
    name: string
    client_name: string
    client_email: string
    form_type: FactFindType | string
    reference: string
    submitted_at: string
    submission_url: string
  }
  password_reset: { name: string; reset_url: string }
}
