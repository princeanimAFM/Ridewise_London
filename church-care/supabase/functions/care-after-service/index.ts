// Church Care: sends each signed-up phone a short update after a service.
// Called on a schedule by the database (supabase/cron.sql) with one of:
//   {"kind": "sunday" | "tuesday" | "friday" | "online" | "special" | "test"}  the team's update after a service
//   {"kind": "missed"}   next morning: members not marked present at yesterday's Sunday service or program
//   {"kind": "reasons"}  that evening: leaders hear who said why they missed, or that they came
//   {"kind": "report_due" | "report_check"}  monthly reports: leaders reminded (1st), pastor told who has sent (8th)
// "days_ago" says which day's service: 0 today, 1 yesterday.
// Deployed without JWT checks: the x-care-cron header must match the CARE_CRON_SECRET secret instead.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const KINDS = ['sunday', 'tuesday', 'friday', 'online', 'special', 'test', 'missed', 'reasons', 'report_due', 'report_check'];

Deno.serve(async (req) => {
  const secret = Deno.env.get('CARE_CRON_SECRET');
  if (!secret || req.headers.get('x-care-cron') !== secret) return new Response('Not allowed', { status: 401 });
  let kind = '', daysAgo = 0;
  try { const b = await req.json(); kind = b.kind; daysAgo = Math.min(7, Math.max(0, Number(b.days_ago) || 0)); } catch { /* no body */ }
  if (!KINDS.includes(kind)) return new Response('Unknown service', { status: 400 });

  webpush.setVapidDetails('https://theafmchurch.org', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { db: { schema: 'care' }, auth: { persistSession: false } });
  const day = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);   // Ghana is on UTC
  const { data, error } = kind === 'missed' ? await db.rpc('missed_push', { p_day: day })
    : kind === 'reasons' ? await db.rpc('reasons_push', { p_day: day })
    : kind.startsWith('report_') ? await db.rpc('report_push', { p_what: kind.slice(7) })
    : await db.rpc('service_push', { p_kind: kind, p_day: day });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  let sent = 0, gone = 0, failed = 0;
  for (const m of data ?? []) {
    try {
      await webpush.sendNotification({ endpoint: m.endpoint, keys: { p256dh: m.p256dh, auth: m.auth } },
        JSON.stringify({ title: m.title, body: m.body, url: m.url }), { TTL: 12 * 3600, urgency: 'normal' });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) { gone++; await db.rpc('forget_push', { p_endpoint: m.endpoint }); }
      else { failed++; console.error('push failed', code, (e as Error).message); }
    }
  }
  return new Response(JSON.stringify({ kind, sent, gone, failed }), { headers: { 'Content-Type': 'application/json' } });
});
