import { Pressable, StyleSheet, Text } from 'react-native';
import { View } from 'react-native';
import { useContent } from '@/lib/liveContent';
import { openLink } from '@/lib/links';
import { radius, space, useTheme } from '@/theme';
import { linkIcon, RowGlyph } from './ui';

/** Watch on YouTube / Listen on Spotify / Telegram / Instagram buttons. */
export function PlatformGrid() {
  const ministry = useContent();
  const t = useTheme();
  return (
    <View style={styles.grid}>
      {ministry.socials.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => openLink(s.url)}
          accessibilityRole="link"
          style={({ pressed }) => [styles.item, { backgroundColor: t.surface, borderColor: t.border }, pressed && { opacity: 0.8 }]}
        >
          <RowGlyph icon={linkIcon(s)} size={22} color={t.accent} />
          <Text numberOfLines={2} style={[styles.label, { color: t.text }]}>
            {s.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  item: {
    flexBasis: '46%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { flex: 1, fontWeight: '600' },
});
