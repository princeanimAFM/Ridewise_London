-- The AFM HUB backend: accounts, newsletter subscribers, announcements.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement checks whether it already exists.

-- ---------------------------------------------------------------------------
-- Profiles: one row per signed-in user (created automatically on sign-up).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users may read and edit their own profile, but never make themselves admin.
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles for select using (id = auth.uid());
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles for update using (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, phone) on public.profiles to authenticated;

-- Is the current user the owner/admin? Used by the security rules below.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

-- Create a profile when someone signs up (email, phone or Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, first_name, last_name, phone)
  values (
    new.id,
    coalesce(meta->>'first_name', meta->>'given_name', split_part(coalesce(meta->>'full_name', meta->>'name', ''), ' ', 1)),
    coalesce(meta->>'last_name', meta->>'family_name'),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Newsletter subscribers. Anyone can subscribe (with or without an account).
-- ---------------------------------------------------------------------------
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  first_name text not null check (char_length(first_name) between 1 and 60),
  email text unique check (email is null or email = lower(email)),
  phone text unique,
  email_opt_in boolean not null default true,
  sms_opt_in boolean not null default false,
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);

alter table public.subscribers enable row level security;

drop policy if exists "subscribers: read own" on public.subscribers;
create policy "subscribers: read own" on public.subscribers for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "subscribers: update own" on public.subscribers;
create policy "subscribers: update own" on public.subscribers for update using (user_id = auth.uid() or public.is_admin());
drop policy if exists "subscribers: admin delete" on public.subscribers;
create policy "subscribers: admin delete" on public.subscribers for delete using (public.is_admin());

-- Subscribe (or update an existing subscription with the same email/phone).
-- Called from the app; runs with elevated rights so the table itself stays private.
create or replace function public.subscribe(
  p_first_name text,
  p_email text default null,
  p_phone text default null,
  p_email_opt_in boolean default true,
  p_sms_opt_in boolean default false
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_email text := nullif(lower(trim(p_email)), '');
  v_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g'), '');
  v_name text := nullif(trim(p_first_name), '');
begin
  if v_name is null then raise exception 'First name is required'; end if;
  if v_email is null and v_phone is null then raise exception 'An email address or phone number is required'; end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Please enter a valid email address'; end if;
  if v_phone is not null and v_phone !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'Please enter the phone number in international format, e.g. +233201234567'; end if;

  if v_email is not null and exists (select 1 from subscribers where email = v_email) then
    update subscribers set
      first_name = v_name,
      phone = coalesce(v_phone, phone),
      email_opt_in = coalesce(p_email_opt_in, true),
      sms_opt_in = coalesce(p_sms_opt_in, false) and coalesce(v_phone, phone) is not null,
      user_id = coalesce(auth.uid(), user_id),
      updated_at = now()
    where email = v_email;
  elsif v_phone is not null and exists (select 1 from subscribers where phone = v_phone) then
    update subscribers set
      first_name = v_name,
      email = coalesce(v_email, email),
      email_opt_in = coalesce(p_email_opt_in, true) and coalesce(v_email, email) is not null,
      sms_opt_in = coalesce(p_sms_opt_in, false),
      user_id = coalesce(auth.uid(), user_id),
      updated_at = now()
    where phone = v_phone;
  else
    insert into subscribers (user_id, first_name, email, phone, email_opt_in, sms_opt_in)
    values (auth.uid(), v_name, v_email, v_phone,
            coalesce(p_email_opt_in, true) and v_email is not null,
            coalesce(p_sms_opt_in, false) and v_phone is not null);
  end if;
end $$;

grant execute on function public.subscribe(text, text, text, boolean, boolean) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- Push notification addresses (one per phone that allowed notifications).
-- ---------------------------------------------------------------------------
create table if not exists public.push_tokens (
  token text primary key check (token like 'ExponentPushToken[%' or token like 'ExpoPushToken[%'),
  user_id uuid references auth.users (id) on delete set null,
  platform text,
  announcements boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;
drop policy if exists "push_tokens: admin read" on public.push_tokens;
create policy "push_tokens: admin read" on public.push_tokens for select using (public.is_admin());

create or replace function public.register_push_token(p_token text, p_platform text default null, p_announcements boolean default true)
returns void
language sql security definer set search_path = public
as $$
  insert into push_tokens (token, user_id, platform, announcements)
  values (p_token, auth.uid(), p_platform, coalesce(p_announcements, true))
  on conflict (token) do update set
    user_id = coalesce(excluded.user_id, push_tokens.user_id),
    platform = excluded.platform,
    announcements = excluded.announcements,
    updated_at = now()
$$;
grant execute on function public.register_push_token(text, text, boolean) to anon, authenticated;

-- Admin dashboard counts.
drop function if exists public.subscriber_counts();
create or replace function public.subscriber_counts()
returns table (total bigint, email bigint, sms bigint, push bigint)
language sql stable security definer set search_path = public
as $$
  select count(*), count(*) filter (where email_opt_in), count(*) filter (where sms_opt_in),
         (select count(*) from push_tokens where announcements)
  from subscribers where public.is_admin()
$$;
grant execute on function public.subscriber_counts() to authenticated;

-- ---------------------------------------------------------------------------
-- Announcements (flyers, upcoming programmes). Everyone can read published
-- ones; only the owner/admin can create them.
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 150),
  body text not null check (char_length(body) between 1 and 5000),
  sms_text text check (sms_text is null or char_length(sms_text) <= 320),
  flyer_path text,
  event_date date,
  send_email boolean not null default true,
  send_sms boolean not null default false,
  send_push boolean not null default true,
  published boolean not null default true,
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  sent_count integer not null default 0,
  failed_count integer not null default 0
);

alter table public.announcements enable row level security;

drop policy if exists "announcements: public read" on public.announcements;
create policy "announcements: public read" on public.announcements for select using (published or public.is_admin());
drop policy if exists "announcements: admin write" on public.announcements;
create policy "announcements: admin write" on public.announcements for all using (public.is_admin()) with check (public.is_admin());

-- Delivery log (written by the send function, readable by the admin).
create table if not exists public.deliveries (
  id bigint generated always as identity primary key,
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  subscriber_id uuid references public.subscribers (id) on delete set null,
  channel text not null check (channel in ('email', 'sms')),
  status text not null check (status in ('sent', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

alter table public.deliveries enable row level security;
drop policy if exists "deliveries: admin read" on public.deliveries;
create policy "deliveries: admin read" on public.deliveries for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- File storage: flyers (uploaded from the owner dashboard) and brand images
-- used in newsletters. Anyone can view; only the admin can upload.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('flyers', 'flyers', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('brand', 'brand', true) on conflict (id) do nothing;

drop policy if exists "storage: admin upload" on storage.objects;
create policy "storage: admin upload" on storage.objects for insert to authenticated
  with check (bucket_id in ('flyers', 'brand') and public.is_admin());
drop policy if exists "storage: admin update" on storage.objects;
create policy "storage: admin update" on storage.objects for update to authenticated
  using (bucket_id in ('flyers', 'brand') and public.is_admin());
drop policy if exists "storage: admin delete" on storage.objects;
create policy "storage: admin delete" on storage.objects for delete to authenticated
  using (bucket_id in ('flyers', 'brand') and public.is_admin());

-- ---------------------------------------------------------------------------
-- AFTER you have signed up in the app with the owner's account, make it the
-- admin by running this line (change the email to add or switch owners):
--
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'princeanim88@gmail.com');
-- ---------------------------------------------------------------------------
