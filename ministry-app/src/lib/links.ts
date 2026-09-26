import { Alert, Linking, Platform, Share } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { ministry } from '@/content/ministry';

/** Opens a link: web pages in an in-app browser, everything else (mailto, whatsapp, apps) externally. */
export async function openLink(url: string | undefined) {
  if (!url) {
    Alert.alert('Coming soon', 'This link has not been added yet.');
    return;
  }
  try {
    if (/^https?:\/\//.test(url) && Platform.OS !== 'web') {
      await WebBrowser.openBrowserAsync(url);
    } else {
      await Linking.openURL(url);
    }
  } catch {
    Alert.alert('Unable to open link', url);
  }
}

export function youtubeUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeThumb(id: string) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export function whatsappUrl(message: string) {
  const { whatsapp } = ministry.contact;
  return whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}` : undefined;
}

export async function shareText(message: string) {
  try {
    await Share.share({ message });
  } catch {
    // user dismissed or sharing unavailable
  }
}

export function shareApp() {
  const link = ministry.appShareUrl ? `\n${ministry.appShareUrl}` : '';
  return shareText(`Check out ${ministry.name} — sermons, quotes and books by ${ministry.minister}.${link}`);
}

export function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
