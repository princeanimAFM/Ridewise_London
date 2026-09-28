/**
 * unsubscribe — the link at the bottom of every newsletter and text message.
 * GET or POST ?t=<unsubscribe token>&c=email|sms|all
 * Public (no sign-in needed): deploy with --no-verify-jwt (see config.toml).
 */
import brandJson from '../_shared/brand.json' with { type: 'json' };
import { adminClient } from '../_shared/auth.ts';

const brand = brandJson as { name: string; email: string };

const page = (title: string, message: string, status = 200) =>
  new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#F4F7FC;font-family:Arial,Helvetica,sans-serif;color:#1C2320;">
<div style="max-width:480px;margin:60px auto;padding:28px;background:#fff;border-radius:14px;text-align:center;">
<div style="color:#1646A8;font-weight:700;letter-spacing:2px;font-size:12px;">${brand.name.toUpperCase()}</div>
<h1 style="font-family:Georgia,serif;font-size:24px;margin:10px 0;">${title}</h1>
<p style="font-size:16px;line-height:1.5;color:#5B6474;">${message}</p>
<p style="font-size:14px;color:#5B6474;">Questions? <a href="mailto:${brand.email}" style="color:#1646A8;">${brand.email}</a></p>
</div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('t') ?? '';
  const channel = url.searchParams.get('c') ?? 'all';
  if (!/^[0-9a-f-]{36}$/i.test(token)) return page('Link not valid', 'This unsubscribe link is incomplete. Please use the full link from the message.', 400);

  const changes =
    channel === 'email' ? { email_opt_in: false } : channel === 'sms' ? { sms_opt_in: false } : { email_opt_in: false, sms_opt_in: false };

  const { data, error } = await adminClient().from('subscribers').update({ ...changes, updated_at: new Date().toISOString() }).eq('unsubscribe_token', token).select('id');
  if (error) return page('Something went wrong', 'Please try again later, or email us and we will remove you.', 500);
  if (!data?.length) return page('Already removed', 'We could not find this subscription. You may already be unsubscribed.');

  const what = channel === 'email' ? 'emails' : channel === 'sms' ? 'text messages' : 'emails and text messages';
  return page('You have been unsubscribed', `You will no longer receive ${what} from ${brand.name}. You can subscribe again at any time in the app.`);
});
