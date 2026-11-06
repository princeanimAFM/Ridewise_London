-- Make the owner (princeanim88@gmail.com) an admin.
-- Works whether or not the account exists yet: it's promoted as soon as the
-- email is confirmed, so nobody can claim admin with an unverified sign-up.
-- Safe to re-run. To add another owner later, see SETUP.md step 6.

create or replace function public.promote_owner()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if lower(new.email) = 'princeanim88@gmail.com' and new.email_confirmed_at is not null then
    insert into public.profiles (id, is_admin) values (new.id, true)
    on conflict (id) do update set is_admin = true;
  end if;
  return new;
end $$;

-- Named to run after on_auth_user_created, which creates the profile.
drop trigger if exists on_auth_user_owner_admin on auth.users;
create trigger on_auth_user_owner_admin
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.promote_owner();

-- If the owner already has a confirmed account, promote it now.
update public.profiles set is_admin = true
where id in (
  select id from auth.users
  where lower(email) = 'princeanim88@gmail.com' and email_confirmed_at is not null
);
