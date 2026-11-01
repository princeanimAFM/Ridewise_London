-- Free e-books and files (Library), and optional profile photos. Safe to re-run.

-- Library items live in app_content under the key 'library'.
alter table public.app_content drop constraint if exists app_content_key_check;
alter table public.app_content add constraint app_content_key_check
  check (key in ('details', 'books', 'perfumes', 'quotes', 'giving', 'services', 'socials', 'archive', 'library'));

-- Optional profile photo, set by the member.
alter table public.profiles add column if not exists avatar_url text;
grant update (avatar_url) on public.profiles to authenticated;

-- Storage: 'library' for PDFs and files (admins upload), 'avatars' for profile photos.
insert into storage.buckets (id, name, public) values ('library', 'library', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

drop policy if exists "storage: admin upload" on storage.objects;
create policy "storage: admin upload" on storage.objects for insert to authenticated
  with check (bucket_id in ('flyers', 'brand', 'catalog', 'library') and public.is_admin());
drop policy if exists "storage: admin update" on storage.objects;
create policy "storage: admin update" on storage.objects for update to authenticated
  using (bucket_id in ('flyers', 'brand', 'catalog', 'library') and public.is_admin());
drop policy if exists "storage: admin delete" on storage.objects;
create policy "storage: admin delete" on storage.objects for delete to authenticated
  using (bucket_id in ('flyers', 'brand', 'catalog', 'library') and public.is_admin());

-- Members can only add, replace or remove photos in their own folder (avatars/<their id>/...).
drop policy if exists "storage: own avatar read" on storage.objects;
create policy "storage: own avatar read" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "storage: own avatar insert" on storage.objects;
create policy "storage: own avatar insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "storage: own avatar update" on storage.objects;
create policy "storage: own avatar update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "storage: own avatar delete" on storage.objects;
create policy "storage: own avatar delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
