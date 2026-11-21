import { useContent } from '@/lib/liveContent';
import { Body, LinkRow, Screen } from '@/components/ui';
import { space } from '@/theme';

export default function Archive() {
  const ministry = useContent();
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
