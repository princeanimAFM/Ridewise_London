import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ministry } from '@/content/ministry';
import { Body, Card, ListRow, Screen, SectionHeader } from '@/components/ui';
import { PhotoHero } from '@/components/PhotoHero';
import { fonts, radius, space, useTheme } from '@/theme';

const paragraphs = (text: string) => text.split(/\n\s*\n/).map((p) => p.trim());

/** About Ministry: the AFM Mission Statement. */
export default function About() {
  const t = useTheme();
  const { about } = ministry;
  const ms = about.missionStatement;
  return (
    <Screen>
      <PhotoHero source={ministry.photos.about} height={340} position="top" style={styles.hero}>
        <Text style={[styles.heroKicker, { color: t.gold }]}>ABOUT MINISTRY</Text>
        <Text style={styles.heroTitle}>{ms.title}</Text>
      </PhotoHero>
      <Text style={[styles.network, { color: t.accent }]}>THE AFM FAMILY NETWORK</Text>
      {paragraphs(ms.intro).map((p, i) => (
        <Body key={i} style={{ marginBottom: space.md }}>
          {p}
        </Body>
      ))}
      {ms.sections.map((s) => (
        <Card key={s.heading} style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: t.surfaceAlt }]}>
              <Ionicons name={s.icon} size={20} color={t.accent} />
            </View>
            <Text style={[styles.sectionTitle, { color: t.text }]}>{s.heading.toUpperCase()}</Text>
          </View>
          <Body>{s.text}</Body>
        </Card>
      ))}
      <Text style={[styles.signed, { color: t.textMuted }]}>Signed: {ms.signed}</Text>

      <SectionHeader title="Learn More" />
      <ListRow icon="person-outline" title="Biography" subtitle={ministry.minister} onPress={() => router.push('/biography')} />
      <ListRow icon="library-outline" title="The AFM Handbook" subtitle="FAQs, anchor scripture, slogans & code of conduct" onPress={() => router.push('/handbook')} />

      {about.serviceTimes.length > 0 && (
        <>
          <SectionHeader title="Service Times" />
          <Card style={{ padding: space.md }}>
            {about.serviceTimes.map((s) => (
              <View key={s.day} style={styles.listRow}>
                <Ionicons name="time-outline" size={18} color={t.accent} />
                <Text style={{ color: t.text, fontWeight: '700', width: 100 }}>{s.day}</Text>
                <Text style={{ color: t.textMuted, flex: 1 }}>{s.detail}</Text>
              </View>
            ))}
            {!!about.address && (
              <View style={styles.listRow}>
                <Ionicons name="location-outline" size={18} color={t.accent} />
                <Text style={{ color: t.text, flex: 1 }}>{about.address}</Text>
              </View>
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, marginBottom: space.lg },
  heroKicker: { fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  heroTitle: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 26, fontWeight: '700', marginTop: 2 },
  section: { padding: space.md, marginBottom: space.sm, borderRadius: radius.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  sectionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  network: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5, marginBottom: space.sm },
  signed: { fontStyle: 'italic', textAlign: 'right', marginTop: space.sm },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6 },
});
