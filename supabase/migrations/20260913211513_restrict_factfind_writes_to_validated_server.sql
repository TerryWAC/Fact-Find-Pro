-- Apply after deploying the server action that uses the server-only key.
-- Public clients can resolve active links, but cannot bypass Typeform validation.
revoke execute on function public.submit_factfind(public.factfind_type, text, text, text, text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_factfind(public.factfind_type, text, text, text, text, jsonb, jsonb)
  to service_role;
comment on function public.submit_factfind(public.factfind_type, text, text, text, text, jsonb, jsonb) is
  'Server-only persistence after validation against the trusted Typeform-derived schema. Public link ownership and active-account checks remain enforced.';
