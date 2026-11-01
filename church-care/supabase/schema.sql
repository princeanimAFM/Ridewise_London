-- Church Care Tracker: database, access rules and public forms.
-- Run in a NEW Supabase project (SQL editor, or the management API). Safe to run again.
--
-- Who sees what (enforced here, not in the app):
--   pastor   everything; sets up groups, leaders, the PA and the welcome team
--   pa       only the areas the pastor ticks: visitors, groups, group prayer requests,
--            prayer requests sent to the pastor
--   welcome  adds visitors and sends welcome messages; no members or prayer requests
--   leader   only the visitors, members and prayer requests of their own group
--   visitors (no login) can only send the welcome form and prayer requests, never read anything
-- People sign in with a code sent to WhatsApp or email; the team list says who may.

-- ---------- tables ----------
create table if not exists public.groups (
  id          text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  tag         text not null default '' check (char_length(tag) <= 80),
  leader_name text not null default '' check (char_length(leader_name) <= 80),
  sort        int  not null default 0
);

create table if not exists public.staff (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 1 and 80),
  email      text unique check (email is null or (email = lower(email) and email like '%_@_%')),
  phone      text unique check (phone is null or phone ~ '^[0-9]{10,15}$'),
  role       text not null check (role in ('pastor', 'pa', 'welcome', 'leader')),
  group_id   text references public.groups(id),
  areas      text[] not null default '{}',
  created_at timestamptz not null default now(),
  check (email is not null or phone is not null),
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
  welcomed_at    timestamptz,
  welcomed_by    text not null default '',
  created_at     timestamptz not null default now()
);
create index if not exists visitors_assigned on public.visitors (assigned_to);

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
-- Set when a member joins the app through their group's invite link.
alter table public.members add column if not exists login_phone   text;
alter table public.members add column if not exists login_email   text;
alter table public.members add column if not exists joined_app_at timestamptz;
alter table public.members add column if not exists last_app_at   timestamptz;
create unique index if not exists members_login_phone on public.members (group_id, login_phone) where login_phone is not null;
create unique index if not exists members_login_email on public.members (group_id, login_email) where login_email is not null;

-- Areas a PA can be given (kept as its own check so it can grow).
alter table public.staff drop constraint if exists staff_areas_check;
alter table public.staff drop constraint if exists staff_areas_allowed;
alter table public.staff add constraint staff_areas_allowed check (areas <@ array['visitors', 'groups', 'prayer_groups', 'prayer_pastor', 'programs']);

-- Special services and programs (conventions, Holy Ghost nights, thanksgiving…). Anyone may read them:
-- they show on the welcome page and in the app. The pastor (or a PA with "programs") manages them.
create table if not exists public.programs (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (char_length(btrim(title)) between 1 and 120),
  starts_on  date not null,
  ends_on    date not null,
  time_text  text not null default '' check (char_length(time_text) <= 60),
  place      text not null default '' check (char_length(place) <= 120),
  details    text not null default '' check (char_length(details) <= 1000),
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on and ends_on <= starts_on + 31)
);

-- One row per person per service attended. kind: sunday (Sunday service), friday (Friday Miracle Service),
-- online (Sunday night online prayer), meeting (group meeting). by_self: the member marked it themselves.
create table if not exists public.attendance (
  member_id uuid not null references public.members(id) on delete cascade,
  seen_on   date not null default current_date,
  kind      text not null default 'sunday',
  by_self   boolean not null default false,
  marked_by text not null default ''
);
create index if not exists attendance_day on public.attendance (seen_on);
-- kinds: sunday, tuesday (Time with the Rabbi), friday (Miracle Service), online (Sunday night), meeting (group), special (a program)
alter table public.attendance add column if not exists program_id uuid references public.programs(id) on delete cascade;
alter table public.attendance drop constraint if exists attendance_kind_check;
alter table public.attendance drop constraint if exists attendance_kind_allowed;
alter table public.attendance add constraint attendance_kind_allowed check (kind in ('sunday', 'tuesday', 'friday', 'online', 'meeting', 'special') and ((kind = 'special') = (program_id is not null)));
-- Special programs are told apart by program, so the key is per program too.
alter table public.attendance drop constraint if exists attendance_pkey;
alter table public.attendance add column if not exists id bigint generated always as identity;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'attendance_id_pkey') then
    alter table public.attendance add constraint attendance_id_pkey primary key (id);
  end if;
