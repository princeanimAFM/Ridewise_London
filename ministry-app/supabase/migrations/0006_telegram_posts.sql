-- Telegram channel posts that have already triggered a push notification. Safe to re-run.
-- Filled only by the telegram-webhook function (service role); admins can read it.

create table if not exists public.telegram_posts (
  chat_id bigint not null,
  message_id bigint not null,
  media_group_id text,
  kind text not null,
  title text not null,
  link text not null,
  notified_count integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (chat_id, message_id)
);

-- An album arrives as several messages with one media_group_id; notify once per album.
create unique index if not exists telegram_posts_media_group
  on public.telegram_posts (chat_id, media_group_id) where media_group_id is not null;

alter table public.telegram_posts enable row level security;
drop policy if exists "telegram_posts: admin read" on public.telegram_posts;
create policy "telegram_posts: admin read" on public.telegram_posts for select using (public.is_admin());
