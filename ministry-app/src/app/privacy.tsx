import { StyleSheet, Text, View } from 'react-native';
import { privacy } from '@/content/privacy';
import { openLink } from '@/lib/links';
import { Body, Button, Screen } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

export default function Privacy() {
  const t = useTheme();
  return (
    <Screen>
      <Text style={[styles.title, { color: t.text }]}>{privacy.title}</Text>
      <Text style={{ color: t.textMuted, marginBottom: space.md }}>
        {privacy.appName} · Effective {privacy.effectiveDate}
      </Text>
      <View style={[styles.summary, { backgroundColor: t.surfaceAlt }]}>
        <Text style={[styles.summaryLabel, { color: t.accent }]}>IN SHORT</Text>
        <Body>{privacy.summary}</Body>
      </View>
      {privacy.sections.map((s) => (
        <View key={s.heading} style={{ marginTop: space.lg }}>
          <Text style={[styles.h2, { color: t.text }]}>{s.heading}</Text>
          {s.body.map((p, i) => (
            <Body key={i} style={{ marginBottom: space.sm }}>
              {p}
            </Body>
          ))}
        </View>
      ))}
      <Button
        label={`Email ${privacy.contactEmail}`}
        icon="mail-outline"
        variant="outline"
        onPress={() => openLink(`mailto:${privacy.contactEmail}?subject=${encodeURIComponent('Privacy question')}`)}
        style={{ marginTop: space.lg }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 28, fontWeight: '700' },
  summary: { borderRadius: radius.md, padding: space.md, gap: space.xs },
  summaryLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  h2: { fontFamily: fonts.serif, fontSize: 19, fontWeight: '700', marginBottom: space.sm },
});