end $$;
drop index if exists public.attendance_one;
create unique index attendance_one on public.attendance (member_id, seen_on, kind, coalesce(program_id, '00000000-0000-0000-0000-000000000000'::uuid));

alter table public.staff add column if not exists joined_app_at timestamptz;
alter table public.staff add column if not exists last_app_at   timestamptz;

-- Invite links. 'leader': one person, one use, made by the pastor. 'member': the group's join link, shared freely.
create table if not exists public.invites (
  token      text primary key default replace(gen_random_uuid()::text, '-', ''),
  kind       text not null check (kind in ('leader', 'member')),
  group_id   text not null references public.groups(id) on delete cascade,
  created_by text not null default '',
  created_at timestamptz not null default now(),
  used_at    timestamptz,
  used_by    text,
  revoked    boolean not null default false
);

-- to_pastor: the person asked for only the pastor (and a PA he allows) to read it.
create table if not exists public.prayers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default '' check (char_length(name) <= 80),
  phone       text not null default '' check (char_length(phone) <= 20),
  body        text not null check (char_length(btrim(body)) between 1 and 1000),
  status      text not null default 'open' check (status in ('open', 'prayed')),
  to_pastor   boolean not null default false,
  assigned_to text references public.groups(id) on delete set null,
  visitor_id  uuid references public.visitors(id) on delete cascade,
  source      text not null default 'team' check (source in ('form', 'team')),
  created_at  timestamptz not null default now(),
  check (not (to_pastor and assigned_to is not null))
);
create index if not exists prayers_assigned on public.prayers (assigned_to);
alter table public.prayers add column if not exists member_id uuid references public.members(id) on delete set null;

-- ---------- who is signed in ----------
-- Phone numbers are kept as international digits (233241234567), as the sign-in system gives them.
create or replace function public.intl_phone(p text) returns text language sql immutable as $$
  select case
    when d = '' then null
    when d like '00%' then substr(d, 3)
    when d like '0%' then '233' || substr(d, 2)
    when length(d) <= 9 then '233' || d
    else d end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) x
$$;

create or replace function public.me() returns public.staff language sql stable security definer set search_path = public as $$
  select s.* from public.staff s
  where (s.email is not null and s.email = lower(nullif(auth.jwt() ->> 'email', '')))
     or (s.phone is not null and s.phone = public.intl_phone(nullif(auth.jwt() ->> 'phone', '')))
  order by s.created_at limit 1
$$;
create or replace function public.my_id()    returns uuid language sql stable as $$ select (public.me()).id $$;
create or replace function public.my_role()  returns text language sql stable as $$ select (public.me()).role $$;
create or replace function public.my_name()  returns text language sql stable as $$ select (public.me()).name $$;
create or replace function public.my_group() returns text language sql stable as $$ select case when (public.me()).role = 'leader' then (public.me()).group_id end $$;
-- The pastor has every area; a PA has the ones the pastor ticked.
create or replace function public.has_area(a text) returns boolean language sql stable as $$
  select coalesce((public.me()).role = 'pastor' or ((public.me()).role = 'pa' and a = any((public.me()).areas)), false)
$$;

-- True only inside the public form functions below.
create or replace function public.from_form() returns boolean language sql stable
as $$ select coalesce(current_setting('care.form', true), '') = '1' $$;

-- ---------- rules the app can't break ----------
create or replace function public.staff_rules() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.name := btrim(new.name);
  new.email := nullif(lower(btrim(coalesce(new.email, ''))), '');
  new.phone := public.intl_phone(new.phone);
  if new.role <> 'leader' then new.group_id := null; end if;
  if new.role <> 'pa' then new.areas := '{}'; end if;
  if tg_op = 'UPDATE' then new.created_at := old.created_at; end if;
  return new;
end $$;
drop trigger if exists staff_rules on public.staff;
create trigger staff_rules before insert or update on public.staff for each row execute function public.staff_rules();

