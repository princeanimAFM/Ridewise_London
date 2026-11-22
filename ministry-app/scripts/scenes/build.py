"""Puts the Sunday photos into the scenes behind the HUB's glass looks, by day and by night.

    sh scripts/scenes/fetch-sources.sh          (once: the free photos the real scenes are made from)
    python3 scripts/scenes/build.py [out_dir]   (needs numpy and Pillow; out_dir defaults to assets/photos)
    python3 scripts/scenes/build.py out_dir --all   (also every sample scene that was shown to the owner)

The app's looks (chosen by the owner in November 2026): dusk = Evening Glow (a drawn sunset, scenes.py), sunset = Sunset (the
same look over a real sunset photograph, real_scenes.py) and aurora = Aurora (emerald water by day, the northern lights at night,
colour_scenes.py). For each look it writes micah-red-suit-{smile,full}-{look}.jpg and ...-{look}night.jpg.

Reads micah-red-suit-smile.jpg (Home) and micah-red-suit-full.jpg (Sermons) from assets/photos and cuts him out of the green
studio backdrop (matte_lib.py). Everything happens on this computer: his photos are never sent to any service.
"""
import os
import sys
import zlib

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import colour_scenes  # noqa: E402
import real_scenes  # noqa: E402
import scenes  # noqa: E402
from matte_lib import composite, subject_matte  # noqa: E402

PHOTOS = os.path.normpath(os.path.join(HERE, '..', '..', 'assets', 'photos'))
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
OUT = ARGS[0] if ARGS else PHOTOS

# the looks in the app
BG = {
    'dusk': lambda: scenes.sunset(False), 'dusknight': lambda: scenes.sunset(True),
    'sunset': lambda: real_scenes.real_dusk_day('a'), 'sunsetnight': lambda: real_scenes.real_dusk_night('a'),
    'aurora': lambda: colour_scenes.aurora(False), 'auroranight': lambda: colour_scenes.aurora(True),
}
if '--all' in sys.argv:  # the other samples the owner was shown (not in the app)
    BG.update({
        'sky': real_scenes.real_sky_day, 'skynight': real_scenes.real_sky_night,
        'tide': lambda: scenes.sea_glass(False), 'tidenight': lambda: scenes.sea_glass(True),
    })
    for _key, _fn in colour_scenes.LOOKS.items():
        BG.setdefault(_key, (lambda f=_fn: f(False)))
        BG.setdefault(_key + 'night', (lambda f=_fn: f(True)))

mattes = {k: subject_matte(os.path.join(PHOTOS, n), None) for k, n in (('smile', 'micah-red-suit-smile.jpg'), ('full', 'micah-red-suit-full.jpg'))}
for look, make in BG.items():
    bg = make()
    rng = np.random.default_rng(zlib.crc32(look.encode()))  # each look's own grain, so a picture doesn't change when others are added
    for key, (a, alpha, B) in mattes.items():
        out = composite(a, alpha, B, bg)
        out = np.clip(out + rng.normal(0, 1.1, out.shape), 0, 255).astype(np.uint8)  # a little grain, so smooth skies have no banding
        Image.fromarray(out).save(os.path.join(OUT, f'micah-red-suit-{key}-{look}.jpg'), quality=88, subsampling=0)
    print('made', look)
