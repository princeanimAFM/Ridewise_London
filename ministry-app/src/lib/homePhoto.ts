import type { Colour } from './appearance';
import { useAppearance } from './appearance';
import { useIsDark } from '@/theme';
import { useContent } from './liveContent';

// The same photos with the green studio backdrop recoloured to each look's colour. The Living Water and Evening Glow looks
// put him in a scene instead (ocean, sky, sunset), each with a day and a night version for light and dark.
const SCENES = ['tide', 'sky', 'dusk', 'golden', 'mist', 'twilight', 'rose', 'aurora', 'storm', 'redsky'] as const;
type PhotoKey = Colour | `${(typeof SCENES)[number]}Night`;
const photoKey = (colour: Colour, dark: boolean): PhotoKey => (dark && (SCENES as readonly string[]).includes(colour) ? (`${colour}Night` as PhotoKey) : colour);

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
  golden: require('../../assets/photos/micah-red-suit-smile-golden.jpg'),
  goldenNight: require('../../assets/photos/micah-red-suit-smile-goldennight.jpg'),
  mist: require('../../assets/photos/micah-red-suit-smile-mist.jpg'),
  mistNight: require('../../assets/photos/micah-red-suit-smile-mistnight.jpg'),
  twilight: require('../../assets/photos/micah-red-suit-smile-twilight.jpg'),
  twilightNight: require('../../assets/photos/micah-red-suit-smile-twilightnight.jpg'),
  rose: require('../../assets/photos/micah-red-suit-smile-rose.jpg'),
  roseNight: require('../../assets/photos/micah-red-suit-smile-rosenight.jpg'),
  aurora: require('../../assets/photos/micah-red-suit-smile-aurora.jpg'),
  auroraNight: require('../../assets/photos/micah-red-suit-smile-auroranight.jpg'),
  storm: require('../../assets/photos/micah-red-suit-smile-storm.jpg'),
  stormNight: require('../../assets/photos/micah-red-suit-smile-stormnight.jpg'),
  redsky: require('../../assets/photos/micah-red-suit-smile-redsky.jpg'),
  redskyNight: require('../../assets/photos/micah-red-suit-smile-redskynight.jpg'),
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
  golden: require('../../assets/photos/micah-red-suit-full-golden.jpg'),
  goldenNight: require('../../assets/photos/micah-red-suit-full-goldennight.jpg'),
  mist: require('../../assets/photos/micah-red-suit-full-mist.jpg'),
  mistNight: require('../../assets/photos/micah-red-suit-full-mistnight.jpg'),
  twilight: require('../../assets/photos/micah-red-suit-full-twilight.jpg'),
  twilightNight: require('../../assets/photos/micah-red-suit-full-twilightnight.jpg'),
  rose: require('../../assets/photos/micah-red-suit-full-rose.jpg'),
  roseNight: require('../../assets/photos/micah-red-suit-full-rosenight.jpg'),
  aurora: require('../../assets/photos/micah-red-suit-full-aurora.jpg'),
  auroraNight: require('../../assets/photos/micah-red-suit-full-auroranight.jpg'),
  storm: require('../../assets/photos/micah-red-suit-full-storm.jpg'),
  stormNight: require('../../assets/photos/micah-red-suit-full-stormnight.jpg'),
  redsky: require('../../assets/photos/micah-red-suit-full-redsky.jpg'),
  redskyNight: require('../../assets/photos/micah-red-suit-full-redskynight.jpg'),
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
