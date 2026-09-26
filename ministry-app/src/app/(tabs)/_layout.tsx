import { useEffect, useRef } from 'react';
import Tabs from 'expo-router/js-tabs';
import { Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ColorValue } from 'react-native';
import type { IconName } from '@/components/ui';
import { useTheme } from '@/theme';
import { useAuth } from '@/lib/auth';
import { backendReady } from '@/lib/supabase';
import { welcomeDone } from '@/lib/welcome';

const tab = (icon: IconName) => ({ color, size }: { color: ColorValue; size: number }) => (
  <Ionicons name={icon} color={color} size={size} />
);

export default function TabsLayout() {
  const t = useTheme();
  const { session, loading } = useAuth();
  const checked = useRef(false);

  // First time the phone app opens (and nobody is signed in): show the welcome / sign-in screen.
  useEffect(() => {
    if (checked.current || loading || Platform.OS === 'web' || !backendReady) return;
    checked.current = true;
    if (session) return;
    welcomeDone().then((done) => {
      if (!done) router.push('/welcome');
    });
  }, [loading, session]);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.textMuted,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border },
        sceneStyle: { backgroundColor: t.background },
        headerRight: () => (
          <Pressable onPress={() => router.push('/assistant')} hitSlop={10} style={{ marginRight: 16 }} accessibilityLabel="Ask the AFM Assistant">
            <Ionicons name="chatbubble-ellipses" size={24} color={t.gold} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false, tabBarIcon: tab('home-outline') }} />
      <Tabs.Screen name="sermons" options={{ title: 'Sermons', tabBarIcon: tab('play-circle-outline') }} />
      <Tabs.Screen name="quotes" options={{ title: 'Quotes', tabBarIcon: tab('chatbubble-ellipses-outline') }} />
      <Tabs.Screen name="store" options={{ title: 'Store', tabBarIcon: tab('bag-handle-outline') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: tab('menu-outline') }} />
    </Tabs>
  );
}
