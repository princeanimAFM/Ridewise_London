-- Security fixes of 20 November 2026 (see the review): leaders can no longer link people from other groups, invite links expire,

-- headcounts use a separate key, lock-screen notifications carry no names or reasons, push addresses can't be taken over.

-- Safe to run again. Generated from schema.sql.

begin;

create or replace function care.member_rules() returns trigger language plpgsql security definer set search_path = care, public as $$
begin
  -- A leader's own edits stay in their group (not updates the database makes for them, such as "last seen" in another group).
  -- A leader can never set or change a member's sign-in links: only accept_invite (when the person joins) sets them.
  -- Otherwise a leader could attach someone from another group by typing their email or phone number.
  if care.my_role() = 'leader' and pg_trigger_depth() = 1 and current_setting('care.invite', true) is distinct from '1' then
    new.group_id := care.my_group();
    if tg_op = 'INSERT' then
      new.login_phone := null; new.login_email := null; new.joined_app_at := null;
    else
      new.login_phone := old.login_phone; new.login_email := old.login_email; new.joined_app_at := old.joined_app_at;
    end if;
  end if;
  new.name := btrim(new.name);
  return new;
end $$;

create or replace function care.person_key(m care.members) returns text language sql immutable as $$
  select coalesce(m.login_phone, m.login_email, m.id::text)
$$;

create or replace function care.stats_key(m care.members) returns text language sql immutable as $$
  select coalesce(m.login_phone, m.login_email, care.intl_phone(m.phone), m.id::text)
$$;

create or replace function care.create_invite(p_group text, p_kind text) returns text language plpgsql security definer set search_path = care, public as $$
declare r text := care.my_role(); t text;
begin
  if not exists (select 1 from care.groups where id = p_group) then raise exception 'That group does not exist'; end if;
  if p_kind = 'leader' then
    if r is distinct from 'pastor' then raise exception 'Only the pastor can invite a group leader'; end if;
    update care.invites set revoked = true where group_id = p_group and kind = 'leader' and used_at is null and not revoked;
    insert into care.invites (kind, group_id, created_by) values ('leader', p_group, coalesce(care.my_name(), '')) returning token into t;
    return t;
  elsif p_kind = 'member' then
    if not coalesce(care.has_area('groups') or (r = 'leader' and care.my_group() = p_group), false) then raise exception 'You can only invite people to your own group'; end if;
    select token into t from care.invites where group_id = p_group and kind = 'member' and not revoked and created_at >= now() - interval '30 days' order by created_at desc limit 1;
    if t is null then insert into care.invites (kind, group_id, created_by) values ('member', p_group, coalesce(care.my_name(), '')) returning token into t; end if;
    return t;
  end if;
  raise exception 'Unknown invite type';
end $$;

create or replace function care.invite_info(p_token text) returns jsonb language sql stable security definer set search_path = care, public as $$
  select jsonb_build_object('kind', i.kind, 'group', g.name, 'tag', g.tag, 'leader', g.leader_name,
    'valid', not i.revoked and i.created_at >= now() - interval '30 days' and (i.kind = 'member' or i.used_at is null))
  from care.invites i join care.groups g on g.id = i.group_id where i.token = p_token
$$;

