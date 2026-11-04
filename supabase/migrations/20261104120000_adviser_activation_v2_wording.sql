/*
  Activation email: describe the move as FactFind Pro v1 to v2.

  Updates the seeded adviser_activation template in place. Safe to re-run.
  The built-in default in src/lib/email/templates.ts carries the same text.
*/

update public.email_templates
set
  subject   = 'Your FactFind Pro v2 account is ready, {{name}}',
  body_html =
    '<h2>Welcome to FactFind Pro v2</h2>'
    '<p>Hi {{name}},</p>'
    '<p>Wealthy Advisers Club has moved adviser fact finds from FactFind Pro v1 to FactFind Pro v2. Your v2 account for <strong>{{company_name}}</strong> has been prepared for you.</p>'
    '<p>Use the link below to choose a password, check the details we hold and switch on your four new v2 client FactFind links.</p>'
    '<p><a href="{{activation_url}}">Activate my v2 account</a></p>'
    '<p>The link is personal to you, can be used once and expires on {{expires_on}}. If you were not expecting this email, you can ignore it and nothing will change.</p>',
  body_text =
    'Hi {{name}},\n\nWealthy Advisers Club has moved adviser fact finds from FactFind Pro v1 to FactFind Pro v2. Your v2 account for {{company_name}} has been prepared for you.\n\nActivate it, choose a password and check your details here:\n{{activation_url}}\n\nThe link is personal to you, can be used once and expires on {{expires_on}}. If you were not expecting this email, ignore it and nothing will change.',
  updated_at = now()
where key = 'adviser_activation';
