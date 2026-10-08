import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Announcement } from '@/lib/announcements';
import { flyerUrl } from '@/lib/supabase';
import { formatDate, shareText } from '@/lib/links';
import { ministry } from '@/content/ministry';
import { Artwork, Button } from './ui';
import { fonts, radius, space, useTheme } from '@/theme';

export function AnnouncementCard({ item, compact }: { item: Announcement; compact?: boolean }) {
  const t = useTheme();
  const [open, setOpen] = useState(!compact);
  const image = flyerUrl(item.flyer_path);
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      {image && <Artwork uri={image} icon="calendar" style={compact ? styles.flyerCompact : styles.flyer} />}
      <View style={{ padding: space.md }}>
        {!!item.event_date && <Text style={[styles.date, { color: t.accent }]}>{formatDate(item.event_date).toUpperCase()}</Text>}
        <Text style={[styles.title, { color: t.text }]}>{item.title}</Text>
        <Pressable onPress={() => setOpen((o) => !o)}>
          <Text numberOfLines={open ? undefined : 3} style={{ color: t.text, fontSize: 16, lineHeight: 23, marginTop: space.xs }}>
            {item.body}
          </Text>
          {!open && <Text style={{ color: t.accent, fontWeight: '700', marginTop: 4 }}>Read more</Text>}
        </Pressable>
        {!compact && (
          <Button
            label="Share"
            icon="share-social-outline"
            variant="outline"
            onPress={() => shareText(`${item.title}${item.event_date ? ` — ${formatDate(item.event_date)}` : ''}\n\n${item.body}${image ? `\n\n${image}` : ''}\n\n${ministry.name}`)}
            style={{ marginTop: space.md }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: space.md },
  flyer: { width: '100%', aspectRatio: 4 / 5 },
  flyerCompact: { width: '100%', aspectRatio: 16 / 9 },
  date: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  title: { fontFamily: fonts.serif, fontSize: 20, fontWeight: '700', marginTop: 2 },
});
