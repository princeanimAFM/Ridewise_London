import { ReactNode } from 'react';
import { ImageSourcePropType, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { fonts, radius, space, useTheme } from '@/theme';
import type { LinkItem } from '@/content/ministry';
import { openLink } from '@/lib/links';

export type IconName = keyof typeof Ionicons.glyphMap;

export function Screen({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  const t = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={[padded && { padding: space.md }, { paddingBottom: space.xl }]}
    >
      <View style={styles.maxWidth}>{children}</View>
    </ScrollView>
  );
}

export function Title({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const t = useTheme();
  return <Text style={[styles.title, { color: t.text }, style]}>{children}</Text>;
}

export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: TextStyle }) {
  const t = useTheme();
  return <Text style={[styles.body, { color: muted ? t.textMuted : t.text }, style]}>{children}</Text>;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const t = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: t.text }]}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ color: t.accent, fontWeight: '600' }}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function Card({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const base = [styles.card, { backgroundColor: t.surface, borderColor: t.border }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [...base, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

export function Button({
  label,
  icon,
  onPress,
  variant = 'primary',
  style,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  variant?: 'primary' | 'gold' | 'outline';
  style?: ViewStyle;
}) {
  const t = useTheme();
  const bg = variant === 'primary' ? t.primary : variant === 'gold' ? t.gold : 'transparent';
  const fg = variant === 'outline' ? t.text : variant === 'gold' ? '#1A1A1A' : t.onPrimary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: variant === 'outline' ? t.border : bg },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={18} color={fg} />}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** Shows an image, or a branded placeholder with an icon when no image is set. */
export function Artwork({
  uri,
  icon,
  label,
  style,
}: {
  uri?: string | ImageSourcePropType;
  icon: IconName;
  label?: string;
  style: ViewStyle;
}) {
  const t = useTheme();
  if (uri) {
    const source = typeof uri === 'string' ? { uri } : uri;
    return <Image source={source as never} style={[style as object, { backgroundColor: t.surfaceAlt }]} contentFit="cover" transition={200} />;
  }
  return (
    <View style={[style, styles.placeholder, { backgroundColor: t.primary }]}>
      <Ionicons name={icon} size={32} color={t.gold} />
      {label && (
        <Text numberOfLines={3} style={styles.placeholderLabel}>
          {label}
        </Text>
      )}
    </View>
  );
}

type RowIcon = IconName | { fa: keyof typeof FontAwesome.glyphMap };

const linkIcons: Record<LinkItem['icon'], RowIcon> = {
  youtube: 'logo-youtube',
  facebook: 'logo-facebook',
  instagram: 'logo-instagram',
  tiktok: 'logo-tiktok',
  x: 'logo-x',
  telegram: { fa: 'telegram' },
  spotify: { fa: 'spotify' },
  podcast: 'mic',
  globe: 'globe-outline',
  whatsapp: 'logo-whatsapp',
  mail: 'mail-outline',
  archive: 'archive-outline',
  book: 'library-outline',
  shield: 'shield-checkmark-outline',
};

export function LinkRow({ item }: { item: LinkItem }) {
  return <ListRow icon={linkIcons[item.icon]} title={item.label} subtitle={item.description} onPress={() => openLink(item.url)} />;
}

export function RowGlyph({ icon, size, color }: { icon: RowIcon; size: number; color: string }) {
  return typeof icon === 'string' ? (
    <Ionicons name={icon} size={size} color={color} />
  ) : (
    <FontAwesome name={icon.fa} size={size} color={color} />
  );
}

export function linkIcon(item: LinkItem) {
  return linkIcons[item.icon];
}

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: RowIcon;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: t.surface, borderColor: t.border }, pressed && { opacity: 0.8 }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: t.surfaceAlt }]}>
        <RowGlyph icon={icon} size={22} color={t.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: t.text }]}>{title}</Text>
        {subtitle && <Text style={{ color: t.textMuted, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={t.textMuted} />
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: active ? t.primary : t.border, backgroundColor: active ? t.primary : t.surface },
      ]}
    >
      <Text style={{ color: active ? t.onPrimary : t.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  maxWidth: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  title: { fontFamily: fonts.serif, fontSize: 26, fontWeight: '700', marginBottom: space.sm },
  body: { fontSize: 16, lineHeight: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 20, fontWeight: '700' },
  card: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: 12,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  placeholder: { alignItems: 'center', justifyContent: 'center', padding: space.sm, gap: space.xs },
  placeholderLabel: { color: '#FFFFFF', fontFamily: fonts.serif, fontWeight: '700', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.sm,
  },
  rowIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
});
