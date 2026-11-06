import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';
import { useContent } from '@/lib/liveContent';
import { openLink, whatsappUrl } from '@/lib/links';
import { Body, Button, Screen, Title } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';

export default function Prayer() {
  const ministry = useContent();
  const t = useTheme();
  const [name, setName] = useState('');
  const [request, setRequest] = useState('');

  const message = () => `Prayer request${name ? ` from ${name}` : ''}:\n\n${request.trim()}`;
  const ready = () => {
    if (!request.trim()) {
      Alert.alert('Prayer request', 'Please write your prayer request first.');
      return false;
    }
    return true;
  };
  const sendEmail = () =>
    ready() &&
    openLink(`mailto:${ministry.contact.email}?subject=${encodeURIComponent('Prayer Request')}&body=${encodeURIComponent(message())}`);
  const wa = whatsappUrl('');
  const sendWhatsapp = () => ready() && openLink(whatsappUrl(message()));

  const input = [styles.input, { color: t.text, backgroundColor: t.surface, borderColor: t.border }];

  return (
    <Screen>
      <Title>How can we pray for you?</Title>
      <Body muted style={{ marginBottom: space.lg }}>
        “The prayer of a righteous person is powerful and effective.” — James 5:16. Share your request and our team will pray with you.
      </Body>

      <Text style={[styles.label, { color: t.text }]}>Your name (optional)</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={t.textMuted} style={input} />

      <Text style={[styles.label, { color: t.text }]}>Prayer request</Text>
      <TextInput
        value={request}
        onChangeText={setRequest}
        placeholder="Write your request here…"
        placeholderTextColor={t.textMuted}
        multiline
        textAlignVertical="top"
        style={[input, { minHeight: 140 }]}
      />

      <Button label="Send by Email" icon="mail-outline" onPress={sendEmail} style={{ marginTop: space.lg }} />
      {wa && <Button label="Send on WhatsApp" icon="logo-whatsapp" variant="gold" onPress={sendWhatsapp} style={{ marginTop: space.sm }} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: space.xs, marginTop: space.md },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm, padding: space.md, fontSize: 16 },
});
