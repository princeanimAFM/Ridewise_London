/**
 * telegram-webhook — Telegram calls this when the AFM bot sees a new post in the channel.
 * Every new post (audio, voice note, video, photo, file or text) sends a push notification
 * to everyone who allows announcement notifications. Tapping it opens the post in Telegram.
 *
 * Setup (once):
 *   1. In Telegram, message @BotFather → /newbot, and keep the token it gives you.
 *      Add the bot to the channel as an admin (it only needs to read posts).
 *   2. Secrets (Supabase → Edge Functions → Secrets):
 *        TELEGRAM_BOT_TOKEN       the token from @BotFather
 *        TELEGRAM_WEBHOOK_SECRET  any long random string (letters, digits, _ and -)
 *        TELEGRAM_CHANNEL         optional: only notify for this channel, e.g. rabbimicah
 *        EXPO_ACCESS_TOKEN        optional: only if "enhanced push security" is on in Expo
 *   3. Open <project>.supabase.co/functions/v1/telegram-webhook?setup=<TELEGRAM_WEBHOOK_SECRET>
 *      once in a browser. It registers this function with Telegram and reports the result.
 */
import { adminClient, json } from '../_shared/auth.ts';

const env = (k: string) => Deno.env.get(k) ?? '';

type Message = {
  message_id: number;
  media_group_id?: string;
  chat: { id: number; title?: string; username?: string; type: string };
  text?: string;
  caption?: string;
  audio?: { title?: string; performer?: string; file_name?: string };
  voice?: unknown;
  video?: unknown;
  video_note?: unknown;
  photo?: unknown[];
  document?: { file_name?: string };
  animation?: unknown;
};

const trim = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const firstLine = (s?: string) => (s ?? '').split('\n').map((l) => l.trim()).find(Boolean) ?? '';

/** What the notification says for each kind of post. Returns null for service messages (pins, title changes). */
function describe(m: Message): { kind: string; title: string; body: string } | null {
  const words = firstLine(m.caption ?? m.text);
  const listen = 'Tap to listen on Telegram.';
  const open = 'Tap to open it in Telegram.';
  if (m.audio) {
    const name = [m.audio.title, m.audio.performer].filter(Boolean).join(' · ') || words || (m.audio.file_name ?? '').replace(/\.[a-z0-9]+$/i, '');
    return { kind: 'audio', title: 'New sermon on Telegram', body: name ? trim(name, 140) : listen };
  }
  if (m.voice) return { kind: 'voice', title: 'New voice message on Telegram', body: words ? trim(words, 140) : listen };
  if (m.video || m.video_note || m.animation) return { kind: 'video', title: 'New video on Telegram', body: words ? trim(words, 140) : open };
  if (m.photo) return { kind: 'photo', title: 'New post on Telegram', body: words ? trim(words, 140) : open };
  if (m.document) return { kind: 'file', title: 'New file on Telegram', body: trim(words || m.document.file_name || open, 140) };
  if (m.text) return { kind: 'text', title: 'New post on Telegram', body: trim(words, 140) || open };
  return null;
}

function postLink(m: Message) {
  return m.chat.username
    ? `https://t.me/${m.chat.username}/${m.message_id}`
    : `https://t.me/c/${String(m.chat.id).replace(/^-100/, '')}/${m.message_id}`;
}

/** Sends push notifications through Expo (100 per request). Returns sent/failed and dead tokens. */
async function sendPush(tokens: string[], title: string, body: string, url: string) {
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
      body: JSON.stringify(batch.map((to) => ({ to, title, body, sound: 'default', channelId: 'default', data: { url } }))),
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

/** Registers this function as the bot's webhook. Called once from a browser with ?setup=<secret>. */
async function setup() {
  const token = env('TELEGRAM_BOT_TOKEN');
  if (!token) return json({ ok: false, error: 'Add the TELEGRAM_BOT_TOKEN secret first.' }, 400);
  const api = (method: string, body?: unknown) =>
    fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    }).then((r) => r.json());
  const me = await api('getMe');
  if (!me.ok) return json({ ok: false, error: 'Telegram did not accept the bot token. Copy it again from @BotFather.' }, 400);
  const set = await api('setWebhook', {
    url: `${env('SUPABASE_URL')}/functions/v1/telegram-webhook`,
    secret_token: env('TELEGRAM_WEBHOOK_SECRET'),
    allowed_updates: ['channel_post'],
    drop_pending_updates: true,
  });
  return json({
    ok: !!set.ok,
    bot: `@${me.result.username}`,
    webhook: set.ok ? 'Registered. New channel posts will now send notifications.' : set.description,
    next: `Make sure @${me.result.username} is an admin of the channel.`,
  });
}

Deno.serve(async (req) => {
  const secret = env('TELEGRAM_WEBHOOK_SECRET');
  if (!secret) return json({ error: 'Add the TELEGRAM_WEBHOOK_SECRET secret first.' }, 500);

  if (req.method === 'GET') {
    return new URL(req.url).searchParams.get('setup') === secret ? await setup() : json({ error: 'Not found' }, 404);
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (req.headers.get('x-telegram-bot-api-secret-token') !== secret) return json({ error: 'Unauthorized' }, 401);

  // From here on always answer 200, or Telegram keeps re-sending the same post.
  let update: { channel_post?: Message };
  try {
    update = await req.json();
  } catch {
    return json({ ok: true, skipped: 'not JSON' });
  }
  const m = update.channel_post;
  if (!m) return json({ ok: true, skipped: 'not a channel post' });

  const only = env('TELEGRAM_CHANNEL').replace(/^@/, '').toLowerCase();
  if (only && (m.chat.username ?? '').toLowerCase() !== only) return json({ ok: true, skipped: 'other channel' });

  const post = describe(m);
  if (!post) return json({ ok: true, skipped: 'service message' });
  const link = postLink(m);

  // Record the post first; a duplicate (Telegram retry or another photo in the same album) is skipped.
  const db = adminClient();
  const { error: dup } = await db.from('telegram_posts').insert({
    chat_id: m.chat.id,
    message_id: m.message_id,
    media_group_id: m.media_group_id ?? null,
    kind: post.kind,
    title: post.body,
    link,
  });
  if (dup) return json({ ok: true, skipped: dup.code === '23505' ? 'already notified' : dup.message });

  const tokens: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from('push_tokens').select('token').eq('announcements', true).range(from, from + 999);
    tokens.push(...(data ?? []).map((r: { token: string }) => r.token));
    if (!data || data.length < 1000) break;
  }

  const push = await sendPush(tokens, post.title, post.body, link);
  if (push.dead.length) await db.from('push_tokens').delete().in('token', push.dead);
  await db.from('telegram_posts').update({ notified_count: push.sent }).eq('chat_id', m.chat.id).eq('message_id', m.message_id);

  return json({ ok: true, kind: post.kind, sent: push.sent, failed: push.failed });
});
