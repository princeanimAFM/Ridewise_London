import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { friendlyError } from '@/lib/supabase';
import { deleteStudy, loadAllStudies, parsePassage, passageLabel, saveStudy, type Study } from '@/lib/studies';
import { RequireOwner } from '@/components/RequireOwner';
import { Field, Notice, Toggle } from '@/components/form';
import { Button, Screen, SectionHeader } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

const confirm = (message: string) =>
  Platform.OS === 'web'
    ? Promise.resolve(window.confirm(message))
    : new Promise<boolean>((resolve) => Alert.alert('Delete study?', message, [{ text: 'Cancel', onPress: () => resolve(false) }, { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }]));

/** Owner dashboard → Bible studies: write, edit, publish and delete studies linked to Bible passages. */
export default function ManageStudies() {
  return (
    <RequireOwner title="Bible studies">
      <Editor />
    </RequireOwner>
  );
}

function Editor() {
  const t = useTheme();
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const [all, setAll] = useState<Study[] | null>(null);
  const [editing, setEditing] = useState<string | null>(params.id ?? null);
  const [title, setTitle] = useState('');
  const [passage, setPassage] = useState('');
  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const reload = useCallback(() => loadAllStudies().then(setAll).catch((e) => setMessage({ kind: 'error', text: friendlyError(e) })), []);
  useEffect(() => { reload(); }, [reload]);

  // Fill the form when editing an existing study.
  const [filled, setFilled] = useState<string | null>(null);
  if (all && editing && filled !== editing) {
    const s = all.find((x) => x.id === editing);
    if (s) {
      setFilled(editing);
      setTitle(s.title); setPassage(passageLabel(s)); setAuthor(s.author); setBody(s.body); setPublished(s.published);
    }
  }
  const startNew = () => {
    setEditing(null); setFilled(null); setTitle(''); setPassage(''); setBody(''); setPublished(true); setMessage(null);
    setAuthor([profile?.first_name, profile?.last_name].filter(Boolean).join(' '));
  };

  const parsed = parsePassage(passage);
  const save = async () => {
    setMessage(null);
    if (!title.trim()) return setMessage({ kind: 'error', text: 'Give the study a title.' });
    if (!parsed) return setMessage({ kind: 'error', text: 'Type the passage like “John 3”, “John 3:16” or “John 3:16-21”.' });
    if (!body.trim()) return setMessage({ kind: 'error', text: 'Write the study.' });
    setBusy(true);
    try {
      await saveStudy({ title, author, body, published, ...parsed }, editing ?? undefined);
      setMessage({ kind: 'success', text: published ? `Saved. It now shows on ${passageLabel(parsed)} and in Bible studies.` : 'Saved as a draft (only admins can see it).' });
      if (!editing) startNew();
      await reload();
    } catch (e) {
      setMessage({ kind: 'error', text: friendlyError(e) });
    }
    setBusy(false);
  };
  const remove = async (s: Study) => {
    if (!(await confirm(`“${s.title}” will be removed from the app.`))) return;
    try {
      await deleteStudy(s.id);
      if (editing === s.id) startNew();
      await reload();
    } catch (e) {
      setMessage({ kind: 'error', text: friendlyError(e) });
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Bible studies' }} />
      <SectionHeader title={editing ? 'Edit study' : 'New study'} />
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. The love that gave" maxLength={150} />
      <Field label="Passage" value={passage} onChangeText={setPassage} placeholder="John 3:16-21" autoCapitalize="words"
        hint={parsed ? `Shows on ${passageLabel(parsed)}` : 'A chapter (John 3), a verse (John 3:16) or verses (John 3:16-21).'} />
      <Field label="By" value={author} onChangeText={setAuthor} placeholder="Prophet Micah Felix Azanduna D.D" maxLength={120} hint="Shown under the title." />
      <Field label="Study" value={body} onChangeText={setBody} multiline placeholder="Write the study. Leave a blank line between paragraphs." style={{ minHeight: 220, textAlignVertical: 'top' }} />
      <Toggle label="Published" value={published} onValueChange={setPublished} hint="Off keeps it as a draft that only admins can see." />
      {message && <Notice kind={message.kind}>{message.text}</Notice>}
      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
        {editing && <Button label="New study" icon="add" variant="outline" onPress={startNew} style={{ flex: 1 }} />}
        <Button label={busy ? 'Saving…' : editing ? 'Save changes' : 'Publish study'} icon="checkmark" onPress={save} style={{ flex: 1 }} />
      </View>

      <SectionHeader title={`All studies${all ? ` (${all.length})` : ''}`} />
      {!all && <ActivityIndicator color={t.accent} />}
      {all?.length === 0 && <Text style={{ color: t.textMuted }}>None yet. Your first study will appear here.</Text>}
      {all?.map((s) => (
        <View key={s.id} style={[styles.row, { backgroundColor: t.surface, borderColor: editing === s.id ? t.accent : t.border }]}>
          <Pressable style={{ flex: 1 }} onPress={() => { setEditing(s.id); setFilled(null); setMessage(null); }}>
            <Text style={{ color: t.accent, fontWeight: '700', fontSize: 13 }}>{passageLabel(s)}{s.published ? '' : '  · draft'}</Text>
            <Text style={{ color: t.text, fontFamily: fonts.serif, fontSize: 17, fontWeight: '700' }}>{s.title}</Text>
            {!!s.author && <Text style={{ color: t.textMuted, fontSize: 13 }}>{s.author}</Text>}
          </Pressable>
          <View style={{ gap: 6 }}>
            <Button label="View" variant="outline" onPress={() => router.push({ pathname: '/bible/study', params: { id: s.id } })} />
            <Button label="Delete" variant="outline" onPress={() => remove(s)} />
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center', borderWidth: 1, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
});
