import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Image, ImageContentPosition } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { shade, useTheme } from '@/theme';

/**
 * A photo header with text over it. The photo fills the area and a dark
 * fade in the theme's colour at the bottom keeps the text readable.
 */
export function PhotoHero({
  source,
  height,
  position = 'top',
  children,
  style,
}: {
  source: unknown;
  height: number;
  position?: ImageContentPosition;
  children?: ReactNode;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const src = typeof source === 'string' ? { uri: source } : source;
  return (
    <View style={[{ height, overflow: 'hidden', backgroundColor: t.primary }, style]}>
      <Image source={src as never} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={position} transition={200} />
      <LinearGradient
        colors={[shade(t, 0), shade(t, 0.15), shade(t, 0.88)]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'flex-end', padding: 20 },
});
