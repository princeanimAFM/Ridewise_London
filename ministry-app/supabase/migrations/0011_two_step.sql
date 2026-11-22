-- Two-step sign-in for the owner and admin accounts (from the review of 19 November 2026). Safe to re-run.
--
-- Admin powers (sending notifications to everyone, changing what the app shows, managing admins, the giving and contact
-- details) now need a sign-in that passed the second step: a code from an authenticator app (Supabase's free TOTP factor;
-- Supabase marks such a sign-in with aal = 'aal2'). Until public.second_step_from(), admins who haven't set it up yet keep
-- their powers; the app asks them each time they open an admin screen. Everything else in the app works as before, for
-- everyone, without a second step.
--
-- Lost phone: remove the person's factor in the Supabase dashboard (Authentication → Users → the user → MFA factors);
-- they set it up again when they next open an admin screen.

create or replace function public.second_step_from()
returns timestamptz language sql immutable as $$ select timestamptz '2026-11-28 00:00:00+00' $$;

-- Has the signed-in person set up an authenticator app?
create or replace function public.has_second_step()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified') $$;

-- Did this sign-in pass the second step (or may this person still do without it)?
create or replace function public.second_step_ok()
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
      or (not public.has_second_step() and now() < public.second_step_from())
$$;

revoke all on function public.second_step_from(), public.has_second_step(), public.second_step_ok() from public, anon;
grant execute on function public.second_step_from(), public.has_second_step(), public.second_step_ok() to authenticated;

-- Admin and owner checks (used by the table rules, the storage rules, set_admin, list_admins and the server functions).
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) and public.second_step_ok() $$;

create or replace function public.is_owner()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null
      and lower(u.email) in (select o.email from private.owners o))
    and public.second_step_ok()
$$;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- The "team" badge on live-chat messages also needs the second step.
create or replace function public.live_message_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  new.name := coalesce(nullif(left(btrim((select first_name from profiles where id = auth.uid())), 40), ''), 'Member');
  new.is_team := public.is_admin();
  new.body := btrim(new.body);
  new.hidden := false;
  new.created_at := now();
  return new;
end $$;