create or replace function care.accept_invite(p_token text, p_name text) returns jsonb language plpgsql security definer set search_path = care, public as $$
declare i care.invites; ph text := care.my_login_phone(); em text := care.my_login_email(); st care.staff := care.me(); n text := btrim(coalesce(p_name, '')); mid uuid;
begin
  if ph is null and em is null then raise exception 'Please sign in first'; end if;
  select * into i from care.invites where token = p_token for update;
  if i.token is null or i.revoked or i.created_at < now() - interval '30 days' then raise exception 'This invite link is no longer valid. Ask for a new one.'; end if;
  if i.kind = 'leader' then
    if i.used_at is not null then raise exception 'This invite link has already been used. Ask the pastor for a new one.'; end if;
    if st.id is not null and st.role in ('pastor', 'pa') then raise exception 'You are already on the team as %', st.role; end if;
    if st.id is not null then
      update care.staff set role = 'leader', group_id = i.group_id, name = coalesce(nullif(n, ''), name) where id = st.id;
    else
      if char_length(n) not between 1 and 80 then raise exception 'Please enter your name'; end if;
      insert into care.staff (name, phone, email, role, group_id, joined_app_at) values (n, ph, em, 'leader', i.group_id, now());
    end if;
    update care.invites set used_at = now(), used_by = coalesce(ph, em) where token = i.token;
    return jsonb_build_object('kind', 'leader', 'group_id', i.group_id);
  end if;
  -- member: link to an existing entry the leader made with the same number, or add them
  perform set_config('care.invite', '1', true);
  select id into mid from care.members where group_id = i.group_id
    and ((login_phone is not null and login_phone = ph) or (login_email is not null and login_email = em));
  if mid is null and ph is not null then
    select id into mid from care.members where group_id = i.group_id and login_phone is null and login_email is null
      and care.intl_phone(phone) = ph order by created_at limit 1;
  end if;
  if mid is not null then
    update care.members set login_phone = coalesce(login_phone, ph), login_email = coalesce(login_email, em), joined_app_at = coalesce(joined_app_at, now()) where id = mid;
  else
    if char_length(n) not between 1 and 80 then raise exception 'Please enter your name'; end if;
    insert into care.members (name, phone, group_id, login_phone, login_email, joined_app_at)
    values (n, coalesce(case when ph is not null then '+' || ph end, ''), i.group_id, ph, em, now()) returning id into mid;
  end if;
  perform set_config('care.invite', '', true);
  return jsonb_build_object('kind', 'member', 'group_id', i.group_id);
end $$;

create or replace function care.growth_data() returns jsonb language plpgsql stable security definer set search_path = care, public as $$
declare r text := care.my_role(); g text := care.my_group(); since date := (date_trunc('month', current_date) - interval '12 months')::date;
begin
  if r is null or r not in ('pastor', 'pa', 'leader') then raise exception 'You don''t have access to the growth figures'; end if;
  return jsonb_build_object(
    'scope', case when g is null then 'church' else 'group' end, 'group', g, 'today', current_date,
    -- the last item says who is the same person (a number, not anything that could be turned back into a phone number)
    'members', coalesce((select jsonb_agg(jsonb_build_array(x.group_id, x.joined_at, x.on_app, x.last_seen, x.who))
                         from (select m.group_id, m.joined_at, m.joined_app_at is not null as on_app, m.last_seen, dense_rank() over (order by care.stats_key(m)) as who
                               from care.members m where g is null or m.group_id = g) x), '[]'::jsonb),
    'visitors', coalesce((select jsonb_agg(jsonb_build_array(v.assigned_to, v.created_at::date, v.status, v.due, v.reached_at))
                          from care.visitors v where g is null or v.assigned_to = g), '[]'::jsonb),
    'attendance', coalesce((select jsonb_agg(jsonb_build_array(x.group_id, x.seen_on, x.kind, x.n)) from (
                              select m.group_id, a.seen_on, a.kind, count(*) as n from care.attendance a join care.members m on m.id = a.member_id
                              where a.seen_on >= since and a.kind in ('sunday', 'tuesday', 'friday', 'online') and (g is null or m.group_id = g)
                              group by 1, 2, 3) x), '[]'::jsonb),
    -- the same, counting each person once however many groups they are in
    'people_attendance', coalesce((select jsonb_agg(jsonb_build_array(x.seen_on, x.kind, x.n)) from (
                              select a.seen_on, a.kind, count(distinct care.stats_key(m)) as n from care.attendance a join care.members m on m.id = a.member_id
                              where a.seen_on >= since and a.kind in ('sunday', 'tuesday', 'friday', 'online') and (g is null or m.group_id = g)
                              group by 1, 2) x), '[]'::jsonb),
    'prayers', coalesce((select jsonb_agg(jsonb_build_array(p.assigned_to, p.to_pastor, p.created_at::date, p.status))
                         from care.prayers p where p.created_at >= since and (g is null or (p.assigned_to = g and not p.to_pastor))), '[]'::jsonb));
