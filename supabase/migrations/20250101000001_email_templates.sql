-- =============================================================================
-- FactFind Pro — default configurable email templates
-- =============================================================================
-- Templates use {{double_brace}} placeholders resolved at send time by
-- src/lib/email/render.ts. Editing a row here changes the live email.
-- =============================================================================

insert into public.email_templates (key, name, description, subject, body_html, body_text)
values
  (
    'new_registration',
    'New registration (to admin)',
    'Sent to the Wealthy Advisers Club admin inbox when an adviser signs up.',
    'New FactFind Pro registration — {{name}}',
    '<h2>New adviser registration</h2>'
    '<p>A new adviser has registered for FactFind Pro and is awaiting approval.</p>'
    '<ul>'
    '<li><strong>Name:</strong> {{name}}</li>'
    '<li><strong>Company:</strong> {{company_name}}</li>'
    '<li><strong>Email:</strong> {{email}}</li>'
    '<li><strong>Phone:</strong> {{phone}}</li>'
    '<li><strong>Registered:</strong> {{registered_at}}</li>'
    '</ul>'
    '<p><a href="{{approvals_url}}">Review pending approvals</a></p>',
    'New adviser registration awaiting approval.\n\nName: {{name}}\nCompany: {{company_name}}\nEmail: {{email}}\nPhone: {{phone}}\nRegistered: {{registered_at}}\n\nReview: {{approvals_url}}'
  ),
  (
    'approval',
    'Account approved (to adviser)',
    'Sent to the adviser when an admin approves their registration.',
    'Your FactFind Pro account has been approved',
    '<h2>Welcome to FactFind Pro</h2>'
    '<p>Hi {{name}},</p>'
    '<p>Your FactFind Pro account has been approved.</p>'
    '<p>You can now sign in and share your four unique client FactFind links — Mortgage, Protection, Medical and Home.</p>'
    '<p><a href="{{login_url}}">Sign in to FactFind Pro</a></p>'
    '<p>— The Wealthy Advisers Club team</p>',
    'Hi {{name}},\n\nYour FactFind Pro account has been approved. Sign in at {{login_url}}\n\n— The Wealthy Advisers Club team'
  ),
  (
    'rejection',
    'Registration rejected (to adviser)',
    'Sent to the adviser when an admin rejects their registration.',
    'Your FactFind Pro registration',
    '<h2>FactFind Pro registration</h2>'
    '<p>Hi {{name}},</p>'
    '<p>Thank you for your interest in FactFind Pro. Unfortunately we are unable to approve your account at this time.</p>'
    '<p>{{reason}}</p>'
    '<p>If you believe this is a mistake, reply to this email and the Wealthy Advisers Club team will take another look.</p>',
    'Hi {{name}},\n\nWe are unable to approve your FactFind Pro account at this time.\n\n{{reason}}\n\nReply to this email if you believe this is a mistake.'
  ),
  (
    'submission_notification',
    'New FactFind submission (to adviser)',
    'Sent to the adviser when a client completes one of their FactFind links.',
    'New {{form_type}} FactFind from {{client_name}}',
    '<h2>New {{form_type}} FactFind received</h2>'
    '<p>Hi {{name}},</p>'
    '<p><strong>{{client_name}}</strong> ({{client_email}}) has submitted your {{form_type}} FactFind.</p>'
    '<ul>'
    '<li><strong>Reference:</strong> {{reference}}</li>'
    '<li><strong>Submitted:</strong> {{submitted_at}}</li>'
    '</ul>'
    '<p><a href="{{submission_url}}">View the submission</a></p>',
    'Hi {{name}},\n\n{{client_name}} ({{client_email}}) submitted your {{form_type}} FactFind.\n\nReference: {{reference}}\nSubmitted: {{submitted_at}}\n\nView: {{submission_url}}'
  ),
  (
    'password_reset',
    'Password reset (to user)',
    'Reference copy of the password reset email. Supabase Auth sends the live one.',
    'Reset your FactFind Pro password',
    '<h2>Reset your password</h2>'
    '<p>Hi {{name}},</p>'
    '<p>Use the link below to choose a new FactFind Pro password. It expires in 60 minutes.</p>'
    '<p><a href="{{reset_url}}">Reset my password</a></p>'
    '<p>If you did not request this, you can safely ignore this email.</p>',
    'Hi {{name}},\n\nReset your FactFind Pro password: {{reset_url}}\n\nIf you did not request this, ignore this email.'
  )
on conflict (key) do nothing;
