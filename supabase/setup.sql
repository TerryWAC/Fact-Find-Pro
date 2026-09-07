/*
   ==========================================================================
   FactFind Pro  complete database setup
   Wealthy Advisors Club
   ==========================================================================

   HOW TO RUN
     Supabase dashboard -> SQL Editor -> New query -> paste this whole file
     -> Run. Takes a few seconds. Safe to run more than once.

   WHAT IT CREATES
     Tables      profiles, factfind_forms, factfind_submissions,
                 email_templates, email_log, activity_log
     Security    Row Level Security on every table, so an adviser can only
                 read their own submissions and only admins see everything
     Automation  a signup creates a pending profile; approving an adviser
                 provisions their four unique client FactFind links
     Public API  resolve_factfind_form() and submit_factfind(), the only way
                 the public client-facing pages touch the database
     Storage     branding and submission-upload buckets

   AFTERWARDS
     Run create-test-user.sql to create your admin login.
     Optionally run seed.sql for demo data (development only, it contains
     plaintext demo passwords).

   NOTE ON COMMENTS
     This file deliberately uses block comments only. Some editors mangle the
     double-hyphen used for SQL line comments when text is pasted, which makes
     a comment parse as SQL and fail.

   This file is the three files in supabase/migrations concatenated in order.
   If you use the Supabase CLI, prefer `supabase db push`.
   ==========================================================================
*/


/* ======================= PART 1 of 3  Schema, RLS, triggers and public RPCs ======================= */

/*
   =============================================================================
   FactFind Pro — initial schema
   Wealthy Advisors Club | UK Mortgage & Protection Brokers
   =============================================================================
   Creates: enums, profiles (users), factfind_forms, factfind_submissions,
   email_templates, email_log, activity_log, plus RLS policies, triggers and
   the SECURITY DEFINER RPCs used by the public (anon) client FactFind pages.
   =============================================================================
 */

create extension if not exists "pgcrypto" with schema extensions;

/*
   =============================================================================
   Enums
   =============================================================================
 */
