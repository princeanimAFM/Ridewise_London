/**
 * Ministry times are written in Ghana time, which is GMT (UTC) all year, with no summer time.
 * These helpers show the same moment in the phone's own time zone, e.g. "9:00 PM in London".
 */
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const ampm = (s: string) => s.replace(/\s?([ap])\.?m\.?/i, (_, x: string) => ` ${x.toUpperCase()}M`);

/** Reads a time such as "6:00 PM", "6pm", "6.30 pm" or "18:00". */
export function parseClock(text: string): { hour: number; minute: number } | null {
  const m = /\b(\d{1,2})(?:[:.](\d{2}))?\s*([ap])\.?m\b/i.exec(text);
  if (m) {
    const hour = Number(m[1]);
    const minute = Number(m[2] ?? 0);
    if (hour < 1 || hour > 12 || minute > 59) return null;
    return { hour: (hour % 12) + (m[3].toLowerCase() === 'p' ? 12 : 0), minute };
  }
  const h24 = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/.exec(text);
  return h24 ? { hour: Number(h24[1]), minute: Number(h24[2]) } : null;
}

/** "18:00" or "18:00:00" → "6:00 PM". */
export function formatClock(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/**
 * The given moment in the phone's time zone, e.g. "9:00 PM in London", with the weekday
 * added when it falls on a different day than in Ghana. Null on Ghana (GMT) time.
 */
export function localTimeOf(at: Date): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return null;
    const time = (zone: string) =>
      ampm(new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: 'numeric', minute: '2-digit', hour12: true }).format(at));
    const weekday = (zone: string) => new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'long' }).format(at);
    const local = time(tz);
    const sameDay = weekday(tz) === weekday('UTC');
    if (sameDay && local === time('UTC')) return null;
    const city = tz.startsWith('Etc/') || !tz.includes('/') ? '' : tz.split('/').pop()!.replace(/_/g, ' ');
    return `${sameDay ? '' : `${weekday(tz)} `}${local} ${city ? `in ${city}` : 'your time'}`;
  } catch {
    return null;
  }
}

/** A dated event: "2026-10-25" + "18:00" (Ghana time) in the phone's time zone. */
export function localEventTime(date: string, hhmm: string): string | null {
  const at = new Date(`${date}T${hhmm.slice(0, 5)}:00Z`);
  return Number.isNaN(at.getTime()) ? null : localTimeOf(at);
}

/**
 * A weekly service: reads the day and time from the owner's text ("Sunday", "8:00 PM")
 * and returns the next one in the phone's time zone. Null when the text has no time.
 */
export function localServiceTime(day: string, detail: string, now = new Date()): string | null {
  const weekday = DAYS.findIndex((d) => day.toLowerCase().includes(d));
  const clock = parseClock(detail);
  if (weekday < 0 || !clock) return null;
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), clock.hour, clock.minute));
  next.setUTCDate(next.getUTCDate() + ((weekday - next.getUTCDay() + 7) % 7));
  if (next < now) next.setUTCDate(next.getUTCDate() + 7);
  return localTimeOf(next);
}
