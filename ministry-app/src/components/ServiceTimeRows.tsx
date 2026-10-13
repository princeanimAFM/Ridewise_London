import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { localServiceTime } from '@/lib/serviceTime';
import { space, useTheme } from '@/theme';

/** Each service with its Ghana (GMT) time and, outside Ghana time, the phone's own time underneath. */
export function ServiceTimeRows({ times }: { times: { day: string; detail: string }[] }) {
  const t = useTheme();
  return (
    <>
      {times.map((s) => {
        const local = localServiceTime(s.day, s.detail);
        return (
          <View key={s.day + s.detail} style={styles.row}>
            <Ionicons name="time-outline" size={18} color={t.accent} style={styles.icon} />
            <Text style={{ color: t.text, fontWeight: '700', width: 100 }}>{s.day}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.textMuted }}>{s.detail}</Text>
              {!!local && <Text style={{ color: t.accent, fontWeight: '600', marginTop: 2 }}>{local}</Text>}
            </View>
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, paddingVertical: 6 },
  icon: { marginTop: 1 },
});
