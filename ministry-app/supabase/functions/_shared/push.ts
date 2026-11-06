// Push notifications through Expo, shared by the edge functions.
const env = (k: string) => Deno.env.get(k) ?? '';

/** Sends push notifications through Expo (100 per request). Returns sent/failed and dead tokens. */
export async function sendPush(tokens: string[], title: string, body: string, url: string) {
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
