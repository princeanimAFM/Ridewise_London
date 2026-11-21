# Scenic photo backdrops

`build.py` puts the Sunday photos of the pastor into the scenes behind the Living Water and Evening Glow looks
(`assets/photos/micah-red-suit-{smile,full}-{sky,skynight,tide,tidenight,dusk,dusknight}.jpg`).

- `matte_lib.py` cuts him out of the green studio backdrop (the share of backdrop in every edge pixel is worked out, so hair and the
  suit's edge stay clean on any background) and sets him into a new one.
- `scenes.py` draws the Ocean (a wall of sea water seen through glass) and the Evening Glow sunset with numpy.
- `real_scenes.py` builds the Sky look from real photographs: a portrait crop of a sky photo by day; by night a star field with the
  Milky Way and a photograph of the full moon, set in with its own halo. It also builds a real-sunset version of Evening Glow
  (`python3 build.py --dusk=real`, photo a, b or c with `--dusk-photo=`): the sunset as photographed by day, the same scene after dark
  with real stars and a crescent moon by night. Without `--dusk=real`, Evening Glow is the drawn sunset.
- `fetch-sources.sh` downloads those photos into `sources/` (not kept in git).

Needs Python 3 with numpy and Pillow. Everything runs on this computer; his photos are never sent to any service.

## Photo credits (free to use, changes allowed, no credit needed under the [Pexels licence](https://www.pexels.com/license/))

| Used for | Pexels photo |
|---|---|
| Daytime sky | https://www.pexels.com/photo/19294597/ ("Clouds on Blue Sky") |
| Night sky, stars and Milky Way | https://www.pexels.com/photo/813269/ ("Moon And Stars", Min An) |
| The full moon | https://www.pexels.com/photo/3905310/ ("Full Moon In Dark Night Sky") |
| Real sunset a (Evening Glow option) | https://www.pexels.com/photo/14528921/ ("Sunset on Sea With Reflection", Luis Moya) |
| Real sunset b | https://www.pexels.com/photo/35327803/ ("Majestic Sunset Over Ocean Horizon") |
| Real sunset c | https://www.pexels.com/photo/19757906/ ("Orange Sunset Sky with Dark Clouds on the Horizon", David Kanigan) |
