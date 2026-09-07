-- =============================================================================
-- FactFind Pro — demo seed data
-- =============================================================================
-- Runs automatically with `supabase db reset`. For a hosted project run it
-- manually from the SQL editor (or `npm run db:seed`). Safe to re-run.
--
-- Demo credentials
--   terry@terry-blackburn.com         — Admin,   approved   — Terry@098!
--   admin@wealthyadvisorsclub.co.uk   — Admin,   approved   — FactFind2025!
--   james@hartleyfinancial.co.uk      — Adviser, approved   — FactFind2025!
--   sarah@meridianmortgages.co.uk     — Adviser, approved   — FactFind2025!
--   daniel@reidprotection.co.uk       — Adviser, PENDING    — FactFind2025!
--   priya@shahwealth.co.uk            — Adviser, PENDING    — FactFind2025!
--
-- These are development credentials. Never seed them into production.
-- =============================================================================

do $$
declare
  v_default_password text := 'FactFind2025!';
  v_user record;
  v_users jsonb := '[
    {"id":"66666666-6666-4666-8666-666666666666","email":"terry@terry-blackburn.com","name":"Terry Blackburn","company":"Wealthy Advisors Club","phone":"+44 7700 900001","role":"admin","status":"approved","slug":"terrywac","password":"Terry@098!"},
    {"id":"11111111-1111-4111-8111-111111111111","email":"admin@wealthyadvisorsclub.co.uk","name":"Wealthy Advisors Club Admin","company":"Wealthy Advisors Club","phone":"+44 20 7946 0100","role":"admin","status":"approved","slug":"wacadmin"},
    {"id":"22222222-2222-4222-8222-222222222222","email":"james@hartleyfinancial.co.uk","name":"James Hartley","company":"Hartley Financial Ltd","phone":"+44 161 496 0234","role":"adviser","status":"approved","slug":"jh4k92mt"},
    {"id":"33333333-3333-4333-8333-333333333333","email":"sarah@meridianmortgages.co.uk","name":"Sarah Okafor","company":"Meridian Mortgages","phone":"+44 121 496 0871","role":"adviser","status":"approved","slug":"so7pq3xd"},
    {"id":"44444444-4444-4444-8444-444444444444","email":"daniel@reidprotection.co.uk","name":"Daniel Reid","company":"Reid Protection Services","phone":"+44 131 496 0559","role":"adviser","status":"pending","slug":"dr2mn8kf"},
    {"id":"55555555-5555-4555-8555-555555555555","email":"priya@shahwealth.co.uk","name":"Priya Shah","company":"Shah Wealth Advisers","phone":"+44 29 2018 0442","role":"adviser","status":"pending","slug":"ps9wt4bc"}
  ]'::jsonb;
