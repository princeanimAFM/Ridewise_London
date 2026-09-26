import { ministry } from '@/content/ministry';
import { Body, LinkRow, Screen } from '@/components/ui';
import { space } from '@/theme';

export default function Archive() {
  return (
    <Screen>
      <Body muted style={{ marginBottom: space.md }}>
        Explore past messages, broadcasts and special events.
      </Body>
      {ministry.archive.map((a) => (
        <LinkRow key={a.id} item={a} />
      ))}
    </Screen>
  );
}
