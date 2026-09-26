import { router } from 'expo-router';
import { RequireOwner } from '@/components/RequireOwner';
import { Notice } from '@/components/form';
import { Body, ListRow, Screen, Title } from '@/components/ui';
import { sections } from '@/lib/contentSchema';
import { space } from '@/theme';

/** Owner: choose an area of the app to edit. */
export default function ManageContent() {
  return (
    <RequireOwner title="Edit app content">
      <Screen>
        <Title>Edit app content</Title>
        <Body muted style={{ marginBottom: space.md }}>
          Changes are saved straight away. Everyone sees them the next time they open the app, with no app update needed.
        </Body>
        {sections.map((s) => (
          <ListRow key={s.key} icon={s.icon} title={s.title} subtitle={s.subtitle} onPress={() => router.push({ pathname: '/manage/[section]', params: { section: s.key } })} />
        ))}
        <Notice kind="info">Sermons update automatically from The AFM Podcast on Podbean. The Biography, Mission Statement and Handbook change with an app update.</Notice>
      </Screen>
    </RequireOwner>
  );
}
