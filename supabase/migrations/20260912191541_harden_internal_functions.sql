-- Internal helpers run through owner-executed triggers/functions, never the Data API.
revoke execute on function public.generate_adviser_slug() from public, anon, authenticated;
revoke execute on function public.generate_submission_reference() from public, anon, authenticated;
revoke execute on function public.provision_factfind_forms(uuid) from public, anon, authenticated;
revoke execute on function public.is_allowlisted_admin(text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_profile_status_change() from public, anon, authenticated;

alter function public.generate_submission_reference() set search_path = pg_catalog, public;
alter function public.touch_updated_at() set search_path = pg_catalog, public;

-- These remain public by design: client links need no account. is_admin and
-- is_approved only inspect auth.uid() and are needed by the existing RLS policies.
-- resolve_factfind_form and submit_factfind enforce the active adviser link.
