import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ministry } from '@/content/ministry';
import { openLink } from '@/lib/links';
import { Artwork, Body, Button, Card, Chip, Screen, Title } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

type Tab = 'books' | 'fragrance';

export default function Store() {
  const t = useTheme();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'fragrance' ? 'fragrance' : 'books');

  useEffect(() => {
    if (params.tab === 'books' || params.tab === 'fragrance') setTab(params.tab);
  }, [params.tab]);

  return (
    <Screen>
      <View style={styles.tabs}>
        <Chip label="AFM Books" active={tab === 'books'} onPress={() => setTab('books')} />
        <Chip label={ministry.fragrances.brandName} active={tab === 'fragrance'} onPress={() => setTab('fragrance')} />
      </View>

      {tab === 'books' ? (
        <>
          <Body muted style={{ marginBottom: space.md }}>
            Books by {ministry.minister}, available on Amazon.
          </Body>
          <View style={styles.grid}>
            {ministry.books.map((b) => (
              <Card key={b.id} style={styles.tile} onPress={() => router.push({ pathname: '/book/[id]', params: { id: b.id } })}>
                <Artwork uri={b.cover} icon="book" label={b.title} style={styles.bookCover} />
                <View style={styles.tileText}>
                  <Text numberOfLines={2} style={[styles.tileTitle, { color: t.text }]}>
                    {b.title}
                  </Text>
                  {b.price && <Text style={{ color: t.accent, fontWeight: '700', marginTop: 2 }}>{b.price}</Text>}
                </View>
              </Card>
            ))}
          </View>
        </>
      ) : (
        <>
          <Title>{ministry.fragrances.brandName}</Title>
          <Body muted style={{ marginBottom: space.md }}>
            {ministry.fragrances.brandStory}
          </Body>
          {ministry.fragrances.launched && ministry.fragrances.items.length > 0 ? (
            <View style={styles.grid}>
              {ministry.fragrances.items.map((f) => (
                <Card key={f.id} style={styles.tile} onPress={() => router.push({ pathname: '/fragrance/[id]', params: { id: f.id } })}>
                  <Artwork uri={f.image} icon="sparkles" label={f.name} style={styles.fragranceImage} />
                  <View style={styles.tileText}>
                    <Text style={[styles.tileTitle, { color: t.text }]}>{f.name}</Text>
                    <Text numberOfLines={1} style={{ color: t.textMuted, fontSize: 13 }}>
                      {f.tagline}
                    </Text>
                    {f.price && <Text style={{ color: t.accent, fontWeight: '700', marginTop: 2 }}>{f.price}</Text>}
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <View style={[styles.soon, { backgroundColor: t.primary }]}>
              <Ionicons name="sparkles" size={34} color={t.gold} />
              <Text style={[styles.soonKicker, { color: t.gold }]}>COMING SOON</Text>
              <Text style={styles.soonTitle}>{ministry.fragrances.brandName}</Text>
              <Text style={styles.soonText}>The collection is being prepared. Check back here for the launch.</Text>
              {ministry.fragrances.previewPhotos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.peek} contentContainerStyle={{ gap: space.sm, paddingHorizontal: 2 }}>
                  {ministry.fragrances.previewPhotos.map((src, i) => (
                    <Artwork key={i} uri={src} icon="sparkles" style={styles.peekPhoto} />
                  ))}
                </ScrollView>
              )}
              <Button
                label="Ask to be told at launch"
                icon="mail-outline"
                variant="gold"
                onPress={() =>
                  openLink(`mailto:${ministry.contact.email}?subject=${encodeURIComponent(`${ministry.fragrances.brandName} launch`)}&body=${encodeURIComponent('Please let me know when the collection launches.')}`)
                }
                style={{ marginTop: space.md, alignSelf: 'stretch' }}
              />
            </View>
          )}
          {!!ministry.fragrances.shopUrl && (
            <Button label="Visit the Shop" icon="bag-handle-outline" variant="gold" onPress={() => openLink(ministry.fragrances.shopUrl)} style={{ marginTop: space.lg }} />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  soon: { borderRadius: 20, padding: space.lg, alignItems: 'center', gap: space.xs },
  soonKicker: { fontSize: 12, fontWeight: '700', letterSpacing: 2, marginTop: space.sm },
  soonTitle: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 26, fontWeight: '700', textAlign: 'center' },
  peek: { alignSelf: 'stretch', marginTop: space.md },
  peekPhoto: { width: 200, height: 250, borderRadius: radius.md },
  soonText: { color: '#DCE8DC', textAlign: 'center', marginTop: space.xs },
  tabs: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: { flexBasis: '46%', flexGrow: 1, maxWidth: '48.5%' },
  bookCover: { width: '100%', aspectRatio: 2 / 3, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  fragranceImage: { width: '100%', aspectRatio: 1 },
  tileText: { padding: space.sm },
  tileTitle: { fontSize: 15, fontWeight: '700' },
});
