-- Security hardening from the review of 19 November 2026. Safe to re-run.
--
-- 1. Owners: a private list of owner accounts (kept out of the code). Only owners can manage admins and change the
--    giving and contact details; ordinary admins keep everything else.
-- 2. Newsletter: nobody can take over, read or edit another person's subscription.
-- 3. Links saved in app content must be web, email or phone links (never javascript: and the like).
-- 4. Push registration: only real push addresses, and a flood brake.
-- 5. Tighter table and function permissions (the row rules stay, this adds a second lock).
-- 6. File size and type limits on the storage buckets.
--
-- After running this, add the owner accounts once (not stored in the code):
--   insert into private.owners (email) values ('<owner email>') on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 1. Owners
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.owners (email text primary key check (email = lower(email)));
alter table private.owners enable row level security;
revoke all on private.owners from public, anon, authenticated;

create or replace function public.is_owner()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null
      and lower(u.email) in (select o.email from private.owners o))
$$;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- An owner account becomes an admin as soon as its email is confirmed.
create or replace function public.promote_owner()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and lower(new.email) in (select o.email from private.owners o) then
    insert into public.profiles (id, is_admin) values (new.id, true)
    on conflict (id) do update set is_admin = true;
  end if;
  return new;
end $$;
revoke all on function public.promote_owner() from public, anon, authenticated;

-- Only an owner can add or remove admins. Owner accounts can't be removed, and nobody can remove themselves.
create or replace function public.set_admin(p_email text, p_admin boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user auth.users%rowtype;
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if not public.is_owner() then raise exception 'Only an owner account can change admins.'; end if;
  select * into v_user from auth.users where lower(email) = v_email limit 1;
  if v_user.id is null then
    raise exception 'No account uses % yet. Ask them to create an account in the app first (More → Sign in → Create account).', v_email;
  end if;
  if p_admin and v_user.email_confirmed_at is null then
    raise exception '% has not confirmed their email yet. Ask them to enter the code we emailed them, then try again.', v_email;
  end if;
  if not p_admin and v_email in (select o.email from private.owners o) then raise exception 'An owner account can''t be removed.'; end if;
  if not p_admin and v_user.id = auth.uid() then raise exception 'You can''t remove yourself. Ask another owner to do it.'; end if;

  insert into profiles (id, is_admin) values (v_user.id, p_admin)
  on conflict (id) do update set is_admin = p_admin;
end $$;

create or replace function public.list_admins()
returns table (email text, first_name text, is_owner boolean, is_me boolean)
language sql stable security definer set search_path = public
as $$
  select u.email::text, p.first_name, lower(u.email) in (select o.email from private.owners o), u.id = auth.uid()
  from profiles p join auth.users u on u.id = p.id
  where p.is_admin and public.is_owner()
  order by lower(u.email) in (select o.email from private.owners o) desc, p.first_name nulls last, u.email
$$;

-- The giving and contact details ('giving', 'details') can only be changed by an owner; other areas by any admin.
drop policy if exists "app_content: admin write" on public.app_content;
drop policy if exists "app_content: insert" on public.app_content;
drop policy if exists "app_content: update" on public.app_content;
drop policy if exists "app_content: delete" on public.app_content;
create policy "app_content: insert" on public.app_content for insert to authenticated
  with check (public.is_owner() or (public.is_admin() and key not in ('giving', 'details')));
create policy "app_content: update" on public.app_content for update to authenticated
  using (public.is_owner() or (public.is_admin() and key not in ('giving', 'details')))
  with check (public.is_owner() or (public.is_admin() and key not in ('giving', 'details')));
create policy "app_content: delete" on public.app_content for delete to authenticated
  using (public.is_owner() or (public.is_admin() and key not in ('giving', 'details')));

-- ---------------------------------------------------------------------------
-- 2. Newsletter: only the verified owner of an email address (or of the phone number) can change an existing
--    subscription. Anyone else is quietly ignored, so the form can't be used to edit people's details or to find
--    out who is subscribed. Members never edit the table directly (only admins delete from it).
-- ---------------------------------------------------------------------------
drop policy if exists "subscribers: update own" on public.subscribers;

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
  v_signed_in_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if v_name is null then raise exception 'First name is required'; end if;
  if v_email is null and v_phone is null then raise exception 'An email address or phone number is required'; end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Please enter a valid email address'; end if;
  if v_phone is not null and v_phone !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'Please enter the phone number in international format, e.g. +233201234567'; end if;

  if v_email is not null and exists (select 1 from subscribers where email = v_email) then
    -- Only the person signed in with this email (or who created the entry while signed in) may change it.
    if auth.uid() is null
       or (v_signed_in_email <> v_email and not exists (select 1 from subscribers where email = v_email and user_id = auth.uid())) then
      return;
    end if;
    update subscribers set
      first_name = v_name,
      phone = coalesce(v_phone, phone),
      email_opt_in = coalesce(p_email_opt_in, true),
      sms_opt_in = coalesce(p_sms_opt_in, false) and coalesce(v_phone, phone) is not null,
      user_id = coalesce(auth.uid(), user_id),
      updated_at = now()
    where email = v_email;
  elsif v_phone is not null and exists (select 1 from subscribers where phone = v_phone) then
    if auth.uid() is null or not exists (select 1 from subscribers where phone = v_phone and user_id = auth.uid()) then
      return;
    end if;
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
-- 3. Links in app content must be web, email or phone links.
-- ---------------------------------------------------------------------------
create or replace function public.app_content_check()
returns trigger
language plpgsql set search_path = public
as $$
begin
  if new.value::text ~* '"\s*(javascript|vbscript|data|file|blob|intent)\s*:' then
    raise exception 'A link in this content starts with a type that is not allowed. Links must start with https://, mailto: or tel:.';
  end if;
  return new;
end $$;
drop trigger if exists app_content_check on public.app_content;
create trigger app_content_check before insert or update on public.app_content for each row execute function public.app_content_check();

-- ---------------------------------------------------------------------------
-- 4. Push registration: real Expo push addresses only, and a brake against floods of fake ones.
--    A push address that already belongs to someone keeps its owner and its notification choice.
-- ---------------------------------------------------------------------------
create or replace function public.register_push_token(p_token text, p_platform text default null, p_announcements boolean default true)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_token is null or length(p_token) > 200 or p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,}\]$' then
    raise exception 'Invalid push address';
  end if;
  if not exists (select 1 from push_tokens where token = p_token)
     and (select count(*) from push_tokens where created_at > now() - interval '1 hour') > 300 then
    return;
  end if;
  insert into push_tokens (token, user_id, platform, announcements)
  values (p_token, auth.uid(), left(p_platform, 20), coalesce(p_announcements, true))
  on conflict (token) do update set
    user_id = coalesce(push_tokens.user_id, excluded.user_id),
    platform = excluded.platform,
    announcements = case when push_tokens.user_id is null or push_tokens.user_id is not distinct from excluded.user_id
                         then excluded.announcements else push_tokens.announcements end,
    updated_at = now();
