/*
   ==========================================================================
   FactFind Pro  approve a user by email
   ==========================================================================

   Supabase dashboard -> SQL Editor -> paste -> Run.

   Approves the account, provisions its four client FactFind links, and
   confirms the email address so sign-in works even if email confirmation is
   switched on. Safe to run more than once.

   Change the two values below to approve someone else. Set v_make_admin to
   false to approve as an ordinary adviser.
   ==========================================================================
*/

do $$
declare
  v_email      text    := 'terry@terry-blackburn.com';
  v_make_admin boolean := true;
  v_id         uuid;
  v_status     text;
begin
  select p.id, p.status::text into v_id, v_status
    from public.profiles p
   where lower(p.email) = lower(v_email);

  if v_id is null then
    raise exception 'No account found for %. Sign up through the app first, or run create-test-user.sql.', v_email;
  end if;

  update public.profiles
     set status           = 'approved',
         role             = case when v_make_admin then 'admin'::public.user_role else role end,
         approved_at      = coalesce(approved_at, now()),
         rejected_at      = null,
         rejection_reason = null
   where id = v_id;

  /* The approval trigger provisions links on a status change; this covers a
     profile that was already marked approved but somehow has none. */
  perform public.provision_factfind_forms(v_id);

  update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, now())
   where id = v_id;

  raise notice 'Approved % (was: %). Role: %.', v_email, v_status,
    case when v_make_admin then 'admin' else 'unchanged' end;
end $$;

/* Confirm: */
select p.email, p.role, p.status, p.adviser_slug, p.approved_at
  from public.profiles p
 where lower(p.email) = 'terry@terry-blackburn.com';

select f.form_type, '/f/' || f.form_type || '/' || f.unique_slug as client_path
  from public.factfind_forms f
  join public.profiles p on p.id = f.adviser_id
 where lower(p.email) = 'terry@terry-blackburn.com'
 order by f.form_type;
