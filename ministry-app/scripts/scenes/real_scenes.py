"""The Sky look uses real photographs: a portrait crop of a sky photo by day, and a star field with a photographed full moon by night.

The photos are free to use (Pexels licence: no credit needed, changes allowed); see README.md for which ones. Run fetch-sources.sh first.
"""
import os

import numpy as np
from PIL import Image

W, H = 1000, 1400
HERE = os.path.dirname(os.path.abspath(__file__))
SOURCES = os.path.join(HERE, 'sources')
DAY, STARS, MOON = 'px-19294597.jpg', 'px-813269.jpg', 'px-3905310.jpg'


def load(name):
    path = os.path.join(SOURCES, name)
    if not os.path.exists(path):
        raise SystemExit(f'{path} is missing: run scripts/scenes/fetch-sources.sh first')
    return Image.open(path).convert('RGB')


def crop_to(img, cx, cy=0.5, zoom=1.0):
    """A portrait window (the picture's shape) of a photo, centred at the fractions (cx, cy); zoom 1 is the largest window."""
    iw, ih = img.size
    target = W / H
    if iw / ih > target:
        wh = ih
        ww = ih * target
    else:
        ww = iw
        wh = iw / target
    ww /= zoom
    wh /= zoom
    x0 = min(max(cx * iw - ww / 2, 0), iw - ww)
    y0 = min(max(cy * ih - wh / 2, 0), ih - wh)
    return img.crop((int(x0), int(y0), int(x0 + ww), int(y0 + wh))).resize((W, H), Image.LANCZOS)


def _box1d(a, r, axis):
    n = a.shape[axis]
    pad = [(0, 0)] * a.ndim
    pad[axis] = (r + 1, r)
    p = np.pad(a, pad, mode='edge')
    c = np.cumsum(p, axis=axis, dtype=np.float64)
    hi = [slice(None)] * a.ndim
    lo = [slice(None)] * a.ndim
    hi[axis] = slice(2 * r + 1, 2 * r + 1 + n)
    lo[axis] = slice(0, n)
    return ((c[tuple(hi)] - c[tuple(lo)]) / (2 * r + 1)).astype(np.float32)


def blur(a, sigma):
    """A soft blur (three box passes), for glows."""
    r = max(1, int(round(sigma * 0.9)))
    out = a.astype(np.float32)
    for _ in range(3):
        out = _box1d(_box1d(out, r, 0), r, 1)
    return out


def screen(base, layer):
    """Adds light the way a photographer does: black in `layer` changes nothing."""
    b = base / 255.0
    l = layer / 255.0
    return (1 - (1 - b) * (1 - l)) * 255.0


def vgrad(stops):
    """A vertical gradient from [(position 0..1, (r, g, b)), ...] as an H x W x 3 float array."""
    ys = np.linspace(0, 1, H, dtype=np.float32)
    pos = [p for p, _ in stops]
    cols = np.array([c for _, c in stops], np.float32)
    col = np.stack([np.interp(ys, pos, cols[:, k]) for k in range(3)], axis=1)
    return np.repeat(col[:, None, :], W, axis=1)


def find_moon(arr):
    """Centre and radius of the bright disc in a photo of the moon on black (found from the picture's own brightness)."""
    m = arr.mean(axis=2) > 40
    ys, xs = np.nonzero(m)
    return xs.mean(), ys.mean(), float(np.sqrt(m.sum() / np.pi))


