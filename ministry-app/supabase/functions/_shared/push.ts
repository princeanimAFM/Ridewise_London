// Push notifications through Expo, shared by the edge functions.
const env = (k: string) => Deno.env.get(k) ?? '';

type Ticket = { status: string; details?: { error?: string } };

/**
 * Sends push notifications through Expo (100 per request). Returns sent/failed and dead tokens.
 * If Expo refuses a whole batch (HTTP 400, e.g. one bad or foreign address in it), the batch is split in half and
 * tried again, so one bad address can't stop everyone else's notification; an address that is refused on its own is dead.
 */
export async function sendPush(tokens: string[], title: string, body: string, url: string) {
  let sent = 0, failed = 0;
  const dead: string[] = [];

  async function sendBatch(batch: string[]): Promise<void> {
    let res: Response;
    try {
      res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          ...(env('EXPO_ACCESS_TOKEN') ? { Authorization: `Bearer ${env('EXPO_ACCESS_TOKEN')}` } : {}),
        },
        body: JSON.stringify(batch.map((to) => ({ to, title, body, sound: 'default', channelId: 'default', data: { url } }))),
      });
    } catch {
      failed += batch.length;
      return;
    }
    if (!res.ok) {
      if (res.status === 400 && batch.length > 1) {
        const mid = Math.ceil(batch.length / 2);
        await sendBatch(batch.slice(0, mid));
        await sendBatch(batch.slice(mid));
        return;
      }
      failed += batch.length;
      if (res.status === 400) dead.push(...batch);
      return;
    }
    const { data } = (await res.json()) as { data: Ticket[] };
    data.forEach((ticket, j) => {
      if (ticket.status === 'ok') sent++;
      else {
        failed++;
        if (ticket.details?.error === 'DeviceNotRegistered') dead.push(batch[j]);
      }
    });
  }

  for (let i = 0; i < tokens.length; i += 100) await sendBatch(tokens.slice(i, i + 100));
  return { sent, failed, dead };
}
