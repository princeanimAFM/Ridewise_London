-- Editable app content: books, perfumes, quotes, giving, links, theme and
-- ministry details, managed from the app's Owner dashboard → Edit app content.
-- Each row holds one area (key) as JSON. Areas with no row use the content
-- built into the app, so nothing changes until the owner edits something.
-- Safe to re-run.

create table if not exists public.app_content (
  key text primary key check (key in ('details', 'books', 'perfumes', 'quotes', 'giving', 'services', 'socials', 'archive')),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null default auth.uid()
);

alter table public.app_content enable row level security;

drop policy if exists "app_content: public read" on public.app_content;
create policy "app_content: public read" on public.app_content for select using (true);
drop policy if exists "app_content: admin write" on public.app_content;
create policy "app_content: admin write" on public.app_content for all using (public.is_admin()) with check (public.is_admin());

grant select on public.app_content to anon, authenticated;
grant insert, update, delete on public.app_content to authenticated;

-- Photos for books and perfumes uploaded from the app.
insert into storage.buckets (id, name, public) values ('catalog', 'catalog', true) on conflict (id) do nothing;

drop policy if exists "storage: admin upload" on storage.objects;
create policy "storage: admin upload" on storage.objects for insert to authenticated
  with check (bucket_id in ('flyers', 'brand', 'catalog') and public.is_admin());
drop policy if exists "storage: admin update" on storage.objects;
create policy "storage: admin update" on storage.objects for update to authenticated
  using (bucket_id in ('flyers', 'brand', 'catalog') and public.is_admin());
drop policy if exists "storage: admin delete" on storage.objects;
create policy "storage: admin delete" on storage.objects for delete to authenticated
  using (bucket_id in ('flyers', 'brand', 'catalog') and public.is_admin());
