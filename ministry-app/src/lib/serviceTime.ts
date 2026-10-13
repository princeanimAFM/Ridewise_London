/**
 * Service times are written in Ghana time, which is GMT all year (no summer time).
 * localServiceTime reads the day and time from the owner's text ("Sunday", "8:00 PM")
 * and returns the same moment in the phone's own time zone, e.g. "9:00 PM in London".
 * Returns null when the text has no time, or the phone is already on Ghana time.
 */
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const ampm = (s: string) => s.replace(/\s?([ap])\.?m\.?/i, (_, x: string) => ` ${x.toUpperCase()}M`);

export function localServiceTime(day: string, detail: string, now = new Date()): string | null {
  const weekday = DAYS.findIndex((d) => day.toLowerCase().includes(d));
  const m = /\b(\d{1,2})(?:[:.](\d{2}))?\s*([ap])\.?m\b/i.exec(detail);
  if (weekday < 0 || !m) return null;
  const hour = (Number(m[1]) % 12) + (m[3].toLowerCase() === 'p' ? 12 : 0);
  const minute = Number(m[2] ?? 0);

  // The next time this service starts, in Ghana time (= UTC).
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute));
  next.setUTCDate(next.getUTCDate() + ((weekday - next.getUTCDay() + 7) % 7));
  if (next < now) next.setUTCDate(next.getUTCDate() + 7);

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return null;
    const time = (zone: string) =>
      ampm(new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: 'numeric', minute: '2-digit', hour12: true }).format(next));
    const local = time(tz);
    const localDay = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'long' }).format(next);
    if (local === time('UTC') && localDay.toLowerCase() === DAYS[weekday]) return null;
    const city = tz.startsWith('Etc/') || !tz.includes('/') ? '' : tz.split('/').pop()!.replace(/_/g, ' ');
    const dayPart = localDay.toLowerCase() === DAYS[weekday] ? '' : `${localDay} `;
    return `${dayPart}${local} ${city ? `in ${city}` : 'your time'}`;
  } catch {
    return null;
  }
}
