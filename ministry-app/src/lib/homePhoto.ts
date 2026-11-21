import type { Colour } from './appearance';
import { useAppearance } from './appearance';
import { useContent } from './liveContent';

// The same photos with the green studio backdrop recoloured to each look's colour.
const homeBackdrops: Partial<Record<Colour, number>> = {
  blue: require('../../assets/photos/micah-red-suit-smile-blue.jpg'),
  blueAqua: require('../../assets/photos/micah-red-suit-smile-blue.jpg'),
  forest: require('../../assets/photos/micah-red-suit-smile-forest.jpg'),
  brown: require('../../assets/photos/micah-red-suit-smile-brown.jpg'),
  purple: require('../../assets/photos/micah-red-suit-smile-purple.jpg'),
  wine: require('../../assets/photos/micah-red-suit-smile-wine.jpg'),
  emerald: require('../../assets/photos/micah-red-suit-smile-emerald.jpg'),
  rust: require('../../assets/photos/micah-red-suit-smile-rust.jpg'),
  crimson: require('../../assets/photos/micah-red-suit-smile-crimson.jpg'),
};
const sermonsBackdrops: Partial<Record<Colour, number>> = {
  blue: require('../../assets/photos/micah-red-suit-full-blue.jpg'),
  blueAqua: require('../../assets/photos/micah-red-suit-full-blue.jpg'),
  forest: require('../../assets/photos/micah-red-suit-full-forest.jpg'),
  brown: require('../../assets/photos/micah-red-suit-full-brown.jpg'),
  purple: require('../../assets/photos/micah-red-suit-full-purple.jpg'),
  wine: require('../../assets/photos/micah-red-suit-full-wine.jpg'),
  emerald: require('../../assets/photos/micah-red-suit-full-emerald.jpg'),
  rust: require('../../assets/photos/micah-red-suit-full-rust.jpg'),
  crimson: require('../../assets/photos/micah-red-suit-full-crimson.jpg'),
};

/** The welcome photo, with the backdrop in the member's chosen colour. */
export function useHomePhoto() {
  const ministry = useContent();
  const { colour } = useAppearance();
  return homeBackdrops[colour] ?? ministry.photos.home;
}

/** The Sermons photo, recoloured the same way. */
export function useSermonsPhoto() {
  const ministry = useContent();
  const { colour } = useAppearance();
  return sermonsBackdrops[colour] ?? ministry.photos.sermons;
}
