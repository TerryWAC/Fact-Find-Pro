-- Imported advisers are prepared privately until their individual activation is released.
alter table public.profiles add column if not exists import_pending boolean not null default false;

create table if not exists public.adviser_imports (
  source_id text primary key,
  source_form_id text not null,
  batch_label text not null,
  batch_sha256 text not null,
  source_row integer not null check (source_row > 0),
  decision text not null check (decision in ('include','hold','exclude_test','exclude_invalid','supersede')),
  decision_reason text not null,
  superseded_by text,
  name text not null,
  email text not null,
  company_name text not null,
  source_submitted_at timestamptz,
  source_profile jsonb not null default '{}'::jsonb,
  profile_prefill jsonb not null default '{}'::jsonb,
  follow_up jsonb not null default '[]'::jsonb,
  asset_paths jsonb not null default '{}'::jsonb,
  profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (source_form_id, source_row)
);
create index if not exists adviser_imports_profile_idx on public.adviser_imports(profile_id);
create index if not exists adviser_imports_decision_idx on public.adviser_imports(decision);
alter table public.adviser_imports enable row level security;
revoke all on public.adviser_imports from anon, authenticated;
grant select on public.adviser_imports to authenticated;
grant all on public.adviser_imports to service_role;
drop policy if exists adviser_imports_admin_read on public.adviser_imports;
create policy adviser_imports_admin_read on public.adviser_imports for select to authenticated
  using ((select public.is_admin()));

-- Only the trusted provisioning/activation service can change this marker.
-- Blocking status changes here also protects older admin deployments from sending
-- approval mail: their update fails before they reach the mail operation.
create or replace function public.guard_imported_profile()
returns trigger language plpgsql security invoker set search_path = pg_catalog, public as $$
begin
  if (tg_op = 'INSERT' and new.import_pending) or
     (tg_op = 'UPDATE' and new.import_pending is distinct from old.import_pending) then
    if current_user not in ('postgres', 'supabase_admin', 'service_role') then
      raise exception 'Imported account activation is managed by the provisioning service.';
    end if;
  end if;
  if new.import_pending and (new.status <> 'pending' or new.role <> 'adviser' or new.onboarding_completed_at is not null) then
    raise exception 'Imported accounts must remain pending until activation is released.';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_imported_profile() from public, anon, authenticated;
drop trigger if exists guard_imported_profile on public.profiles;
create trigger guard_imported_profile before insert or update on public.profiles
  for each row execute function public.guard_imported_profile();

create or replace function public.guard_imported_form()
returns trigger language plpgsql security invoker set search_path = pg_catalog, public as $$
begin
  if new.is_active and exists(select 1 from public.profiles p where p.id = new.adviser_id and p.import_pending) then
    raise exception 'Prepared FactFind links remain inactive until adviser activation.';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_imported_form() from public, anon, authenticated;
drop trigger if exists guard_imported_form on public.factfind_forms;
create trigger guard_imported_form before insert or update on public.factfind_forms
  for each row execute function public.guard_imported_form();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('adviser-imports', 'adviser-imports', false, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;
drop policy if exists adviser_import_assets_admin_read on storage.objects;
create policy adviser_import_assets_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'adviser-imports' and (select public.is_admin()));