end $$;
grant execute on function public.register_push_token(text, text, boolean) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Permissions: the row rules stay as the main lock; this removes what the app never needs.
-- ---------------------------------------------------------------------------
revoke insert, update, delete, truncate, trigger, references on all tables in schema public from anon;
revoke truncate, trigger, references on all tables in schema public from authenticated;
revoke insert, update on public.deliveries, public.telegram_posts, public.push_tokens, public.subscribers from authenticated;
revoke insert, delete on public.profiles from authenticated;
revoke execute on function public.set_admin(text, boolean), public.list_admins(), public.subscriber_counts() from public, anon;
alter default privileges for role postgres in schema public revoke insert, update, delete, truncate, trigger, references on tables from anon;
alter default privileges for role postgres in schema public revoke truncate, trigger, references on tables from authenticated;

-- ---------------------------------------------------------------------------
-- 6. Storage limits (profile photos: small images only; flyers and photos: images; library: documents).
-- ---------------------------------------------------------------------------
update storage.buckets set file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'] where id = 'avatars';
update storage.buckets set file_size_limit = 15728640,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'] where id in ('flyers', 'catalog', 'brand');
update storage.buckets set file_size_limit = 52428800,
  allowed_mime_types = array['application/pdf', 'application/epub+zip', 'image/jpeg', 'image/png', 'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'] where id = 'library';
