/*
  Per-adviser question markers.

  Every question card shows "Required" or "Optional". An adviser can ask for
  the "Optional" marker to be left off their links so clients are not nudged
  to skip questions (Supreme Financial Solutions, 11 November 2026); required
  questions still say "Required" and nothing becomes mandatory. The flag is
  resolved with the link, like branding. Default false: no change for anyone
  until an admin sets it for that adviser. Safe to re-run.
*/

alter table public.profiles
  add column if not exists hide_optional_markers boolean not null default false;

comment on column public.profiles.hide_optional_markers is 'Leave the "Optional" marker off this adviser''s FactFind questions; required questions are still marked.';

drop function if exists public.resolve_factfind_form(public.factfind_type, text);

create function public.resolve_factfind_form(p_form_type public.factfind_type, p_slug text)
returns table (
  form_id uuid, adviser_id uuid, adviser_name text, company_name text,
  logo_url text, avatar_url text, brand_colour text,
  form_type public.factfind_type, is_active boolean,
  job_title text, website text, business_location text,
  contact_phone text, contact_email text, services text, client_focus text,
  variant text, hide_optional_markers boolean
)
language sql stable security definer set search_path = ''
as $$
  select f.id, f.adviser_id, p.name, p.company_name, p.logo_url, p.avatar_url,
    p.brand_colour, f.form_type, f.is_active, p.job_title, p.website,
    p.business_location, p.phone, p.contact_email, p.services, p.client_focus,
    f.variant, p.hide_optional_markers
  from public.factfind_forms f
  join public.profiles p on p.id = f.adviser_id
  where f.form_type = p_form_type and f.unique_slug = p_slug
    and f.is_active and p.status = 'approved' and not p.import_pending
  limit 1;
$$;
revoke all on function public.resolve_factfind_form(public.factfind_type, text) from public;
grant execute on function public.resolve_factfind_form(public.factfind_type, text) to anon, authenticated;
notify pgrst, 'reload schema';
