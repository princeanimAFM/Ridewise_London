-- Church Care: when the updates go out (Ghana time = UTC). Run once in the Supabase SQL editor,
-- after deploying the care-after-service function and saving the secret below. Safe to run again.
-- The secret is kept in Supabase Vault (name: care_cron_secret) and must match the function's CARE_CRON_SECRET.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function care.send_after_service(p_kind text, p_days_ago int default 0) returns void language sql security definer set search_path = care, public as $$
  select net.http_post(
    url := 'https://' || (select decrypted_secret from vault.decrypted_secrets where name = 'care_project_ref') || '.supabase.co/functions/v1/care-after-service',
    headers := jsonb_build_object('Content-Type', 'application/json',
                 'x-care-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'care_cron_secret')),
    body := jsonb_build_object('kind', p_kind, 'days_ago', p_days_ago));
$$;
drop function if exists care.send_after_service(text);
revoke all on function care.send_after_service(text, int) from public, anon, authenticated;

-- The pastor and leaders: Sunday service at 2 PM the same day; everything else at 8 AM the next morning
-- (Tuesday and Friday services can run late). Online prayer only if anyone was marked present.
select cron.schedule('care-after-sunday',  '0 14 * * 0', $$select care.send_after_service('sunday', 0)$$);
select cron.schedule('care-after-online',  '0 8 * * 1',  $$select care.send_after_service('online', 1)$$);
select cron.schedule('care-after-tuesday', '0 8 * * 3',  $$select care.send_after_service('tuesday', 1)$$);
select cron.schedule('care-after-friday',  '0 8 * * 6',  $$select care.send_after_service('friday', 1)$$);
select cron.schedule('care-after-special', '0 8 * * *',  $$select care.send_after_service('special', 1)$$);
-- Members not marked present at yesterday's Sunday, Tuesday or Friday service or program: 10 AM. Their leaders hear the replies: 8 PM.
select cron.schedule('care-missed-you',    '0 10 * * *', $$select care.send_after_service('missed', 1)$$);
select cron.schedule('care-replies',       '0 20 * * *', $$select care.send_after_service('reasons', 1)$$);
-- Monthly reports: leaders reminded on the 1st at 8 AM; the pastor hears who has sent on the 8th at 8 AM.
select cron.schedule('care-report-due',    '0 8 1 * *',  $$select care.send_after_service('report_due', 0)$$);
select cron.schedule('care-report-check',  '0 8 8 * *',  $$select care.send_after_service('report_check', 0)$$);