def add_moon(sky, moon_photo, cx, cy, diameter, tint=(255, 246, 228), gain=1.12, crescent=0.0):
    """Sets the real moon into `sky` at (cx, cy): it hides the stars behind it, dims the ones near it and has a soft halo.
    With crescent > 0 only a crescent on the right is lit (crescent = how far the shadow is pushed across, as a share of the diameter)
    and the rest of the disc keeps a trace of earthshine."""
    arr = np.array(moon_photo.convert('RGB')).astype(np.float32)
    mx, my, mr = find_moon(arr)
    pad = 1.12
    tile = moon_photo.crop((int(mx - mr * pad), int(my - mr * pad), int(mx + mr * pad), int(my + mr * pad))).convert('RGB')
    size = int(diameter * pad)
    tile = np.array(tile.resize((size, size), Image.LANCZOS)).astype(np.float32)
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    rr = np.hypot(xx - size / 2, yy - size / 2) / (diameter / 2)
    inside = np.clip((1.0 - rr) / 0.035 + 0.5, 0, 1)
    if crescent > 0:
        shadow = np.hypot(xx - size / 2 + crescent * diameter, yy - size / 2) / (diameter / 2)
        lit = np.clip((shadow - 1.0) / 0.09 + 0.5, 0, 1)                    # outside the shadow disc = lit, with a soft terminator
        inside = inside * (0.07 + 0.93 * lit)                                # earthshine on the dark side
    tile = tile * inside[..., None] * (np.asarray(tint, np.float32) / 255.0) * gain
    layer = np.zeros((H, W, 3), np.float32)
    x0, y0 = int(cx - size / 2), int(cy - size / 2)
    sx0, sy0 = max(0, -x0), max(0, -y0)
    x1, y1 = min(W, x0 + size), min(H, y0 + size)
    layer[max(0, y0):y1, max(0, x0):x1] = tile[sy0:sy0 + (y1 - max(0, y0)), sx0:sx0 + (x1 - max(0, x0))]
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    disc = (np.hypot(xs - cx, ys - cy) < diameter / 2).astype(np.float32)
    near = np.clip(blur(disc, diameter * 0.55) * 1.4, 0, 1)
    sky = sky * (1 - (0.7 if crescent <= 0 else 0.15) * near[..., None])  # the moon's glare drowns the stars close to it
    hide = np.clip(blur(disc, 1.5) * 1.15, 0, 1)
    if crescent > 0:                                                         # only its lit part hides stars; the dark side stays see-through
        hide = hide * np.clip((np.hypot(xs - cx + crescent * diameter, ys - cy) / (diameter / 2) - 1.0) / 0.09 + 0.5, 0, 1)
    sky = sky * (1 - hide)[..., None]                                        # the moon itself hides the stars behind it
    halo = blur(disc, diameter * 0.16) * 0.42 + blur(disc, diameter * 0.55) * 0.26 + blur(disc, diameter * 1.4) * 0.14
    if crescent > 0:
        halo = halo * 0.45                                                   # a crescent gives much less light than a full moon
    halo = halo * (1.0 - np.clip(blur(disc, 2.0), 0, 1))                 # light round the moon, not over its face, so the craters stay
    return screen(sky, layer + halo[..., None] * np.asarray((196, 214, 255), np.float32))


def real_sky_day():
    """Blue sky with white clouds: a portrait crop of a real photo."""
    return np.array(crop_to(load(DAY), 0.5)).astype(np.float32)


def real_sky_night():
    """A real star field (with the Milky Way) lifted to deep blue, and a real photograph of the full moon."""
    stars = np.array(crop_to(load(STARS), 0.3)).astype(np.float32)
    base = vgrad([(0, (6, 10, 36)), (0.5, (14, 22, 70)), (1, (26, 40, 100))])
    sky = screen(base, np.clip(stars * 1.35, 0, 255))
    return add_moon(sky, load(MOON), 790, 230, 200)


# Real sunsets for the Evening Glow look (the drawn one in scenes.py is the alternative): which photo, and where to crop it.
DUSK = {
    'a': ('px-14528921.jpg', 0.5, 0.5),    # deep brown-red clouds, a low orange sun and its path on the sea
    'b': ('px-35327803.jpg', 0.35, 0.5),   # warm amber and brown clouds over a dark sea
    'c': ('px-19757906.jpg', 0.5, 0.5),    # a clean burnt-orange sky with cloud banks on the horizon
}


def real_dusk_day(key='a'):
    """The sunset itself, as photographed."""
    name, cx, cy = DUSK[key]
    return np.array(crop_to(load(name), cx, cy)).astype(np.float32)


def real_dusk_night(key='a'):
    """The same scene after dark: a dim copper glow is left low down, the sky above goes deep plum with real stars and a crescent moon."""
    day = real_dusk_day(key)
    ys = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    grey = np.repeat(day.mean(axis=2, keepdims=True), 3, axis=2)
    cool = (day * 0.45 + grey * 0.55) * np.asarray((0.62, 0.40, 0.56), np.float32)      # calm, plum
    warm = day * np.asarray((0.34, 0.27, 0.25), np.float32)                              # the light that is left, dimmed but still copper
    w = np.clip((ys - 0.26) / 0.22, 0, 1)
    w = w * w * (3 - 2 * w)
    night = cool * (1 - w) + warm * w
    night = night * (0.42 + 0.58 * np.clip(ys * 1.4, 0, 1))                              # darkest at the top
    stars = np.array(crop_to(load(STARS), 0.3)).astype(np.float32)                       # a window without that photo's own crescent
    stars = np.clip(stars - np.percentile(stars, 60, axis=(0, 1)), 0, 255)               # just the stars: that photo's own sky is bluish and would tint the glow
    mask = np.clip((0.52 - ys) / 0.28, 0, 1) ** 1.1                                      # stars above, fading out towards the glow
    sky = screen(night, np.clip(stars * 1.6 * mask, 0, 255))
    return add_moon(sky, load(MOON), 800, 250, 150, crescent=0.42)
