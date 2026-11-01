-- Church Care Tracker: database, access rules and public forms.
-- Run once in a NEW Supabase project (SQL editor, or the management API). Safe to run again.
--
-- Who sees what (enforced here, not in the app):
--   pastor   everything; assigns visitors to groups; manages the team list
--   welcome  adds visitors and sees the visitor list; no members or prayer requests
--   leader   only the visitors, members and prayer requests of their own group
--   visitors (no login) can only send the welcome form and prayer requests, never read anything

-- ---------- tables ----------
create table if not exists public.groups (
  id          text primary key,
  name        text not null,
  tag         text not null default '',
  leader_name text not null default '',
  sort        int  not null default 0
);

create table if not exists public.staff (
  email      text primary key check (email = lower(btrim(email)) and email like '%@%'),
  name       text not null check (char_length(btrim(name)) between 1 and 80),
  role       text not null check (role in ('pastor', 'welcome', 'leader')),
  group_id   text references public.groups(id),
  created_at timestamptz not null default now(),
  check (role <> 'leader' or group_id is not null)
);

create table if not exists public.visitors (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(btrim(name)) between 1 and 80),
  phone          text not null default '' check (char_length(phone) <= 20),
  reason         text not null default '' check (char_length(reason) <= 60),
  invited_by     text not null default '' check (char_length(invited_by) <= 80),
  group_interest text references public.groups(id) on delete set null,
  assigned_to    text references public.groups(id) on delete set null,
  status         text not null default 'new' check (status in ('new', 'reached', 'joined')),
  due            date,
  reached_at     date,
  seen_by_leader boolean not null default true,
  consent_at     timestamptz,
  source         text not null default 'team' check (source in ('form', 'team')),
  created_at     timestamptz not null default now()
);
create index if not exists visitors_assigned on public.visitors (assigned_to);
alter table public.visitors add column if not exists welcomed_at timestamptz;
alter table public.visitors add column if not exists welcomed_by text not null default '';

create table if not exists public.visitor_notes (
  id         bigint generated always as identity primary key,
  visitor_id uuid not null references public.visitors(id) on delete cascade,
  author     text not null default '',
  body       text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists visitor_notes_visitor on public.visitor_notes (visitor_id);

create table if not exists public.members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 1 and 80),
  phone      text not null default '' check (char_length(phone) <= 20),
  group_id   text not null references public.groups(id),
  joined_at  date not null default current_date,
  last_seen  date,
  visitor_id uuid references public.visitors(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists members_group on public.members (group_id);

create table if not exists public.attendance (
  member_id uuid not null references public.members(id) on delete cascade,
  seen_on   date not null default current_date,
  primary key (member_id, seen_on)
);

create table if not exists public.prayers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default '' check (char_length(name) <= 80),
  phone       text not null default '' check (char_length(phone) <= 20),
  body        text not null check (char_length(btrim(body)) between 1 and 1000),
  status      text not null default 'open' check (status in ('open', 'prayed')),
  assigned_to text references public.groups(id) on delete set null,
  visitor_id  uuid references public.visitors(id) on delete cascade,
  source      text not null default 'team' check (source in ('form', 'team')),
  created_at  timestamptz not null default now()
);
create index if not exists prayers_assigned on public.prayers (assigned_to);

-- ---------- who is signed in ----------
create or replace function public.my_email() returns text language sql stable
as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.my_role() returns text language sql stable security definer set search_path = public
as $$ select role from public.staff where email = public.my_email() $$;

create or replace function public.my_group() returns text language sql stable security definer set search_path = public
as $$ select group_id from public.staff where email = public.my_email() and role = 'leader' $$;

create or replace function public.my_name() returns text language sql stable security definer set search_path = public
as $$ select name from public.staff where email = public.my_email() $$;

-- True only inside the public form functions below.
create or replace function public.from_form() returns boolean language sql stable
as $$ select coalesce(current_setting('care.form', true), '') = '1' $$;

