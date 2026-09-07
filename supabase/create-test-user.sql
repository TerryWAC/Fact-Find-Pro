-- =============================================================================
-- FactFind Pro — create (or reset) a single admin/test account
-- =============================================================================
-- Run this in the Supabase SQL editor, or locally with:
--   psql "$DATABASE_URL" -f supabase/create-test-user.sql
--
-- Safe to re-run: if the account already exists it resets the password and
-- re-applies the role/status rather than erroring.
--
-- Creates:
--   terry@terry-blackburn.com  /  Terry@098!   — Admin, approved
--
-- An admin sees BOTH the adviser workspace (dashboard, links, submissions)
-- and the admin area (approvals, all submissions, email templates), so this
-- one login is enough to test the whole platform.
--
-- SECURITY: this file contains a plaintext password. Change it after first
-- sign-in (Settings → Password), and do not use these credentials in
-- production. Edit the values below to provision a different account.
-- =============================================================================

do $$
declare
  v_email    text := 'terry@terry-blackburn.com';
  v_password text := 'Terry@098!';
  v_name     text := 'Terry Blackburn';
  v_company  text := 'Wealthy Advisors Club';
  v_phone    text := '+44 7700 900001';
  v_slug     text := 'terrywac';
  v_id       uuid;
  v_existing text;
  v_is_new   boolean;
begin
  select id into v_id from auth.users where lower(email) = lower(v_email);
  v_is_new := v_id is null;

  if v_is_new then
    -- ---- New account -------------------------------------------------------
    v_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      v_id,
      'authenticated',
      'authenticated',
      lower(v_email),
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', v_name, 'company_name', v_company, 'phone', v_phone),
      now(),
      now(),
      '', '', '', ''
    );

    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    )
    values (
      gen_random_uuid(), v_id::text, v_id,
      jsonb_build_object('sub', v_id::text, 'email', lower(v_email), 'email_verified', true),
      'email', now(), now(), now()
    )
    on conflict (provider, provider_id) do nothing;

    raise notice 'Created auth user % (%)', v_email, v_id;
  else
    -- ---- Existing account: reset the password and confirm the email --------
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at         = now()
     where id = v_id;

    raise notice 'Reset password for existing user % (%)', v_email, v_id;
  end if;

  -- Slug policy:
  --  * existing account  -> keep the slug they already have, so client links
  --                         that have been shared out keep working
  --  * new account       -> use the requested slug (the on_auth_user_created
  --                         trigger will have assigned a random one), unless
  --                         another adviser already holds it
  select adviser_slug into v_existing from public.profiles where id = v_id;

  if not v_is_new and v_existing is not null then
    v_slug := v_existing;
  elsif exists (select 1 from public.profiles where adviser_slug = v_slug and id <> v_id) then
    v_slug := public.generate_adviser_slug();
  end if;

  -- The on_auth_user_created trigger normally writes this row; upsert so the
  -- script also works when the profile is missing or needs promoting.
  insert into public.profiles (
    id, name, company_name, email, phone, role, status, adviser_slug, approved_at
  )
  values (
    v_id, v_name, v_company, lower(v_email), v_phone, 'admin', 'approved', v_slug, now()
  )
  on conflict (id) do update
    set name         = excluded.name,
        company_name = excluded.company_name,
        email        = excluded.email,
        phone        = excluded.phone,
        role         = 'admin',
        status       = 'approved',
        adviser_slug = excluded.adviser_slug,
        approved_at  = coalesce(public.profiles.approved_at, now()),
        rejected_at  = null,
        rejection_reason = null;

  -- Provision the four unique FactFind links (no-op if they already exist).
  perform public.provision_factfind_forms(v_id);

  raise notice 'Ready: % is an approved admin with slug %', v_email, v_slug;
end $$;

-- Confirm the result and show the four client links.
select p.email, p.name, p.role, p.status, p.adviser_slug
  from public.profiles p
 where lower(p.email) = 'terry@terry-blackburn.com';

select f.form_type, '/f/' || f.form_type || '/' || f.unique_slug as client_path
  from public.factfind_forms f
  join public.profiles p on p.id = f.adviser_id
 where lower(p.email) = 'terry@terry-blackburn.com'
 order by f.form_type;
