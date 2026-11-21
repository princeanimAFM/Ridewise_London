"""Puts the Sunday photos into each scenic look (Living Water Ocean / Sky and Evening Glow), by day and by night.

    python3 scripts/scenes/build.py [out_dir]        (needs numpy and Pillow; out_dir defaults to assets/photos)

Reads micah-red-suit-smile.jpg (Home) and micah-red-suit-full.jpg (Sermons) from assets/photos, cuts him out of the green studio
backdrop (matte_lib.py) and sets him in the scenes drawn by scenes.py, writing micah-red-suit-{smile,full}-{look}.jpg for
look = sky, skynight, tide, tidenight, dusk, dusknight. Nothing is sent to any service: the scenes are drawn on this computer.
"""
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import scenes  # noqa: E402
from matte_lib import composite, subject_matte  # noqa: E402

PHOTOS = os.path.normpath(os.path.join(HERE, '..', '..', 'assets', 'photos'))
OUT = sys.argv[1] if len(sys.argv) > 1 else PHOTOS

BG = {
    'sky': lambda: scenes.sky_day(), 'skynight': lambda: scenes.sky_night(),
    'tide': lambda: scenes.sea_glass(False), 'tidenight': lambda: scenes.sea_glass(True),
    'dusk': lambda: scenes.sunset(False), 'dusknight': lambda: scenes.sunset(True),
}
mattes = {k: subject_matte(os.path.join(PHOTOS, n), None) for k, n in (('smile', 'micah-red-suit-smile.jpg'), ('full', 'micah-red-suit-full.jpg'))}
rng = np.random.default_rng(1)
for look, make in BG.items():
    bg = make()
    for key, (a, alpha, B) in mattes.items():
        out = composite(a, alpha, B, bg)
        out = np.clip(out + rng.normal(0, 1.1, out.shape), 0, 255).astype(np.uint8)  # a little grain, so the smooth sky has no banding
        Image.fromarray(out).save(os.path.join(OUT, f'micah-red-suit-{key}-{look}.jpg'), quality=88, subsampling=0)
    print('made', look)