-- Each group shows the name of its current leader (the most recently added one).
create or replace function public.staff_leader_name() returns trigger language plpgsql security definer set search_path = public as $$
declare g text;
begin
  foreach g in array array[case when tg_op <> 'INSERT' then old.group_id end, case when tg_op <> 'DELETE' then new.group_id end] loop
    if g is not null then
      update public.groups set leader_name = coalesce(
        (select name from public.staff where role = 'leader' and group_id = g order by created_at desc limit 1), '')
      where id = g;
    end if;
  end loop;
  return null;
end $$;
drop trigger if exists staff_leader_name on public.staff;
create trigger staff_leader_name after insert or update or delete on public.staff for each row execute function public.staff_leader_name();

-- The team list always keeps at least one pastor.
create or replace function public.keep_a_pastor() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'pastor' and (tg_op = 'DELETE' or new.role <> 'pastor')
     and not exists (select 1 from public.staff where role = 'pastor' and id <> old.id) then
    raise exception 'The team needs at least one pastor';
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists keep_a_pastor on public.staff;
create trigger keep_a_pastor before update or delete on public.staff for each row execute function public.keep_a_pastor();

create or replace function public.visitor_rules() returns trigger language plpgsql security definer set search_path = public as $$
declare r text := public.my_role(); can_assign boolean := public.has_area('visitors');
begin
  if tg_op = 'INSERT' then
    new.source := case when public.from_form() then 'form' else 'team' end;
    new.created_at := now();
    new.status := 'new';
    new.reached_at := null;
    new.welcomed_at := null; new.welcomed_by := '';
    if new.source = 'form' or r = 'welcome' or (r = 'pa' and not can_assign) then
      new.assigned_to := null;
    elsif r = 'leader' then
      new.assigned_to := public.my_group();
    end if;
    new.due := current_date + 2;
    new.seen_by_leader := (new.assigned_to is null or r = 'leader');
    new.name := btrim(new.name);
    return new;
  end if;
  if new.assigned_to is distinct from old.assigned_to then
    if not can_assign then raise exception 'Only the pastor can assign visitors to a group'; end if;
    if new.assigned_to is not null and new.status = 'new' then
      new.due := current_date + 2;   -- the leader has two days from assignment
      new.seen_by_leader := false;   -- shows "New for you"
    end if;
  end if;
  if not can_assign then new.due := old.due; end if;
  if new.status <> 'new' and old.status = 'new' and new.reached_at is null then new.reached_at := current_date; end if;
  if current_setting('care.welcoming', true) is distinct from '1' then
    new.welcomed_at := old.welcomed_at; new.welcomed_by := old.welcomed_by;
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
    else
      new.source := 'team';
      new.visitor_id := null;
      if current_setting('care.member', true) is distinct from '1' then new.member_id := null; end if;
      if r = 'leader' and not new.to_pastor then new.assigned_to := public.my_group(); end if;
      if r = 'welcome' then new.assigned_to := null; end if;
    end if;
    if new.to_pastor then new.assigned_to := null; end if;
    new.status := 'open';
    new.created_at := now();
    return new;
  end if;
  if new.to_pastor is distinct from old.to_pastor then raise exception 'Who a prayer request is for cannot be changed'; end if;
  if new.assigned_to is distinct from old.assigned_to then
    if new.to_pastor then raise exception 'This prayer request is for the pastor only'; end if;
    if not public.has_area('prayer_groups') and current_setting('care.follow', true) is distinct from '1' then raise exception 'Only the pastor can pass a prayer request to a group'; end if;
  end if;
  if new.body is distinct from old.body or new.source is distinct from old.source or new.created_at is distinct from old.created_at
     or new.visitor_id is distinct from old.visitor_id or new.member_id is distinct from old.member_id then
    raise exception 'A prayer request cannot be rewritten';
  end if;
  return new;
end $$;
drop trigger if exists prayer_rules on public.prayers;
create trigger prayer_rules before insert or update on public.prayers for each row execute function public.prayer_rules();

-- A visitor's prayer requests for "my leader" go to the same leader as the visitor.
create or replace function public.visitor_prayers_follow() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.assigned_to is distinct from old.assigned_to then
    perform set_config('care.follow', '1', true);
    update public.prayers set assigned_to = new.assigned_to where visitor_id = new.id and not to_pastor;
    perform set_config('care.follow', '', true);
  end if;
  return null;
