-- =============================================================================
-- FactFind Pro — adviser onboarding
-- =============================================================================
-- Adds the profile fields the 6-step setup wizard collects, the delivery
-- preferences for completed fact finds, and the team roster.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles: firm details, delivery preferences and wizard progress
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists job_title               text,
  add column if not exists fca_number              text,
  add column if not exists website                 text,
  add column if not exists business_location       text,
  add column if not exists delivery_email_copy     boolean     not null default true,
  add column if not exists delivery_downloads      boolean     not null default true,
  add column if not exists delivery_webhook_enabled boolean    not null default false,
  add column if not exists delivery_webhook_url    text,
  add column if not exists onboarding_step         smallint    not null default 1,
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.profiles.delivery_downloads is
  'Always true — PDF/CSV download is a built-in capability, stored so the setting reads consistently.';
comment on column public.profiles.onboarding_step is
  'Furthest step reached in the setup wizard (1-6). Lets an adviser resume where they left off.';
comment on column public.profiles.onboarding_completed_at is
  'Set when setup is finished or explicitly dismissed. Null means the wizard still shows on sign-in.';

-- A webhook must be a URL, and only when the option is switched on.
do $$ begin
  alter table public.profiles
    add constraint profiles_webhook_url_check check (
      delivery_webhook_url is null
      or delivery_webhook_url ~* '^https?://[^\s]+$'
    );
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles
    add constraint profiles_webhook_enabled_check check (
      not delivery_webhook_enabled or delivery_webhook_url is not null
    );
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- team_members — the advisers and admin staff an account has registered
-- -----------------------------------------------------------------------------
-- Roster only: these are not sign-ins. Turning a roster entry into its own
-- approved account is a later release, which is what linked_profile_id is for.
-- -----------------------------------------------------------------------------
create table if not exists public.team_members (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references public.profiles (id) on delete cascade,
  linked_profile_id uuid references public.profiles (id) on delete set null,
  name              text not null,
  email             text not null,
  phone             text,
  job_title         text,
  fca_number        text,
  role              text not null default 'adviser'
                    check (role in ('adviser', 'administrator', 'paraplanner')),
  headshot_url      text,
  created_at        timestamptz not null default now(),
  constraint team_members_owner_email_key unique (owner_id, email)
);

create index if not exists team_members_owner_idx on public.team_members (owner_id);

comment on table public.team_members is
  'Team roster captured during onboarding. Not auth users — see linked_profile_id.';

alter table public.team_members enable row level security;

drop policy if exists "team_members_own_all"  on public.team_members;
drop policy if exists "team_members_admin_all" on public.team_members;

create policy "team_members_own_all" on public.team_members
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "team_members_admin_all" on public.team_members
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.team_members to authenticated, service_role;
