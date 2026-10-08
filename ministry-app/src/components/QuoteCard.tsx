import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Quote } from '@/content/ministry';
import { shareText } from '@/lib/links';
import { ministry } from '@/content/ministry';
import { fonts, radius, space, useTheme } from '@/theme';
import { Button } from './ui';

export function QuoteCard({ quote, featured }: { quote: Quote; featured?: boolean }) {
  const t = useTheme();
  const bg = featured ? t.primary : t.surface;
  const fg = featured ? '#FFFFFF' : t.text;
  const share = () => shareText(`“${quote.text}”\n— ${quote.source ?? ministry.quoteSource}\n\n${ministry.name}`);
  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: featured ? bg : t.border }]}>
      {featured && <Text style={[styles.label, { color: t.gold }]}>QUOTE OF THE DAY</Text>}
      <Ionicons name="chatbox-ellipses" size={featured ? 28 : 20} color={t.gold} />
      <Text style={[styles.text, { color: fg, fontSize: featured ? 22 : 18 }]}>“{quote.text}”</Text>
      <View style={styles.footer}>
        <Text style={{ color: featured ? '#DCE8DC' : t.textMuted, flex: 1 }}>— {quote.source ?? ministry.quoteSource}</Text>
        <Button label="Share" icon="share-social-outline" variant={featured ? 'gold' : 'outline'} onPress={share} style={styles.share} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.lg, gap: space.sm, marginBottom: space.md },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  text: { fontFamily: fonts.serif, lineHeight: 30, fontStyle: 'italic' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  share: { paddingVertical: 8 },
});
