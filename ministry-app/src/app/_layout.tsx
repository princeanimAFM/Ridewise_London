import Stack from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme';
import { PlayerProvider } from '@/lib/player';
import { AuthProvider } from '@/lib/auth';
import { maybeAskForReview } from '@/lib/review';
import { refreshNotifications, supported as notificationsSupported } from '@/lib/notifications';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
  const t = useTheme();
  useEffect(() => {
    maybeAskForReview();
    refreshNotifications();
    if (!notificationsSupported) return;
    // Tapping a notification opens the matching screen.
    const open = (response: Notifications.NotificationResponse | null) => {
      const url = response?.notification.request.content.data?.url;
      if (typeof url === 'string' && url.startsWith('/')) router.push(url as never);
    };
    open(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);
  return (
    <AuthProvider>
    <PlayerProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: t.background },
          headerBackTitle: 'Back',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sermon/[id]" options={{ title: 'Sermon' }} />
        <Stack.Screen name="episode/[id]" options={{ title: 'Sermon' }} />
        <Stack.Screen name="biography" options={{ title: 'Biography' }} />
        <Stack.Screen name="handbook" options={{ title: 'The AFM Handbook' }} />
        <Stack.Screen name="assistant" options={{ title: 'AFM Assistant' }} />
        <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
        <Stack.Screen name="account/index" options={{ title: 'My Account' }} />
        <Stack.Screen name="account/sign-up" options={{ title: 'Create Account' }} />
        <Stack.Screen name="account/forgot" options={{ title: 'Password' }} />
        <Stack.Screen name="subscribe" options={{ title: 'Newsletter' }} />
        <Stack.Screen name="announcements" options={{ title: 'Announcements' }} />
        <Stack.Screen name="admin" options={{ title: 'Owner Dashboard' }} />
        <Stack.Screen name="give" options={{ title: 'Give' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="live" options={{ title: 'Live' }} />
        <Stack.Screen name="book/[id]" options={{ title: 'Book' }} />
        <Stack.Screen name="fragrance/[id]" options={{ title: 'Fragrance' }} />
        <Stack.Screen name="about" options={{ title: 'About Ministry' }} />
        <Stack.Screen name="connect" options={{ title: 'Contact Us' }} />
        <Stack.Screen name="archive" options={{ title: 'Archive' }} />
        <Stack.Screen name="prayer" options={{ title: 'Prayer Request' }} />
      </Stack>
    </PlayerProvider>
    </AuthProvider>
  );
}