do $$ begin
  create type public.user_role as enum ('admin', 'adviser');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_status as enum ('pending', 'approved', 'rejected', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.factfind_type as enum ('mortgage', 'protection', 'medical', 'home');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.submission_status as enum ('new', 'in_review', 'completed', 'archived');
exception when duplicate_object then null; end $$;

/*
   =============================================================================
   profiles — the application "Users" table (1:1 with auth.users)
   =============================================================================
 */
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  name             text not null default '',
  company_name     text,
  email            text not null,
  phone            text,
  role             public.user_role   not null default 'adviser',
  status           public.user_status not null default 'pending',
  adviser_slug     text unique,
  avatar_url       text,
  logo_url         text,
  brand_colour     text,
  approved_at      timestamptz,
  approved_by      uuid references public.profiles (id) on delete set null,
  rejected_at      timestamptz,
  rejection_reason text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index if not exists profiles_email_key on public.profiles (lower(email));
create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

comment on table public.profiles is 'Application users. Advisers must be approved by an admin before they can sign in.';
comment on column public.profiles.adviser_slug is 'Unique public identifier used in client FactFind URLs, e.g. /f/mortgage/{adviser_slug}.';

/*
   =============================================================================
   factfind_forms — the four unique client links owned by each adviser
   =============================================================================
 */
create table if not exists public.factfind_forms (
  id           uuid primary key default gen_random_uuid(),
  adviser_id   uuid not null references public.profiles (id) on delete cascade,
  form_type    public.factfind_type not null,
  unique_slug  text not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  constraint factfind_forms_adviser_type_key unique (adviser_id, form_type),
  constraint factfind_forms_type_slug_key    unique (form_type, unique_slug)
);

create index if not exists factfind_forms_adviser_idx on public.factfind_forms (adviser_id);
create index if not exists factfind_forms_slug_idx    on public.factfind_forms (unique_slug);

comment on table public.factfind_forms is 'One row per adviser per FactFind type. unique_slug is the adviser identifier in the public URL.';

/*
   =============================================================================
   factfind_submissions — completed client FactFinds
   =============================================================================
 */
create table if not exists public.factfind_submissions (
  id              uuid primary key default gen_random_uuid(),
  form_id         uuid references public.factfind_forms (id) on delete set null,
  adviser_id      uuid not null references public.profiles (id) on delete cascade,
  form_type       public.factfind_type not null,
  reference       text not null unique,
  client_name     text not null,
  client_email    text not null,
  client_phone    text,
  status          public.submission_status not null default 'new',
  submission_data jsonb not null default '{}'::jsonb,
  meta            jsonb not null default '{}'::jsonb,
  submitted_at    timestamptz not null default now()
);

create index if not exists submissions_adviser_idx      on public.factfind_submissions (adviser_id);
create index if not exists submissions_type_idx         on public.factfind_submissions (form_type);
create index if not exists submissions_submitted_at_idx on public.factfind_submissions (submitted_at desc);
create index if not exists submissions_client_name_idx  on public.factfind_submissions using gin (to_tsvector('simple', client_name));
create index if not exists submissions_client_email_idx on public.factfind_submissions (lower(client_email));

comment on table public.factfind_submissions is 'Client submissions. Always bound to the adviser who owns the link that was used.';

/*
   =============================================================================
   email_templates — configurable notification templates
   =============================================================================
 */
create table if not exists public.email_templates (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  name        text not null,
  description text,
  subject     text not null,
  body_html   text not null,
  body_text   text,
  enabled     boolean not null default true,
  updated_at  timestamptz not null default now()
);

/*
   =============================================================================
   email_log — delivery audit trail (also acts as the outbox in dev)
   =============================================================================
 */
create table if not exists public.email_log (
  id           uuid primary key default gen_random_uuid(),
  template_key text,
  to_email     text not null,
  subject      text not null,
  status       text not null default 'queued',
  provider     text,
  error        text,
  payload      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists email_log_created_at_idx on public.email_log (created_at desc);

/*
   =============================================================================
   activity_log — powers the "Recent Activity" panels
   =============================================================================
 */
create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  adviser_id  uuid references public.profiles (id) on delete cascade,
  actor_id    uuid references public.profiles (id) on delete set null,
  type        text not null,
  title       text not null,
  description text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists activity_log_adviser_idx    on public.activity_log (adviser_id);
create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);

/*
   =============================================================================
   Helper functions
   =============================================================================
 */

/*
   Returns true when the calling user is an approved admin.
   SECURITY DEFINER so that policies on `profiles` do not recurse into themselves.
 */
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.status = 'approved'
  );
$$;

/* Returns true when the calling user is an approved account of any role. */
create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'approved'
  );
$$;

/* Collision-safe short public identifier for adviser links (e.g. "a7f3k92p"). */
create or replace function public.generate_adviser_slug()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  alphabet constant text := 'abcdefghijkmnopqrstuvwxyz23456789';  /* no l/1/0/o */
  candidate text;
  i int;
begin
  loop
    candidate := '';
    for i in 1..8 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles p where p.adviser_slug = candidate);
  end loop;
  return candidate;
end;
$$;

/* Sequential, human-friendly submission reference: FF-000123 */
create sequence if not exists public.submission_reference_seq start 1000;

create or replace function public.generate_submission_reference()
returns text
language sql
volatile
as $$
  select 'FF-' || lpad(nextval('public.submission_reference_seq')::text, 6, '0');
$$;

/* keep updated_at fresh */
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists email_templates_touch_updated_at on public.email_templates;
create trigger email_templates_touch_updated_at
  before update on public.email_templates
  for each row execute function public.touch_updated_at();

