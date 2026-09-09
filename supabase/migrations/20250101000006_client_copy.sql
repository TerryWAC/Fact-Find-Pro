-- =============================================================================
-- FactFind Pro — PDF copy to the client
-- =============================================================================
-- • delivery_client_copy: when on, the client is emailed a branded PDF of
--   their answers as soon as they submit. Advisers can also send one by hand
--   from the submission page at any time.
-- • The email template the client receives (editable by admins).
-- =============================================================================

alter table public.profiles
  add column if not exists delivery_client_copy boolean not null default false;

insert into public.email_templates (key, name, description, subject, body_html, body_text)
values
  (
    'submission_client_copy',
    'Copy of FactFind (to client)',
    'Sent to the client with their completed FactFind attached as a PDF.',
    'Your {{form_type}} FactFind — copy for your records',
    '<h2>Your {{form_type}} FactFind</h2>'
    '<p>Hi {{client_name}},</p>'
    '<p>Thank you for completing your {{form_type}} FactFind. A copy of everything you told us is attached as a PDF for your records.</p>'
    '<ul>'
    '<li><strong>Reference:</strong> {{reference}}</li>'
    '<li><strong>Submitted:</strong> {{submitted_at}}</li>'
    '</ul>'
    '<p>If anything needs correcting, just reply to this email and {{adviser_name}} will update it.</p>'
    '<p>{{adviser_name}}<br>{{company_name}}</p>',
    'Hi {{client_name}},\n\nThank you for completing your {{form_type}} FactFind. A copy of everything you told us is attached as a PDF for your records.\n\nReference: {{reference}}\nSubmitted: {{submitted_at}}\n\nIf anything needs correcting, just reply to this email and {{adviser_name}} will update it.\n\n{{adviser_name}}\n{{company_name}}'
  )
on conflict (key) do nothing;
