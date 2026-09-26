import Tabs from 'expo-router/js-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ColorValue } from 'react-native';
import type { IconName } from '@/components/ui';
import { useTheme } from '@/theme';

const tab = (icon: IconName) => ({ color, size }: { color: ColorValue; size: number }) => (
  <Ionicons name={icon} color={color} size={size} />
);

export default function TabsLayout() {
  const t = useTheme();
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
