import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BOOKS } from '@/content/bible';
import { reference } from '@/lib/bible';
import { mapHash, MAPS_CREDIT, mentionsOf, place, placesIn, searchPlaces, SURE, usePlaces, type Place } from '@/lib/maps';
import { BibleMap, isDarkTheme } from '@/components/BibleMap';
import { Button } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

/**
 * Bible maps. With book & chapter: the places named in that chapter. With place: one place and every verse
 * that names it. With journey: a journey stop by stop. Otherwise: journeys, and search for any place.
 */
export default function BibleMaps() {
  const t = useTheme();
  const { height } = useWindowDimensions();
  const params = useLocalSearchParams<{ book?: string; chapter?: string; place?: string; journey?: string; sel?: string }>();
  const maps = usePlaces();
  const d = maps.data;
  const [sel, setSel] = useState<number | null>(params.sel ? Number(params.sel) : null);
  const [q, setQ] = useState('');

  const book = params.book != null ? Math.min(Math.max(Number(params.book) || 0, 0), BOOKS.length - 1) : undefined;
  const chapter = params.chapter ? Number(params.chapter) : undefined;
  const placeId = params.place != null && params.place !== '' ? Number(params.place) : undefined;
  const journey = d && params.journey ? d.journeys.find((j) => j.id === params.journey) : undefined;
  const view = journey ? { journey: journey.id } : placeId != null ? { place: placeId } : book != null && chapter ? { book, chapter } : {};
  const hash = mapHash(view, isDarkTheme(t.background), params.sel ? Number(params.sel) : null);

  const inChapter = useMemo(() => (d && book != null && chapter ? placesIn(d, book, chapter) : []), [d, book, chapter]);
  const found = useMemo(() => (d && q.trim() ? searchPlaces(d, q) : []), [d, q]);

  const read = (b: number, c: number, v?: number) => router.push({ pathname: '/bible/read', params: { book: b, chapter: c, verse: v ?? '' } });
  const openPlace = (id: number) => router.push({ pathname: '/bible/map', params: { place: id } });
  const pick = (id: number) => setSel(id);

  const title = journey ? journey.title : placeId != null && d ? place(d, placeId).name : book != null && chapter ? `Map · ${reference(book, chapter)}` : 'Bible maps';

  const placeRow = (p: Place, extra?: React.ReactNode, onPress?: () => void) => (
    <Pressable key={p.id} onPress={onPress ?? (() => openPlace(p.id))}
      style={({ pressed }) => [styles.row, { borderColor: sel === p.id ? t.accent : t.border, backgroundColor: t.surface }, pressed && { opacity: 0.8 }]}>
      <View style={[styles.dot, p.sure === 0 ? { borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.text } : { backgroundColor: p.sure === 2 ? '#1F5E3B' : '#B8892B' }]} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{p.name}</Text>
        <Text style={{ color: t.textMuted, fontSize: 12 }}>{SURE[p.sure]} · {p.kind}</Text>
        {extra}
      </View>
    </Pressable>
  );

  let body: React.ReactNode = null;
  if (!d) {
    body = maps.error ? (
      <View style={{ gap: space.sm }}>
        <Text style={{ color: t.textMuted }}>{maps.error}</Text>
        <Button label="Try again" icon="refresh" onPress={maps.retry} style={{ alignSelf: 'flex-start' }} />
      </View>
    ) : <ActivityIndicator color={t.accent} />;
  } else if (journey) {
    body = (
      <>
        <Text style={[styles.h1, { color: t.text }]}>{journey.title}</Text>
        <Text style={{ color: t.accent, fontWeight: '700', marginBottom: space.sm }}>{journey.ref}</Text>
        {!!journey.note && <Text style={{ color: t.textMuted, marginBottom: space.sm, lineHeight: 20 }}>{journey.note}</Text>}
        {journey.stops.map(([id, label], n) => {
          const p = place(d, id);
          return (
            <Pressable key={n} onPress={() => pick(id)} style={({ pressed }) => [styles.stop, { borderColor: sel === id ? t.accent : t.border, backgroundColor: t.surface }, pressed && { opacity: 0.8 }]}>
              <View style={[styles.num, { backgroundColor: t.primary }]}><Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>{n + 1}</Text></View>
              <Text style={{ color: t.text, fontWeight: '600', flex: 1 }}>{label || p.name}</Text>
              <Pressable onPress={() => openPlace(id)} hitSlop={8}><Text style={{ color: t.accent, fontWeight: '700', fontSize: 13 }}>Verses ›</Text></Pressable>
            </Pressable>
          );
        })}
      </>
    );
  } else if (placeId != null) {
    const p = place(d, placeId);
    const all = mentionsOf(d, placeId);
    body = (
      <>
        <Text style={[styles.h1, { color: t.text }]}>{p.name}</Text>
        <Text style={{ color: t.textMuted, marginBottom: space.sm }}>{SURE[p.sure]} · {p.kind} · named in {all.length} {all.length === 1 ? 'verse' : 'verses'}</Text>
        {p.sure < 2 && <Text style={{ color: t.textMuted, marginBottom: space.sm, lineHeight: 20 }}>Scholars aren’t fully sure where this was. The map shows the most likely site.</Text>}
        <Button label="Look it up in the Bible dictionary" icon="reader-outline" variant="outline" onPress={() => router.push({ pathname: '/bible/dictionary', params: { term: p.name } })} style={{ alignSelf: 'flex-start', marginBottom: space.md }} />
        <View style={styles.wrap}>
          {all.slice(0, 300).map((m, i) => (
            <Pressable key={i} onPress={() => read(m.book, m.chapter, m.verse)} style={[styles.chip, { borderColor: t.border, backgroundColor: t.surface }]}>
              <Text style={{ color: t.accent, fontWeight: '600', fontSize: 13 }}>{reference(m.book, m.chapter, [m.verse])}</Text>
            </Pressable>
          ))}
        </View>
      </>
    );
  } else if (book != null && chapter) {
    body = (
      <>
        <Text style={[styles.h1, { color: t.text }]}>Places in {reference(book, chapter)}</Text>
        {inChapter.length === 0 && <Text style={{ color: t.textMuted }}>No places are named in this chapter.</Text>}
        {inChapter.map(({ place: p, verses }) => placeRow(p, (
          <View style={[styles.wrap, { marginTop: 4 }]}>
            {verses.map((v) => (
              <Pressable key={v} onPress={() => read(book, chapter, v)} hitSlop={4}>
                <Text style={{ color: t.accent, fontWeight: '600', fontSize: 13 }}>v{v}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => openPlace(p.id)} hitSlop={4}>
              <Text style={{ color: t.textMuted, fontSize: 13 }}>· all {mentionsOf(d, p.id).length} verses ›</Text>
            </Pressable>
          </View>
        ), () => pick(p.id)))}
      </>
    );
  } else {
    body = (
      <>
        <View style={[styles.search, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Ionicons name="search" size={18} color={t.textMuted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Find a place, e.g. Bethel, Capernaum" placeholderTextColor={t.textMuted}
            autoCapitalize="words" style={[styles.input, { color: t.text }]} />
          {!!q && <Pressable onPress={() => setQ('')} hitSlop={8}><Ionicons name="close-circle" size={20} color={t.textMuted} /></Pressable>}
        </View>
        {q.trim() ? (
          found.length ? found.map((p) => placeRow(p)) : <Text style={{ color: t.textMuted }}>No place by that name.</Text>
        ) : (
          <>
            <Text style={[styles.label, { color: t.textMuted }]}>JOURNEYS</Text>
            {d.journeys.map((j) => (
              <Pressable key={j.id} onPress={() => router.push({ pathname: '/bible/map', params: { journey: j.id } })}
                style={({ pressed }) => [styles.row, { borderColor: t.border, backgroundColor: t.surface }, pressed && { opacity: 0.8 }]}>
                <Ionicons name="trail-sign-outline" size={20} color={t.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{j.title}</Text>
                  <Text style={{ color: t.textMuted, fontSize: 13 }}>{j.ref} · {j.stops.length} stops</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
              </Pressable>
            ))}
            <Text style={{ color: t.textMuted, marginTop: space.sm, lineHeight: 20 }}>Tap a dot on the map to see the place. While reading, tap “Map of this chapter” to see the places it names.</Text>
          </>
        )}
      </>
    );
  }

  // A place tapped on the map (in a chapter or journey): its name and verses, above the list.
  const picked = d && sel != null && placeId == null ? place(d, sel) : null;
  const pickedHere = picked && book != null && chapter ? inChapter.find((x) => x.place.id === picked.id)?.verses : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen options={{ title }} />
      <BibleMap hash={hash} selected={sel} onPlace={setSel} style={{ height: Math.round(height * 0.48) }} />
      <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}>
        <View style={styles.max}>
          {picked && (
            <View style={[styles.picked, { borderColor: t.accent, backgroundColor: t.surface }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontFamily: fonts.serif, fontSize: 18, fontWeight: '700' }}>{picked.name}</Text>
                <Text style={{ color: t.textMuted, fontSize: 12 }}>{SURE[picked.sure]}{pickedHere ? ` · verse ${pickedHere.join(', ')}` : ''}</Text>
              </View>
              <Button label="Verses" variant="outline" onPress={() => openPlace(picked.id)} />
            </View>
          )}
          {body}
          <Text style={{ color: t.textMuted, fontSize: 12, lineHeight: 18, marginTop: space.lg }}>{MAPS_CREDIT}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  max: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  h1: { fontFamily: fonts.serif, fontSize: 24, fontWeight: '700', marginBottom: space.xs },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: space.md, marginBottom: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
  stop: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm, marginBottom: 6 },
  num: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: space.md, marginBottom: space.md },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  picked: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: 1, borderRadius: radius.md, padding: space.md, marginBottom: space.md },
});
