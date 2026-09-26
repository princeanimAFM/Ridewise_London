import Stack from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme';
import { PlayerProvider } from '@/lib/player';

export default function RootLayout() {
  const t = useTheme();
  return (
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
        <Stack.Screen name="book/[id]" options={{ title: 'Book' }} />
        <Stack.Screen name="fragrance/[id]" options={{ title: 'Fragrance' }} />
        <Stack.Screen name="about" options={{ title: 'About Ministry' }} />
        <Stack.Screen name="connect" options={{ title: 'Contact Us' }} />
        <Stack.Screen name="archive" options={{ title: 'Archive' }} />
        <Stack.Screen name="prayer" options={{ title: 'Prayer Request' }} />
      </Stack>
    </PlayerProvider>
  );
}
