/**
 * Where tapping a notification may go. Only the app's own screens and a few trusted sites are allowed, so a forged
 * notification can't open an arbitrary page or a hidden screen.
 */
const SCREENS = [/^\/(announcements|live|quotes|sermons|store|bible)\/?$/, /^\/bible\/read\?[A-Za-z0-9=&%._-]*$/];
const SITES = /^https:\/\/(t\.me|telegram\.me|(www\.)?theafmchurch\.org|afm-hub\.expo\.app|(www\.)?youtube\.com|youtu\.be)\//i;

export type NotificationTarget = { kind: 'screen'; path: string } | { kind: 'link'; url: string } | null;

export function notificationTarget(url: unknown): NotificationTarget {
  if (typeof url !== 'string' || url.length > 500) return null;
  if (url.startsWith('/') && !url.startsWith('//') && SCREENS.some((r) => r.test(url))) return { kind: 'screen', path: url };
  if (SITES.test(url)) return { kind: 'link', url };
  return null;
}
