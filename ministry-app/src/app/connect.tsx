import { useContent } from '@/lib/liveContent';
import { whatsappUrl } from '@/lib/links';
import { Body, LinkRow, Screen, SectionHeader } from '@/components/ui';
import { space } from '@/theme';

export default function Connect() {
  const ministry = useContent();
  const wa = whatsappUrl(`Hello ${ministry.name}!`);
  return (
    <Screen>
      <Body muted style={{ marginBottom: space.sm }}>
        Stay connected with {ministry.minister} and the AFM family.
      </Body>
      <SectionHeader title="Watch, Listen & Follow" />
      {ministry.socials.map((s) => (
        <LinkRow key={s.id} item={s} />
      ))}
      <SectionHeader title="Contact" />
      {!!ministry.contact.email && (
        <LinkRow item={{ id: 'mail', label: 'Email Us', url: `mailto:${ministry.contact.email}`, icon: 'mail', description: ministry.contact.email }} />
      )}
      {wa && <LinkRow item={{ id: 'wa', label: 'WhatsApp', url: wa, icon: 'whatsapp', description: 'Message the ministry' }} />}
    </Screen>
  );
}
