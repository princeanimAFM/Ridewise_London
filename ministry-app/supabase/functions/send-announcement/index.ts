/**
 * send-announcement — emails and/or texts an announcement to every subscriber,
 * greeting each by first name. Called from the owner dashboard in the app.
 *
 * POST { announcement_id: string, test_email?: string }
 *   test_email: send a single preview to this address instead of everyone.
 *
 * Secrets (Supabase → Edge Functions → Secrets):
 *   BREVO_API_KEY, NEWSLETTER_FROM_EMAIL, NEWSLETTER_FROM_NAME   (email)
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM or TWILIO_MESSAGING_SERVICE_SID   (text messages)
 *   EXPO_ACCESS_TOKEN (optional; only if "enhanced push security" is on in Expo)   (push notifications)
 */
import { adminClient, corsHeaders, json, publicUrl, requireAdmin } from '../_shared/auth.ts';
import { liveBrand } from '../_shared/liveBrand.ts';
import { type Brand, renderEmail, renderSms } from '../_shared/newsletter.ts';

type Subscriber = { id: string; first_name: string; email: string | null; phone: string | null; unsubscribe_token: string };

const env = (k: string) => Deno.env.get(k) ?? '';

async function sendEmail(brand: Brand, to: { email: string; name: string }, subject: string, html: string, text: string, unsubscribeUrl: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env('BREVO_API_KEY'), 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: env('NEWSLETTER_FROM_EMAIL') || brand.email, name: env('NEWSLETTER_FROM_NAME') || brand.name },
      replyTo: { email: brand.email, name: brand.name },
      to: [to],
      subject,
      htmlContent: html,
      textContent: text,
      headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    }),
  });
  if (!res.ok) throw new Error(`Email ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function sendSms(to: string, body: string) {
  const sid = env('TWILIO_ACCOUNT_SID');
  const form = new URLSearchParams({ To: to, Body: body });
  if (env('TWILIO_MESSAGING_SERVICE_SID')) form.set('MessagingServiceSid', env('TWILIO_MESSAGING_SERVICE_SID'));
  else form.set('From', env('TWILIO_FROM'));
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${sid}:${env('TWILIO_AUTH_TOKEN')}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  if (!res.ok) throw new Error(`SMS ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

/** Sends push notifications through Expo (100 per request). Returns sent/failed and dead tokens. */
async function sendPush(tokens: string[], title: string, body: string) {
  let sent = 0, failed = 0;
  const dead: string[] = [];
  for (let i = 0; i < tokens.length; i += 100) {
    const batch = tokens.slice(i, i + 100);
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        ...(env('EXPO_ACCESS_TOKEN') ? { Authorization: `Bearer ${env('EXPO_ACCESS_TOKEN')}` } : {}),
      },
      body: JSON.stringify(batch.map((to) => ({ to, title, body, sound: 'default', channelId: 'default', data: { url: '/announcements' } }))),
    });
    if (!res.ok) {
      failed += batch.length;
      continue;
    }
    const { data } = (await res.json()) as { data: { status: string; details?: { error?: string } }[] };
    data.forEach((ticket, j) => {
      if (ticket.status === 'ok') sent++;
      else {
        failed++;
        if (ticket.details?.error === 'DeviceNotRegistered') dead.push(batch[j]);
      }
    });
  }
  return { sent, failed, dead };
}

/** Runs `task` over `items` with at most `limit` running at once. */
async function pool<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) await task(items[i++]);
  });
  await Promise.all(workers);
}

