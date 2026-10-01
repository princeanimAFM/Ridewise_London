import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useContent } from '@/lib/liveContent';
import { openLink, whatsappUrl } from '@/lib/links';
import { Artwork, Body, Button, Screen, SectionHeader, Title } from '@/components/ui';
import { VideoPlayer } from '@/components/VideoPlayer';
import { sizePrices } from '@/lib/video';
import { radius, space, useTheme } from '@/theme';

export default function FragranceDetail() {
  const ministry = useContent();
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = ministry.fragrances.items.find((f) => f.id === id);
  if (!item) return <Screen><Body>Product not found.</Body></Screen>;

  const sizes = sizePrices(item.size, item.price);
  const orderOnWhatsapp = whatsappUrl(`Hello, I would like to order ${item.name}${item.size ? ` (${item.size})` : ''}.`);

  return (
    <Screen>
      <Stack.Screen options={{ title: item.name }} />
      <Artwork uri={item.image} icon="sparkles" label={item.name} style={styles.image} />
      <Text style={[styles.brand, { color: t.accent }]}>{ministry.fragrances.brandName.toUpperCase()}</Text>
      <Title>{item.name}</Title>
      <Text style={{ color: t.textMuted, fontSize: 16, marginBottom: space.md }}>{item.tagline}</Text>
      <Body>{item.description}</Body>

      {item.notes && item.notes.length > 0 && (
        <View style={styles.notes}>
          {item.notes.map((n) => (
            <View key={n} style={[styles.note, { backgroundColor: t.surfaceAlt }]}>
              <Text style={{ color: t.text, fontWeight: '600' }}>{n}</Text>
            </View>
          ))}
        </View>
      )}

      {item.video ? (
        <>
          <SectionHeader title="The vision behind it" />
          <VideoPlayer link={item.video} />
        </>
      ) : null}

      {sizes.length > 0 ? (
        <View style={[styles.sizes, { borderColor: t.border }]}>
          {sizes.map((r, i) => (
            <View key={r.size} style={[styles.sizeRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: t.border }]}>
              <Text style={{ color: t.textMuted, fontSize: 16 }}>{r.size}</Text>
              <Text style={[styles.price, { color: t.text }]}>{r.price}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={[styles.priceRow, { borderColor: t.border }]}>
          <Text style={{ color: t.textMuted }}>{item.size}</Text>
          <Text style={[styles.price, { color: t.text }]}>{item.price}</Text>
        </View>
      )}

      {item.buyUrl ? (
        <Button label="Buy Now" icon="bag-handle-outline" variant="gold" onPress={() => openLink(item.buyUrl)} style={{ marginBottom: space.sm }} />
      ) : null}
      {orderOnWhatsapp ? (
        <Button label="Order on WhatsApp" icon="logo-whatsapp" onPress={() => openLink(orderOnWhatsapp)} />
      ) : !item.buyUrl ? (
        <Button label="Enquire by Email" icon="mail-outline" onPress={() => openLink(`mailto:${ministry.contact.email}?subject=${encodeURIComponent(`Order: ${item.name}`)}`)} />
      ) : null}

    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 4 / 5, borderRadius: radius.md, marginBottom: space.md },
  brand: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  notes: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  note: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.md,
    marginVertical: space.lg,
  },
  price: { fontSize: 22, fontWeight: '700' },
  sizes: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, marginVertical: space.lg },
  sizeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space.sm + 2 },
});
