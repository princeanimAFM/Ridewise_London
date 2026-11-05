import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useContent } from '@/lib/liveContent';
import { openLink } from '@/lib/links';
import { Artwork, Body, Button, Screen, SectionHeader, Title } from '@/components/ui';
import { VideoPlayer } from '@/components/VideoPlayer';
import { radius, space, useTheme } from '@/theme';

export default function FragranceDetail() {
  const ministry = useContent();
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = ministry.fragrances.items.find((f) => f.id === id);
  if (!item) return <Screen><Body>Product not found.</Body></Screen>;
  // Ordering and prices live on the brand's own website, not in the app (the app is a showcase).
  const shop = item.buyUrl || ministry.fragrances.shopUrl;

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

      {item.size ? (
        <View style={[styles.buy, { borderColor: t.border }]}>
          <Text style={[styles.label, { color: t.textMuted }]}>SIZES</Text>
          <Text style={{ color: t.text, fontSize: 16 }}>{item.size}</Text>
        </View>
      ) : null}

      {shop ? (
        <>
          <Button label={`Order at ${ministry.fragrances.brandName}`} icon="open-outline" variant="gold" onPress={() => openLink(shop)} style={styles.action} />
          <Text style={{ color: t.textMuted, fontSize: 13, textAlign: 'center' }}>Prices and ordering are on the {ministry.fragrances.brandName} website.</Text>
        </>
      ) : (
        <Text style={{ color: t.textMuted, fontSize: 14 }}>Ordering opens soon on the {ministry.fragrances.brandName} website.</Text>
      )}
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
  action: { marginBottom: space.sm },
});
