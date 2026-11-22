import { Text, type StyleProp, type TextStyle } from 'react-native';
import { router } from 'expo-router';
import { paragraphs } from '@/lib/dictionary';
import { useTheme } from '@/theme';

/**
 * Text from the dictionary or commentary, with its Bible references and dictionary links tappable:
 * a reference opens the verse, a name opens its dictionary entry.
 */
export function RichText({ body, style, onNavigate }: { body: string; style?: StyleProp<TextStyle>; onNavigate?: () => void }) {
  const t = useTheme();
  const read = (book: number, chapter: number, verse: number) => {
    onNavigate?.();
    router.push({ pathname: '/bible/read', params: { book, chapter, verse: verse || '' } });
  };
  const see = (term: string) => {
    onNavigate?.();
    router.push({ pathname: '/bible/dictionary', params: { term } });
  };
  return (
    <>
      {paragraphs(body).map((pieces, i) => (
        <Text key={i} style={style}>
          {pieces.map((p, j) =>
            p.kind === 'text' ? p.text : (
              <Text key={j} onPress={() => (p.kind === 'ref' ? read(p.book, p.chapter, p.verse) : see(p.term))}
                style={{ color: t.accent, fontWeight: p.kind === 'ref' ? '600' : '700' }}>
                {p.kind === 'entry' ? p.text.charAt(0) + p.text.slice(1).toLowerCase() : p.text}
              </Text>
            ))}
        </Text>
      ))}
    </>
  );
}
