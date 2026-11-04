import type { FactFindType } from '@/lib/supabase/database.types'

export type EmailTemplateKey =
  | 'new_registration'
  | 'approval'
  | 'rejection'
  | 'submission_notification'
  | 'submission_client_copy'
  | 'adviser_activation'
  | 'v1_retirement_notice'
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
    description: 'Sent to the Wealthy Advisers Club admin inbox when an adviser signs up.',
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
<p>— The Wealthy Advisers Club team</p>`,
    bodyText: `Hi {{name}},

Your FactFind Pro account has been approved. Sign in at {{login_url}}

— The Wealthy Advisers Club team`,
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
<p>If you believe this is a mistake, reply to this email and the Wealthy Advisers Club team will take another look.</p>`,
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
  submission_client_copy: {
    key: 'submission_client_copy',
    name: 'Copy of FactFind (to client)',
    description: 'Sent to the client with their completed FactFind attached as a PDF.',
    subject: 'Your {{form_type}} FactFind — copy for your records',
    bodyHtml: `<h2>Your {{form_type}} FactFind</h2>
<p>Hi {{client_name}},</p>
<p>Thank you for completing your {{form_type}} FactFind. A copy of everything you told us is attached as a PDF for your records.</p>
<ul>
  <li><strong>Reference:</strong> {{reference}}</li>
  <li><strong>Submitted:</strong> {{submitted_at}}</li>
</ul>
<p>If anything needs correcting, just reply to this email and {{adviser_name}} will update it.</p>
<p>{{adviser_name}}<br>{{company_name}}</p>`,
    bodyText: `Hi {{client_name}},

Thank you for completing your {{form_type}} FactFind. A copy of everything you told us is attached as a PDF for your records.

Reference: {{reference}}
Submitted: {{submitted_at}}

If anything needs correcting, just reply to this email and {{adviser_name}} will update it.

{{adviser_name}}
{{company_name}}`,
    variables: ['client_name', 'adviser_name', 'company_name', 'form_type', 'reference', 'submitted_at'],
  },
  adviser_activation: {
    key: 'adviser_activation',
    name: 'Account activation (to existing adviser)',
    description: 'Sent to a prepared adviser with their single-use link to set a password and activate their account.',
    subject: 'Your FactFind Pro v2 account is ready, {{name}}',
    bodyHtml: `<h2>Welcome to FactFind Pro v2</h2>
<p>Hi {{name}},</p>
<p>Wealthy Advisers Club has moved adviser fact finds from FactFind Pro v1 to FactFind Pro v2. Your v2 account for <strong>{{company_name}}</strong> has been prepared for you.</p>
<p>Use the link below to choose a password, check the details we hold and switch on your four new v2 client FactFind links.</p>
<p><a href="{{activation_url}}">Activate my v2 account</a></p>
<p>The link is personal to you, can be used once and expires on {{expires_on}}. If you were not expecting this email, you can ignore it and nothing will change.</p>`,
    bodyText: `Hi {{name}},

Wealthy Advisers Club has moved adviser fact finds from FactFind Pro v1 to FactFind Pro v2. Your v2 account for {{company_name}} has been prepared for you.

Activate it, choose a password and check your details here:
{{activation_url}}

The link is personal to you, can be used once and expires on {{expires_on}}. If you were not expecting this email, ignore it and nothing will change.`,
    variables: ['name', 'company_name', 'activation_url', 'expires_on'],
  },
  v1_retirement_notice: {
    key: 'v1_retirement_notice',
    name: 'Version 1 retirement notice (to existing adviser)',
    description: 'One-off notice to every prepared adviser that Fact Find Version 1 is being discontinued and Version 2 is the only platform.',
    subject: 'Important Notice: Fact Find Version 1 Retiring Tomorrow – Please Switch to Version 2',
    bodyHtml: `<h2>Fact Find Version 1 retires tomorrow</h2>
<p>Dear {{name}},</p>
<p>We are writing to let you know that <strong>Fact Find Version 1 will be discontinued from tomorrow, 5 November 2026.</strong> From this date, Version 1 will no longer be accessible or operational.</p>
<p>We have now moved to <strong>Fact Find Version 2</strong>, which will be the only version available going forward.</p>
<p><strong>How to access Fact Find Version 2</strong></p>
<p>We have already sent an email to all members with instructions on how to log in and access the new Version 2 platform. If you haven't received this email, please check your junk or spam folder.</p>
<p>Alternatively, you can register directly using the link below:</p>
<p><a href="{{signup_url}}">Sign Up for Fact Find Version 2</a></p>
<p>Please ensure you have registered and can access Version 2 before Version 1 is discontinued tomorrow to avoid any disruption to your work.</p>
<p>If you experience any issues accessing the new platform or need assistance, please get in touch with our team.</p>
<p>Thank you for your cooperation.</p>
<p>Kind regards,<br>The Club Team</p>`,
    bodyText: `Dear {{name}},

We are writing to let you know that Fact Find Version 1 will be discontinued from tomorrow, 5 November 2026. From this date, Version 1 will no longer be accessible or operational.

We have now moved to Fact Find Version 2, which will be the only version available going forward.

How to access Fact Find Version 2

We have already sent an email to all members with instructions on how to log in and access the new Version 2 platform. If you haven't received this email, please check your junk or spam folder.

Alternatively, you can register directly here:
{{signup_url}}

Please ensure you have registered and can access Version 2 before Version 1 is discontinued tomorrow to avoid any disruption to your work.

If you experience any issues accessing the new platform or need assistance, please get in touch with our team.

Thank you for your cooperation.

Kind regards,
The Club Team`,
    variables: ['name', 'signup_url'],
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
  submission_client_copy: {
    client_name: string
    adviser_name: string
    company_name: string
    form_type: string
    reference: string
    submitted_at: string
  }
  submission_notification: {
    name: string
    client_name: string
    client_email: string
    form_type: FactFindType | string
    reference: string
    submitted_at: string
    submission_url: string
  }
  adviser_activation: { name: string; company_name: string; activation_url: string; expires_on: string }
  v1_retirement_notice: { name: string; signup_url: string }
  password_reset: { name: string; reset_url: string }
}
