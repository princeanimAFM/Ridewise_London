import { useEffect, useRef } from 'react';
import Tabs from 'expo-router/js-tabs';
import { Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ColorValue } from 'react-native';
import type { IconName } from '@/components/ui';
import { useTheme } from '@/theme';
import { FLOATING_BAR, GlassBar, floatingBarBottom } from '@/components/Glass';
import { useAuth } from '@/lib/auth';
import { backendReady } from '@/lib/supabase';
import { welcomeDone } from '@/lib/welcome';

const tab = (icon: IconName) => ({ color, size }: { color: ColorValue; size: number }) => (
  <Ionicons name={icon} color={color as string} size={size} />
);

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
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
        // glass looks: the header continues the gradient, and the tab bar is a pill that floats over the screen
        headerStyle: { backgroundColor: t.glass && t.backdrop ? t.backdrop[0] : t.primary },
        headerShadowVisible: !t.glass,
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.textMuted,
        tabBarStyle: t.glass
          ? {
              position: 'absolute',
              left: 14,
              right: 14,
              bottom: floatingBarBottom(insets.bottom),
              height: FLOATING_BAR,
              paddingTop: 6,
              paddingBottom: 6,
              borderRadius: FLOATING_BAR / 2,
              borderTopWidth: 0,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.22)',
              backgroundColor: 'transparent',
              shadowColor: '#000',
              shadowOpacity: 0.35,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
              elevation: 14,
            }
          : { backgroundColor: t.surface, borderTopColor: t.border },
        tabBarBackground: t.glass ? () => <GlassBar /> : undefined,
        sceneStyle: { backgroundColor: t.background },
        headerRight: () => (
          <Pressable onPress={() => router.push('/assistant')} hitSlop={10} style={{ marginRight: 16 }} accessibilityLabel="Ask the AFM Assistant">
            <Ionicons name="chatbubble-ellipses" size={24} color={t.gold} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false, tabBarIcon: tab('home-outline') }} />
      <Tabs.Screen name="bible" options={{ title: 'Bible', headerTitle: 'Holy Bible', tabBarIcon: tab('book-outline') }} />
      <Tabs.Screen name="sermons" options={{ title: 'Sermons', tabBarIcon: tab('play-circle-outline') }} />
      <Tabs.Screen name="store" options={{ title: 'Store', tabBarIcon: tab('bag-handle-outline') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: tab('menu-outline') }} />
    </Tabs>
  );
}