end $$;
drop trigger if exists visitor_prayers_follow on public.visitors;
create trigger visitor_prayers_follow after update of assigned_to on public.visitors for each row execute function public.visitor_prayers_follow();

create or replace function public.attendance_rules() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('care.member', true) is distinct from '1' then
    new.by_self := false;
    new.marked_by := coalesce(public.my_name(), '');
  end if;
  if new.seen_on > current_date then raise exception 'You can''t mark a service that hasn''t happened yet'; end if;
  if new.kind = 'special' and not exists (select 1 from public.programs where id = new.program_id and new.seen_on between starts_on and ends_on) then
    raise exception 'That date is not part of the program';
  end if;
  return new;
end $$;
drop trigger if exists attendance_rules on public.attendance;
create trigger attendance_rules before insert on public.attendance for each row execute function public.attendance_rules();

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
alter table public.invites       enable row level security;
alter table public.programs      enable row level security;   -- no policies: only the functions below use it

-- Nobody without a login reads or writes tables directly; the public forms use the functions below.
revoke all on public.invites from anon, authenticated;
revoke all on public.groups, public.staff, public.visitors, public.visitor_notes, public.members, public.attendance, public.prayers from anon;
grant select on public.groups to anon;
revoke all on public.programs from anon;
grant select on public.programs to anon;
drop policy if exists programs_read on public.programs;
create policy programs_read on public.programs for select to anon, authenticated using (true);
drop policy if exists programs_write on public.programs;
create policy programs_write on public.programs for all to authenticated using (public.has_area('programs')) with check (public.has_area('programs'));

drop policy if exists groups_read on public.groups;
create policy groups_read on public.groups for select to anon, authenticated using (true);
drop policy if exists groups_write on public.groups;
create policy groups_write on public.groups for all to authenticated using (public.my_role() = 'pastor') with check (public.my_role() = 'pastor');

drop policy if exists staff_read on public.staff;
create policy staff_read on public.staff for select to authenticated using (public.my_role() = 'pastor' or id = public.my_id());
drop policy if exists staff_write on public.staff;
create policy staff_write on public.staff for all to authenticated using (public.my_role() = 'pastor') with check (public.my_role() = 'pastor');

drop policy if exists visitors_read on public.visitors;
create policy visitors_read on public.visitors for select to authenticated
  using (public.has_area('visitors') or public.my_role() = 'welcome' or (public.my_role() = 'leader' and assigned_to = public.my_group()));
drop policy if exists visitors_add on public.visitors;
create policy visitors_add on public.visitors for insert to authenticated
  with check (public.has_area('visitors') or public.my_role() in ('welcome', 'leader'));
drop policy if exists visitors_edit on public.visitors;
create policy visitors_edit on public.visitors for update to authenticated
  using (public.has_area('visitors') or (public.my_role() = 'leader' and assigned_to = public.my_group()))
  with check (public.has_area('visitors') or (public.my_role() = 'leader' and assigned_to = public.my_group()));
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
  using (public.has_area('groups') or (public.my_role() = 'leader' and group_id = public.my_group()))
  with check (public.has_area('groups') or (public.my_role() = 'leader' and group_id = public.my_group()));

drop policy if exists attendance_all on public.attendance;
create policy attendance_all on public.attendance for all to authenticated
  using (exists (select 1 from public.members m where m.id = member_id))
  with check (exists (select 1 from public.members m where m.id = member_id));

create or replace function public.can_see_prayer(to_pastor boolean, assigned_to text) returns boolean language sql stable as $$
  select case when to_pastor then public.has_area('prayer_pastor')
              else public.has_area('prayer_groups') or (public.my_role() = 'leader' and assigned_to = public.my_group()) end
$$;
drop policy if exists prayers_read on public.prayers;
create policy prayers_read on public.prayers for select to authenticated using (public.can_see_prayer(to_pastor, assigned_to));
drop policy if exists prayers_add on public.prayers;
create policy prayers_add on public.prayers for insert to authenticated with check (public.my_role() is not null);
drop policy if exists prayers_edit on public.prayers;
create policy prayers_edit on public.prayers for update to authenticated
  using (public.can_see_prayer(to_pastor, assigned_to)) with check (public.can_see_prayer(to_pastor, assigned_to));
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

