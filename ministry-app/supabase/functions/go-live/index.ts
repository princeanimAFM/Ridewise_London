/**
 * go-live — the Owner dashboard's "We're live" and "End live service" buttons.
 *
 *   POST { action: 'start', title? }  opens a live session and sends "Live now" to every phone
 *                                     that allows announcement notifications; tapping it opens Live.
 *   POST { action: 'end' }            closes the open session; comments and prayer requests stop.
 *
 * Admins only. Only one session can be open, so a double tap never notifies twice.
 * Each start also clears old messages: comments after 90 days, prayer requests after 24 months
 * (the periods in the privacy policy).
 */
import { adminClient, corsHeaders, json, requireAdmin } from '../_shared/auth.ts';
import { sendPush } from '../_shared/push.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const admin = await requireAdmin(req);
  if (!admin) return json({ error: 'Only the ministry team can do this.' }, 403);

  let body: { action?: string; title?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Bad request' }, 400);
  }
  const db = adminClient();

  if (body.action === 'end') {
    const { data, error } = await db.from('live_sessions').update({ ended_at: new Date().toISOString() }).is('ended_at', null).select('id');
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, ended: data?.length ?? 0 });
  }

  if (body.action !== 'start') return json({ error: 'Unknown action' }, 400);
  const title = (body.title ?? '').trim().slice(0, 120) || 'Live service';

  const { data: session, error } = await db.from('live_sessions').insert({ title, started_by: admin.id }).select('id').single();
  if (error) {
    if (error.code === '23505') return json({ error: 'A live service is already on. End it first, or keep going.' }, 409);
    return json({ error: error.message }, 500);
  }

  const now = Date.now();
  await db.from('live_messages').delete().eq('kind', 'comment').lt('created_at', new Date(now - 90 * 864e5).toISOString());
  await db.from('live_messages').delete().eq('kind', 'prayer').lt('created_at', new Date(now - 730 * 864e5).toISOString());

  const tokens: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from('push_tokens').select('token').eq('announcements', true).range(from, from + 999);
    tokens.push(...(data ?? []).map((r: { token: string }) => r.token));
    if (!data || data.length < 1000) break;
  }
  const push = await sendPush(tokens, '🔴 Live now', `${title} · Tap to join`, '/live');
  if (push.dead.length) await db.from('push_tokens').delete().in('token', push.dead);
  await db.from('live_sessions').update({ notified_count: push.sent }).eq('id', session.id);

  return json({ ok: true, session_id: session.id, sent: push.sent, failed: push.failed });
});
