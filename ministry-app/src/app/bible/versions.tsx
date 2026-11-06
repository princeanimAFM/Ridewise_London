import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  canKeepOffline,
  deleteBible,
  downloadBible,
  DOWNLOAD_SIZE,
  setBiblePrefs,
  TRANSLATION_IDS,
  TRANSLATIONS,
  useBiblePrefs,
  useDownloads,
  type TranslationId,
} from '@/lib/bible';
import { Body, Screen, SectionHeader } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';

const GROUPS = ['English', 'Ghanaian languages', 'Other languages'] as const;

/** Choose a Bible version and download versions to the phone for offline reading. */
export default function BibleVersions() {
  const t = useTheme();
  const prefs = useBiblePrefs();
  const downloads = useDownloads();

  const choose = (id: TranslationId) => {
    setBiblePrefs({ translation: id });
    router.back();
  };

  const remove = (id: TranslationId) => {
    const go = () => deleteBible(id);
    const msg = `Remove ${TRANSLATIONS[id].name} from this phone? Your highlights and bookmarks are kept, and you can download it again any time.`;
    if (Platform.OS === 'web') go();
    else Alert.alert('Remove download', msg, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: go }]);
  };

  const downloaded = TRANSLATION_IDS.filter((id) => downloads[id] === 'ready').length;

  return (
    <Screen>
      <Body muted>
        {canKeepOffline
          ? `Download the versions you want. They stay on your phone, so you can read without internet. Each is a ${DOWNLOAD_SIZE}.${downloaded ? ` ${downloaded} downloaded.` : ''}`
          : 'Choose a version to read. To keep Bibles for offline reading, use the app on your phone.'}
      </Body>

      {GROUPS.map((group) => (
        <View key={group}>
          <SectionHeader title={group} />
          {TRANSLATION_IDS.filter((id) => TRANSLATIONS[id].group === group).map((id) => {
            const tr = TRANSLATIONS[id];
            const state = downloads[id] ?? 'none';
            const current = prefs.translation === id;
            return (
              <Pressable
                key={id}
                onPress={() => choose(id)}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: t.surface, borderColor: current ? t.accent : t.border, borderWidth: current ? 2 : StyleSheet.hairlineWidth },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={[styles.badge, { backgroundColor: current ? t.primary : t.surfaceAlt }]}>
                  <Text style={{ color: current ? '#FFFFFF' : t.text, fontWeight: '800', fontSize: 11 }} numberOfLines={1}>
                    {tr.short}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{tr.name}</Text>
                  <Text style={{ color: t.textMuted, marginTop: 2 }} numberOfLines={2}>
                    {current ? 'Reading now · ' : ''}
                    {tr.about}
                  </Text>
                </View>
                {canKeepOffline &&
                  (state === 'downloading' ? (
                    <ActivityIndicator color={t.accent} />
                  ) : state === 'ready' ? (
                    <Pressable onPress={() => remove(id)} hitSlop={10} accessibilityLabel={`Remove ${tr.name} download`} style={styles.action}>
                      <Ionicons name="checkmark-circle" size={22} color={t.accent} />
                      <Text style={{ color: t.textMuted, fontSize: 11 }}>Remove</Text>
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => downloadBible(id).catch(() => {})} hitSlop={10} accessibilityLabel={`Download ${tr.name}`} style={styles.action}>
                      <Ionicons name={state === 'error' ? 'refresh-circle-outline' : 'cloud-download-outline'} size={24} color={t.accent} />
                      <Text style={{ color: t.textMuted, fontSize: 11 }}>{state === 'error' ? 'Retry' : 'Download'}</Text>
                    </Pressable>
                  ))}
              </Pressable>
            );
          })}
        </View>
      ))}

      <Text style={{ color: t.textMuted, fontSize: 12, marginTop: space.lg, lineHeight: 18 }}>
        All versions are public domain or openly licensed, from eBible.org. Twi, Ewe and Hausa © Biblica, Inc. and LSV © Covenant Press, used under CC BY-SA 4.0.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, marginBottom: space.sm },
  badge: { width: 56, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  action: { alignItems: 'center', minWidth: 56 },
});
