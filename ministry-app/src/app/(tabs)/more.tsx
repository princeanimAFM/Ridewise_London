import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Text } from 'react-native';
import { ministry } from '@/content/ministry';
import { openLink, shareApp } from '@/lib/links';
import { displayName, useAuth } from '@/lib/auth';
import { rateApp } from '@/lib/review';
import { Platform } from 'react-native';
import { ListRow, Screen, SectionHeader } from '@/components/ui';
import { space, useTheme } from '@/theme';

export default function More() {
  const t = useTheme();
  const { session, profile } = useAuth();
  return (
    <Screen>
      <ListRow
        icon="person-circle-outline"
        title={session ? `Hello, ${displayName(profile, session)}` : 'Sign in or create account'}
        subtitle={session ? 'My account & newsletter' : 'Manage your newsletter and more'}
        onPress={() => router.push('/account')}
      />
      {profile?.is_admin && <ListRow icon="megaphone-outline" title="Owner dashboard" subtitle="Upload flyers & send announcements" onPress={() => router.push('/admin')} />}
      {profile?.is_admin && <ListRow icon="people-circle-outline" title="Subscribers" subtitle="See who has signed up for the newsletter" onPress={() => router.push('/subscribers')} />}
      {profile?.is_admin && <ListRow icon="create-outline" title="Edit app content" subtitle="Books, perfumes, quotes, giving, links" onPress={() => router.push('/manage')} />}
      <ListRow icon="chatbubble-ellipses-outline" title={ministry.assistant.name} subtitle="Ask a question or find your way around" onPress={() => router.push('/assistant')} />

      <SectionHeader title="Ministry" />
      <ListRow icon="people-outline" title="About Ministry" subtitle="The AFM Mission Statement" onPress={() => router.push('/about')} />
      <ListRow icon="person-outline" title="Biography" subtitle={ministry.minister} onPress={() => router.push('/biography')} />
      <ListRow icon="library-outline" title="The AFM Handbook" subtitle="FAQs, anchor scripture, slogans & code of conduct" onPress={() => router.push('/handbook')} />
      <ListRow icon="document-text-outline" title="Library" subtitle="Free e-books & files" onPress={() => router.push('/library')} />
      <ListRow icon="archive-outline" title="Archive" subtitle="Podcast, YouTube & Telegram" onPress={() => router.push('/archive')} />

      <SectionHeader title="Get Involved" />
      <ListRow icon="chatbox-ellipses-outline" title="Contact Us" subtitle="Social media, email & WhatsApp" onPress={() => router.push('/connect')} />
      <ListRow icon="hand-left-outline" title="Prayer Request" subtitle="We would love to pray with you" onPress={() => router.push('/prayer')} />
      <ListRow icon="radio-outline" title="Live Services" subtitle="Watch services streaming on YouTube" onPress={() => router.push('/live')} />
      <ListRow icon="gift-outline" title="Give an Offering" subtitle="PayPal, Cash App, MoMo, V Cash, bank" onPress={() => router.push('/give')} />
      <ListRow icon="mail-open-outline" title="Newsletter" subtitle="Get announcements by email or text" onPress={() => router.push('/subscribe')} />
      {Platform.OS !== 'web' && <ListRow icon="notifications-outline" title="Notifications" subtitle="Daily quote & announcements" onPress={() => router.push('/notifications')} />}
      <ListRow icon="calendar-outline" title="Announcements" subtitle="Upcoming programmes & flyers" onPress={() => router.push('/announcements')} />
      {Platform.OS !== 'web' && <ListRow icon="star-outline" title="Rate the app" subtitle="Leave a review on the store" onPress={rateApp} />}
      <ListRow icon="share-social-outline" title="Share App" subtitle={`Invite others to ${ministry.name}`} onPress={shareApp} />

      <SectionHeader title="Legal" />
      <ListRow icon="shield-checkmark-outline" title="Privacy Policy" onPress={() => router.push('/privacy')} />

      <Text style={{ color: t.textMuted, textAlign: 'center', marginTop: space.xl }}>
        {ministry.name} · v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </Screen>
  );
}