drop function if exists public.submit_welcome(text, text, text, text, text, text, boolean);
drop function if exists public.submit_prayer(text, text, text, boolean);

-- p_prayer_to: 'pastor' (pastor only) or 'leader' (the group leader they are given, and the pastor)
create or replace function public.submit_welcome(
  p_name text, p_phone text, p_reason text, p_invited_by text, p_group text, p_prayer text, p_prayer_to text, p_consent boolean
) returns void language plpgsql security definer set search_path = public as $$
declare vid uuid;
begin
  if not coalesce(p_consent, false) then raise exception 'Please tick the consent box'; end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 80 then raise exception 'Please enter your name'; end if;
  if char_length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) not between 9 and 15 then raise exception 'Please enter a WhatsApp number'; end if;
  perform public.form_brake();
  perform set_config('care.form', '1', true);
  insert into public.visitors (name, phone, reason, invited_by, group_interest, consent_at)
  values (btrim(p_name), left(btrim(p_phone), 20), left(btrim(coalesce(p_reason, '')), 60), left(btrim(coalesce(p_invited_by, '')), 80),
          (select id from public.groups where id = p_group), now())
  returning id into vid;
  if char_length(btrim(coalesce(p_prayer, ''))) > 0 then
    insert into public.prayers (name, phone, body, visitor_id, to_pastor)
    values (btrim(p_name), left(btrim(p_phone), 20), left(btrim(p_prayer), 1000), vid, coalesce(p_prayer_to, 'pastor') = 'pastor');
  end if;
end $$;

-- p_to: 'pastor', or a group id to send it to that group's leader
create or replace function public.submit_prayer(p_name text, p_phone text, p_body text, p_to text, p_consent boolean)
returns void language plpgsql security definer set search_path = public as $$
declare g text := (select id from public.groups where id = p_to);
begin
  if not coalesce(p_consent, false) then raise exception 'Please tick the consent box'; end if;
  if char_length(btrim(coalesce(p_body, ''))) not between 1 and 1000 then raise exception 'Please write your prayer request'; end if;
  perform public.form_brake();
  perform set_config('care.form', '1', true);
  insert into public.prayers (name, phone, body, to_pastor, assigned_to)
  values (left(btrim(coalesce(p_name, '')), 80), left(btrim(coalesce(p_phone, '')), 20), btrim(p_body), g is null, g);
end $$;

