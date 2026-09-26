import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ministry } from '@/content/ministry';
import { AssistantAction, AssistantReply, ChatTurn, answer, suggestedQuestions } from '@/lib/assistant';
import { openLink } from '@/lib/links';
import { Artwork } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';

type Bubble = { id: number; role: 'user' | 'assistant'; text: string; actions?: AssistantAction[] };

const welcome: Bubble = {
  id: 0,
  role: 'assistant',
  text: `Hello! I'm the ${ministry.assistant.name}. I can help you find your way around ${ministry.name} and answer questions about the ministry, Prophet Micah, his books and the AFM Handbook. What would you like to know?`,
};

export default function Assistant() {
  const t = useTheme();
  const [bubbles, setBubbles] = useState<Bubble[]>([welcome]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const nextId = useRef(1);

  useEffect(() => {
    const id = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(id);
  }, [bubbles, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput('');
    const history: ChatTurn[] = bubbles.filter((b) => b.id !== 0).map((b) => ({ role: b.role, content: b.text }));
    setBubbles((bs) => [...bs, { id: nextId.current++, role: 'user', text: q }]);
    setBusy(true);
    let reply: AssistantReply;
    try {
      reply = await answer(q, history);
    } catch {
      reply = { text: `Sorry, something went wrong. Please try again, or email ${ministry.contact.email}.`, actions: [], source: 'fallback' };
    }
    setBubbles((bs) => [...bs, { id: nextId.current++, role: 'assistant', text: reply.text, actions: reply.actions }]);
    setBusy(false);
  };

  const runAction = (a: AssistantAction) => {
    if (a.route) router.push(a.params ? ({ pathname: a.route, params: a.params } as never) : (a.route as never));
    else openLink(a.url);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView ref={scroll} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        <View style={styles.maxWidth}>
          {bubbles.map((b) =>
            b.role === 'user' ? (
              <View key={b.id} style={[styles.bubble, styles.user, { backgroundColor: t.primary }]}>
                <Text style={styles.userText}>{b.text}</Text>
              </View>
            ) : (
              <View key={b.id} style={styles.botRow}>
                <Artwork uri={ministry.logo} icon="leaf" style={styles.avatar} />
                <View style={{ flex: 1, gap: space.sm }}>
                  <View style={[styles.bubble, styles.bot, { backgroundColor: t.surface, borderColor: t.border }]}>
                    <Text selectable style={[styles.botText, { color: t.text }]}>
                      {b.text}
                    </Text>
                  </View>
                  {!!b.actions?.length && (
                    <View style={styles.actions}>
                      {b.actions.map((a) => (
                        <Pressable
                          key={a.label}
                          onPress={() => runAction(a)}
                          style={({ pressed }) => [styles.action, { borderColor: t.primary, backgroundColor: t.surfaceAlt }, pressed && { opacity: 0.8 }]}
                        >
                          <Text style={{ color: t.primary, fontWeight: '700' }}>{a.label}</Text>
                          <Ionicons name={a.route ? 'arrow-forward' : 'open-outline'} size={14} color={t.primary} />
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ),
          )}

          {busy && (
            <View style={styles.botRow}>
              <Artwork uri={ministry.logo} icon="leaf" style={styles.avatar} />
              <View style={[styles.bubble, styles.bot, styles.typing, { backgroundColor: t.surface, borderColor: t.border }]}>
                <ActivityIndicator size="small" color={t.accent} />
                <Text style={{ color: t.textMuted }}>Thinking…</Text>
              </View>
            </View>
          )}

          {bubbles.length === 1 && (
            <View style={styles.suggestions}>
              <Text style={[styles.suggestTitle, { color: t.textMuted }]}>TRY ASKING</Text>
              {suggestedQuestions.map((s) => (
                <Pressable key={s} onPress={() => send(s)} style={({ pressed }) => [styles.suggestion, { backgroundColor: t.surface, borderColor: t.border }, pressed && { opacity: 0.8 }]}>
                  <Ionicons name="chatbubble-outline" size={16} color={t.accent} />
                  <Text style={{ color: t.text, flex: 1 }}>{s}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.composer, { backgroundColor: t.surface, borderTopColor: t.border }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask me anything about AFM…"
          placeholderTextColor={t.textMuted}
          style={[styles.input, { color: t.text, backgroundColor: t.background, borderColor: t.border }]}
          multiline
          maxLength={1000}
          onSubmitEditing={() => send(input)}
          blurOnSubmit
          returnKeyType="send"
          editable={!busy}
        />
        <Pressable
          onPress={() => send(input)}
          disabled={busy || !input.trim()}
          accessibilityLabel="Send"
          style={[styles.send, { backgroundColor: busy || !input.trim() ? t.border : t.primary }]}
        >
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.md, paddingBottom: space.lg },
  maxWidth: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: space.md },
  bubble: { borderRadius: radius.lg, paddingHorizontal: space.md, paddingVertical: space.sm + 2, maxWidth: '100%' },
  user: { alignSelf: 'flex-end', maxWidth: '85%', borderBottomRightRadius: 6 },
  userText: { color: '#FFFFFF', fontSize: 16, lineHeight: 22 },
  botRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', maxWidth: '92%' },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  bot: { borderWidth: StyleSheet.hairlineWidth, borderTopLeftRadius: 6, alignSelf: 'flex-start' },
  botText: { fontSize: 16, lineHeight: 23 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  suggestions: { gap: space.sm, marginTop: space.sm },
  suggestTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, padding: space.sm, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, paddingHorizontal: space.md, paddingTop: 10, paddingBottom: 10, fontSize: 16, maxHeight: 120 },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
