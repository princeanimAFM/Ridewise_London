import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { liveMinistry as ministry } from './liveContent';
import { supabase } from './supabase';

/**
 * Notifications:
 *  - Daily AFM quote: scheduled on the phone (no server), a different quote each day.
 *  - Announcements & updates: push notifications sent when the owner publishes
 *    (the phone registers its push address with the backend).
 */

export type NotificationPrefs = {
  prompted: boolean; // has the invitation card been answered?
  dailyQuote: boolean;
  hour: number; // 0-23, local time for the daily quote
  announcements: boolean;
};

const KEY = 'afm.notifications';
const DEFAULTS: NotificationPrefs = { prompted: false, dailyQuote: true, hour: 7, announcements: true };
const DAYS_AHEAD = 30;
export const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export async function getPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

async function savePrefs(p: NotificationPrefs) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export async function permissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (!supported) return 'denied';
  const { status } = await Notifications.getPermissionsAsync();
  return status as 'granted' | 'denied' | 'undetermined';
}

async function ensureChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'AFM updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#C9A227',
    });
  }
}

/** Asks the phone for permission (shows the system dialog the first time). */
export async function requestPermission(): Promise<boolean> {
  if (!supported) return false;
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  if (!current.canAskAgain) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Schedules the next 30 days of daily quotes, one different quote per day. */
export async function scheduleDailyQuotes(hour: number) {
  if (!supported) return;
  await cancelDailyQuotes();
  const quotes = ministry.quotes;
  const now = new Date();
  for (let d = 0; d < DAYS_AHEAD; d++) {
    const when = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, hour, 0, 0);
    if (when.getTime() <= now.getTime() + 60_000) continue;
    const dayNumber = Math.floor(when.getTime() / 86_400_000);
    const quote = quotes[dayNumber % quotes.length];
    await Notifications.scheduleNotificationAsync({
      identifier: `daily-quote-${d}`,
      content: { title: 'Quote of the Day', body: `“${quote.text}” — ${ministry.quoteSource}`, data: { url: '/quotes', kind: 'daily-quote' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: 'default' },
    });
  }
}

export async function cancelDailyQuotes() {
  if (!supported) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled.filter((n) => n.identifier.startsWith('daily-quote-')).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Registers this phone for announcement push notifications (needs the backend). */
async function registerPush(enabled: boolean) {
  if (!supported || !supabase) return;
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  if (!projectId) return;
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS, p_announcements: enabled });
  } catch {
    // Push is unavailable (e.g. Expo Go on Android, or no network): daily quotes still work.
  }
}

/** Applies preferences: permission, daily quote schedule and push registration. */
export async function applyPrefs(p: NotificationPrefs): Promise<{ granted: boolean }> {
  await savePrefs(p);
  const wantsAny = p.dailyQuote || p.announcements;
  const granted = wantsAny ? await requestPermission() : (await permissionStatus()) === 'granted';
  if (granted && p.dailyQuote) await scheduleDailyQuotes(p.hour);
  else await cancelDailyQuotes();
  if (granted) await registerPush(p.announcements);
  return { granted };
}

/** Run on app start: keeps the daily quotes topped up and the push address current. */
export async function refreshNotifications() {
  if (!supported) return;
  const p = await getPrefs();
  if (!p.prompted || (await permissionStatus()) !== 'granted') return;
  await ensureChannel();
  if (p.dailyQuote) await scheduleDailyQuotes(p.hour);
  await registerPush(p.announcements);
}

export async function markPrompted() {
  await savePrefs({ ...(await getPrefs()), prompted: true });
}
