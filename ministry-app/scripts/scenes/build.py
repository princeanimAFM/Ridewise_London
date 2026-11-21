"""Puts the Sunday photos into each scenic look (Living Water Ocean / Sky and Evening Glow), by day and by night.

    sh scripts/scenes/fetch-sources.sh               (once: the free sky, star, moon and sunset photos)
    python3 scripts/scenes/build.py [out_dir] [--dusk=real] [--dusk-photo=a|b|c]
        needs numpy and Pillow; out_dir defaults to assets/photos. Evening Glow is the drawn sunset unless --dusk=real,
        which uses a real sunset photo instead (a = deep brown-red sky and sun path, b = amber clouds, c = burnt orange).

Reads micah-red-suit-smile.jpg (Home) and micah-red-suit-full.jpg (Sermons) from assets/photos, cuts him out of the green studio
backdrop (matte_lib.py) and sets him in each scene, writing micah-red-suit-{smile,full}-{look}.jpg for
look = sky, skynight (real photos, real_scenes.py), tide, tidenight, dusk, dusknight (drawn, scenes.py).
Everything happens on this computer: his photos are never sent to any service.
"""
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import real_scenes  # noqa: E402
import scenes  # noqa: E402
from matte_lib import composite, subject_matte  # noqa: E402

PHOTOS = os.path.normpath(os.path.join(HERE, '..', '..', 'assets', 'photos'))
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
OUT = ARGS[0] if ARGS else PHOTOS

BG = {
    'sky': real_scenes.real_sky_day, 'skynight': real_scenes.real_sky_night,
    'tide': lambda: scenes.sea_glass(False), 'tidenight': lambda: scenes.sea_glass(True),
    'dusk': lambda: scenes.sunset(False), 'dusknight': lambda: scenes.sunset(True),
}
if '--dusk=real' in sys.argv:
    which = next((a.split('=')[1] for a in sys.argv if a.startswith('--dusk-photo=')), 'a')
    BG['dusk'] = lambda: real_scenes.real_dusk_day(which)
    BG['dusknight'] = lambda: real_scenes.real_dusk_night(which)
mattes = {k: subject_matte(os.path.join(PHOTOS, n), None) for k, n in (('smile', 'micah-red-suit-smile.jpg'), ('full', 'micah-red-suit-full.jpg'))}
rng = np.random.default_rng(1)
for look, make in BG.items():
    bg = make()
    for key, (a, alpha, B) in mattes.items():
        out = composite(a, alpha, B, bg)
        out = np.clip(out + rng.normal(0, 1.1, out.shape), 0, 255).astype(np.uint8)  # a little grain, so the smooth sky has no banding
        Image.fromarray(out).save(os.path.join(OUT, f'micah-red-suit-{key}-{look}.jpg'), quality=88, subsampling=0)
    print('made', look)
