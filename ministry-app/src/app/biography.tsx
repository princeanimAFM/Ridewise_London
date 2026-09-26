import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { biography } from '@/content/biography';
import { ministry } from '@/content/ministry';
import { PlatformGrid } from '@/components/PlatformGrid';
import { Artwork, Body, Button, IconName, Screen, SectionHeader } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

export default function Biography() {
  const t = useTheme();
  return (
    <Screen padded={false}>
      <View style={[styles.hero, { backgroundColor: t.primary }]}>
        <Artwork uri={ministry.heroImage ?? ministry.portrait} icon="person" style={styles.photo} />
        <Text style={[styles.kicker, { color: t.gold }]}>BIOGRAPHY</Text>
        <Text style={styles.name}>{biography.name}</Text>
        <View style={styles.roles}>
          {biography.roles.map((r) => (
            <View key={r} style={styles.role}>
              <Text style={styles.roleText}>{r}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.knownAs}>Known as {biography.knownAs.join(' · ')}</Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.intro, { color: t.text }]}>{biography.intro}</Text>

        <View style={[styles.facts, { backgroundColor: t.surface, borderColor: t.border }]}>
          {biography.facts.map((f, i) => (
            <View key={f.value} style={[styles.fact, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border }]}>
              <Text style={[styles.factLabel, { color: t.accent }]}>{f.label.toUpperCase()}</Text>
              <Text style={[styles.factValue, { color: t.text }]}>{f.value}</Text>
            </View>
          ))}
        </View>

        {biography.chapters.map((c) => (
          <View key={c.title}>
            <View style={styles.chapterHead}>
              <View style={[styles.chapterIcon, { backgroundColor: t.surfaceAlt }]}>
                <Ionicons name={c.icon as IconName} size={20} color={t.accent} />
              </View>
              <Text style={[styles.chapterTitle, { color: t.text }]}>{c.title}</Text>
            </View>
            {c.paragraphs.map((p, i) => (
              <Body key={i} style={{ marginBottom: space.md }}>
                {p}
              </Body>
            ))}
            {c.showBooks && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingBottom: space.sm }}>
                {ministry.books.map((b) => (
                  <Pressable key={b.id} onPress={() => router.push({ pathname: '/book/[id]', params: { id: b.id } })} style={{ width: 110 }}>
                    <Artwork uri={b.cover} icon="book" label={b.title} style={styles.cover} />
                    <Text numberOfLines={2} style={{ color: t.text, fontWeight: '600', marginTop: space.xs }}>
                      {b.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        ))}

        <View style={[styles.closing, { borderColor: t.gold }]}>
          <Text style={[styles.closingText, { color: t.text }]}>{biography.closing}</Text>
        </View>

        <Button label="Read the AFM Mission Statement" icon="flag-outline" variant="outline" onPress={() => router.push('/about')} style={{ marginTop: space.lg }} />

        <SectionHeader title="Follow Prophet Micah" />
        <PlatformGrid />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xl },
  photo: { width: 180, height: 180, borderRadius: 90, borderWidth: 4, borderColor: '#FFFFFF', marginBottom: space.md },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  name: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: space.xs },
  roles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.xs, marginTop: space.md },
  role: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', paddingHorizontal: 10, paddingVertical: 4 },
  roleText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  knownAs: { color: '#DCE8DC', fontStyle: 'italic', marginTop: space.md },
  body: { padding: space.md },
  intro: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 29, marginBottom: space.lg },
  facts: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, marginBottom: space.lg },
  fact: { paddingHorizontal: space.md, paddingVertical: space.sm + 2 },
  factLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  factValue: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  chapterHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md, marginBottom: space.sm },
  chapterIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  chapterTitle: { fontFamily: fonts.serif, fontSize: 21, fontWeight: '700' },
  cover: { width: 110, height: 165, borderRadius: radius.sm },
  closing: { borderLeftWidth: 3, paddingLeft: space.md, marginTop: space.lg },
  closingText: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 28, fontStyle: 'italic' },
});
