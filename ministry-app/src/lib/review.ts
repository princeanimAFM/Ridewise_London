import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { openLink } from './links';

const KEY = 'afm.review';
type State = { opens: number; firstOpen: number; asked: boolean };

/** "Rate the app": shows Google Play / App Store's in-app review, or opens the store page. */
export async function rateApp() {
  if (Platform.OS === 'web') return;
  try {
    if ((await StoreReview.isAvailableAsync()) && (await StoreReview.hasAction())) {
      await StoreReview.requestReview();
      return;
    }
  } catch {}
  const url = StoreReview.storeUrl();
  if (url) openLink(url);
}

/**
 * Counts app opens and, once, after at least 5 opens over 3+ days, asks the
 * store to show its review prompt. The store decides whether it actually
 * appears (Google and Apple limit how often).
 */
export async function maybeAskForReview() {
  if (Platform.OS === 'web') return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const s: State = raw ? JSON.parse(raw) : { opens: 0, firstOpen: Date.now(), asked: false };
    s.opens += 1;
    const days = (Date.now() - s.firstOpen) / 86_400_000;
    const ask = !s.asked && s.opens >= 5 && days >= 3;
    if (ask) s.asked = true;
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
    if (ask && (await StoreReview.isAvailableAsync())) setTimeout(() => StoreReview.requestReview().catch(() => {}), 4000);
  } catch {}
}
