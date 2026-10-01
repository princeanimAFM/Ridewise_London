import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useContent } from '@/lib/liveContent';
import { openLink, whatsappUrl } from '@/lib/links';
import { Artwork, Body, Button, Chip, Screen, SectionHeader, Title } from '@/components/ui';
import { VideoPlayer } from '@/components/VideoPlayer';
import { sizePrices } from '@/lib/video';
import { radius, space, useTheme } from '@/theme';

/** "0592 717 859" → "+233592717859" so the number also works when dialled from abroad. */
function telLink(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '');
  return `tel:${/^0\d{9}$/.test(digits) ? `+233${digits.slice(1)}` : digits}`;
}

export default function FragranceDetail() {
  const ministry = useContent();
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = ministry.fragrances.items.find((f) => f.id === id);
  const sizes = sizePrices(item?.size, item?.price);
  const [picked, setPicked] = useState(0);
  if (!item) return <Screen><Body>Product not found.</Body></Screen>;

  const choice = sizes[picked];
  const size = choice?.size ?? item.size;
  const price = choice?.price ?? item.price;
  const order = `Hello, I would like to order ${item.name}${size ? ` (${size})` : ''}.`;
  const orderOnWhatsapp = whatsappUrl(order);
  const phones = ministry.fragrances.orderPhones.split(',').map((p) => p.trim()).filter(Boolean);

  return (
    <Screen>
      <Stack.Screen options={{ title: item.name }} />
      <Artwork uri={item.image} icon="sparkles" label={item.name} style={styles.image} />
      <Text style={[styles.brand, { color: t.accent }]}>{ministry.fragrances.brandName.toUpperCase()}</Text>
      <Title>{item.name}</Title>
      <Text style={{ color: t.textMuted, fontSize: 16, marginBottom: space.md }}>{item.tagline}</Text>
      {item.description ? <Body>{item.description}</Body> : null}

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

      <View style={[styles.buy, { borderColor: t.border }]}>
        {sizes.length > 0 ? (
          <>
            <Text style={[styles.label, { color: t.textMuted }]}>CHOOSE A SIZE</Text>
            <View style={styles.sizeChips}>
              {sizes.map((r, i) => (
                <Chip key={r.size} label={r.size} active={i === picked} onPress={() => setPicked(i)} />
              ))}
            </View>
          </>
        ) : size ? (
          <Text style={{ color: t.textMuted }}>{size}</Text>
        ) : null}
        {price ? <Text style={[styles.price, { color: t.text }]}>{price}</Text> : null}
      </View>

      {item.buyUrl ? (
        <Button label="Buy Now" icon="bag-handle-outline" variant="gold" onPress={() => openLink(item.buyUrl)} style={styles.action} />
      ) : null}
      {orderOnWhatsapp ? (
        <Button label="Order on WhatsApp" icon="logo-whatsapp" onPress={() => openLink(orderOnWhatsapp)} style={styles.action} />
      ) : null}
      {phones.map((p, i) => (
        <Button
          key={p}
          label={`Call to order: ${p}`}
          icon="call-outline"
          variant={i === 0 && !item.buyUrl ? 'gold' : 'outline'}
          onPress={() => openLink(telLink(p))}
          style={styles.action}
        />
      ))}
      <Button
        label="Order by email"
        icon="mail-outline"
        variant="outline"
        onPress={() => openLink(`mailto:${ministry.contact.email}?subject=${encodeURIComponent(`Order: ${item.name}${size ? ` (${size})` : ''}`)}&body=${encodeURIComponent(order)}`)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 4 / 5, borderRadius: radius.md, marginBottom: space.md },
  brand: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  notes: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  note: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  buy: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: space.md, marginVertical: space.lg, gap: space.sm },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  sizeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  price: { fontSize: 28, fontWeight: '700' },
  action: { marginBottom: space.sm },
});