-- ---------- rules the app can't break ----------
create or replace function public.visitor_rules() returns trigger language plpgsql security definer set search_path = public as $$
declare r text := public.my_role();
begin
  if tg_op = 'INSERT' then
    new.source := case when public.from_form() then 'form' else 'team' end;
    new.created_at := now();
    new.status := 'new';
    new.reached_at := null;
    if new.source = 'form' then
      new.assigned_to := null;
    elsif r = 'leader' then
      new.assigned_to := public.my_group();
    elsif r = 'welcome' then
      new.assigned_to := null;
    end if;
    new.due := current_date + 2;
    new.seen_by_leader := (new.assigned_to is null or r = 'leader');
    new.name := btrim(new.name);
    return new;
  end if;
  -- UPDATE
  if new.assigned_to is distinct from old.assigned_to then
    if r is distinct from 'pastor' then
      raise exception 'Only the pastor can assign visitors to a group';
    end if;
    if new.assigned_to is not null and new.status = 'new' then
      new.due := current_date + 2;   -- leader has two days from assignment
      new.seen_by_leader := false;   -- shows "New for you"
    end if;
  end if;
  if r is distinct from 'pastor' then new.due := old.due; end if;
  if new.status <> 'new' and old.status = 'new' and new.reached_at is null then
    new.reached_at := current_date;
  end if;
  if r is distinct from 'pastor' and (new.welcomed_at is distinct from old.welcomed_at or new.welcomed_by is distinct from old.welcomed_by) and not public.from_form() then
    if current_setting('care.welcoming', true) is distinct from '1' then
      new.welcomed_at := old.welcomed_at; new.welcomed_by := old.welcomed_by;
    end if;
  end if;
  if new.consent_at is distinct from old.consent_at or new.source is distinct from old.source or new.created_at is distinct from old.created_at then
    raise exception 'Those details cannot be changed';
  end if;
  return new;
end $$;
drop trigger if exists visitor_rules on public.visitors;
create trigger visitor_rules before insert or update on public.visitors for each row execute function public.visitor_rules();

create or replace function public.note_author() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.author := coalesce(public.my_name(), '');
  new.body := btrim(new.body);
  new.created_at := now();
  return new;
end $$;
drop trigger if exists note_author on public.visitor_notes;
create trigger note_author before insert on public.visitor_notes for each row execute function public.note_author();

create or replace function public.member_rules() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() = 'leader' then new.group_id := public.my_group(); end if;
  new.name := btrim(new.name);
  return new;
end $$;
drop trigger if exists member_rules on public.members;
create trigger member_rules before insert or update on public.members for each row execute function public.member_rules();

create or replace function public.prayer_rules() returns trigger language plpgsql security definer set search_path = public as $$
declare r text := public.my_role();
begin
  if tg_op = 'INSERT' then
    if public.from_form() then
      new.source := 'form';
      new.assigned_to := null;
    else
      new.source := 'team';
      new.visitor_id := null;
      if r = 'leader' then new.assigned_to := public.my_group(); end if;
      if r = 'welcome' then new.assigned_to := null; end if;
    end if;
    new.status := 'open';
    new.created_at := now();
    return new;
  end if;
  if new.assigned_to is distinct from old.assigned_to and r is distinct from 'pastor' then
    raise exception 'Only the pastor can pass a prayer request to a group';
  end if;
  if new.body is distinct from old.body or new.source is distinct from old.source or new.created_at is distinct from old.created_at then
    raise exception 'A prayer request cannot be rewritten';
  end if;
  return new;
end $$;
drop trigger if exists prayer_rules on public.prayers;
create trigger prayer_rules before insert or update on public.prayers for each row execute function public.prayer_rules();

-- A visitor's prayer requests go to the same leader as the visitor.
create or replace function public.visitor_prayers_follow() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.assigned_to is distinct from old.assigned_to then
    update public.prayers set assigned_to = new.assigned_to where visitor_id = new.id;
  end if;
  return null;
end $$;
drop trigger if exists visitor_prayers_follow on public.visitors;
create trigger visitor_prayers_follow after update of assigned_to on public.visitors for each row execute function public.visitor_prayers_follow();

-- The team list always keeps at least one pastor.
create or replace function public.keep_a_pastor() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'pastor' and (tg_op = 'DELETE' or new.role <> 'pastor')
     and not exists (select 1 from public.staff where role = 'pastor' and email <> old.email) then
    raise exception 'The team needs at least one pastor';
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists keep_a_pastor on public.staff;
create trigger keep_a_pastor before update or delete on public.staff for each row execute function public.keep_a_pastor();

