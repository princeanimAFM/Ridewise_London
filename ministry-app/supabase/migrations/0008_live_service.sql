-- Live services: the "We're live" notification, live comments and private prayer requests. Safe to re-run.
--
-- live_sessions: one row per live service. The go-live edge function opens one (and notifies
--   everyone) and closes it. Only one can be open at a time.
-- live_messages: comments (seen by everyone watching) and prayer requests (seen only by the
--   sender and the ministry team), sent from the app's Live screen while a service is live.
--   Names come from the sender's profile, so nobody can post under someone else's name.

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Live service' check (char_length(title) between 1 and 120),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  started_by uuid references auth.users (id) on delete set null,
  notified_count integer not null default 0
);
create unique index if not exists live_sessions_one_open on public.live_sessions ((true)) where ended_at is null;

alter table public.live_sessions enable row level security;
drop policy if exists "live_sessions: public read" on public.live_sessions;
create policy "live_sessions: public read" on public.live_sessions for select using (true);
drop policy if exists "live_sessions: admin write" on public.live_sessions;
create policy "live_sessions: admin write" on public.live_sessions for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.live_messages (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.live_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  is_team boolean not null default false,
  kind text not null check (kind in ('comment', 'prayer')),
  body text not null check (char_length(btrim(body)) between 1 and 500),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists live_messages_session on public.live_messages (session_id, created_at);
create index if not exists live_messages_user_recent on public.live_messages (user_id, created_at desc);

-- Fill in who sent it from the signed-in account, whatever the app sends.
create or replace function public.live_message_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  new.name := coalesce(nullif(left(btrim((select first_name from profiles where id = auth.uid())), 40), ''), 'Member');
  new.is_team := coalesce((select is_admin from profiles where id = auth.uid()), false);
  new.body := btrim(new.body);
  new.hidden := false;
  new.created_at := now();
  return new;
end $$;
drop trigger if exists live_message_defaults on public.live_messages;
create trigger live_message_defaults before insert on public.live_messages
  for each row execute function public.live_message_defaults();

alter table public.live_messages enable row level security;

drop policy if exists "live_messages: read" on public.live_messages;
create policy "live_messages: read" on public.live_messages for select using (
  (kind = 'comment' and not hidden) or user_id = auth.uid() or public.is_admin()
);

-- Signed-in members can post while a service is live, at most once every 5 seconds.
drop policy if exists "live_messages: post while live" on public.live_messages;
create policy "live_messages: post while live" on public.live_messages for insert to authenticated with check (
  auth.uid() is not null
  and exists (select 1 from public.live_sessions s where s.id = session_id and s.ended_at is null)
  and not exists (
    select 1 from public.live_messages m
    where m.user_id = auth.uid() and m.created_at > now() - interval '5 seconds'
  )
);

-- The ministry team can hide a comment; members can delete their own messages.
drop policy if exists "live_messages: admin hide" on public.live_messages;
create policy "live_messages: admin hide" on public.live_messages for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "live_messages: delete own" on public.live_messages;
create policy "live_messages: delete own" on public.live_messages for delete using (user_id = auth.uid() or public.is_admin());

revoke insert, update on public.live_messages from anon, authenticated;
grant select on public.live_messages to anon, authenticated;
grant insert (session_id, kind, body) on public.live_messages to authenticated;
grant update (hidden) on public.live_messages to authenticated;
grant delete on public.live_messages to authenticated;

-- Stream new comments and session changes to open apps.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.live_messages; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.live_sessions; exception when duplicate_object then null; end;
  end if;
end $$;
