-- Two-step sign-in: everyone on the team (pastor, PA, welcome team, leaders) uses an authenticator app as a second
-- step after their email code or Google sign-in. Until care.second_step_from() those who haven't set it up can still
-- come in (the app asks them each time); after that, setting it up is the only way in. Members may turn it on too.
-- The pastor sees who has it on and can reset it (lost phone), which also signs that person out on every phone.
-- Safe to run again. Generated from schema.sql.

begin;

create or replace function care.second_step_from() returns timestamptz language sql immutable as $$ select timestamptz '2026-11-28 00:00:00+00' $$;

create or replace function care.has_second_step() returns boolean language sql stable security definer set search_path = care, public as $$
  select exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified')
$$;

create or replace function care.passed_second_step() returns boolean language sql stable as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
$$;

create or replace function care.me_any() returns care.staff language sql stable security definer set search_path = care, public as $$
  select s.* from care.staff s
  where (s.email is not null and s.email = lower(nullif(auth.jwt() ->> 'email', '')))
     or (s.phone is not null and s.phone = care.intl_phone(nullif(auth.jwt() ->> 'phone', '')))
  order by s.created_at limit 1
$$;

revoke all on function care.me_any() from public, anon, authenticated;

create or replace function care.me() returns care.staff language sql stable security definer set search_path = care, public as $$
  select s.* from care.me_any() s
  where s.id is not null and (care.passed_second_step() or (not care.has_second_step() and now() < care.second_step_from()))
$$;

create or replace function care.member_ok() returns boolean language sql stable as $$
  select care.passed_second_step() or not care.has_second_step()
$$;

create or replace function care.my_login_phone() returns text language sql stable as $$ select care.intl_phone(nullif(auth.jwt() ->> 'phone', '')) where care.member_ok() $$;

create or replace function care.my_login_email() returns text language sql stable as $$ select lower(nullif(auth.jwt() ->> 'email', '')) where care.member_ok() $$;

create or replace function care.whoami() returns jsonb language plpgsql security definer set search_path = care, public as $$
declare st care.staff := care.me(); anyone care.staff := care.me_any(); ph text := care.my_login_phone(); em text := care.my_login_email(); gs jsonb;
  two boolean := care.has_second_step();
begin
  -- signed in, but the second step is still to do: 'code' (type the app's code) or 'setup' (set the app up first)
  if (anyone.id is not null and st.id is null) or (auth.uid() is not null and two and not care.passed_second_step()) then
    return jsonb_build_object('kind', 'second_step', 'need', case when two then 'code' else 'setup' end,
                              'role', coalesce(anyone.role, 'member'), 'name', anyone.name);
  end if;
  if ph is null and em is null then return null; end if;
  if st.id is not null then
    update care.staff set joined_app_at = coalesce(joined_app_at, now()), last_app_at = now() where id = st.id;
    return jsonb_build_object('kind', 'staff', 'id', st.id, 'name', st.name, 'role', st.role, 'group_id', st.group_id, 'areas', to_jsonb(st.areas), 'email', st.email, 'phone', st.phone,
                              'second_step', case when two then 'on' else 'due' end, 'second_step_from', care.second_step_from());
  end if;
  update care.members set last_app_at = now()
   where (login_phone is not null and login_phone = ph) or (login_email is not null and login_email = em);
  select jsonb_agg(jsonb_build_object('member_id', m.id, 'group_id', m.group_id) order by m.joined_app_at), min(m.name)
    into gs from care.members m
   where (m.login_phone is not null and m.login_phone = ph) or (m.login_email is not null and m.login_email = em);
  if gs is null then return null; end if;
  return jsonb_build_object('kind', 'member', 'role', 'member', 'name',
    (select name from care.members where (login_phone = ph or login_email = em) order by joined_app_at limit 1), 'groups', gs,
    'second_step', case when two then 'on' else 'off' end);
end $$;

create or replace function care.team_second_step() returns table (staff_id uuid, since timestamptz) language sql stable security definer set search_path = care, public as $$
  select s.id, min(f.created_at) from care.staff s
    join auth.users u on (s.email is not null and lower(u.email) = s.email) or (s.phone is not null and u.phone = s.phone)
    join auth.mfa_factors f on f.user_id = u.id and f.status = 'verified'
  where care.my_role() = 'pastor'
  group by s.id
$$;

create or replace function care.reset_second_step(p_staff uuid) returns void language plpgsql security definer set search_path = care, public as $$
declare s care.staff;
begin
  if care.my_role() is distinct from 'pastor' then raise exception 'Only the pastor can reset 2-step sign-in'; end if;
  select * into s from care.staff where id = p_staff;
  if s.id is null then raise exception 'That person is not on the team'; end if;
  if s.id = care.my_id() then raise exception 'You can''t reset your own 2-step sign-in. Ask the person who looks after the app.'; end if;
  delete from auth.mfa_factors f using auth.users u
   where f.user_id = u.id and ((s.email is not null and lower(u.email) = s.email) or (s.phone is not null and u.phone = s.phone));
  delete from auth.sessions x using auth.users u
   where x.user_id = u.id and ((s.email is not null and lower(u.email) = s.email) or (s.phone is not null and u.phone = s.phone));
end $$;

revoke all on function care.team_second_step(), care.reset_second_step(uuid) from public, anon;

grant execute on function care.team_second_step(), care.reset_second_step(uuid) to authenticated;

commit;
