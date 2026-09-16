-- Optional, adviser-authored practice details. Existing accounts are not changed.
alter table public.profiles
  add column if not exists contact_email text,
  add column if not exists services text,
  add column if not exists client_focus text;
alter table public.profiles drop constraint if exists profiles_contact_email_length;
alter table public.profiles add constraint profiles_contact_email_length check (char_length(contact_email) <= 254);
alter table public.profiles drop constraint if exists profiles_services_length;
alter table public.profiles add constraint profiles_services_length check (char_length(services) <= 600);
alter table public.profiles drop constraint if exists profiles_client_focus_length;
alter table public.profiles add constraint profiles_client_focus_length check (char_length(client_focus) <= 600);

-- A return shape change requires DROP; the migration is applied atomically.
drop function if exists public.resolve_factfind_form(public.factfind_type, text);
create function public.resolve_factfind_form(p_form_type public.factfind_type, p_slug text)
returns table (
  form_id uuid, adviser_id uuid, adviser_name text, company_name text,
  logo_url text, avatar_url text, brand_colour text,
  form_type public.factfind_type, is_active boolean,
  job_title text, website text, business_location text,
  contact_phone text, contact_email text, services text, client_focus text
)
language sql stable security definer set search_path = ''
as $$
  select f.id, f.adviser_id, p.name, p.company_name, p.logo_url, p.avatar_url,
    p.brand_colour, f.form_type, f.is_active, p.job_title, p.website,
    p.business_location, p.phone, p.contact_email, p.services, p.client_focus
  from public.factfind_forms f
  join public.profiles p on p.id = f.adviser_id
  where f.form_type = p_form_type and f.unique_slug = p_slug
    and f.is_active and p.status = 'approved' and not p.import_pending
  limit 1;
$$;
revoke all on function public.resolve_factfind_form(public.factfind_type, text) from public;
grant execute on function public.resolve_factfind_form(public.factfind_type, text) to anon, authenticated;
comment on column public.profiles.contact_email is 'Optional public business contact and client-copy Reply-To; account email is unchanged.';
notify pgrst, 'reload schema';
