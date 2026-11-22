import type { Colour } from './appearance';
import { useAppearance } from './appearance';
import { useIsDark } from '@/theme';
import { useContent } from './liveContent';

// The Sunday photos, matched to the member's look: Church Blue & White has the studio backdrop recoloured blue; the glass looks
// put him in a scene (scripts/scenes/build.py), with a day and a night version for light and dark mode. AFM Green uses the photos
// the content gives.
const SCENES = ['dusk', 'sunset', 'aurora'] as const;
type PhotoKey = Colour | `${(typeof SCENES)[number]}Night`;
const photoKey = (colour: Colour, dark: boolean): PhotoKey => (dark && (SCENES as readonly string[]).includes(colour) ? (`${colour}Night` as PhotoKey) : colour);

const homeBackdrops: Partial<Record<PhotoKey, number>> = {
  blue: require('../../assets/photos/micah-red-suit-smile-blue.jpg'),
  dusk: require('../../assets/photos/micah-red-suit-smile-dusk.jpg'),
  duskNight: require('../../assets/photos/micah-red-suit-smile-dusknight.jpg'),
  sunset: require('../../assets/photos/micah-red-suit-smile-sunset.jpg'),
  sunsetNight: require('../../assets/photos/micah-red-suit-smile-sunsetnight.jpg'),
  aurora: require('../../assets/photos/micah-red-suit-smile-aurora.jpg'),
  auroraNight: require('../../assets/photos/micah-red-suit-smile-auroranight.jpg'),
};
const sermonsBackdrops: Partial<Record<PhotoKey, number>> = {
  blue: require('../../assets/photos/micah-red-suit-full-blue.jpg'),
  dusk: require('../../assets/photos/micah-red-suit-full-dusk.jpg'),
  duskNight: require('../../assets/photos/micah-red-suit-full-dusknight.jpg'),
  sunset: require('../../assets/photos/micah-red-suit-full-sunset.jpg'),
  sunsetNight: require('../../assets/photos/micah-red-suit-full-sunsetnight.jpg'),
  aurora: require('../../assets/photos/micah-red-suit-full-aurora.jpg'),
  auroraNight: require('../../assets/photos/micah-red-suit-full-auroranight.jpg'),
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
