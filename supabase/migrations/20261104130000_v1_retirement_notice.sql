/*
  One-off notice to existing advisers that Fact Find Version 1 is being
  discontinued. Seeds the editable template; sending is an admin action in
  Admin > Existing advisers and the email log records who has had it.
  Safe to re-run.
*/

insert into public.email_templates (key, name, description, subject, body_html, body_text)
values
  (
    'v1_retirement_notice',
    'Version 1 retirement notice (to existing adviser)',
    'One-off notice to every prepared adviser that Fact Find Version 1 is being discontinued and Version 2 is the only platform.',
    'Important Notice: Fact Find Version 1 Retiring Tomorrow – Please Switch to Version 2',
    '<h2>Fact Find Version 1 retires tomorrow</h2>'
    '<p>Dear {{name}},</p>'
    '<p>We are writing to let you know that <strong>Fact Find Version 1 will be discontinued from tomorrow, 5 November 2026.</strong> From this date, Version 1 will no longer be accessible or operational.</p>'
    '<p>We have now moved to <strong>Fact Find Version 2</strong>, which will be the only version available going forward.</p>'
    '<p><strong>How to access Fact Find Version 2</strong></p>'
    '<p>We have already sent an email to all members with instructions on how to log in and access the new Version 2 platform. If you haven''t received this email, please check your junk or spam folder.</p>'
    '<p>Alternatively, you can register directly using the link below:</p>'
    '<p><a href="{{signup_url}}">Sign Up for Fact Find Version 2</a></p>'
    '<p>Please ensure you have registered and can access Version 2 before Version 1 is discontinued tomorrow to avoid any disruption to your work.</p>'
    '<p>If you experience any issues accessing the new platform or need assistance, please get in touch with our team.</p>'
    '<p>Thank you for your cooperation.</p>'
    '<p>Kind regards,<br>The Club Team</p>',
    'Dear {{name}},\n\nWe are writing to let you know that Fact Find Version 1 will be discontinued from tomorrow, 5 November 2026. From this date, Version 1 will no longer be accessible or operational.\n\nWe have now moved to Fact Find Version 2, which will be the only version available going forward.\n\nHow to access Fact Find Version 2\n\nWe have already sent an email to all members with instructions on how to log in and access the new Version 2 platform. If you haven''t received this email, please check your junk or spam folder.\n\nAlternatively, you can register directly here:\n{{signup_url}}\n\nPlease ensure you have registered and can access Version 2 before Version 1 is discontinued tomorrow to avoid any disruption to your work.\n\nIf you experience any issues accessing the new platform or need assistance, please get in touch with our team.\n\nThank you for your cooperation.\n\nKind regards,\nThe Club Team'
  )
on conflict (key) do nothing;
