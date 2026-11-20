import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BOOKS, NEW_TESTAMENT_START } from '@/content/bible';
import { bookName, parseReference, reference, TRANSLATIONS, useBible, useBiblePrefs, useDownloads, useMarks, verseOfTheDay } from '@/lib/bible';
import { applyPrefs, getPrefs, permissionStatus, supported } from '@/lib/notifications';
import { Screen, SectionHeader } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

/** Bible home: continue reading first, then search, the study tools as tiles, verse of the day and the 66 books. */
export default function BibleHome() {
  const t = useTheme();
  const prefs = useBiblePrefs();
  const marks = useMarks();
  useBible(prefs.translation); // loads the version so book names show in its language
  useDownloads();
  const [query, setQuery] = useState('');
  const [testament, setTestament] = useState<'old' | 'new' | null>(null);
  const shown = testament ?? (prefs.last && prefs.last.book >= NEW_TESTAMENT_START ? 'new' : 'old');
  // Offer the daily verse notification on phones where it is not on yet.
  const [verseReminder, setVerseReminder] = useState<'hidden' | 'offer' | 'on'>('hidden');
  useEffect(() => {
    if (!supported) return;
    Promise.all([getPrefs(), permissionStatus()]).then(([p, status]) => setVerseReminder(p.dailyVerse && status === 'granted' ? 'hidden' : 'offer'));
  }, []);
  const remindMe = async () => {
    const { granted } = await applyPrefs({ ...(await getPrefs()), prompted: true, dailyVerse: true });
    setVerseReminder(granted ? 'on' : 'offer');
  };
  const votd = verseOfTheDay();
  const saved = Object.keys(marks).length;

  const go = () => {
    const q = query.trim();
    if (!q) return;
    const ref = parseReference(q);
    if (ref) router.push({ pathname: '/bible/read', params: { book: ref.book, chapter: ref.chapter, verse: ref.verse ?? '' } });
    else router.push({ pathname: '/bible/search', params: { q } });
  };

  const bookGrid = (from: number, to: number) => (
    <View style={styles.books}>
      {BOOKS.slice(from, to).map(([id], i) => (
        <Pressable
          key={id}
          onPress={() => router.push({ pathname: '/bible/[book]', params: { book: from + i } })}
          style={({ pressed }) => [styles.book, { backgroundColor: t.surface, borderColor: t.border }, pressed && { opacity: 0.75 }]}
        >
          <Text numberOfLines={1} style={{ color: t.text, fontWeight: '600' }}>{bookName(from + i)}</Text>
        </Pressable>
      ))}
    </View>
  );

  // Where "Continue reading" goes: the last chapter read, or the start of the Bible.
  const last = prefs.last;
  const here = last ?? { book: 0, chapter: 1 };
  const chapters = BOOKS[here.book]?.[2] ?? 1;
  const progress = Math.min(1, here.chapter / chapters);
  const openHere = () => router.push({ pathname: '/bible/read', params: { book: here.book, chapter: here.chapter } });

  const tools: { icon: keyof typeof Ionicons.glyphMap; label: string; badge?: string; count?: number; to: Href }[] = [
    { icon: 'school', label: 'Studies', to: '/bible/studies' },
    { icon: 'map', label: 'Maps', to: '/bible/map' },
    { icon: 'reader', label: 'Dictionary', to: '/bible/dictionary' },
    { icon: 'library', label: 'Concordance', to: '/bible/concordance' },
    { icon: 'bookmarks', label: 'My notes', count: saved, to: '/bible/saved' },
    { icon: 'language', label: 'Version', badge: TRANSLATIONS[prefs.translation].short, to: '/bible/versions' },
  ];

  return (
    <Screen>
      <Pressable
        onPress={openHere}
        accessibilityRole="button"
        accessibilityLabel={`${last ? 'Continue reading' : 'Start reading'} ${reference(here.book, here.chapter)}`}
        style={({ pressed }) => [styles.hero, { backgroundColor: t.primary }, pressed && { opacity: 0.92 }]}
      >
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="book" size={26} color={t.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: t.gold }]}>{last ? 'CONTINUE READING' : 'START READING'}</Text>
            <Text style={styles.heroRef} numberOfLines={1}>{reference(here.book, here.chapter)}</Text>
          </View>
          <View style={[styles.heroGo, { backgroundColor: t.gold }]}>
            <Ionicons name="arrow-forward" size={22} color={t.primary} />
          </View>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(4, progress * 100)}%`, backgroundColor: t.gold }]} />
        </View>
        <Text style={[styles.heroSub, { color: t.onPrimaryMuted }]}>
          Chapter {here.chapter} of {chapters} · {TRANSLATIONS[prefs.translation].short}
        </Text>
      </Pressable>

      <View style={[styles.search, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Ionicons name="search" size={18} color={t.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={go}
          returnKeyType="search"
          placeholder="Search a word, or go to John 3:16"
          placeholderTextColor={t.textMuted}
          style={[styles.searchInput, { color: t.text }]}
        />
        {!!query && (
          <Pressable onPress={go} hitSlop={8}>
            <Ionicons name="arrow-forward-circle" size={26} color={t.accent} />
          </Pressable>
        )}
      </View>

      <View style={styles.tools}>
        {tools.map((x) => (
          <Pressable
            key={x.label}
            onPress={() => router.push(x.to)}
            accessibilityRole="button"
            accessibilityLabel={x.badge ? `${x.label}: ${x.badge}` : x.label}
            style={({ pressed }) => [styles.tool, { backgroundColor: t.surface, borderColor: t.border }, pressed && { opacity: 0.75 }]}
          >
            <View style={[styles.toolIcon, { backgroundColor: t.surfaceAlt }]}>
              {x.badge ? (
                <Text style={{ color: t.primary, fontWeight: '800', fontSize: 13 }} numberOfLines={1}>{x.badge}</Text>
              ) : (
                <Ionicons name={x.icon} size={24} color={t.accent} />
              )}
              {!!x.count && (
                <View style={[styles.count, { backgroundColor: t.primary }]}>
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>{x.count > 99 ? '99+' : x.count}</Text>
                </View>
              )}
            </View>
            <Text style={{ color: t.text, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{x.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => router.push({ pathname: '/bible/read', params: { book: votd.book, chapter: votd.chapter, verse: votd.verse } })}
        style={({ pressed }) => [styles.votd, { backgroundColor: t.surface, borderColor: t.border }, pressed && { opacity: 0.9 }]}
      >
        <Text style={[styles.kicker, { color: t.accent }]}>VERSE OF THE DAY</Text>
        <Text style={[styles.votdText, { color: t.text }]}>“{votd.text}”</Text>
        <Text style={[styles.votdRef, { color: t.textMuted }]}>{votd.ref} · KJV</Text>
      </Pressable>
      {verseReminder !== 'hidden' && (
        <Pressable onPress={remindMe} disabled={verseReminder === 'on'} style={styles.remind} hitSlop={6}>
          <Ionicons name={verseReminder === 'on' ? 'checkmark-circle' : 'notifications-outline'} size={18} color={t.accent} />
          <Text style={{ color: t.accent, fontWeight: '700' }}>
            {verseReminder === 'on' ? 'Done: you will get the Verse of the Day every morning' : 'Send me the Verse of the Day every morning'}
          </Text>
        </Pressable>
      )}

      <SectionHeader title="Books of the Bible" />
      <View style={[styles.segment, { backgroundColor: t.surfaceAlt }]}>
        {(['old', 'new'] as const).map((k) => (
          <Pressable
            key={k}
            onPress={() => setTestament(k)}
            accessibilityRole="tab"
            accessibilityState={{ selected: shown === k }}
            style={[styles.segmentButton, shown === k && { backgroundColor: t.primary }]}
          >
            <Text style={{ color: shown === k ? '#FFFFFF' : t.text, fontWeight: '700' }}>{k === 'old' ? 'Old Testament' : 'New Testament'}</Text>
          </Pressable>
        ))}
      </View>
      {shown === 'old' ? bookGrid(0, NEW_TESTAMENT_START) : bookGrid(NEW_TESTAMENT_START, BOOKS.length)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, padding: space.md, marginBottom: space.md },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  heroIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' },
  heroRef: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 24, fontWeight: '700', marginTop: 2 },
  heroGo: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)', marginTop: space.md, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  heroSub: { marginTop: 6, fontSize: 13, fontWeight: '600' },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: space.md, marginBottom: space.md },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 12 },
  tools: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.sm, marginBottom: space.md },
  tool: { width: '31.5%', alignItems: 'center', gap: 6, paddingVertical: space.md, paddingHorizontal: 4, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  toolIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  count: { position: 'absolute', top: -4, right: -8, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  votd: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: space.md, marginBottom: space.md },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  votdText: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 27, marginTop: space.sm },
  votdRef: { marginTop: space.sm, fontWeight: '600' },
  remind: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -space.sm, marginBottom: space.md, paddingHorizontal: 4 },
  segment: { flexDirection: 'row', borderRadius: radius.md, padding: 4, marginBottom: space.md },
  segmentButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.sm },
  books: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  book: { width: '48.5%', paddingVertical: 12, paddingHorizontal: space.md, borderRadius: radius.sm, borderWidth: StyleSheet.hairlineWidth },
});
