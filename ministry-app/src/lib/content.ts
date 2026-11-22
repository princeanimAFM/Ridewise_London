import { liveMinistry as ministry } from './liveContent';

export const sermonsByDate = [...ministry.sermons].sort((a, b) => b.date.localeCompare(a.date));

export const sermonSeries = Array.from(
  new Set(sermonsByDate.map((s) => s.series).filter((s): s is string => !!s)),
);

/** Same quote all day, a new one each day. */
export function quoteOfTheDay(date = new Date()) {
  const { quotes } = ministry;
  const day = Math.floor(date.getTime() / 86_400_000);
  return quotes[day % quotes.length];
}
