import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useContent } from '@/lib/liveContent';
import { quoteOfTheDay, sermonsByDate } from '@/lib/content';
import { ArchiveCard } from '@/components/ArchiveCard';
import { PlatformGrid } from '@/components/PlatformGrid';
import { QuoteCard } from '@/components/QuoteCard';
import { SermonCard } from '@/components/SermonCard';
import { EpisodeRow } from '@/components/EpisodeRow';
import { PhotoHero } from '@/components/PhotoHero';
import { useEpisodes } from '@/lib/podcast';
import { useAnnouncements } from '@/lib/announcements';
import { backendReady } from '@/lib/supabase';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { NotificationInvite } from '@/components/NotificationInvite';
import { Artwork, IconName, Screen, SectionHeader } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

type Shortcut = { icon: IconName; label: string; onPress: () => void };

export default function Home() {
  const ministry = useContent();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const latest = sermonsByDate[0];
  const { episodes } = useEpisodes();
  const { items: announcements } = useAnnouncements(2);

  const shortcuts: Shortcut[] = [
    { icon: 'play-circle-outline', label: 'Sermons', onPress: () => router.push('/sermons') },
    { icon: 'book-outline', label: 'Books', onPress: () => router.push({ pathname: '/store', params: { tab: 'books' } }) },
    { icon: 'radio-outline', label: 'Live', onPress: () => router.push('/live') },
    { icon: 'library-outline', label: 'Handbook', onPress: () => router.push('/handbook') },
    { icon: 'information-circle-outline', label: 'About', onPress: () => router.push('/about') },
    { icon: 'gift-outline', label: 'Give', onPress: () => router.push('/give') },
  ];

  return (
    <Screen padded={false}>
      <PhotoHero source={ministry.photos.home} height={430 + insets.top} position="top">
        <View style={styles.heroText}>
          <View style={styles.logoWrap}>
            <Artwork uri={ministry.logo} icon="leaf" style={styles.logo} />
          </View>
          <View style={[styles.theme, { borderColor: t.gold }]}>
            <Text style={[styles.themeText, { color: t.gold }]}>
              {ministry.themeOfTheYear.year} · {ministry.themeOfTheYear.title.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.welcome, { color: t.gold }]}>WELCOME TO</Text>
          <Text style={styles.name}>{ministry.name}</Text>
          <Text style={styles.minister}>{ministry.minister}</Text>
          <Text style={styles.tagline}>{ministry.tagline}</Text>
        </View>
      </PhotoHero>

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

        <Pressable
          onPress={() => router.push('/live')}
          style={({ pressed }) => [styles.assistant, { backgroundColor: t.surface, borderColor: '#C62828' }, pressed && { opacity: 0.85 }]}
        >
          <View style={[styles.assistantIcon, { backgroundColor: '#C62828' }]}>
            <Ionicons name="radio" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>Watch Live Services</Text>
            <Text style={{ color: t.textMuted, marginTop: 2 }}>Stream services on YouTube inside the app</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={t.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/assistant')}
          style={({ pressed }) => [styles.assistant, { backgroundColor: t.surface, borderColor: t.gold }, pressed && { opacity: 0.85 }]}
        >
          <View style={[styles.assistantIcon, { backgroundColor: t.primary }]}>
            <Ionicons name="chatbubble-ellipses" size={22} color={t.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>Ask the {ministry.assistant.name}</Text>
            <Text style={{ color: t.textMuted, marginTop: 2 }}>Find sermons, books, the Handbook and more</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={t.textMuted} />
        </Pressable>

        <View style={{ height: space.md }} />
        <ArchiveCard />

        <NotificationInvite />

        {announcements.length > 0 && (
          <>
            <SectionHeader title="Upcoming Programmes" action="See all" onAction={() => router.push('/announcements')} />
            <AnnouncementCard item={announcements[0]} compact />
          </>
        )}

        {backendReady && (
          <Pressable
            onPress={() => router.push('/subscribe')}
            style={({ pressed }) => [styles.assistant, { backgroundColor: t.primary, borderColor: t.primary }, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.assistantIcon, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
              <Ionicons name="mail-open" size={22} color={t.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Get the AFM Newsletter</Text>
              <Text style={{ color: '#DCE8DC', marginTop: 2 }}>Announcements by email or text</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#DCE8DC" />
          </Pressable>
        )}

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
              Teaching prophet, philanthropist, theologian and founder of the Alleluia Faith Mission Global Assembly and the AFM Family Network.
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
  heroText: { paddingBottom: space.lg },
  welcome: { fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  theme: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: space.sm, backgroundColor: 'rgba(0,0,0,0.25)' },
  themeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  logoWrap: { backgroundColor: '#FFFFFF', borderRadius: 30, padding: 3, alignSelf: 'flex-start', marginBottom: space.sm },
  logo: { width: 52, height: 52, borderRadius: 26 },
  name: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 34, fontWeight: '700', marginTop: 2 },
  minister: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginTop: space.xs },
  tagline: { color: '#DCE8DC', fontStyle: 'italic', marginTop: space.xs },
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
  assistant: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: 1, marginTop: space.md },
  assistantIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
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