end $$;

create or replace function care.service_push(p_kind text, p_day date default current_date)
returns table (endpoint text, p256dh text, auth text, title text, body text, url text)
language plpgsql stable security definer set search_path = care, public as $$
declare pr record; s record; lbl text; msg text; pres int; total int; missed text[]; unmarked text[]; noleader text[]; offapp int; newv int; todo int;
begin
  for pr in
    select null::uuid as id, p_kind as kind,
           case p_kind when 'sunday' then 'Sunday service' when 'tuesday' then 'Time with the Rabbi' when 'friday' then 'Friday Miracle Service'
                       when 'online' then 'Online prayer' else 'Church Care' end as label
    where p_kind in ('sunday', 'tuesday', 'friday', 'online', 'test')
    union all
    select p.id, 'special', p.title from care.programs p where p_kind = 'special' and p_day between p.starts_on and p.ends_on
  loop
    -- the online prayer only gets a message when someone was marked present
    if pr.kind = 'online' and not exists (select 1 from care.attendance a where a.seen_on = p_day and a.kind = 'online') then continue; end if;
    for s in select st.*, ps.endpoint as ep, ps.p256dh as k1, ps.auth as k2 from care.push_subs ps join care.staff st on st.id = ps.staff_id loop
      if pr.kind = 'test' then
        msg := 'Notifications are working. You''ll get a short update after each service.';
      elsif s.role in ('pastor', 'pa') then
        select count(distinct care.stats_key(m)) into pres from care.attendance a join care.members m on m.id = a.member_id
          where a.seen_on = p_day and a.kind = pr.kind and a.program_id is not distinct from pr.id;
        select array_agg(g.name order by g.sort) into unmarked from care.groups g
          where exists (select 1 from care.members m where m.group_id = g.id)
            and not exists (select 1 from care.attendance a join care.members m on m.id = a.member_id
                            where m.group_id = g.id and a.seen_on = p_day and a.kind = pr.kind and a.program_id is not distinct from pr.id);
        select array_agg(g.name order by g.sort) into noleader from care.groups g
          where not exists (select 1 from care.staff x where x.role = 'leader' and x.group_id = g.id and x.joined_app_at is not null);
        select count(*) into offapp from care.members m where m.joined_app_at is null;
        select count(*) into newv from care.visitors v where v.created_at::date = p_day;
        msg := pres || case when pres = 1 then ' person' else ' people' end || ' marked present.'
          || case when unmarked is not null then ' No one marked yet: ' || care.name_list(unmarked) || '.' else '' end
          || case when newv > 0 then ' ' || newv || ' new visitor' || case when newv = 1 then '' else 's' end || '.' else '' end
          || case when noleader is not null then ' Still to sign up: the leader of ' || care.name_list(noleader) || '.' else '' end
          || case when offapp > 0 then ' ' || offapp || ' member' || case when offapp = 1 then '' else 's' end || ' not on the app yet.' else '' end;
      elsif s.role = 'leader' then
        select count(*) filter (where a.member_id is not null), count(*),
               array_agg(m.name order by m.name) filter (where a.member_id is null)
          into pres, total, missed
          from care.members m left join care.attendance a on a.member_id = m.id and a.seen_on = p_day and a.kind = pr.kind and a.program_id is not distinct from pr.id
          where m.group_id = s.group_id and (m.joined_at <= p_day or a.member_id is not null);
        select count(*) into todo from care.visitors v where v.assigned_to = s.group_id and v.status = 'new';
        msg := pres || ' of ' || total || ' from ' || coalesce((select name from care.groups where id = s.group_id), 'your group') || ' marked present.'
          || case when missed is not null then ' ' || array_length(missed, 1) || ' not marked yet. Tap to see who.' else '' end
          || case when todo > 0 then ' ' || todo || ' visitor' || case when todo = 1 then '' else 's' end || ' to contact.' else '' end;
      else
        continue;
      end if;
      endpoint := s.ep; p256dh := s.k1; auth := s.k2;
      title := case when pr.kind = 'test' then 'Church Care' else pr.label || ', ' || to_char(p_day, 'FMDay FMDD Mon') end;
      body := msg;
      url := 'team.html' || case when pr.kind = 'test' then '' else '#after=' || pr.kind || '|' || p_day || coalesce('|' || pr.id, '') end;
      return next;
    end loop;
  end loop;
