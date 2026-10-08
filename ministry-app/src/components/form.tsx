import { ReactNode } from 'react';
import { StyleSheet, Switch, Text, TextInput, TextInputProps, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { radius, space, useTheme } from '@/theme';

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={[styles.label, { color: t.text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={t.textMuted}
        {...props}
        style={[styles.input, { color: t.text, backgroundColor: t.surface, borderColor: t.border }, props.multiline && { minHeight: 120, textAlignVertical: 'top' }, props.style]}
      />
      {hint && <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 4 }}>{hint}</Text>}
    </View>
  );
}

export function Toggle({ label, value, onValueChange, hint }: { label: string; value: boolean; onValueChange: (v: boolean) => void; hint?: string }) {
  const t = useTheme();
  return (
    <View style={[styles.toggle, { borderColor: t.border, backgroundColor: t.surface }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontWeight: '600', fontSize: 16 }}>{label}</Text>
        {hint && <Text style={{ color: t.textMuted, marginTop: 2 }}>{hint}</Text>}
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: t.primary, false: t.border }} thumbColor="#FFFFFF" />
    </View>
  );
}

/** Inline message box: error, success or info. */
export function Notice({ kind = 'info', children }: { kind?: 'error' | 'success' | 'info'; children: ReactNode }) {
  const t = useTheme();
  const color = kind === 'error' ? '#B3261E' : kind === 'success' ? t.primary : t.accent;
  const icon = kind === 'error' ? 'alert-circle' : kind === 'success' ? 'checkmark-circle' : 'information-circle';
  return (
    <View style={[styles.notice, { borderColor: color, backgroundColor: t.surface }]} accessibilityLiveRegion="polite">
      <Ionicons name={icon} size={20} color={color} />
      <Text style={{ color: t.text, flex: 1, lineHeight: 21 }}>{children}</Text>
    </View>
  );
}

export function Divider({ label }: { label: string }) {
  const t = useTheme();
  return (
    <View style={styles.divider}>
      <View style={[styles.line, { backgroundColor: t.border }]} />
      <Text style={{ color: t.textMuted, fontWeight: '600' }}>{label}</Text>
      <View style={[styles.line, { backgroundColor: t.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: space.xs },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: 12, fontSize: 16 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, marginBottom: space.sm },
  notice: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', padding: space.md, borderRadius: radius.md, borderWidth: 1, marginBottom: space.md },
  divider: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginVertical: space.md },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
