/*
  Per-link question-set variants.

  A FactFind link normally serves the standard question set for its type. A
  link can instead name a variant (a bespoke question set kept in the app,
  e.g. 'future_perfect' for Tom Hunt's Mortgage FactFind). The variant is
  resolved with the link so the public page, server validation and previews
  all use the same schema. Null means the standard questions. Safe to re-run.
*/

alter table public.factfind_forms
  add column if not exists variant text
  check (variant is null or variant ~ '^[a-z][a-z0-9_]{0,39}$');

comment on column public.factfind_forms.variant is 'Named bespoke question set served by this link; null for the standard FactFind.';

drop function if exists public.resolve_factfind_form(public.factfind_type, text);

create function public.resolve_factfind_form(p_form_type public.factfind_type, p_slug text)
returns table (
  form_id uuid, adviser_id uuid, adviser_name text, company_name text,
  logo_url text, avatar_url text, brand_colour text,
  form_type public.factfind_type, is_active boolean,
  job_title text, website text, business_location text,
  contact_phone text, contact_email text, services text, client_focus text,
  variant text
)
language sql stable security definer set search_path = ''
as $$
  select f.id, f.adviser_id, p.name, p.company_name, p.logo_url, p.avatar_url,
    p.brand_colour, f.form_type, f.is_active, p.job_title, p.website,
    p.business_location, p.phone, p.contact_email, p.services, p.client_focus,
    f.variant
  from public.factfind_forms f
  join public.profiles p on p.id = f.adviser_id
  where f.form_type = p_form_type and f.unique_slug = p_slug
    and f.is_active and p.status = 'approved' and not p.import_pending
  limit 1;
$$;
revoke all on function public.resolve_factfind_form(public.factfind_type, text) from public;
grant execute on function public.resolve_factfind_form(public.factfind_type, text) to anon, authenticated;
notify pgrst, 'reload schema';
