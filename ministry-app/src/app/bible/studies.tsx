import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/lib/auth';
import { passageLabel, useStudies } from '@/lib/studies';
import { Button, Screen } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

/** Bible studies from the ministry, newest first. */
export default function StudiesList() {
  const t = useTheme();
  const { profile } = useAuth();
  const { items, loading, error, reload } = useStudies();
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const w = q.trim().toLowerCase();
    return w ? items.filter((s) => `${s.title} ${s.author} ${passageLabel(s)} ${s.body}`.toLowerCase().includes(w)) : items;
  }, [items, q]);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Bible studies' }} />
      <Text style={{ color: t.textMuted, lineHeight: 21, marginBottom: space.md }}>Studies from the ministry on passages of the Bible. They also show at the top of the chapter while you read.</Text>
      {profile?.is_admin && (
        <Button label="Write or manage studies" icon="create-outline" variant="outline" onPress={() => router.push('/manage-studies')} style={{ marginBottom: space.md }} />
      )}
      {items.length > 4 && (
        <View style={[styles.search, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Ionicons name="search" size={18} color={t.textMuted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search studies" placeholderTextColor={t.textMuted} style={{ flex: 1, color: t.text, fontSize: 16, paddingVertical: 10 }} />
        </View>
      )}
      {loading && <ActivityIndicator color={t.accent} style={{ marginTop: space.lg }} />}
      {!!error && <Button label="Try again" icon="refresh" onPress={reload} style={{ alignSelf: 'flex-start' }} />}
      {!loading && !error && !items.length && <Text style={{ color: t.textMuted }}>No studies yet. They will appear here when the ministry adds them.</Text>}
      {shown.map((s) => (
        <Pressable key={s.id} onPress={() => router.push({ pathname: '/bible/study', params: { id: s.id } })}
          style={({ pressed }) => [styles.card, { backgroundColor: t.surface, borderColor: t.border }, pressed && { opacity: 0.85 }]}>
          <Text style={{ color: t.accent, fontWeight: '700', fontSize: 13 }}>{passageLabel(s)}</Text>
          <Text style={{ color: t.text, fontFamily: fonts.serif, fontSize: 19, fontWeight: '700', marginTop: 2 }}>{s.title}</Text>
          {!!s.author && <Text style={{ color: t.textMuted, marginTop: 2 }}>{s.author}</Text>}
          <Text style={{ color: t.text, marginTop: space.xs, lineHeight: 21 }} numberOfLines={3}>{s.body}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: space.md, marginBottom: space.md },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
});
