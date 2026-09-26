import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Text } from 'react-native';
import { ministry } from '@/content/ministry';
import { openLink, shareApp } from '@/lib/links';
import { ListRow, Screen, SectionHeader } from '@/components/ui';
import { space, useTheme } from '@/theme';

export default function More() {
  const t = useTheme();
  return (
    <Screen>
      <SectionHeader title="Ministry" />
      <ListRow icon="people-outline" title="About Ministry" subtitle="The AFM Mission Statement" onPress={() => router.push('/about')} />
      <ListRow icon="person-outline" title="Our Founder" subtitle={ministry.minister} onPress={() => router.push('/founder')} />
      <ListRow icon="library-outline" title="The AFM Handbook" subtitle="FAQs, anchor scripture, slogans & code of conduct" onPress={() => router.push('/handbook')} />
      <ListRow icon="archive-outline" title="Archive" subtitle="Podcast, YouTube & Telegram" onPress={() => router.push('/archive')} />

      <SectionHeader title="Get Involved" />
      <ListRow icon="chatbox-ellipses-outline" title="Contact Us" subtitle="Social media, email & WhatsApp" onPress={() => router.push('/connect')} />
      <ListRow icon="hand-left-outline" title="Prayer Request" subtitle="We would love to pray with you" onPress={() => router.push('/prayer')} />
      {!!ministry.contact.givingUrl && (
        <ListRow icon="gift-outline" title="Give" subtitle="Support the work of the ministry" onPress={() => openLink(ministry.contact.givingUrl)} />
      )}
      <ListRow icon="share-social-outline" title="Share App" subtitle={`Invite others to ${ministry.name}`} onPress={shareApp} />

      <SectionHeader title="Legal" />
      <ListRow icon="shield-checkmark-outline" title="Privacy Policy" onPress={() => openLink(ministry.privacyPolicyUrl)} />

      <Text style={{ color: t.textMuted, textAlign: 'center', marginTop: space.xl }}>
        {ministry.name} · v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </Screen>
  );
}
