-- =============================================================================
-- FactFind Pro — activation of privately prepared adviser accounts
-- =============================================================================
-- An admin sends each prepared adviser a single-use activation link. The link
-- carries a random token; only its SHA-256 hash is stored. The adviser sets a
-- password, checks their details, accepts the current terms and chooses their
-- delivery preferences. The provisioning service (service role) then clears
-- import_pending, approves the profile, activates the four reserved FactFinds
-- and lifts the authentication ban. Ordinary users cannot read or write here.
-- =============================================================================

create table if not exists public.adviser_activations (
  id                     uuid primary key default gen_random_uuid(),
  profile_id             uuid not null references public.profiles(id) on delete cascade,
  token_hash             text not null unique,
  invited_by             uuid references public.profiles(id) on delete set null,
  sent_at                timestamptz not null default now(),
  expires_at             timestamptz not null,
  used_at                timestamptz,
  accepted_terms_version text,
  created_at             timestamptz not null default now()
);

create index if not exists adviser_activations_profile_idx on public.adviser_activations(profile_id);

alter table public.adviser_activations enable row level security;
revoke all on public.adviser_activations from anon, authenticated;
grant select on public.adviser_activations to authenticated;
grant all on public.adviser_activations to service_role;

drop policy if exists adviser_activations_admin_read on public.adviser_activations;
create policy adviser_activations_admin_read on public.adviser_activations
  for select to authenticated
  using ((select public.is_admin()));

insert into public.email_templates (key, name, description, subject, body_html, body_text)
values
  (
    'adviser_activation',
    'Account activation (to existing adviser)',
    'Sent to a prepared adviser with their single-use link to set a password and activate their account.',
    'Activate your FactFind Pro account, {{name}}',
    '<h2>Your FactFind Pro account is ready</h2>'
    '<p>Hi {{name}},</p>'
    '<p>Wealthy Advisers Club has moved adviser fact finds to FactFind Pro. An account for <strong>{{company_name}}</strong> has been prepared for you.</p>'
    '<p>Use the link below to choose a password, check the details we hold and switch on your four client FactFind links.</p>'
    '<p><a href="{{activation_url}}">Activate my account</a></p>'
    '<p>The link is personal to you, can be used once and expires on {{expires_on}}. If you were not expecting this email, you can ignore it and nothing will change.</p>',
    'Hi {{name}},\n\nWealthy Advisers Club has moved adviser fact finds to FactFind Pro. An account for {{company_name}} has been prepared for you.\n\nActivate it, choose a password and check your details here:\n{{activation_url}}\n\nThe link is personal to you, can be used once and expires on {{expires_on}}. If you were not expecting this email, ignore it and nothing will change.'
  )
on conflict (key) do nothing;