end $$;

create or replace function care.reasons_push(p_day date default current_date - 1)
returns table (endpoint text, p256dh text, auth text, title text, body text, url text)
language plpgsql stable security definer set search_path = care, public as $$
declare s record; pr record; why text[]; came text[];
begin
  for pr in select case extract(dow from p_day) when 0 then 'sunday' when 2 then 'tuesday' else 'friday' end as kind, null::uuid as id,
                   case extract(dow from p_day) when 0 then 'Sunday service' when 2 then 'Time with the Rabbi' else 'Friday Miracle Service' end as label
            where extract(dow from p_day) in (0, 2, 5)
            union all select 'special', p.id, p.title from care.programs p where p_day between p.starts_on and p.ends_on loop
    for s in select st.group_id, ps.endpoint as ep, ps.p256dh as k1, ps.auth as k2 from care.push_subs ps join care.staff st on st.id = ps.staff_id where st.role = 'leader' loop
      select array_agg(m.name || ' (' || care.reason_text(x.reason) || ')' order by m.name) into why from care.absences x join care.members m on m.id = x.member_id
        where m.group_id = s.group_id and x.seen_on = p_day and x.kind = pr.kind and x.program_id is not distinct from pr.id;
      select array_agg(m.name order by m.name) into came from care.attendance a join care.members m on m.id = a.member_id
        where m.group_id = s.group_id and a.seen_on = p_day and a.kind = pr.kind and a.program_id is not distinct from pr.id and a.by_self;
      if why is null and came is null then continue; end if;
      endpoint := s.ep; p256dh := s.k1; auth := s.k2;
      title := pr.label || ', ' || to_char(p_day, 'FMDay FMDD Mon') || ': members replied';
      -- no names or reasons on the lock screen: they are shown inside the signed-in app
      body := case when why is not null then array_length(why, 1) || case when array_length(why, 1) = 1 then ' member' else ' members' end || ' told you why they couldn''t come. ' else '' end
           || case when came is not null then array_length(came, 1) || ' said they came: please check and mark them present if they were there. ' else '' end
           || 'Tap to see.';
      url := 'team.html#after=' || pr.kind || '|' || p_day || coalesce('|' || pr.id, '');
      return next;
    end loop;
  end loop;
end $$;

create or replace function care.save_push(p_endpoint text, p_p256dh text, p_auth text) returns void language plpgsql security definer set search_path = care, public as $$
declare st uuid; ml text;
begin
  if care.my_role() in ('pastor', 'pa', 'leader') then st := care.my_id();
  elsif exists (select care.my_member_groups()) then ml := coalesce(care.my_login_phone(), care.my_login_email());
  else raise exception 'Please join your group first'; end if;
  if p_endpoint !~ '^https://' then raise exception 'That notification address doesn''t look right'; end if;
  insert into care.push_subs (endpoint, staff_id, member_login, p256dh, auth) values (p_endpoint, st, ml, p_p256dh, p_auth)
  on conflict (endpoint) do update set staff_id = excluded.staff_id, member_login = excluded.member_login, p256dh = excluded.p256dh, auth = excluded.auth, created_at = now()
    where care.push_subs.auth = excluded.auth;   -- knowing the address is not enough: you need the subscription's secret too
end $$;

commit;