async function allSubscribers(db: ReturnType<typeof adminClient>, column: 'email_opt_in' | 'sms_opt_in') {
  const rows: Subscriber[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('subscribers')
      .select('id, first_name, email, phone, unsubscribe_token')
      .eq(column, true)
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data as Subscriber[]));
    if (!data || data.length < 1000) return rows;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);

  const admin = await requireAdmin(req);
  if (!admin) return json({ error: 'Only the owner account can send announcements.' }, 403);

  let payload: { announcement_id?: string; test_email?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (!payload.announcement_id) return json({ error: 'announcement_id is required' }, 400);

  const db = adminClient();
  const { data: a, error } = await db.from('announcements').select('*').eq('id', payload.announcement_id).single();
  if (error || !a) return json({ error: 'Announcement not found' }, 404);

  const brand = await liveBrand(db);
  const announcement = { ...a, flyer_url: a.flyer_path ? publicUrl('flyers', a.flyer_path) : null };
  const headerImageUrl = env('NEWSLETTER_HEADER_IMAGE_URL') || publicUrl('brand', 'email-header.jpg');
  const unsubBase = `${env('SUPABASE_URL')}/functions/v1/unsubscribe`;
  const unsubUrl = (s: Subscriber, channel: 'email' | 'sms') => `${unsubBase}?t=${s.unsubscribe_token}&c=${channel}`;

  // Preview to one address.
  if (payload.test_email) {
    if (!env('BREVO_API_KEY')) return json({ error: 'Email sending is not set up yet (BREVO_API_KEY missing).' }, 400);
    const fake = { id: '', first_name: 'Friend', email: payload.test_email, phone: null, unsubscribe_token: 'preview' };
    const email = renderEmail({ brand, announcement, firstName: 'Friend', headerImageUrl, unsubscribeUrl: unsubUrl(fake, 'email') });
    try {
      await sendEmail(brand, { email: payload.test_email, name: 'Friend' }, `[Preview] ${email.subject}`, email.html, email.text, unsubUrl(fake, 'email'));
      return json({ preview: true, sentTo: payload.test_email });
    } catch (e) {
      return json({ error: String(e) }, 502);
    }
  }

  if (a.sent_at) return json({ error: 'This announcement has already been sent.' }, 409);

  const results = { emailSent: 0, emailFailed: 0, smsSent: 0, smsFailed: 0, pushSent: 0, pushFailed: 0, skipped: [] as string[] };
  const log: { announcement_id: string; subscriber_id: string; channel: 'email' | 'sms'; status: 'sent' | 'failed'; error: string | null }[] = [];

  if (a.send_email) {
    if (!env('BREVO_API_KEY')) results.skipped.push('email (not set up yet)');
    else {
      const subs = (await allSubscribers(db, 'email_opt_in')).filter((s) => s.email);
      await pool(subs, 5, async (s) => {
        const url = unsubUrl(s, 'email');
        const email = renderEmail({ brand, announcement, firstName: s.first_name, headerImageUrl, unsubscribeUrl: url });
        try {
          await sendEmail(brand, { email: s.email!, name: s.first_name }, email.subject, email.html, email.text, url);
          results.emailSent++;
          log.push({ announcement_id: a.id, subscriber_id: s.id, channel: 'email', status: 'sent', error: null });
        } catch (e) {
          results.emailFailed++;
          log.push({ announcement_id: a.id, subscriber_id: s.id, channel: 'email', status: 'failed', error: String(e).slice(0, 300) });
        }
      });
    }
  }

  if (a.send_sms) {
    if (!env('TWILIO_ACCOUNT_SID')) results.skipped.push('text messages (not set up yet)');
    else {
      const subs = (await allSubscribers(db, 'sms_opt_in')).filter((s) => s.phone);
      await pool(subs, 3, async (s) => {
        try {
          await sendSms(s.phone!, renderSms({ brand, announcement, firstName: s.first_name, unsubscribeUrl: unsubUrl(s, 'sms') }));
          results.smsSent++;
          log.push({ announcement_id: a.id, subscriber_id: s.id, channel: 'sms', status: 'sent', error: null });
        } catch (e) {
          results.smsFailed++;
          log.push({ announcement_id: a.id, subscriber_id: s.id, channel: 'sms', status: 'failed', error: String(e).slice(0, 300) });
        }
      });
    }
  }

  if (a.send_push) {
    const tokens: string[] = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await db.from('push_tokens').select('token').eq('announcements', true).range(from, from + 999);
      tokens.push(...(data ?? []).map((r: { token: string }) => r.token));
      if (!data || data.length < 1000) break;
    }
    const body = (a.sms_text && a.sms_text.trim()) || a.body.replace(/\s+/g, ' ').slice(0, 170);
    const push = await sendPush(tokens, a.title, body);
    results.pushSent = push.sent;
    results.pushFailed = push.failed;
    if (push.dead.length) await db.from('push_tokens').delete().in('token', push.dead);
  }

  for (let i = 0; i < log.length; i += 500) await db.from('deliveries').insert(log.slice(i, i + 500));
  await db
    .from('announcements')
    .update({
      sent_at: new Date().toISOString(),
      sent_count: results.emailSent + results.smsSent + results.pushSent,
      failed_count: results.emailFailed + results.smsFailed + results.pushFailed,
    })
    .eq('id', a.id);

  return json(results);
});
