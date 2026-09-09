-- =============================================================================
-- FactFind Pro — adviser branding
-- =============================================================================
-- • brand_colour must be a 6-digit hex colour (or null for the default).
-- • resolve_factfind_form() also returns the adviser's photo, so the public
--   FactFind page can show it next to their name.
-- =============================================================================

alter table public.profiles
  drop constraint if exists profiles_brand_colour_hex;

alter table public.profiles
  add constraint profiles_brand_colour_hex
  check (brand_colour is null or brand_colour ~ '^#[0-9A-Fa-f]{6}$');

-- The return type changes, so the function has to be dropped and recreated.
drop function if exists public.resolve_factfind_form(public.factfind_type, text);

create function public.resolve_factfind_form(
  p_form_type public.factfind_type,
  p_slug      text
)
returns table (
  form_id       uuid,
  adviser_id    uuid,
  adviser_name  text,
  company_name  text,
  logo_url      text,
  avatar_url    text,
  brand_colour  text,
  form_type     public.factfind_type,
  is_active     boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select f.id, f.adviser_id, p.name, p.company_name, p.logo_url, p.avatar_url, p.brand_colour, f.form_type, f.is_active
  from public.factfind_forms f
  join public.profiles p on p.id = f.adviser_id
  where f.form_type = p_form_type
    and f.unique_slug = p_slug
    and f.is_active
    and p.status = 'approved'
  limit 1;
$$;

revoke all on function public.resolve_factfind_form(public.factfind_type, text) from public;
grant execute on function public.resolve_factfind_form(public.factfind_type, text) to anon, authenticated;