-- Last seen = the latest attendance mark.
create or replace function public.update_last_seen() returns trigger language plpgsql security definer set search_path = public as $$
declare m uuid := coalesce(new.member_id, old.member_id);
begin
  update public.members set last_seen = (select max(seen_on) from public.attendance where member_id = m) where id = m;
  return null;
end $$;
drop trigger if exists update_last_seen on public.attendance;
create trigger update_last_seen after insert or delete on public.attendance for each row execute function public.update_last_seen();

-- ---------- access rules ----------
alter table public.groups        enable row level security;
alter table public.staff         enable row level security;
alter table public.visitors      enable row level security;
alter table public.visitor_notes enable row level security;
alter table public.members       enable row level security;
alter table public.attendance    enable row level security;
alter table public.prayers       enable row level security;

-- Nobody without a login reads or writes tables directly; the public forms use the functions below.
revoke all on public.groups, public.staff, public.visitors, public.visitor_notes, public.members, public.attendance, public.prayers from anon;
grant select on public.groups to anon;

drop policy if exists groups_read on public.groups;
create policy groups_read on public.groups for select to anon, authenticated using (true);
drop policy if exists groups_write on public.groups;
create policy groups_write on public.groups for all to authenticated using (public.my_role() = 'pastor') with check (public.my_role() = 'pastor');

drop policy if exists staff_read on public.staff;
create policy staff_read on public.staff for select to authenticated using (public.my_role() = 'pastor' or email = public.my_email());
drop policy if exists staff_write on public.staff;
create policy staff_write on public.staff for all to authenticated using (public.my_role() = 'pastor') with check (public.my_role() = 'pastor');

drop policy if exists visitors_read on public.visitors;
create policy visitors_read on public.visitors for select to authenticated
  using (public.my_role() in ('pastor', 'welcome') or (public.my_role() = 'leader' and assigned_to = public.my_group()));
drop policy if exists visitors_add on public.visitors;
create policy visitors_add on public.visitors for insert to authenticated with check (public.my_role() is not null);
drop policy if exists visitors_edit on public.visitors;
create policy visitors_edit on public.visitors for update to authenticated
  using (public.my_role() = 'pastor' or (public.my_role() = 'leader' and assigned_to = public.my_group()))
  with check (public.my_role() = 'pastor' or (public.my_role() = 'leader' and assigned_to = public.my_group()));
drop policy if exists visitors_remove on public.visitors;
create policy visitors_remove on public.visitors for delete to authenticated using (public.my_role() = 'pastor');

drop policy if exists notes_read on public.visitor_notes;
create policy notes_read on public.visitor_notes for select to authenticated
  using (exists (select 1 from public.visitors v where v.id = visitor_id));
drop policy if exists notes_add on public.visitor_notes;
create policy notes_add on public.visitor_notes for insert to authenticated
  with check (public.my_role() is not null and exists (select 1 from public.visitors v where v.id = visitor_id));
drop policy if exists notes_remove on public.visitor_notes;
create policy notes_remove on public.visitor_notes for delete to authenticated using (public.my_role() = 'pastor');

drop policy if exists members_all on public.members;
create policy members_all on public.members for all to authenticated
  using (public.my_role() = 'pastor' or (public.my_role() = 'leader' and group_id = public.my_group()))
  with check (public.my_role() = 'pastor' or (public.my_role() = 'leader' and group_id = public.my_group()));

drop policy if exists attendance_all on public.attendance;
create policy attendance_all on public.attendance for all to authenticated
  using (exists (select 1 from public.members m where m.id = member_id))
  with check (exists (select 1 from public.members m where m.id = member_id));

drop policy if exists prayers_read on public.prayers;
create policy prayers_read on public.prayers for select to authenticated
  using (public.my_role() = 'pastor' or (public.my_role() = 'leader' and assigned_to = public.my_group()));
drop policy if exists prayers_add on public.prayers;
create policy prayers_add on public.prayers for insert to authenticated with check (public.my_role() is not null);
drop policy if exists prayers_edit on public.prayers;
create policy prayers_edit on public.prayers for update to authenticated
  using (public.my_role() = 'pastor' or (public.my_role() = 'leader' and assigned_to = public.my_group()))
  with check (public.my_role() = 'pastor' or (public.my_role() = 'leader' and assigned_to = public.my_group()));
drop policy if exists prayers_remove on public.prayers;
create policy prayers_remove on public.prayers for delete to authenticated using (public.my_role() = 'pastor');

