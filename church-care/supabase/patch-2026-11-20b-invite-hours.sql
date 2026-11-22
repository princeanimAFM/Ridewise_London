-- Join links work for 12 hours (they used to work for 30 days). A group's join link is reused only while it has at
-- least 6 hours left, and invite_info says when a link stops working, so the app can show it.
-- Safe to run again. Generated from schema.sql.

begin;

create or replace function care.invite_hours() returns int language sql immutable as $$ select 12 $$;
revoke all on function care.invite_hours() from public, anon, authenticated;

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
    select token into t from care.invites where group_id = p_group and kind = 'member' and not revoked
      and created_at >= now() - make_interval(hours => care.invite_hours()) / 2 order by created_at desc limit 1;
    if t is null then insert into care.invites (kind, group_id, created_by) values ('member', p_group, coalesce(care.my_name(), '')) returning token into t; end if;
    return t;
  end if;
  raise exception 'Unknown invite type';
end $$;

create or replace function care.invite_info(p_token text) returns jsonb language sql stable security definer set search_path = care, public as $$
  select jsonb_build_object('kind', i.kind, 'group', g.name, 'tag', g.tag, 'leader', g.leader_name,
    'valid', not i.revoked and i.created_at >= now() - make_interval(hours => care.invite_hours()) and (i.kind = 'member' or i.used_at is null),
    'expires_at', i.created_at + make_interval(hours => care.invite_hours()),
    -- counted here, so a phone with the wrong time still knows how long the link has left
    'seconds_left', greatest(0, floor(extract(epoch from i.created_at + make_interval(hours => care.invite_hours()) - now())))::int)
  from care.invites i join care.groups g on g.id = i.group_id where i.token = p_token
$$;

create or replace function care.accept_invite(p_token text, p_name text) returns jsonb language plpgsql security definer set search_path = care, public as $$
declare i care.invites; ph text := care.my_login_phone(); em text := care.my_login_email(); st care.staff := care.me(); n text := btrim(coalesce(p_name, '')); mid uuid;
begin
  if ph is null and em is null then raise exception 'Please sign in first'; end if;
  select * into i from care.invites where token = p_token for update;
  if i.token is null or i.revoked or i.created_at < now() - make_interval(hours => care.invite_hours()) then raise exception 'This invite link is no longer valid. Ask for a new one.'; end if;
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

commit;