begin
  for v_user in select * from jsonb_to_recordset(v_users)
    as x(id uuid, email text, name text, company text, phone text, role text, status text, slug text, password text)
  loop
    -- auth.users (the profile row is created by the on_auth_user_created trigger)
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      v_user.id,
      'authenticated',
      'authenticated',
      v_user.email,
      extensions.crypt(coalesce(v_user.password, v_default_password), extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', v_user.name, 'company_name', v_user.company, 'phone', v_user.phone),
      now() - (interval '1 day' * (random() * 40)::int),
      now(),
      '', '', '', ''
    )
    on conflict (id) do nothing;

    insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), v_user.id::text, v_user.id,
      jsonb_build_object('sub', v_user.id::text, 'email', v_user.email, 'email_verified', true),
      'email', now(), now(), now()
    )
    on conflict (provider, provider_id) do nothing;

    -- normalise the profile created by the trigger
    update public.profiles
       set name         = v_user.name,
           company_name = v_user.company,
           phone        = v_user.phone,
           role         = v_user.role::public.user_role,
           adviser_slug = v_user.slug,
           status       = v_user.status::public.user_status,
           approved_at  = case when v_user.status = 'approved' then now() - interval '7 days' else null end
     where id = v_user.id;

    if v_user.status = 'approved' then
      perform public.provision_factfind_forms(v_user.id);
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Demo submissions across both approved advisers and all four FactFind types
-- -----------------------------------------------------------------------------
do $$
declare
  v_row record;
  v_form record;
  v_ref text;
  v_clients jsonb := '[
    {"adviser":"22222222-2222-4222-8222-222222222222","type":"mortgage","name":"Oliver & Emma Bennett","email":"o.bennett@example.co.uk","phone":"+44 7700 900141","days":1,"status":"new"},
    {"adviser":"22222222-2222-4222-8222-222222222222","type":"protection","name":"Rachel Nwosu","email":"r.nwosu@example.co.uk","phone":"+44 7700 900233","days":3,"status":"in_review"},
    {"adviser":"22222222-2222-4222-8222-222222222222","type":"medical","name":"Thomas Okonkwo","email":"t.okonkwo@example.co.uk","phone":"+44 7700 900318","days":5,"status":"new"},
    {"adviser":"22222222-2222-4222-8222-222222222222","type":"home","name":"Charlotte Fairbanks","email":"c.fairbanks@example.co.uk","phone":"+44 7700 900427","days":8,"status":"completed"},
    {"adviser":"22222222-2222-4222-8222-222222222222","type":"mortgage","name":"Aisha Rahman","email":"a.rahman@example.co.uk","phone":"+44 7700 900512","days":11,"status":"completed"},
    {"adviser":"22222222-2222-4222-8222-222222222222","type":"mortgage","name":"Gareth Llewellyn","email":"g.llewellyn@example.co.uk","phone":"+44 7700 900604","days":14,"status":"archived"},
    {"adviser":"22222222-2222-4222-8222-222222222222","type":"protection","name":"Sofia Marchetti","email":"s.marchetti@example.co.uk","phone":"+44 7700 900733","days":17,"status":"new"},
    {"adviser":"33333333-3333-4333-8333-333333333333","type":"mortgage","name":"Daniel & Priya Kapoor","email":"d.kapoor@example.co.uk","phone":"+44 7700 900845","days":2,"status":"new"},
    {"adviser":"33333333-3333-4333-8333-333333333333","type":"home","name":"Michael Strachan","email":"m.strachan@example.co.uk","phone":"+44 7700 900918","days":6,"status":"in_review"},
    {"adviser":"33333333-3333-4333-8333-333333333333","type":"medical","name":"Grace Adeyemi","email":"g.adeyemi@example.co.uk","phone":"+44 7700 901027","days":9,"status":"new"},
    {"adviser":"33333333-3333-4333-8333-333333333333","type":"protection","name":"Hannah Whitfield","email":"h.whitfield@example.co.uk","phone":"+44 7700 901133","days":13,"status":"completed"}
  ]'::jsonb;
begin
  for v_row in select * from jsonb_to_recordset(v_clients)
    as x(adviser uuid, type text, name text, email text, phone text, days int, status text)
  loop
    select * into v_form from public.factfind_forms
     where adviser_id = v_row.adviser and form_type = v_row.type::public.factfind_type;

    continue when v_form.id is null;
    continue when exists (
      select 1 from public.factfind_submissions
       where adviser_id = v_row.adviser and lower(client_email) = lower(v_row.email) and form_type = v_row.type::public.factfind_type
    );

    v_ref := public.generate_submission_reference();

    insert into public.factfind_submissions (
      form_id, adviser_id, form_type, reference, client_name, client_email, client_phone,
      status, submitted_at, submission_data, meta
    )
    values (
      v_form.id, v_row.adviser, v_row.type::public.factfind_type, v_ref,
      v_row.name, v_row.email, v_row.phone,
      v_row.status::public.submission_status,
      now() - (interval '1 day' * v_row.days),
      jsonb_build_object(
        'placeholder', true,
        'note', 'Demo submission. Real question sets are plugged into the form engine later.',
        'steps', jsonb_build_array(
          jsonb_build_object('id','about-you','title','About you','answers', jsonb_build_object(
            'full_name', v_row.name, 'email', v_row.email, 'phone', v_row.phone)),
          jsonb_build_object('id','your-situation','title','Your situation','answers', jsonb_build_object(
            'placeholder_response','Sample response captured by the placeholder form engine.')),
          jsonb_build_object('id','your-requirements','title','Your requirements','answers', jsonb_build_object(
            'placeholder_response','Sample response captured by the placeholder form engine.')),
          jsonb_build_object('id','declarations','title','Declarations','answers', jsonb_build_object(
            'consent_contact', true, 'consent_privacy', true))
        )
      ),
      jsonb_build_object('source','seed','user_agent','seed-script')
    );

    insert into public.activity_log (adviser_id, type, title, description, metadata)
    values (
      v_row.adviser, 'submission.created',
      'New ' || v_row.type || ' FactFind received',
      v_row.name || ' submitted a ' || v_row.type || ' FactFind (' || v_ref || ').',
      jsonb_build_object('reference', v_ref, 'form_type', v_row.type)
    );
  end loop;
end $$;