-- ---------- public forms (QR code page) ----------
-- A small brake on floods of fake submissions: at most 60 forms in any 10 minutes, church-wide.
create or replace function public.form_brake() returns void language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.visitors where source = 'form' and created_at > now() - interval '10 minutes')
   + (select count(*) from public.prayers  where source = 'form' and created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'Too many forms right now. Please try again in a few minutes.';
  end if;
end $$;

create or replace function public.submit_welcome(
  p_name text, p_phone text, p_reason text, p_invited_by text, p_group text, p_prayer text, p_consent boolean
) returns void language plpgsql security definer set search_path = public as $$
declare vid uuid;
begin
  if not coalesce(p_consent, false) then raise exception 'Please tick the consent box'; end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 80 then raise exception 'Please enter your name'; end if;
  if char_length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) not between 9 and 15 then raise exception 'Please enter a WhatsApp number'; end if;
  perform public.form_brake();
  perform set_config('care.form', '1', true);
  insert into public.visitors (name, phone, reason, invited_by, group_interest, consent_at, source)
  values (btrim(p_name), left(btrim(p_phone), 20), left(btrim(coalesce(p_reason, '')), 60), left(btrim(coalesce(p_invited_by, '')), 80),
          (select id from public.groups where id = p_group), now(), 'form')
  returning id into vid;
  if char_length(btrim(coalesce(p_prayer, ''))) > 0 then
    insert into public.prayers (name, phone, body, visitor_id)
    values (btrim(p_name), left(btrim(p_phone), 20), left(btrim(p_prayer), 1000), vid);
  end if;
end $$;

create or replace function public.submit_prayer(p_name text, p_phone text, p_body text, p_consent boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not coalesce(p_consent, false) then raise exception 'Please tick the consent box'; end if;
  if char_length(btrim(coalesce(p_body, ''))) not between 1 and 1000 then raise exception 'Please write your prayer request'; end if;
  perform public.form_brake();
  perform set_config('care.form', '1', true);
  insert into public.prayers (name, phone, body, source)
  values (left(btrim(coalesce(p_name, '')), 80), left(btrim(coalesce(p_phone, '')), 20), btrim(p_body), 'form');
end $$;

revoke all on function public.submit_welcome(text, text, text, text, text, text, boolean) from public;
revoke all on function public.submit_prayer(text, text, text, boolean) from public;
grant execute on function public.submit_welcome(text, text, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.submit_prayer(text, text, text, boolean) to anon, authenticated;
revoke all on function public.form_brake() from public, anon, authenticated;

-- Records that the welcome message was sent (the welcome team can't edit visitors otherwise).
create or replace function public.mark_welcomed(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare r text := public.my_role();
begin
  if r is null then raise exception 'You don''t have access to do that'; end if;
  perform set_config('care.welcoming', '1', true);
  update public.visitors set welcomed_at = coalesce(welcomed_at, now()),
         welcomed_by = case when welcomed_at is null then coalesce(public.my_name(), '') else welcomed_by end
   where id = p_id and (r in ('pastor', 'welcome') or (r = 'leader' and assigned_to = public.my_group()));
  if not found then raise exception 'You don''t have access to do that'; end if;
end $$;
revoke all on function public.mark_welcomed(uuid) from public, anon;
grant execute on function public.mark_welcomed(uuid) to authenticated;

-- ---------- live updates ----------
do $$
declare t text;
begin
  foreach t in array array['visitors', 'visitor_notes', 'members', 'prayers', 'staff'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------- groups ----------
insert into public.groups (id, name, tag, leader_name, sort) values
  ('g1', 'Archbishop Nicholas Duncan-Williams', '', 'Prophet Richmond Taku', 1),
  ('g2', 'David Oyedepo', '', 'Elijah Antwi',          2),
  ('g3', 'Prophet Miracle Damoah', '', 'Prophet Elijah',        3),
  ('g4', 'Dr. Mike Murdock', '', 'Mr. Owusu Erga',        4),
  ('wog',  'Women of Glory',  'Women''s Fellowship',                 'Madam Millicent',       5),
  ('sg',   'Stoic Gentleman', 'Men''s Fellowship',                   'Mr. Owusu Geoffery',    6),
  ('prov', 'The Providence',  'Church Choir',                        'Caljay Music',          7)
on conflict (id) do update set name = excluded.name, tag = excluded.tag;