revoke all on function public.submit_welcome(text, text, text, text, text, text, text, boolean) from public;
revoke all on function public.submit_prayer(text, text, text, text, boolean) from public;
grant execute on function public.submit_welcome(text, text, text, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.submit_prayer(text, text, text, text, boolean) to anon, authenticated;
revoke all on function public.form_brake() from public, anon, authenticated;

-- Records that the welcome message was sent.
create or replace function public.mark_welcomed(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare r text := public.my_role();
begin
  if r is null then raise exception 'You don''t have access to do that'; end if;
  perform set_config('care.welcoming', '1', true);
  update public.visitors set welcomed_at = coalesce(welcomed_at, now()),
         welcomed_by = case when welcomed_at is null then coalesce(public.my_name(), '') else welcomed_by end
   where id = p_id and (public.has_area('visitors') or r = 'welcome' or (r = 'leader' and assigned_to = public.my_group()));
  if not found then raise exception 'You don''t have access to do that'; end if;
  perform set_config('care.welcoming', '', true);
end $$;
revoke all on function public.mark_welcomed(uuid) from public, anon;
grant execute on function public.mark_welcomed(uuid) to authenticated;

-- ---------- the app for everyone: who am I, invite links, members ----------
create or replace function public.my_login_phone() returns text language sql stable as $$ select public.intl_phone(nullif(auth.jwt() ->> 'phone', '')) $$;
create or replace function public.my_login_email() returns text language sql stable as $$ select lower(nullif(auth.jwt() ->> 'email', '')) $$;

-- Group memberships of the signed-in person (a person can be in more than one group).
create or replace function public.my_member_groups() returns setof text language sql stable security definer set search_path = public as $$
  select group_id from public.members
  where (login_phone is not null and login_phone = public.my_login_phone()) or (login_email is not null and login_email = public.my_login_email())
$$;

-- Called when the app opens: says who you are and records that you use the app.
create or replace function public.whoami() returns jsonb language plpgsql security definer set search_path = public as $$
declare st public.staff := public.me(); ph text := public.my_login_phone(); em text := public.my_login_email(); gs jsonb;
begin
  if ph is null and em is null then return null; end if;
  if st.id is not null then
    update public.staff set joined_app_at = coalesce(joined_app_at, now()), last_app_at = now() where id = st.id;
    return jsonb_build_object('kind', 'staff', 'id', st.id, 'name', st.name, 'role', st.role, 'group_id', st.group_id, 'areas', to_jsonb(st.areas), 'email', st.email, 'phone', st.phone);
  end if;
  update public.members set last_app_at = now()
   where (login_phone is not null and login_phone = ph) or (login_email is not null and login_email = em);
  select jsonb_agg(jsonb_build_object('member_id', m.id, 'group_id', m.group_id) order by m.joined_app_at), min(m.name)
    into gs from public.members m
   where (m.login_phone is not null and m.login_phone = ph) or (m.login_email is not null and m.login_email = em);
  if gs is null then return null; end if;
  return jsonb_build_object('kind', 'member', 'role', 'member', 'name',
    (select name from public.members where (login_phone = ph or login_email = em) order by joined_app_at limit 1), 'groups', gs);
end $$;

-- Make (or fetch) an invite link token.
create or replace function public.create_invite(p_group text, p_kind text) returns text language plpgsql security definer set search_path = public as $$
declare r text := public.my_role(); t text;
begin
  if not exists (select 1 from public.groups where id = p_group) then raise exception 'That group does not exist'; end if;
  if p_kind = 'leader' then
    if r is distinct from 'pastor' then raise exception 'Only the pastor can invite a group leader'; end if;
    update public.invites set revoked = true where group_id = p_group and kind = 'leader' and used_at is null and not revoked;
    insert into public.invites (kind, group_id, created_by) values ('leader', p_group, coalesce(public.my_name(), '')) returning token into t;
    return t;
  elsif p_kind = 'member' then
    if not coalesce(public.has_area('groups') or (r = 'leader' and public.my_group() = p_group), false) then raise exception 'You can only invite people to your own group'; end if;
    select token into t from public.invites where group_id = p_group and kind = 'member' and not revoked order by created_at desc limit 1;
    if t is null then insert into public.invites (kind, group_id, created_by) values ('member', p_group, coalesce(public.my_name(), '')) returning token into t; end if;
    return t;
  end if;
  raise exception 'Unknown invite type';
end $$;

-- A new join link for the group (the old one stops working).
create or replace function public.reset_member_invite(p_group text) returns text language plpgsql security definer set search_path = public as $$
begin
  if not coalesce(public.has_area('groups') or (public.my_role() = 'leader' and public.my_group() = p_group), false) then raise exception 'You can only change your own group''s link'; end if;
  update public.invites set revoked = true where group_id = p_group and kind = 'member';
  return public.create_invite(p_group, 'member');
end $$;

-- What an invite link is for, shown before signing in. Says nothing private.
create or replace function public.invite_info(p_token text) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('kind', i.kind, 'group', g.name, 'tag', g.tag, 'leader', g.leader_name,
    'valid', not i.revoked and (i.kind = 'member' or i.used_at is null))
  from public.invites i join public.groups g on g.id = i.group_id where i.token = p_token
$$;

-- Accept an invite after signing in with a WhatsApp or email code.
create or replace function public.accept_invite(p_token text, p_name text) returns jsonb language plpgsql security definer set search_path = public as $$
declare i public.invites; ph text := public.my_login_phone(); em text := public.my_login_email(); st public.staff := public.me(); n text := btrim(coalesce(p_name, '')); mid uuid;
begin
  if ph is null and em is null then raise exception 'Please sign in first'; end if;
  select * into i from public.invites where token = p_token for update;
  if i.token is null or i.revoked then raise exception 'This invite link is no longer valid. Ask for a new one.'; end if;
  if i.kind = 'leader' then
    if i.used_at is not null then raise exception 'This invite link has already been used. Ask the pastor for a new one.'; end if;
    if st.id is not null and st.role in ('pastor', 'pa') then raise exception 'You are already on the team as %', st.role; end if;
    if st.id is not null then
      update public.staff set role = 'leader', group_id = i.group_id, name = coalesce(nullif(n, ''), name) where id = st.id;
    else
      if char_length(n) not between 1 and 80 then raise exception 'Please enter your name'; end if;
      insert into public.staff (name, phone, email, role, group_id, joined_app_at) values (n, ph, em, 'leader', i.group_id, now());
    end if;
    update public.invites set used_at = now(), used_by = coalesce(ph, em) where token = i.token;
    return jsonb_build_object('kind', 'leader', 'group_id', i.group_id);
  end if;
  -- member: link to an existing entry the leader made with the same number, or add them
  select id into mid from public.members where group_id = i.group_id
    and ((login_phone is not null and login_phone = ph) or (login_email is not null and login_email = em));
  if mid is null and ph is not null then
    select id into mid from public.members where group_id = i.group_id and login_phone is null and login_email is null
      and public.intl_phone(phone) = ph order by created_at limit 1;
  end if;
  if mid is not null then
    update public.members set login_phone = coalesce(login_phone, ph), login_email = coalesce(login_email, em), joined_app_at = coalesce(joined_app_at, now()) where id = mid;
  else
    if char_length(n) not between 1 and 80 then raise exception 'Please enter your name'; end if;
    insert into public.members (name, phone, group_id, login_phone, login_email, joined_app_at)
    values (n, coalesce(case when ph is not null then '+' || ph end, ''), i.group_id, ph, em, now()) returning id into mid;
  end if;
  return jsonb_build_object('kind', 'member', 'group_id', i.group_id);
end $$;

-- A member's view of their group: names only (no phone numbers), plus their leader's WhatsApp.
create or replace function public.my_group_view(p_group text) returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not coalesce(p_group in (select public.my_member_groups()) or public.my_group() = p_group or public.has_area('groups'), false) then
    raise exception 'You can only see your own group';
  end if;
  return jsonb_build_object(
    'group', (select to_jsonb(g) from public.groups g where g.id = p_group),
    'leader_phone', (select phone from public.staff where role = 'leader' and group_id = p_group order by created_at desc limit 1),
    'people', coalesce((select jsonb_agg(jsonb_build_object('name', m.name, 'on_app', m.joined_app_at is not null) order by m.name)
                        from public.members m where m.group_id = p_group), '[]'::jsonb));
end $$;

-- Members send prayer requests to their leader or the pastor, and see their own.
create or replace function public.member_prayer(p_body text, p_to text, p_group text) returns void language plpgsql security definer set search_path = public as $$
declare m public.members;
begin
  select * into m from public.members where group_id = p_group and id in (
    select id from public.members where (login_phone is not null and login_phone = public.my_login_phone()) or (login_email is not null and login_email = public.my_login_email()));
  if m.id is null then raise exception 'You can only send prayer requests from your own group'; end if;
  if char_length(btrim(coalesce(p_body, ''))) not between 1 and 1000 then raise exception 'Please write your prayer request'; end if;
  perform set_config('care.member', '1', true);
  insert into public.prayers (name, phone, body, to_pastor, assigned_to, member_id)
  values (m.name, m.phone, btrim(p_body), p_to = 'pastor', case when p_to = 'pastor' then null else p_group end, m.id);
  perform set_config('care.member', '', true);
end $$;

create or replace function public.my_prayers() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('body', p.body, 'status', p.status, 'to_pastor', p.to_pastor, 'created_at', p.created_at) order by p.created_at desc), '[]'::jsonb)
  from public.prayers p join public.members m on m.id = p.member_id
  where (m.login_phone is not null and m.login_phone = public.my_login_phone()) or (m.login_email is not null and m.login_email = public.my_login_email())
