-- =============================================================================
-- FactFind Pro — storage buckets
-- =============================================================================
-- `branding` holds adviser logos (future custom-branding feature).
-- `submission-uploads` is reserved for client document uploads.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('branding', 'branding', true, 2097152, array['image/png','image/jpeg','image/svg+xml','image/webp']),
  ('submission-uploads', 'submission-uploads', false, 10485760, null)
on conflict (id) do nothing;

-- branding: anyone can read, an adviser may manage only their own folder (<uid>/...)
drop policy if exists "branding_public_read"  on storage.objects;
drop policy if exists "branding_owner_write"  on storage.objects;
drop policy if exists "branding_owner_update" on storage.objects;
drop policy if exists "branding_owner_delete" on storage.objects;

create policy "branding_public_read" on storage.objects
  for select using (bucket_id = 'branding');

create policy "branding_owner_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'branding' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "branding_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'branding' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "branding_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'branding' and (storage.foldername(name))[1] = auth.uid()::text);

-- submission uploads: adviser-scoped read, admins see everything
drop policy if exists "submission_uploads_owner_read" on storage.objects;
drop policy if exists "submission_uploads_admin_all"  on storage.objects;

create policy "submission_uploads_owner_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'submission-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "submission_uploads_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'submission-uploads' and public.is_admin())
  with check (bucket_id = 'submission-uploads' and public.is_admin());