/*
   =============================================================================
   Signup: mirror auth.users into public.profiles
   =============================================================================
 */
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, name, company_name, email, phone, role, status, adviser_slug)
  values (
    new.id,
    coalesce(nullif(meta->>'name', ''), split_part(new.email, '@', 1)),
    nullif(meta->>'company_name', ''),
    new.email,
    nullif(meta->>'phone', ''),
    'adviser',
    'pending',
    public.generate_adviser_slug()
  )
  on conflict (id) do nothing;

  insert into public.activity_log (adviser_id, actor_id, type, title, description)
  values (new.id, new.id, 'user.registered', 'New adviser registered',
          coalesce(nullif(meta->>'name', ''), new.email) || ' created an account and is awaiting approval.');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

/*
   =============================================================================
   Approval: provision the four unique FactFind links
   =============================================================================
 */
create or replace function public.provision_factfind_forms(p_adviser_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_type public.factfind_type;
begin
  select adviser_slug into v_slug from public.profiles where id = p_adviser_id;

  if v_slug is null then
    v_slug := public.generate_adviser_slug();
    update public.profiles set adviser_slug = v_slug where id = p_adviser_id;
  end if;

  foreach v_type in array array['mortgage', 'protection', 'medical', 'home']::public.factfind_type[]
  loop
    insert into public.factfind_forms (adviser_id, form_type, unique_slug)
    values (p_adviser_id, v_type, v_slug)
    on conflict (adviser_id, form_type) do nothing;
  end loop;
end;
$$;

create or replace function public.handle_profile_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    perform public.provision_factfind_forms(new.id);

    insert into public.activity_log (adviser_id, actor_id, type, title, description)
    values (new.id, auth.uid(), 'user.approved', 'Account approved',
            new.name || ' was approved and their FactFind links are live.');
  end if;

  if new.status = 'rejected' and (old.status is distinct from 'rejected') then
    insert into public.activity_log (adviser_id, actor_id, type, title, description)
    values (new.id, auth.uid(), 'user.rejected', 'Account rejected',
            coalesce(new.rejection_reason, 'No reason supplied.'));
  end if;

  return new;
end;
$$;

drop trigger if exists on_profile_status_change on public.profiles;
create trigger on_profile_status_change
  after update of status on public.profiles
  for each row execute function public.handle_profile_status_change();

/*
   =============================================================================
   Public (anon) RPCs used by the client-facing FactFind pages
   =============================================================================
 */

/* Resolve /f/{type}/{slug} to the owning adviser without exposing the tables. */
create or replace function public.resolve_factfind_form(
  p_form_type public.factfind_type,
  p_slug      text
)
returns table (
  form_id       uuid,
  adviser_id    uuid,
  adviser_name  text,
  company_name  text,
  logo_url      text,
  brand_colour  text,
  form_type     public.factfind_type,
  is_active     boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select f.id, f.adviser_id, p.name, p.company_name, p.logo_url, p.brand_colour, f.form_type, f.is_active
  from public.factfind_forms f
  join public.profiles p on p.id = f.adviser_id
  where f.form_type = p_form_type
    and f.unique_slug = p_slug
    and f.is_active
    and p.status = 'approved'
  limit 1;
$$;

/* Accept a client submission and bind it to the adviser who owns the link. */
create or replace function public.submit_factfind(
  p_form_type       public.factfind_type,
  p_slug            text,
  p_client_name     text,
  p_client_email    text,
  p_client_phone    text default null,
  p_submission_data jsonb default '{}'::jsonb,
  p_meta            jsonb default '{}'::jsonb
)
returns table (submission_id uuid, reference text)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_form   public.factfind_forms%rowtype;
  v_ref    text;
  v_id     uuid;
  v_name   text := btrim(coalesce(p_client_name, ''));
  v_email  text := lower(btrim(coalesce(p_client_email, '')));
begin
  if v_name = '' then
    raise exception 'Client name is required' using errcode = '22023';
  end if;

  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'A valid client email is required' using errcode = '22023';
  end if;

  select f.* into v_form
  from public.factfind_forms f
  join public.profiles p on p.id = f.adviser_id
  where f.form_type = p_form_type
    and f.unique_slug = p_slug
    and f.is_active
    and p.status = 'approved'
  limit 1;

  if not found then
    raise exception 'This FactFind link is not valid or is no longer active' using errcode = 'P0002';
  end if;

  v_ref := public.generate_submission_reference();

  insert into public.factfind_submissions (
    form_id, adviser_id, form_type, reference,
    client_name, client_email, client_phone, submission_data, meta
  )
  values (
    v_form.id, v_form.adviser_id, v_form.form_type, v_ref,
    v_name, v_email, nullif(btrim(coalesce(p_client_phone, '')), ''),
    coalesce(p_submission_data, '{}'::jsonb),
    coalesce(p_meta, '{}'::jsonb)
  )
  returning id into v_id;

  insert into public.activity_log (adviser_id, type, title, description, metadata)
  values (
    v_form.adviser_id,
    'submission.created',
    'New ' || v_form.form_type::text || ' FactFind received',
    v_name || ' submitted a ' || v_form.form_type::text || ' FactFind (' || v_ref || ').',
    jsonb_build_object('submission_id', v_id, 'reference', v_ref, 'form_type', v_form.form_type)
  );

  return query select v_id, v_ref;
end;
$$;

/*
   =============================================================================
   Row Level Security
   =============================================================================
 */
alter table public.profiles             enable row level security;
alter table public.factfind_forms       enable row level security;
alter table public.factfind_submissions enable row level security;
alter table public.email_templates      enable row level security;
alter table public.email_log            enable row level security;
alter table public.activity_log         enable row level security;

/* profiles =============================================================== */
drop policy if exists "profiles_select_own"   on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_update_own"   on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_insert_self"  on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

create policy "profiles_insert_self" on public.profiles
  for insert with check (id = auth.uid());

/* Advisers may edit their own details but never their role or status. */
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    and role   = (select p.role   from public.profiles p where p.id = auth.uid())
    and status = (select p.status from public.profiles p where p.id = auth.uid())
  );

create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

/* factfind_forms ========================================================= */
drop policy if exists "forms_select_own"   on public.factfind_forms;
drop policy if exists "forms_select_admin" on public.factfind_forms;
drop policy if exists "forms_update_admin" on public.factfind_forms;

create policy "forms_select_own" on public.factfind_forms
  for select using (adviser_id = auth.uid());

create policy "forms_select_admin" on public.factfind_forms
  for select using (public.is_admin());

create policy "forms_update_admin" on public.factfind_forms
  for all using (public.is_admin()) with check (public.is_admin());

/* factfind_submissions =================================================== */
drop policy if exists "submissions_select_own"   on public.factfind_submissions;
drop policy if exists "submissions_select_admin" on public.factfind_submissions;
drop policy if exists "submissions_update_own"   on public.factfind_submissions;
drop policy if exists "submissions_admin_all"    on public.factfind_submissions;

create policy "submissions_select_own" on public.factfind_submissions
  for select using (adviser_id = auth.uid() and public.is_approved());

create policy "submissions_update_own" on public.factfind_submissions
  for update using (adviser_id = auth.uid() and public.is_approved())
  with check (adviser_id = auth.uid());

create policy "submissions_admin_all" on public.factfind_submissions
  for all using (public.is_admin()) with check (public.is_admin());

/*
   Note: there is deliberately no INSERT policy for anon/authenticated.
   Client submissions arrive exclusively through public.submit_factfind().
 */

/* email_templates ======================================================== */
drop policy if exists "templates_admin_all" on public.email_templates;
drop policy if exists "templates_read_approved" on public.email_templates;

create policy "templates_admin_all" on public.email_templates
  for all using (public.is_admin()) with check (public.is_admin());

create policy "templates_read_approved" on public.email_templates
  for select using (public.is_approved());

/* email_log ============================================================== */
drop policy if exists "email_log_admin_all" on public.email_log;

create policy "email_log_admin_all" on public.email_log
  for all using (public.is_admin()) with check (public.is_admin());

/* activity_log =========================================================== */
drop policy if exists "activity_select_own"   on public.activity_log;
drop policy if exists "activity_select_admin" on public.activity_log;

create policy "activity_select_own" on public.activity_log
  for select using (adviser_id = auth.uid());

create policy "activity_select_admin" on public.activity_log
  for select using (public.is_admin());

/*
   =============================================================================
   Grants
   =============================================================================
   Supabase projects normally carry default privileges that grant these
   automatically, but granting explicitly keeps the migration self-contained
   (and correct on self-hosted Postgres). RLS still gates every row.
 */
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

/*
   `anon` gets no table access at all: the public FactFind pages reach the data
   exclusively through the SECURITY DEFINER functions granted below.
 */

revoke all on function public.resolve_factfind_form(public.factfind_type, text) from public;
revoke all on function public.submit_factfind(public.factfind_type, text, text, text, text, jsonb, jsonb) from public;

grant execute on function public.resolve_factfind_form(public.factfind_type, text) to anon, authenticated;
grant execute on function public.submit_factfind(public.factfind_type, text, text, text, text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_approved() to authenticated;


/* ======================= PART 2 of 3  Default notification email templates ======================= */

/*
   =============================================================================
   FactFind Pro — default configurable email templates
   =============================================================================
   Templates use {{double_brace}} placeholders resolved at send time by
   src/lib/email/render.ts. Editing a row here changes the live email.
   =============================================================================
 */

insert into public.email_templates (key, name, description, subject, body_html, body_text)
values
  (
    'new_registration',
    'New registration (to admin)',
    'Sent to the Wealthy Advisors Club admin inbox when an adviser signs up.',
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
    '<p>— The Wealthy Advisors Club team</p>',
    'Hi {{name}},\n\nYour FactFind Pro account has been approved. Sign in at {{login_url}}\n\n— The Wealthy Advisors Club team'
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
    '<p>If you believe this is a mistake, reply to this email and the Wealthy Advisors Club team will take another look.</p>',
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


/* ======================= PART 3 of 3  Storage buckets and their policies ======================= */

/*
   =============================================================================
   FactFind Pro — storage buckets
   =============================================================================
   `branding` holds adviser logos (future custom-branding feature).
   `submission-uploads` is reserved for client document uploads.
   =============================================================================
 */

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('branding', 'branding', true, 2097152, array['image/png','image/jpeg','image/svg+xml','image/webp']),
  ('submission-uploads', 'submission-uploads', false, 10485760, null)
on conflict (id) do nothing;

/* branding: anyone can read, an adviser may manage only their own folder (<uid>/...) */
drop policy if exists "branding_public_read"  on storage.objects;
drop policy if exists "branding_owner_write"  on storage.objects;
drop policy if exists "branding_owner_update" on storage.objects;
drop policy if exists "branding_owner_delete" on storage.objects;

create policy "branding_public_read" on storage.objects
  for select using (bucket_id = 'branding');

create policy "branding_owner_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'branding' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "branding_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'branding' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "branding_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'branding' and (storage.foldername(name))[1] = auth.uid()::text);

/* submission uploads: adviser-scoped read, admins see everything */
drop policy if exists "submission_uploads_owner_read" on storage.objects;
drop policy if exists "submission_uploads_admin_all"  on storage.objects;

create policy "submission_uploads_owner_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'submission-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "submission_uploads_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'submission-uploads' and public.is_admin())
  with check (bucket_id = 'submission-uploads' and public.is_admin());


/* Done. This lists the tables so you can confirm it worked: */
select table_name
  from information_schema.tables
 where table_schema = 'public'
   and table_name in ('profiles','factfind_forms','factfind_submissions',
                      'email_templates','email_log','activity_log')
 order by table_name;
