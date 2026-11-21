import type { Colour } from './appearance';
import { useAppearance } from './appearance';
import { useIsDark } from '@/theme';
import { useContent } from './liveContent';

// The same photos with the green studio backdrop recoloured to each look's colour. The Living Water and Evening Glow looks
// put him in a scene instead (ocean, sky, sunset), each with a day and a night version for light and dark.
type PhotoKey = Colour | 'tideNight' | 'skyNight' | 'duskNight';
const SCENES: readonly Colour[] = ['tide', 'sky', 'dusk'];
const photoKey = (colour: Colour, dark: boolean): PhotoKey => (dark && SCENES.includes(colour) ? (`${colour}Night` as PhotoKey) : colour);

const homeBackdrops: Partial<Record<PhotoKey, number>> = {
  blue: require('../../assets/photos/micah-red-suit-smile-blue.jpg'),
  blueAqua: require('../../assets/photos/micah-red-suit-smile-blue.jpg'),
  forest: require('../../assets/photos/micah-red-suit-smile-forest.jpg'),
  brown: require('../../assets/photos/micah-red-suit-smile-brown.jpg'),
  purple: require('../../assets/photos/micah-red-suit-smile-purple.jpg'),
  wine: require('../../assets/photos/micah-red-suit-smile-wine.jpg'),
  emerald: require('../../assets/photos/micah-red-suit-smile-emerald.jpg'),
  rust: require('../../assets/photos/micah-red-suit-smile-rust.jpg'),
  crimson: require('../../assets/photos/micah-red-suit-smile-crimson.jpg'),
  tide: require('../../assets/photos/micah-red-suit-smile-tide.jpg'),
  tideNight: require('../../assets/photos/micah-red-suit-smile-tidenight.jpg'),
  sky: require('../../assets/photos/micah-red-suit-smile-sky.jpg'),
  skyNight: require('../../assets/photos/micah-red-suit-smile-skynight.jpg'),
  dusk: require('../../assets/photos/micah-red-suit-smile-dusk.jpg'),
  duskNight: require('../../assets/photos/micah-red-suit-smile-dusknight.jpg'),
};
const sermonsBackdrops: Partial<Record<PhotoKey, number>> = {
  blue: require('../../assets/photos/micah-red-suit-full-blue.jpg'),
  blueAqua: require('../../assets/photos/micah-red-suit-full-blue.jpg'),
  forest: require('../../assets/photos/micah-red-suit-full-forest.jpg'),
  brown: require('../../assets/photos/micah-red-suit-full-brown.jpg'),
  purple: require('../../assets/photos/micah-red-suit-full-purple.jpg'),
  wine: require('../../assets/photos/micah-red-suit-full-wine.jpg'),
  emerald: require('../../assets/photos/micah-red-suit-full-emerald.jpg'),
  rust: require('../../assets/photos/micah-red-suit-full-rust.jpg'),
  crimson: require('../../assets/photos/micah-red-suit-full-crimson.jpg'),
  tide: require('../../assets/photos/micah-red-suit-full-tide.jpg'),
  tideNight: require('../../assets/photos/micah-red-suit-full-tidenight.jpg'),
  sky: require('../../assets/photos/micah-red-suit-full-sky.jpg'),
  skyNight: require('../../assets/photos/micah-red-suit-full-skynight.jpg'),
  dusk: require('../../assets/photos/micah-red-suit-full-dusk.jpg'),
  duskNight: require('../../assets/photos/micah-red-suit-full-dusknight.jpg'),
};

/** The welcome photo, with the backdrop in the member's chosen colour. */
export function useHomePhoto() {
  const ministry = useContent();
  const { colour } = useAppearance();
  const dark = useIsDark();
  return homeBackdrops[photoKey(colour, dark)] ?? ministry.photos.home;
}

/** The Sermons photo, recoloured the same way. */
export function useSermonsPhoto() {
  const ministry = useContent();
  const { colour } = useAppearance();
  const dark = useIsDark();
  return sermonsBackdrops[photoKey(colour, dark)] ?? ministry.photos.sermons;
}
