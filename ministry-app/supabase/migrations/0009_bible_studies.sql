-- Bible studies written by the ministry (the owner and admins) and shown in the Bible: each is linked to
-- a passage (book, chapter, and optionally verses) and appears on that chapter and in the Studies list.
-- Everyone can read published studies; only admins can write, edit or delete them.

create table if not exists public.bible_studies (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(btrim(title)) between 1 and 150),
  -- Book 0 = Genesis … 65 = Revelation.
  book        int  not null check (book between 0 and 65),
  chapter     int  not null check (chapter between 1 and 150),
  verse_from  int  check (verse_from is null or verse_from between 1 and 176),
  verse_to    int  check (verse_to is null or (verse_from is not null and verse_to between verse_from and 176)),
  -- Who the study is by, as shown to readers (e.g. "Prophet Micah Felix Azanduna D.D").
  author      text not null default '' check (char_length(author) <= 120),
  body        text not null check (char_length(btrim(body)) between 1 and 30000),
  published   boolean not null default true,
  created_by  uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists bible_studies_passage on public.bible_studies (book, chapter);
create index if not exists bible_studies_newest on public.bible_studies (created_at desc);

create or replace function public.bible_studies_touch() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then new.created_at := old.created_at; new.created_by := old.created_by; end if;
  return new;
end $$;
drop trigger if exists bible_studies_touch on public.bible_studies;
create trigger bible_studies_touch before insert or update on public.bible_studies for each row execute function public.bible_studies_touch();

alter table public.bible_studies enable row level security;
drop policy if exists "bible_studies: public read" on public.bible_studies;
create policy "bible_studies: public read" on public.bible_studies for select using (published or public.is_admin());
drop policy if exists "bible_studies: admin write" on public.bible_studies;
create policy "bible_studies: admin write" on public.bible_studies for all using (public.is_admin()) with check (public.is_admin());
grant select on public.bible_studies to anon, authenticated;
grant insert, update, delete on public.bible_studies to authenticated;
