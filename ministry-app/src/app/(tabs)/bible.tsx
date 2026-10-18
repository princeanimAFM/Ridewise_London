import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BOOKS, NEW_TESTAMENT_START } from '@/content/bible';
import { bookName, parseReference, reference, TRANSLATIONS, useBible, useBiblePrefs, useDownloads, useMarks, verseOfTheDay } from '@/lib/bible';
import { applyPrefs, getPrefs, permissionStatus, supported } from '@/lib/notifications';
import { Card, Screen, SectionHeader } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

/** Bible home: translation, search, continue reading, verse of the day and the 66 books. */
export default function BibleHome() {
  const t = useTheme();
  const prefs = useBiblePrefs();
  const marks = useMarks();
  useBible(prefs.translation); // loads the version so book names show in its language
  useDownloads();
  const [query, setQuery] = useState('');
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

  return (
    <Screen>
      <Card onPress={() => router.push('/bible/versions')} style={styles.continue}>
        <View style={[styles.badge, { backgroundColor: t.primary }]}>
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 11 }} numberOfLines={1}>{TRANSLATIONS[prefs.translation].short}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }} numberOfLines={1}>{TRANSLATIONS[prefs.translation].name}</Text>
          <Text style={{ color: t.textMuted, fontSize: 13 }}>Change version · download for offline</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={t.textMuted} />
      </Card>

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

      {prefs.last && (
        <Card onPress={() => router.push({ pathname: '/bible/read', params: { book: prefs.last!.book, chapter: prefs.last!.chapter } })} style={styles.continue}>
          <Ionicons name="bookmark-outline" size={22} color={t.accent} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.textMuted, fontSize: 13 }}>Continue reading</Text>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{reference(prefs.last.book, prefs.last.chapter)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={t.textMuted} />
        </Card>
      )}

      <Pressable
        onPress={() => router.push({ pathname: '/bible/read', params: { book: votd.book, chapter: votd.chapter, verse: votd.verse } })}
        style={({ pressed }) => [styles.votd, { backgroundColor: t.primary }, pressed && { opacity: 0.9 }]}
      >
        <Text style={[styles.kicker, { color: t.gold }]}>VERSE OF THE DAY</Text>
        <Text style={styles.votdText}>“{votd.text}”</Text>
        <Text style={[styles.votdRef, { color: t.onPrimaryMuted }]}>{votd.ref} · KJV</Text>
      </Pressable>
      {verseReminder !== 'hidden' && (
        <Pressable onPress={remindMe} disabled={verseReminder === 'on'} style={styles.remind} hitSlop={6}>
          <Ionicons name={verseReminder === 'on' ? 'checkmark-circle' : 'notifications-outline'} size={18} color={t.accent} />
          <Text style={{ color: t.accent, fontWeight: '700' }}>
            {verseReminder === 'on' ? 'Done: you will get the Verse of the Day every morning' : 'Send me the Verse of the Day every morning'}
          </Text>
        </Pressable>
      )}

      {saved > 0 && (
        <Card onPress={() => router.push('/bible/saved')} style={styles.continue}>
          <Ionicons name="color-wand-outline" size={22} color={t.accent} />
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 16, flex: 1 }}>My highlights, bookmarks & notes</Text>
          <Text style={{ color: t.textMuted }}>{saved}</Text>
          <Ionicons name="chevron-forward" size={20} color={t.textMuted} />
        </Card>
      )}

      <SectionHeader title="Old Testament" />
      {bookGrid(0, NEW_TESTAMENT_START)}
      <SectionHeader title="New Testament" />
      {bookGrid(NEW_TESTAMENT_START, BOOKS.length)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: { minWidth: 48, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: space.md, marginBottom: space.md },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 12 },
  continue: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, marginBottom: space.md },
  votd: { borderRadius: radius.md, padding: space.md, marginBottom: space.md },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  votdText: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 18, lineHeight: 27, marginTop: space.sm },
  votdRef: { marginTop: space.sm, fontWeight: '600' },
  remind: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -space.sm, marginBottom: space.md, paddingHorizontal: 4 },
  books: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  book: { width: '48.5%', paddingVertical: 12, paddingHorizontal: space.md, borderRadius: radius.sm, borderWidth: StyleSheet.hairlineWidth },
});