$$;

-- Members say they were at a service (today or the two days before). Sunday and online services are on Sundays,
-- the Miracle Service on Fridays; group meetings any day.
drop function if exists public.member_checkin(text, text, date, boolean);
create or replace function public.member_checkin(p_group text, p_kind text, p_day date, p_here boolean, p_program uuid default null) returns void language plpgsql security definer set search_path = public as $$
declare mid uuid;
begin
  select id into mid from public.members where group_id = p_group and id in (
    select id from public.members where (login_phone is not null and login_phone = public.my_login_phone()) or (login_email is not null and login_email = public.my_login_email()));
  if mid is null then raise exception 'You can only mark attendance in your own group'; end if;
  if p_day is null or p_day > current_date or p_day < current_date - 2 then raise exception 'You can mark attendance for today or the last two days'; end if;
  if p_kind in ('sunday', 'online') and extract(dow from p_day) <> 0 then raise exception 'That service is on Sundays'; end if;
  if p_kind = 'friday' and extract(dow from p_day) <> 5 then raise exception 'The Miracle Service is on Fridays'; end if;
  if p_kind = 'tuesday' and extract(dow from p_day) <> 2 then raise exception 'Time with the Rabbi is on Tuesdays'; end if;
  if p_kind <> 'special' then p_program := null; end if;
  if p_here then
    perform set_config('care.member', '1', true);
    insert into public.attendance (member_id, seen_on, kind, program_id, by_self, marked_by)
    values (mid, p_day, p_kind, p_program, true, (select name from public.members where id = mid)) on conflict do nothing;
    perform set_config('care.member', '', true);
  else
    delete from public.attendance where member_id = mid and seen_on = p_day and kind = p_kind
      and program_id is not distinct from p_program and by_self;
  end if;
