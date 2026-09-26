import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { sermonsByDate, sermonSeries } from '@/lib/content';
import { SermonCard } from '@/components/SermonCard';
import { ArchiveCard } from '@/components/ArchiveCard';
import { PlatformGrid } from '@/components/PlatformGrid';
import { Body, Chip, Screen, SectionHeader } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';

export default function Sermons() {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [series, setSeries] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sermonsByDate.filter(
      (s) =>
        (!series || s.series === series) &&
        (!q || [s.title, s.summary, s.scripture, s.series].some((f) => f?.toLowerCase().includes(q))),
    );
  }, [query, series]);

  if (sermonsByDate.length === 0) {
    return (
      <Screen>
        <ArchiveCard />
        <SectionHeader title="Watch & Listen" />
        <PlatformGrid />
      </Screen>
    );
  }

  return (
    <Screen>
      <ArchiveCard />
      <View style={{ height: space.md }} />
      <View style={[styles.search, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Ionicons name="search-outline" size={20} color={t.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search sermons, scriptures…"
          placeholderTextColor={t.textMuted}
          style={[styles.input, { color: t.text }]}
          clearButtonMode="while-editing"
        />
      </View>

      {sermonSeries.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" active={!series} onPress={() => setSeries(null)} />
          {sermonSeries.map((s) => (
            <Chip key={s} label={s} active={series === s} onPress={() => setSeries(s)} />
          ))}
        </ScrollView>
      )}

      {results.map((s) => (
        <SermonCard key={s.id} sermon={s} />
      ))}
      {results.length === 0 && (
        <Body muted style={{ textAlign: 'center', marginTop: space.lg }}>
          No sermons match your search.
        </Body>
      )}
      <Text style={{ color: t.textMuted, textAlign: 'center', marginTop: space.md }}>
        {results.length} sermon{results.length === 1 ? '' : 's'}
      </Text>
      <SectionHeader title="Watch & Listen" />
      <PlatformGrid />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16 },
  chips: { gap: space.sm, paddingVertical: space.md },
});
