import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ministry } from '@/content/ministry';
import { quoteOfTheDay, sermonsByDate } from '@/lib/content';
import { openLink } from '@/lib/links';
import { ArchiveCard } from '@/components/ArchiveCard';
import { PlatformGrid } from '@/components/PlatformGrid';
import { QuoteCard } from '@/components/QuoteCard';
import { SermonCard } from '@/components/SermonCard';
import { EpisodeRow } from '@/components/EpisodeRow';
import { useEpisodes } from '@/lib/podcast';
import { Artwork, IconName, Screen, SectionHeader } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

type Shortcut = { icon: IconName; label: string; onPress: () => void };

export default function Home() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const latest = sermonsByDate[0];
  const { episodes } = useEpisodes();

  const shortcuts: Shortcut[] = [
    { icon: 'play-circle-outline', label: 'Sermons', onPress: () => router.push('/sermons') },
    { icon: 'book-outline', label: 'Books', onPress: () => router.push({ pathname: '/store', params: { tab: 'books' } }) },
    { icon: 'sparkles-outline', label: 'Fragrance', onPress: () => router.push({ pathname: '/store', params: { tab: 'fragrance' } }) },
    { icon: 'library-outline', label: 'Handbook', onPress: () => router.push('/handbook') },
    { icon: 'information-circle-outline', label: 'About', onPress: () => router.push('/about') },
    ministry.contact.givingUrl
      ? { icon: 'gift-outline', label: 'Give', onPress: () => openLink(ministry.contact.givingUrl) }
      : { icon: 'chatbox-outline', label: 'Contact', onPress: () => router.push('/connect') },
  ];

  const heroContent = (
    <View style={[styles.heroInner, { paddingTop: insets.top + space.lg }]}>
      <View style={styles.logoWrap}>
        <Artwork uri={ministry.logo} icon="leaf" style={styles.logo} />
      </View>
      <Text style={styles.name}>{ministry.name}</Text>
      <Text style={[styles.minister, { color: t.gold }]}>{ministry.minister}</Text>
      <Text style={styles.tagline}>{ministry.tagline}</Text>
    </View>
  );

  return (
    <Screen padded={false}>
      <View style={{ backgroundColor: t.primary }}>{heroContent}</View>

      <View style={{ padding: space.md }}>
        <View style={styles.grid}>
          {shortcuts.map((s) => (
            <Pressable
              key={s.label}
              onPress={s.onPress}
              style={({ pressed }) => [styles.shortcut, { backgroundColor: t.surface, borderColor: t.border }, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name={s.icon} size={26} color={t.accent} />
              <Text style={{ color: t.text, fontWeight: '600', marginTop: 6 }}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: space.md }} />
        <ArchiveCard />

        <View style={{ height: space.md }} />
        <QuoteCard quote={quoteOfTheDay()} featured />

        {episodes.length > 0 && (
          <>
            <SectionHeader title="Latest Messages" action="See all" onAction={() => router.push('/sermons')} />
            {episodes.slice(0, 3).map((e) => (
              <EpisodeRow key={e.id} episode={e} />
            ))}
          </>
        )}

        <SectionHeader title="Meet the Prophet" />
        <Pressable
          onPress={() => router.push('/biography')}
          style={({ pressed }) => [styles.feature, { backgroundColor: t.surface, borderColor: t.border }, pressed && { opacity: 0.85 }]}
        >
          <Artwork uri={ministry.portrait} icon="person" style={styles.portrait} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.featureTitle, { color: t.text }]}>{ministry.minister}</Text>
            <Text numberOfLines={3} style={{ color: t.textMuted, marginTop: 4 }}>
              Prophet, theologian, apologist, author and founder of the AFM Family Network.
            </Text>
            <Text style={{ color: t.accent, fontWeight: '700', marginTop: space.sm }}>Read his biography →</Text>
          </View>
        </Pressable>

        {latest && (
          <>
            <SectionHeader title="Latest Sermon" action="See all" onAction={() => router.push('/sermons')} />
            <SermonCard sermon={latest} large />
          </>
        )}

        <SectionHeader title="Watch, Listen & Follow" />
        <PlatformGrid />

        <SectionHeader title="AFM Books" action="See all" onAction={() => router.push({ pathname: '/store', params: { tab: 'books' } })} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md }}>
          {ministry.books.map((b) => (
            <Pressable key={b.id} onPress={() => router.push({ pathname: '/book/[id]', params: { id: b.id } })} style={{ width: 130 }}>
              <Artwork uri={b.cover} icon="book" label={b.title} style={styles.cover} />
              <Text numberOfLines={2} style={[styles.bookTitle, { color: t.text }]}>
                {b.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroInner: { paddingHorizontal: space.lg, paddingBottom: space.xl + space.md, alignItems: 'center' },
  logoWrap: { backgroundColor: '#FFFFFF', borderRadius: 48, padding: 6, marginBottom: space.md },
  logo: { width: 84, height: 84, borderRadius: 42 },
  name: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 32, fontWeight: '700', textAlign: 'center' },
  minister: { fontSize: 15, fontWeight: '600', marginTop: space.xs, textAlign: 'center' },
  tagline: { color: '#DCE8DC', fontStyle: 'italic', marginTop: space.sm, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: -space.lg },
  shortcut: {
    flexBasis: '31%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cover: { width: 130, height: 195, borderRadius: radius.sm },
  feature: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  portrait: { width: 96, height: 96, borderRadius: 48 },
  featureTitle: { fontFamily: fonts.serif, fontSize: 17, fontWeight: '700' },
  bookTitle: { fontWeight: '600', marginTop: space.xs },
});
