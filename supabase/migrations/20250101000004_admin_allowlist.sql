/*
   ==========================================================================
   FactFind Pro  admin allowlist
   ==========================================================================
   Solves the bootstrap problem: every signup is pending until an admin
   approves it, but on a fresh project there is no admin yet.

   Any email in public.admin_allowlist is created as an APPROVED ADMIN the
   moment it signs up, with its four client links provisioned. Anyone already
   signed up with an allowlisted email is approved by this migration too.

   To add another admin later:
     insert into public.admin_allowlist (email) values ('someone@firm.co.uk');
   ==========================================================================
*/

create table if not exists public.admin_allowlist (
  email      text primary key,
  note       text,
  created_at timestamptz not null default now()
);

comment on table public.admin_allowlist is
  'Emails that become approved admins automatically at signup. Bootstraps the first admin.';

alter table public.admin_allowlist enable row level security;

drop policy if exists "admin_allowlist_admin_all" on public.admin_allowlist;
create policy "admin_allowlist_admin_all" on public.admin_allowlist
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.admin_allowlist to authenticated, service_role;

insert into public.admin_allowlist (email, note)
values ('terry@terry-blackburn.com', 'Wealthy Advisers Club owner')
on conflict (email) do nothing;

/* Emails are compared case-insensitively. */
create or replace function public.is_allowlisted_admin(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_allowlist a where lower(a.email) = lower(p_email)
  );
$$;

/*
   Signup trigger, now allowlist-aware. Replaces the version from the init
   migration. Allowlisted emails skip the pending queue entirely.
*/
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta     jsonb   := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  is_admin boolean := public.is_allowlisted_admin(new.email);
begin
  insert into public.profiles (
    id, name, company_name, email, phone, role, status, adviser_slug, approved_at
  )
  values (
    new.id,
    coalesce(nullif(meta->>'name', ''), split_part(new.email, '@', 1)),
    nullif(meta->>'company_name', ''),
    new.email,
    nullif(meta->>'phone', ''),
    case when is_admin then 'admin'::public.user_role     else 'adviser'::public.user_role   end,
    case when is_admin then 'approved'::public.user_status else 'pending'::public.user_status end,
    public.generate_adviser_slug(),
    case when is_admin then now() else null end
  )
  on conflict (id) do nothing;

  if is_admin then
    /* The status-change trigger only fires on UPDATE, so provision here. */
    perform public.provision_factfind_forms(new.id);

    insert into public.activity_log (adviser_id, actor_id, type, title, description)
    values (new.id, new.id, 'user.approved', 'Admin account created',
            coalesce(nullif(meta->>'name', ''), new.email) || ' signed up and was approved automatically (admin allowlist).');
  else
    insert into public.activity_log (adviser_id, actor_id, type, title, description)
    values (new.id, new.id, 'user.registered', 'New adviser registered',
            coalesce(nullif(meta->>'name', ''), new.email) || ' created an account and is awaiting approval.');
  end if;

  return new;
end;
$$;

/*
   Backfill: approve anyone already signed up with an allowlisted email, so
   running this on an existing project fixes a stuck first admin immediately.
*/
do $$
declare
  v_profile record;
begin
  for v_profile in
    select p.id, p.email, p.status
      from public.profiles p
     where public.is_allowlisted_admin(p.email)
       and (p.status <> 'approved' or p.role <> 'admin')
  loop
    update public.profiles
       set status           = 'approved',
           role             = 'admin',
           approved_at      = coalesce(approved_at, now()),
           rejected_at      = null,
           rejection_reason = null
     where id = v_profile.id;

    perform public.provision_factfind_forms(v_profile.id);

    /* Let them sign in even if email confirmation is switched on. */
    update auth.users
       set email_confirmed_at = coalesce(email_confirmed_at, now())
     where id = v_profile.id;

    raise notice 'Allowlisted admin % approved (was %).', v_profile.email, v_profile.status;
  end loop;
end $$;
