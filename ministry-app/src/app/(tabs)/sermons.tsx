import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ministry } from '@/content/ministry';
import { useEpisodes } from '@/lib/podcast';
import { sermonsByDate } from '@/lib/content';
import { ArchiveCard } from '@/components/ArchiveCard';
import { PhotoHero } from '@/components/PhotoHero';
import { EpisodeRow } from '@/components/EpisodeRow';
import { PlatformGrid } from '@/components/PlatformGrid';
import { SermonCard } from '@/components/SermonCard';
import { Body, Button, Screen, SectionHeader } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

const PAGE = 30;

export default function Sermons() {
  const t = useTheme();
  const { episodes, loading, error, refresh } = useEpisodes();
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? episodes.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)) : episodes;
  }, [episodes, query]);

  return (
    <Screen>
      <PhotoHero source={ministry.photos.sermons} height={250} position="top" style={styles.hero}>
        <Text style={[styles.kicker, { color: t.gold }]}>{ministry.podcast.title.toUpperCase()}</Text>
        <Text style={styles.heroTitle}>Sermons & Teachings</Text>
        <Text style={styles.heroSub}>{episodes.length ? `${episodes.length} messages to play in the app` : '500+ audio messages'}</Text>
      </PhotoHero>
      {episodes.length > 0 && (
        <View style={[styles.search, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Ionicons name="search-outline" size={20} color={t.textMuted} />
          <TextInput
            value={query}
            onChangeText={(v) => {
              setQuery(v);
              setLimit(PAGE);
            }}
            placeholder={`Search ${episodes.length} messages…`}
            placeholderTextColor={t.textMuted}
            style={[styles.input, { color: t.text }]}
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {sermonsByDate.length > 0 && (
        <>
          <SectionHeader title="Featured" />
          {sermonsByDate.map((s) => (
            <SermonCard key={s.id} sermon={s} />
          ))}
        </>
      )}

      {loading && episodes.length === 0 && (
        <View style={styles.center}>
          <ActivityIndicator color={t.accent} />
          <Body muted style={{ marginTop: space.sm }}>
            Loading {ministry.podcast.title}…
          </Body>
        </View>
      )}

      {episodes.length > 0 && (
        <>
          <SectionHeader title={query ? `${results.length} results` : ministry.podcast.title} />
          {results.slice(0, limit).map((e) => (
            <EpisodeRow key={e.id} episode={e} />
          ))}
          {results.length > limit && (
            <Button label="Show more" variant="outline" onPress={() => setLimit((l) => l + PAGE)} />
          )}
          {results.length === 0 && <Body muted style={{ textAlign: 'center' }}>No messages match your search.</Body>}
        </>
      )}

      {!loading && episodes.length === 0 && (
        <>
          {!!error && (
            <View style={[styles.notice, { backgroundColor: t.surfaceAlt }]}>
              <Text style={{ color: t.text, flex: 1 }}>Couldn't load the latest sermons right now.</Text>
              <Button label="Retry" variant="outline" onPress={refresh} style={{ paddingVertical: 6 }} />
            </View>
          )}
          <ArchiveCard />
        </>
      )}

      <SectionHeader title="Watch, Listen & Follow" />
      <PlatformGrid />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, marginBottom: space.md },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  heroTitle: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 26, fontWeight: '700', marginTop: 2 },
  heroSub: { color: '#DCE8DC', marginTop: 4 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.sm,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16 },
  center: { alignItems: 'center', paddingVertical: space.xl },
  notice: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md, marginBottom: space.md },
});