end $$;

create or replace function public.my_attendance(p_group text) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('seen_on', a.seen_on, 'kind', a.kind, 'program_id', a.program_id, 'by_self', a.by_self) order by a.seen_on desc), '[]'::jsonb)
  from public.attendance a join public.members m on m.id = a.member_id
  where m.group_id = p_group and a.seen_on > current_date - 120
    and ((m.login_phone is not null and m.login_phone = public.my_login_phone()) or (m.login_email is not null and m.login_email = public.my_login_email()))
$$;

do $$ begin
  revoke all on function public.member_checkin(text, text, date, boolean, uuid), public.my_attendance(text) from public, anon;
  grant execute on function public.member_checkin(text, text, date, boolean, uuid), public.my_attendance(text) to authenticated;
  revoke all on function public.whoami(), public.create_invite(text, text), public.reset_member_invite(text), public.accept_invite(text, text),
    public.my_group_view(text), public.member_prayer(text, text, text), public.my_prayers(), public.my_member_groups() from public, anon;
  grant execute on function public.whoami(), public.create_invite(text, text), public.reset_member_invite(text), public.accept_invite(text, text),
    public.my_group_view(text), public.member_prayer(text, text, text), public.my_prayers() to authenticated;
  revoke all on function public.invite_info(text) from public;
  grant execute on function public.invite_info(text) to anon, authenticated;
end $$;

-- ---------- live updates ----------
do $$
declare t text;
begin
  foreach t in array array['visitors', 'visitor_notes', 'members', 'prayers', 'staff', 'groups', 'attendance', 'programs'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------- groups (the pastor can rename them and add more in the app) ----------
insert into public.groups (id, name, tag, leader_name, sort) values
  ('g1',   'Archbishop Nicholas Duncan-Williams', '',                    'Prophet Richmond Taku', 1),
  ('g2',   'Bishop David Oyedepo',                '',                    'Elijah Antwi',          2),
  ('g3',   'Prophet Miracle Damoah Godfred',      '',                    'Prophet Elijah',        3),
  ('g4',   'Dr. Mike Murdock',                    '',                    'Mr. Owusu Erga',        4),
  ('wog',  'Women of Glory',                      'Women''s Fellowship', 'Madam Millicent',       5),
  ('sg',   'Stoic Gentleman',                     'Men''s Fellowship',   'Mr. Owusu Geoffery',    6),
  ('prov', 'The Providence',                      'Church Choir',        'Caljay Music',          7),
  ('dia',  'The AFM Diaspora',                    '',                    'David Annor',           8)
on conflict (id) do nothing;
