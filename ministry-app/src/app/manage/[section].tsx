import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RequireOwner } from '@/components/RequireOwner';
import { Field, Notice, Toggle } from '@/components/form';
import { Artwork, Body, Button, Chip, Screen, SectionHeader, Title } from '@/components/ui';
import { type FieldDef, type ListSection, type ObjectSection, sections } from '@/lib/contentSchema';
import { resetContent, saveContent } from '@/lib/contentSync';
import { editableValue, imageFrom } from '@/lib/liveContent';
import { friendlyError, storageUrl, uploadPickedImage } from '@/lib/supabase';
import { radius, space, useTheme } from '@/theme';

type Row = Record<string, unknown> & { id: string };

/** Owner: edit one area of the app (a list like Books, or a form like Theme & contact). */
export default function EditSection() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const def = sections.find((s) => s.key === section);
  if (!def) return <Screen><Body>Not found.</Body></Screen>;
  return (
    <RequireOwner title={def.title}>
      <Stack.Screen options={{ title: def.title }} />
      {def.type === 'list' ? <ListEditor def={def} /> : <ObjectEditor def={def} />}
    </RequireOwner>
  );
}

/** Runs a save, showing progress, errors and a success message. */
function useSaver() {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const run = async (label: string, fn: () => Promise<string | void>) => {
    setBusy(label);
    setError('');
    setMessage('');
    try {
      const msg = await fn();
      if (msg) setMessage(msg);
      return true;
    } catch (e) {
      setError(friendlyError(e));
      return false;
    } finally {
      setBusy('');
    }
  };
  return { busy, error, message, setError, run };
}

const text = (v: unknown) => (typeof v === 'string' ? v : '');

function validate(fields: FieldDef[], draft: Record<string, unknown>) {
  for (const f of fields) {
    const v = text(draft[f.key]).trim();
    if (f.required && f.kind !== 'switch' && !v) throw new Error(`Add the ${f.label.toLowerCase()}.`);
    if (v && f.kind === 'url' && !/^https?:\/\/\S+$/i.test(v)) throw new Error(`${f.label}: the link should start with https://`);
    if (v && f.kind === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) throw new Error(`${f.label}: check the email address.`);
  }
}

/** Trims text values before saving. */
function clean(draft: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
}

function ObjectEditor({ def }: { def: ObjectSection }) {
  const [draft, setDraft] = useState(() => editableValue(def.key) as Record<string, unknown>);
  const [confirmReset, setConfirmReset] = useState(false);
  const { busy, error, message, run } = useSaver();

  const save = () =>
    run('save', async () => {
      validate(def.fields, draft);
      await saveContent(def.key, clean(draft));
      return 'Saved. Everyone sees it the next time they open the app.';
    });

  const reset = () =>
    run('reset', async () => {
      await resetContent(def.key);
      setDraft(editableValue(def.key) as Record<string, unknown>);
      setConfirmReset(false);
      return 'Back to the original details.';
    });

  return (
    <Screen>
      <Title>{def.title}</Title>
      <Body muted style={{ marginBottom: space.sm }}>{def.intro}</Body>
      {def.fields.map((f) => (
        <View key={f.key}>
          {f.group && <SectionHeader title={f.group} />}
          <FieldInput field={f} value={draft[f.key]} onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))} />
        </View>
      ))}
      {!!error && <Notice kind="error">{error}</Notice>}
      {!!message && <Notice kind="success">{message}</Notice>}
      <Button label={busy === 'save' ? 'Saving…' : 'Save changes'} icon="checkmark" variant="gold" onPress={save} style={{ marginTop: space.sm }} />
      <ResetButton confirming={confirmReset} setConfirming={setConfirmReset} onReset={reset} busy={busy === 'reset'} />
    </Screen>
  );
}

