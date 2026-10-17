-- Optional start time for an announcement's programme, in Ghana time (GMT). Safe to re-run.
-- The app shows it to each member in their own time zone; emails list Ghana, UK and US times.
alter table public.announcements add column if not exists event_time time;
