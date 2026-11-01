-- Manage admins from the app (Owner dashboard → Admins).
-- Any admin can add or remove admins. The owner account (princeanim88@gmail.com)
-- can't be removed, and admins can't remove themselves, so the app can never
-- be left without an admin. Safe to re-run.

create or replace function public.list_admins()
returns table (email text, first_name text, is_owner boolean, is_me boolean)
language sql stable security definer set search_path = public
as $$
  select u.email::text, p.first_name, lower(u.email) = 'princeanim88@gmail.com', u.id = auth.uid()
  from profiles p join auth.users u on u.id = p.id
  where p.is_admin and public.is_admin()
  order by lower(u.email) = 'princeanim88@gmail.com' desc, p.first_name nulls last, u.email
$$;
grant execute on function public.list_admins() to authenticated;

create or replace function public.set_admin(p_email text, p_admin boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user auth.users%rowtype;
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if not public.is_admin() then raise exception 'Only an admin can change admins.'; end if;
  select * into v_user from auth.users where lower(email) = v_email limit 1;
  if v_user.id is null then
    raise exception 'No account uses % yet. Ask them to create an account in the app first (More → Sign in → Create account).', v_email;
  end if;
  if p_admin and v_user.email_confirmed_at is null then
    raise exception '% has not confirmed their email yet. Ask them to enter the code we emailed them, then try again.', v_email;
  end if;
  if not p_admin and v_email = 'princeanim88@gmail.com' then raise exception 'The owner account can''t be removed.'; end if;
  if not p_admin and v_user.id = auth.uid() then raise exception 'You can''t remove yourself. Ask another admin to do it.'; end if;

  insert into profiles (id, is_admin) values (v_user.id, p_admin)
  on conflict (id) do update set is_admin = p_admin;
end $$;
grant execute on function public.set_admin(text, boolean) to authenticated;