function ListEditor({ def }: { def: ListSection }) {
  const t = useTheme();
  const [items, setItems] = useState(() => editableValue(def.key) as Row[]);
  const [editing, setEditing] = useState<{ index: number; draft: Row } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [query, setQuery] = useState('');
  const { busy, error, message, setError, run } = useSaver();

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.map((item, index) => ({ item, index })).filter(({ item }) => !q || text(item[def.titleField]).toLowerCase().includes(q));
  }, [items, query, def.titleField]);

  const persist = (next: Row[], done: string) =>
    run('save', async () => {
      await saveContent(def.key, next);
      setItems(next);
      return done;
    });

  const startNew = () => {
    const draft: Row = { id: `${def.key}-${Date.now().toString(36)}` };
    def.fields.forEach((f) => (draft[f.key] = f.kind === 'choice' ? f.options?.[0]?.value ?? '' : ''));
    setError('');
    setEditing({ index: -1, draft });
  };

  const saveItem = async () => {
    if (!editing) return;
    try {
      validate(def.fields, editing.draft);
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    const row = clean(editing.draft) as Row;
    const next = editing.index === -1 ? (def.addToTop ? [row, ...items] : [...items, row]) : items.map((r, i) => (i === editing.index ? row : r));
    if (await persist(next, editing.index === -1 ? `Added. Everyone sees it the next time they open the app.` : 'Saved. Everyone sees it the next time they open the app.')) setEditing(null);
  };

  const deleteItem = async () => {
    if (!editing) return;
    const next = items.filter((_, i) => i !== editing.index);
    if (await persist(next, 'Removed from the app.')) {
      setEditing(null);
      setConfirmDelete(false);
    }
  };

  const move = (index: number, by: -1 | 1) => {
    const to = index + by;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[index], next[to]] = [next[to], next[index]];
    persist(next, 'Order saved.');
  };

  const reset = () =>
    run('reset', async () => {
      await resetContent(def.key);
      setItems(editableValue(def.key) as Row[]);
      setConfirmReset(false);
      return 'Back to the original list.';
    });

  if (editing) {
    const isNew = editing.index === -1;
    return (
      <Screen>
        <Title>{isNew ? `New ${def.itemName}` : `Edit ${def.itemName}`}</Title>
        {def.fields.map((f) => (
          <View key={f.key}>
            {f.group && <SectionHeader title={f.group} />}
            <FieldInput field={f} value={editing.draft[f.key]} onChange={(v) => setEditing((e) => e && { ...e, draft: { ...e.draft, [f.key]: v } })} />
          </View>
        ))}
        {!!error && <Notice kind="error">{error}</Notice>}
        <Button label={busy === 'save' ? 'Saving…' : isNew ? `Add ${def.itemName}` : 'Save changes'} icon="checkmark" variant="gold" onPress={saveItem} style={{ marginTop: space.sm }} />
        <Button label="Cancel" variant="outline" onPress={() => { setEditing(null); setConfirmDelete(false); setError(''); }} style={{ marginTop: space.sm }} />
        {!isNew &&
          (!confirmDelete ? (
            <Button label={`Remove this ${def.itemName}`} icon="trash-outline" variant="outline" onPress={() => setConfirmDelete(true)} style={{ marginTop: space.lg }} />
          ) : (
            <View style={[styles.confirm, { borderColor: '#B3261E', backgroundColor: t.surface }]}>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>Remove it from the app?</Text>
              <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
                <Button label="Keep" variant="outline" onPress={() => setConfirmDelete(false)} style={{ flex: 1 }} />
                <Button label={busy === 'save' ? 'Removing…' : 'Remove'} onPress={deleteItem} style={{ flex: 1, backgroundColor: '#B3261E', borderColor: '#B3261E' }} />
              </View>
            </View>
          ))}
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>{def.title}</Title>
      <Body muted style={{ marginBottom: space.md }}>{def.intro}</Body>
      <Button label={`Add a ${def.itemName}`} icon="add" variant="gold" onPress={startNew} style={{ marginBottom: space.md }} />
      {!!error && <Notice kind="error">{error}</Notice>}
      {!!message && <Notice kind="success">{message}</Notice>}
      {def.searchable && (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${items.length} ${def.itemName}s…`}
          placeholderTextColor={t.textMuted}
          style={[styles.search, { color: t.text, backgroundColor: t.surface, borderColor: t.border }]}
        />
      )}
      {items.length === 0 && <Body muted>Nothing here yet. Tap "Add a {def.itemName}".</Body>}
      {shown.map(({ item, index }) => (
        <View key={item.id} style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Pressable style={styles.rowMain} onPress={() => { setError(''); setEditing({ index, draft: { ...item } }); }} accessibilityRole="button" accessibilityLabel={`Edit ${text(item[def.titleField])}`}>
            {def.imageField && <Artwork uri={imageFrom(text(item[def.imageField]))} icon="image-outline" style={styles.thumb} />}
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontWeight: '700' }} numberOfLines={def.searchable ? 3 : 2}>{text(item[def.titleField])}</Text>
              {def.subtitleField && !!text(item[def.subtitleField]) && (
                <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{text(item[def.subtitleField])}</Text>
              )}
            </View>
            <Ionicons name="create-outline" size={20} color={t.accent} />
          </Pressable>
          {!query && (
            <View style={styles.moves}>
              <IconButton icon="chevron-up" label="Move up" disabled={index === 0} onPress={() => move(index, -1)} />
              <IconButton icon="chevron-down" label="Move down" disabled={index === items.length - 1} onPress={() => move(index, 1)} />
            </View>
          )}
        </View>
      ))}
      {busy === 'save' && <ActivityIndicator color={t.accent} style={{ marginTop: space.sm }} />}
      <ResetButton confirming={confirmReset} setConfirming={setConfirmReset} onReset={reset} busy={busy === 'reset'} />
    </Screen>
  );
}

function ResetButton({ confirming, setConfirming, onReset, busy }: { confirming: boolean; setConfirming: (v: boolean) => void; onReset: () => void; busy: boolean }) {
  const t = useTheme();
  if (!confirming) {
    return (
      <Pressable onPress={() => setConfirming(true)} style={{ marginTop: space.xl, alignSelf: 'center', padding: space.sm }} accessibilityRole="button">
        <Text style={{ color: t.textMuted, textDecorationLine: 'underline' }}>Undo all my changes here</Text>
      </Pressable>
    );
  }
  return (
    <View style={[styles.confirm, { borderColor: t.gold, backgroundColor: t.surface, marginTop: space.xl }]}>
      <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>Go back to the original?</Text>
      <Text style={{ color: t.textMuted, marginTop: 4 }}>Everything you added or changed here is replaced by what came with the app.</Text>
      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
        <Button label="Cancel" variant="outline" onPress={() => setConfirming(false)} style={{ flex: 1 }} />
        <Button label={busy ? 'Resetting…' : 'Yes, reset'} variant="gold" onPress={onReset} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function IconButton({ icon, label, onPress, disabled }: { icon: 'chevron-up' | 'chevron-down'; label: string; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={6} style={[styles.iconButton, { borderColor: t.border, opacity: disabled ? 0.3 : 1 }]} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={18} color={t.text} />
    </Pressable>
  );
}

function FieldInput({ field: f, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const t = useTheme();
  const label = f.required ? `${f.label} *` : f.label;

  if (f.kind === 'switch') return <Toggle label={f.label} hint={f.hint} value={!!value} onValueChange={onChange} />;
  if (f.kind === 'image') return <ImageInput label={label} value={text(value)} onChange={onChange} />;
  if (f.kind === 'choice') {
    return (
      <View style={{ marginBottom: space.md }}>
        <Text style={{ color: t.text, fontWeight: '600', marginBottom: space.xs }}>{label}</Text>
        <View style={styles.choices}>
          {f.options?.map((o) => <Chip key={o.value} label={o.label} active={value === o.value} onPress={() => onChange(o.value)} />)}
        </View>
      </View>
    );
  }
  return (
    <Field
      label={label}
      hint={f.hint}
      value={text(value)}
      onChangeText={onChange}
      placeholder={f.placeholder}
      multiline={f.kind === 'multiline'}
      autoCapitalize={f.kind === 'url' || f.kind === 'email' ? 'none' : 'sentences'}
      autoCorrect={f.kind !== 'url' && f.kind !== 'email'}
      keyboardType={f.kind === 'url' ? 'url' : f.kind === 'email' ? 'email-address' : f.kind === 'phone' ? 'phone-pad' : 'default'}
    />
  );
}

function ImageInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const t = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async () => {
    setError('');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (res.canceled || !res.assets?.[0]) return;
    setBusy(true);
    try {
      const path = await uploadPickedImage('catalog', 'photos', res.assets[0]);
      onChange(storageUrl('catalog', path));
    } catch (e) {
      setError(`The photo did not upload: ${friendlyError(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={{ color: t.text, fontWeight: '600', marginBottom: space.xs }}>{label}</Text>
      <Pressable onPress={pick} style={[styles.imageBox, { borderColor: t.border, backgroundColor: t.surface }]} accessibilityRole="button" accessibilityLabel="Choose a photo">
        {value ? (
          <Artwork uri={imageFrom(value)} icon="image-outline" style={styles.image} />
        ) : (
          <View style={styles.imageEmpty}>
            <Ionicons name="image-outline" size={30} color={t.accent} />
            <Text style={{ color: t.text, fontWeight: '700', marginTop: space.xs }}>Choose a photo</Text>
          </View>
        )}
        {busy && <ActivityIndicator color={t.accent} style={StyleSheet.absoluteFill} />}
      </Pressable>
      {!!value && (
        <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
          <Button label="Change photo" icon="image-outline" variant="outline" onPress={pick} style={{ flex: 1 }} />
          <Button label="Remove" icon="close" variant="outline" onPress={() => onChange('')} style={{ flex: 1 }} />
        </View>
      )}
      {!!error && <Text style={{ color: '#B3261E', marginTop: space.xs }}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: 12, fontSize: 16, marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, marginBottom: space.sm, paddingRight: space.sm },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm },
  thumb: { width: 48, height: 60, borderRadius: radius.sm },
  moves: { gap: 6 },
  iconButton: { width: 32, height: 28, borderRadius: radius.sm, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  confirm: { borderWidth: 1, borderRadius: radius.md, padding: space.md, marginTop: space.lg },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  imageBox: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.md, overflow: 'hidden', minHeight: 120, justifyContent: 'center', alignSelf: 'flex-start', minWidth: 160 },
  imageEmpty: { alignItems: 'center', padding: space.lg },
  image: { width: 160, height: 200 },
});
