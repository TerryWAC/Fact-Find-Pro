-- Run in the SQL editor as postgres. Every fixture row is rolled back.
-- Submission reference sequences are non-transactional and may have two gaps.
begin;
do $verify$
declare
  owner_id uuid := gen_random_uuid();
  other_id uuid := gen_random_uuid();
  owner_slug text;
  other_slug text;
  submitted uuid;
  count_rows integer;
  denied boolean := false;
  helper text;
begin
  foreach helper in array array[
    'public.generate_adviser_slug()', 'public.generate_submission_reference()',
    'public.provision_factfind_forms(uuid)', 'public.is_allowlisted_admin(text)',
    'public.handle_new_user()', 'public.handle_profile_status_change()',
    'public.submit_factfind(public.factfind_type,text,text,text,text,jsonb,jsonb)'
  ] loop
    if has_function_privilege('anon', helper, 'EXECUTE') or
       has_function_privilege('authenticated', helper, 'EXECUTE') then
      raise exception 'Internal helper remains exposed: %', helper;
    end if;
  end loop;

  insert into auth.users (id, email, raw_user_meta_data) values
    (owner_id, 'readiness-' || owner_id || '@example.test', '{"name":"Readiness fixture"}'),
    (other_id, 'readiness-' || other_id || '@example.test', '{"name":"Isolation fixture"}');
  if (select status from public.profiles where id = owner_id) <> 'pending' then
    raise exception 'New adviser was not pending';
  end if;
  update public.profiles set status = 'approved' where id in (owner_id, other_id);
  select adviser_slug into owner_slug from public.profiles where id = owner_id;
  select adviser_slug into other_slug from public.profiles where id = other_id;
  if (select count(*) from public.factfind_forms where adviser_id = owner_id) <> 4 then
    raise exception 'Approval did not create four links';
  end if;

  perform set_config('request.jwt.claim.sub', '', true);
  set local role anon;
  if (select count(*) from public.resolve_factfind_form('home', owner_slug)) <> 1 then
    raise exception 'Public form resolution failed';
  end if;
  begin
    perform public.submit_factfind('medical', owner_slug, 'Bypass fixture', 'readiness@example.test', null, '{}', '{}');
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'Anonymous users bypassed server validation'; end if;
  reset role;
  set local role service_role;
  select submission_id into submitted from public.submit_factfind(
    'home', owner_slug, 'Synthetic client', 'readiness@example.test', null, '{"test":true}', '{}'
  );
  perform public.submit_factfind('home', other_slug, 'Other synthetic client', 'readiness@example.test');
  reset role;
  set local role anon;
  select count(*) into count_rows from public.factfind_submissions;
  if count_rows <> 0 then raise exception 'Anonymous users can read submissions'; end if;

  reset role;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  set local role authenticated;
  denied := false;
  begin
    perform public.submit_factfind('medical', owner_slug, 'Bypass fixture', 'readiness@example.test', null, '{}', '{}');
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'Authenticated users bypassed server validation'; end if;
  denied := false;
  select count(*) into count_rows from public.factfind_submissions;
  if count_rows <> 1 then raise exception 'Adviser submission isolation failed'; end if;
  if (select adviser_id from public.factfind_submissions where id = submitted) <> owner_id then
    raise exception 'Submission assigned to the wrong adviser';
  end if;
  update public.profiles set name = 'Edited fixture' where id = owner_id;
  begin
    update public.profiles set role = 'admin' where id = owner_id;
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'Adviser could elevate their role'; end if;
  reset role;
  update public.factfind_forms set is_active = false where adviser_id = owner_id;
  perform set_config('request.jwt.claim.sub', '', true);
  set local role service_role;
  denied := false;
  begin
    perform public.submit_factfind('home', owner_slug, 'Synthetic client', 'readiness@example.test');
  exception when no_data_found then denied := true;
  end;
  if not denied then raise exception 'Inactive link accepted a submission'; end if;
  reset role;
end;
$verify$;
rollback;
select 'Readiness checks passed; all fixture rows rolled back' as result;
