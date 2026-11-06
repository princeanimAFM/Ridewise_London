import { useAppearance } from './appearance';
import { useContent } from './liveContent';

// The same photo with the studio backdrop recoloured from AFM green to church blue.
const blueBackdrop = require('../../assets/photos/micah-red-suit-smile-blue.jpg');

/** The welcome photo, with a blue backdrop when the member has chosen Church Blue & White. */
export function useHomePhoto() {
  const ministry = useContent();
  const { colour } = useAppearance();
  return colour === 'blue' ? blueBackdrop : ministry.photos.home;
}
