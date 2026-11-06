import { StyleSheet, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useContent } from '@/lib/liveContent';
import { openLink, shareText } from '@/lib/links';
import { Artwork, Body, Button, Screen, Title } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';

export default function BookDetail() {
  const ministry = useContent();
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = ministry.books.find((b) => b.id === id);
  if (!book) return <Screen><Body>Book not found.</Body></Screen>;

  return (
    <Screen>
      <Stack.Screen options={{ title: book.title }} />
      <Artwork uri={book.cover} icon="book" label={book.title} style={styles.cover} />
      <Title style={{ textAlign: 'center' }}>{book.title}</Title>
      {book.subtitle && <Text style={[styles.subtitle, { color: t.textMuted }]}>{book.subtitle}</Text>}
      {book.price && <Text style={[styles.price, { color: t.accent }]}>{book.price}</Text>}
      <Body style={{ marginBottom: space.lg }}>{book.description}</Body>
      <Button label="Buy on Amazon" icon="logo-amazon" variant="gold" onPress={() => openLink(book.amazonUrl)} style={{ marginBottom: space.sm }} />
      <Button
        label="Share"
        icon="share-social-outline"
        variant="outline"
        onPress={() => shareText(`${book.title} by ${ministry.minister}\n${book.amazonUrl}`)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { width: 200, aspectRatio: 2 / 3, borderRadius: radius.sm, alignSelf: 'center', marginBottom: space.lg },
  subtitle: { textAlign: 'center', fontSize: 16, marginBottom: space.sm },
  price: { textAlign: 'center', fontSize: 18, fontWeight: '700', marginBottom: space.md },
});
