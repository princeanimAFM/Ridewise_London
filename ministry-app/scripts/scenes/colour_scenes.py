"""A real-photograph scene for each colour look, by day and by night.

Each function returns an H x W x 3 float array (0-255), the picture he is set into. The photos are free-licence Pexels photos
(see README.md); they are cropped to the picture's shape and graded towards the look's colours. Run fetch-sources.sh first.
"""
import numpy as np
from PIL import Image

from real_scenes import H, MOON, STARS, W, add_moon, blur, crop_to, load, screen, vgrad

YS = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
XX, YY = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))


def photo(name, cx=0.5, cy=0.5, zoom=1.0):
    return np.array(crop_to(load(name), cx, cy, zoom)).astype(np.float32)


def hsv(img, dh=0.0, ds=1.0, dv=1.0):
    """Shift the hue (degrees) and scale the saturation and brightness."""
    a = np.array(Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert('HSV')).astype(np.float32)
    a[..., 0] = (a[..., 0] + dh * 255.0 / 360.0) % 256
    a[..., 1] = np.clip(a[..., 1] * ds, 0, 255)
    a[..., 2] = np.clip(a[..., 2] * dv, 0, 255)
    return np.array(Image.fromarray(a.astype(np.uint8), 'HSV').convert('RGB')).astype(np.float32)


def mul(img, rgb):
    return np.clip(img * np.asarray(rgb, np.float32), 0, 255)


def lift(img, rgb, amount):
    """Mix a colour into the picture (amount 0..1)."""
    return img * (1 - amount) + np.asarray(rgb, np.float32) * amount


def add_stars(img, top=0.55, fade=0.3, gain=1.5, cx=0.3):
    """Real stars (from the Milky Way photo) in the upper part of the picture, fading out lower down."""
    st = photo(STARS, cx)
    st = np.clip(st - np.percentile(st, 60, axis=(0, 1)), 0, 255) * gain
    mask = np.clip((top - YS) / fade, 0, 1) ** 1.1
    return screen(img, np.clip(st * mask, 0, 255))


def fireflies(img, seed=3, count=70, colour=(255, 222, 130)):
    """Soft warm specks of light, like fireflies, drifting in the dark."""
    rng = np.random.default_rng(seed)
    layer = np.zeros((H, W), np.float32)
    for _ in range(count):
        x, y = rng.uniform(0, W), rng.uniform(0, H * 0.9)
        r = rng.uniform(2.5, 9.0)
        amp = rng.uniform(0.35, 1.0)
        x0, x1, y0, y1 = int(max(0, x - 5 * r)), int(min(W, x + 5 * r)), int(max(0, y - 5 * r)), int(min(H, y + 5 * r))
        gx, gy = XX[y0:y1, x0:x1] - x, YY[y0:y1, x0:x1] - y
        layer[y0:y1, x0:x1] += amp * np.exp(-(gx * gx + gy * gy) / (2 * (r / 2.2) ** 2))
    return screen(img, np.clip(layer[..., None] * np.asarray(colour, np.float32), 0, 255))


def golden(night=False):
    """AFM Green: sunlight in gold rays through green leaves. Night: the same wood in moonlight, with fireflies."""
    day = hsv(photo('px-19500620.jpg', 0.55), 0, 1.10, 1.04)
    if not night:
        return day
    n = mul(hsv(day, 14, 0.85, 0.48), (0.76, 1.0, 1.0))
    return fireflies(n)


def mist(night=False):
    """Forest Green & Sage: pines in mist. Night: a dark pine wood in fog with the moon behind it."""
    if not night:
        return mul(hsv(photo('px-13735083.jpg', 0.72), 0, 0.95, 1.0), (0.95, 1.03, 0.98))
    n = mul(hsv(photo('px-12315546.jpg', 0.5), 0, 1.05, 0.42), (0.78, 1.0, 1.05))
    return add_moon(n, load(MOON), 790, 235, 165, gain=1.0)


def twilight(night=False):
    """Royal Purple & Orchid: violet and orchid clouds. Night: a purple dusk with a crescent moon and the first stars."""
    if not night:
        return hsv(photo('px-1287142.jpg', 0.5), 6, 1.0, 0.96)
    n = add_stars(hsv(photo('px-6564097.jpg', 0.5, 0.3), 0, 1.1, 0.66), top=0.5, fade=0.3, gain=1.1)
    return add_moon(n, load(MOON), 800, 250, 150, crescent=0.42)


def rose(night=False):
    """Wine & Dusty Rose: soft rose clouds. Night: wine-dark clouds with the moon and stars."""
    if not night:
        return hsv(photo('px-6331086.jpg', 0.5, 0.35), -16, 1.1, 0.8)
    return hsv(photo('px-2719301.jpg', 0.15), 28, 0.8, 0.62)


def aurora(night=False):
    """Emerald & Navy: calm emerald water by day; green northern lights over a navy night sky."""
    if not night:
        return lift(hsv(photo('px-11807184.jpg', 0.12, 0.85, 2.2), -14, 1.0, 0.95), (4, 50, 60), 0.15)
    base = vgrad([(0, (6, 12, 44)), (0.6, (10, 24, 70)), (1, (14, 34, 90))])
    return screen(base, np.clip(photo('px-18945828.jpg', 0.5) * 1.15, 0, 255))


def storm(night=False):
    """Burnt Orange & Slate: slate cloud lit orange. Night: dark slate cloud with an orange rim of light."""
    if not night:
        return hsv(photo('px-5245865.jpg', 0.5), 0, 1.05, 0.95)
    return hsv(photo('px-31788104.jpg', 0.5), 0, 1.0, 0.85)


def redsky(night=False):
    """Deep Red & Sky: red cloud in a blue evening sky. Night: deep crimson dusk with stars."""
    if not night:
        return hsv(photo('px-4381454.jpg', 0.5), 0, 1.05, 0.95)
    return add_stars(hsv(photo('px-12616695.jpg', 0.5), -6, 1.3, 0.6), top=0.45, fade=0.3, gain=1.3)


LOOKS = {'golden': golden, 'mist': mist, 'twilight': twilight, 'rose': rose, 'aurora': aurora, 'storm': storm, 'redsky': redsky}
