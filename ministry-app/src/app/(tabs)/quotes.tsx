import { ministry } from '@/content/ministry';
import { quoteOfTheDay } from '@/lib/content';
import { QuoteCard } from '@/components/QuoteCard';
import { Screen, SectionHeader } from '@/components/ui';

export default function Quotes() {
  const today = quoteOfTheDay();
  return (
    <Screen>
      <QuoteCard quote={today} featured />
      <SectionHeader title="All Quotes" />
      {ministry.quotes
        .filter((q) => q.id !== today.id)
        .map((q) => (
          <QuoteCard key={q.id} quote={q} />
        ))}
    </Screen>
  );
}
