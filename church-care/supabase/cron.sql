-- Church Care: when the after-service updates go out (Ghana time = UTC). Run once in the Supabase SQL editor,
-- after deploying the care-after-service function and saving the secret below. Safe to run again.
-- The secret is kept in Supabase Vault (name: care_cron_secret) and must match the function's CARE_CRON_SECRET.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function care.send_after_service(p_kind text) returns void language sql security definer set search_path = care, public as $$
  select net.http_post(
    url := 'https://' || (select decrypted_secret from vault.decrypted_secrets where name = 'care_project_ref') || '.supabase.co/functions/v1/care-after-service',
    headers := jsonb_build_object('Content-Type', 'application/json',
                 'x-care-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'care_cron_secret')),
    body := jsonb_build_object('kind', p_kind));
$$;
revoke all on function care.send_after_service(text) from public, anon, authenticated;

-- Sunday service (8 AM): 2 PM.  Online prayer (Sunday 8 PM, only if anyone was marked): 10:30 PM.
-- Time with the Rabbi (Tuesday 6 PM) and Friday Miracle Service (6 PM): 9 PM.  Special programs: 10 PM on each day of the program.
select cron.schedule('care-after-sunday',  '0 14 * * 0',  $$select care.send_after_service('sunday')$$);
select cron.schedule('care-after-online',  '30 22 * * 0', $$select care.send_after_service('online')$$);
select cron.schedule('care-after-tuesday', '0 21 * * 2',  $$select care.send_after_service('tuesday')$$);
select cron.schedule('care-after-friday',  '0 21 * * 5',  $$select care.send_after_service('friday')$$);
select cron.schedule('care-after-special', '0 22 * * *',  $$select care.send_after_service('special')$$);
-- Members not marked present at yesterday's Sunday service or program: 10 AM. Their leaders hear the replies: 8 PM.
select cron.schedule('care-missed-you',    '0 10 * * *',  $$select care.send_after_service('missed')$$);
select cron.schedule('care-replies',       '0 20 * * *',  $$select care.send_after_service('reasons')$$);
