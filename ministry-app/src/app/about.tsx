import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ministry } from '@/content/ministry';
import { openLink, youtubeThumb, youtubeUrl } from '@/lib/links';
import { Artwork, Body, Card, Screen, SectionHeader, Title } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

const paragraphs = (text: string) => text.split(/\n\s*\n/).map((p) => p.trim());

export default function About() {
  const t = useTheme();
  const { about } = ministry;
  const ms = about.missionStatement;
  return (
    <Screen>
      <View style={styles.header}>
        <Artwork uri={ministry.heroImage ?? ministry.logo} icon="person" style={styles.photo} />
        <Text style={[styles.kicker, { color: t.accent }]}>OUR FOUNDER</Text>
        <Title style={{ textAlign: 'center' }}>{ministry.minister}</Title>
      </View>
      {paragraphs(about.story).map((p, i) => (
        <Body key={i} style={{ marginBottom: space.md }}>
          {p}
        </Body>
      ))}

      {!!about.introVideoYoutubeId && (
        <Card onPress={() => openLink(youtubeUrl(about.introVideoYoutubeId))} style={{ marginBottom: space.md }}>
          <Artwork uri={youtubeThumb(about.introVideoYoutubeId)} icon="play-circle" style={styles.video} />
          <View style={styles.playBadge}>
            <Ionicons name="play" size={28} color="#FFFFFF" />
          </View>
        </Card>
      )}

      <SectionHeader title="Ministries" />
      <Card style={{ padding: space.md }}>
        {about.ministries.map((m) => (
          <View key={m} style={styles.listRow}>
            <Ionicons name="leaf-outline" size={18} color={t.accent} />
            <Text style={{ color: t.text, fontSize: 16, flex: 1 }}>{m}</Text>
          </View>
        ))}
      </Card>

      <SectionHeader title={ms.title} />
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
            <Text style={[styles.sectionTitle, { color: t.text }]}>{s.heading}</Text>
          </View>
          <Body>{s.text}</Body>
        </Card>
      ))}
      <Text style={[styles.signed, { color: t.textMuted }]}>Signed: {ms.signed}</Text>

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
  header: { alignItems: 'center', marginBottom: space.md },
  photo: { width: 140, height: 140, borderRadius: 70, marginBottom: space.md },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: space.xs },
  video: { width: '100%', aspectRatio: 16 / 9 },
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -30,
    marginTop: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6 },
  section: { padding: space.md, marginBottom: space.sm, borderRadius: radius.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  sectionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 18, fontWeight: '700' },
  signed: { fontStyle: 'italic', textAlign: 'right', marginTop: space.sm },
});
