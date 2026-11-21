"""Procedural backdrops for the app's welcome and Sermons photos: sky, sea seen through glass, and a sunset sea, day and night."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1000, 1400
YY = np.arange(H, dtype=np.float32)[:, None]
XX = np.arange(W, dtype=np.float32)[None, :]

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

def vgrad(stops):
    ys = np.linspace(0, 1, H, dtype=np.float32)
    pos = [p for p, _ in stops]; cols = np.array([c for _, c in stops], np.float32)
    out = np.empty((H, W, 3), np.float32)
    for k in range(3): out[..., k] = np.interp(ys, pos, cols[:, k])[:, None]
    return out

def noise(cw, ch, seed):
    rng = np.random.default_rng(seed)
    gw, gh = int(np.ceil(W / cw)) + 3, int(np.ceil(H / ch)) + 3
    g = rng.random((gh, gw)).astype(np.float32)
    a = np.array(Image.fromarray(g).resize((gw * cw, gh * ch), Image.BICUBIC), dtype=np.float32)
    return a[ch:ch + H, cw:cw + W]

def stretch(n):
    lo, hi = np.percentile(n, [3, 97]); return np.clip((n - lo) / (hi - lo), 0, 1)

def fbm(cw, ch, octaves, seed, gain=0.5):
    tot = np.zeros((H, W), np.float32); amp, norm = 1.0, 0.0
    for o in range(octaves):
        tot += amp * noise(max(2, int(cw / 2 ** o)), max(2, int(ch / 2 ** o)), seed + 31 * o); norm += amp; amp *= gain
    return stretch(tot / norm)

def _box1d(a, r, axis):
    n = a.shape[axis]
    pad = [(0, 0)] * a.ndim; pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode='edge'), axis=axis, dtype=np.float64)
    hi = [slice(None)] * a.ndim; lo = [slice(None)] * a.ndim
    hi[axis] = slice(2 * r + 1, 2 * r + 1 + n); lo[axis] = slice(0, n)
    return ((c[tuple(hi)] - c[tuple(lo)]) / (2 * r + 1)).astype(np.float32)

def blur(a, sigma):
    """Gaussian-like blur (three box passes), for float images of any shape."""
    r = max(1, int(round(sigma)))
    out = a.astype(np.float32)
    for _ in range(3):
        out = _box1d(_box1d(out, r, 0), r, 1)
    return out

def shift(a, dx, dy):
    return np.roll(np.roll(a, int(dy), axis=0), int(dx), axis=1)

def mix(base, colour, alpha):
    al = alpha[..., None] if alpha.ndim == 2 else alpha
    c = np.asarray(colour, np.float32)
    return base * (1 - al) + c * al

def glow(cx, cy, radius, power=2.0):
    d = np.sqrt((XX - cx) ** 2 + (YY - cy) ** 2) / radius
    return np.clip(1 - d, 0, 1) ** power

def vignette(img, strength=0.28):
    cx, cy = W / 2, H / 2
    v = (((XX - cx) / cx) ** 2 + ((YY - cy) / cy) ** 2) ** 1.4
    return img * (1 - strength * np.clip(v, 0, 1.4))[..., None]

def stars(img, seed, count, ymax=0.6, bright=1.0, tint=(235, 240, 255)):
    rng = np.random.default_rng(seed)
    layer = Image.new('L', (W, H), 0); d = ImageDraw.Draw(layer)
    for _ in range(count):
        x, y = rng.random() * W, (rng.random() ** 1.5) * H * ymax
        r = rng.choice([0.7, 1.0, 1.4, 2.0], p=[0.5, 0.3, 0.15, 0.05]); v = int(255 * (0.4 + 0.6 * rng.random()))
        d.ellipse((x - r, y - r, x + r, y + r), fill=v)
    sharp = np.array(layer, np.float32) / 255
    halo = blur(sharp, 2.2) * 2.5
    return mix(img, tint, np.clip(sharp * bright + halo * 0.5 * bright, 0, 1))

def bubbles(img, seed, count, rmin=3, rmax=14, ymin=0.08, ymax=1.0, tint=(220, 245, 255), strength=1.0):
    rng = np.random.default_rng(seed)
    layer = Image.new('RGBA', (W * 2, H * 2), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    for _ in range(count):
        r = rmin + (rmax - rmin) * rng.random() ** 2.2
        x, y = rng.random() * W, (ymin + (ymax - ymin) * rng.random()) * H
        a = int(255 * (0.25 + 0.5 * rng.random()) * strength)
        d.ellipse(((x - r) * 2, (y - r) * 2, (x + r) * 2, (y + r) * 2), outline=(255, 255, 255, a), width=max(2, int(r * 0.35)), fill=(255, 255, 255, int(a * 0.12)))
        d.ellipse(((x - r * 0.55) * 2, (y - r * 0.6) * 2, (x - r * 0.15) * 2, (y - r * 0.25) * 2), fill=(255, 255, 255, min(255, int(a * 1.3))))
    layer = layer.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.5))
    arr = np.array(layer, np.float32) / 255
    return mix(img, tint, arr[..., 3] * (arr[..., 0]))

def glass(img, tilt=0.42, strength=1.0, edges=True):
    """The sheen of a sheet of glass in front of the scene: a broad diagonal glare, a thin second band and a bright edge."""
    d = (XX + tilt * YY - 520) / 150.0
    g = 0.11 * np.exp(-d ** 2) + 0.05 * np.exp(-((d - 2.3) * 2.6) ** 2) + 0.03 * np.exp(-((d + 2.1) * 2.2) ** 2)
    edge = (0.16 * np.exp(-((XX - 34) / 9.0) ** 2) + 0.07 * np.exp(-((XX - (W - 30)) / 7.0) ** 2)) if edges else 0.0
    return mix(img, (255, 255, 255), np.clip((g + edge) * strength, 0, 0.5) * np.ones((H, W), np.float32))

def clouds(img, seed, cover, lit, shade, sun=(-1.0, -1.0), ymin=0.0, ymax=1.0, scale=(360, 230), alpha=1.0, softness=0.30, gain=26):
    """Soft puffy clouds: a smooth density field lit from the side facing the sun, shaded underneath."""
    base = fbm(scale[0], scale[1], 6, seed)
    ybias = smoothstep(ymin - 0.04, ymin + 0.10, YY / H) * (1 - smoothstep(ymax - 0.10, ymax + 0.04, YY / H))
    d = smoothstep(cover, cover + softness, base) * ybias
    ds = blur(d, 8)
    gy, gx = np.gradient(ds)
    sx, sy = sun
    face = np.clip(0.70 - (gx * sx + gy * sy) * gain, 0, 1)           # edges that face the sun
    core = np.clip(blur(d, 34) * 1.5, 0, 1)                            # the thick middle sits in its own shade
    k = np.clip(face * 0.85 + (1 - core) * 0.40, 0, 1)[..., None]
    col = np.asarray(shade, np.float32) * (1 - k) + np.asarray(lit, np.float32) * k
    a = (np.clip(blur(d, 2.5) * 1.35, 0, 1) * alpha)[..., None]
    return img * (1 - a) + col * a

def streaks(img, seed, colour, alpha, ymin=0.0, ymax=0.6, scale=(1100, 70)):
    """Thin wisps of high cloud."""
    n = fbm(scale[0], scale[1], 4, seed)
    band = smoothstep(ymin, ymin + 0.1, YY / H) * (1 - smoothstep(ymax - 0.1, ymax, YY / H))
    m = smoothstep(0.58, 0.9, n) * band * alpha
    return mix(img, colour, m)

def sky_day():
    img = vgrad([(0, (26, 98, 190)), (0.35, (58, 142, 226)), (0.7, (128, 196, 244)), (1, (206, 234, 250))])
    img = mix(img, (255, 248, 236), glow(820, 110, 700, 2.2) * 0.55)
    img = streaks(img, 3, (255, 255, 255), 0.55, ymin=0.02, ymax=0.5)
    img = clouds(img, 7, 0.54, (255, 255, 255), (168, 198, 234), ymin=0.16, ymax=1.0, alpha=0.97)
    img = clouds(img, 23, 0.60, (255, 255, 255), (182, 208, 238), ymin=0.52, ymax=1.0, scale=(560, 170), alpha=0.9)
    return vignette(img, 0.18)

def sky_night():
    img = vgrad([(0, (8, 12, 46)), (0.4, (20, 30, 92)), (0.75, (46, 66, 150)), (1, (86, 110, 190))])
    img = mix(img, (200, 215, 255), glow(800, 150, 520, 2.4) * 0.35)
    img = stars(img, 5, 520, ymax=0.62)
    d = np.sqrt((XX - 800) ** 2 + (YY - 150) ** 2)
    img = mix(img, (236, 242, 255), (1 - smoothstep(34, 40, d)) * 0.92)           # the moon
    img = streaks(img, 9, (150, 170, 230), 0.35, ymin=0.05, ymax=0.5)
    img = clouds(img, 11, 0.56, (176, 192, 240), (52, 66, 132), ymin=0.3, ymax=1.0, alpha=0.78)
    return vignette(img, 0.22)

def full(v):
    return np.asarray(v, np.float32) * np.ones((H, W), np.float32)

def ridged(cell, seed):
    n = noise(cell, cell, seed)
    return (1 - np.abs(2 * n - 1)) ** 6

def caustics(repeat, seed, wob=2.4, wscale=900):
    """Fine bright lines of sunlight through moving water: folded sine waves, the look of light on a pool floor."""
    rng = np.random.default_rng(seed)
    tau = 2 * np.pi
    # a slow wobble in the coordinates so the pattern never repeats the same way twice
    wx = (fbm(wscale, wscale, 3, seed + 10) - 0.5) * wob
    wy = (fbm(wscale, wscale, 3, seed + 11) - 0.5) * wob
    px = (XX / W * repeat * tau + wx) % tau - 250.0
    py = (YY / W * repeat * tau + wy) % tau - 250.0
    ix, iy = px.copy(), py.copy()
    c = np.ones((H, W), np.float32)
    inten = 0.0075
    for n in range(5):
        t = rng.uniform(2.0, 9.0) * (1.0 - 3.5 / (n + 1))
        ix, iy = px + (np.cos(t - ix) + np.sin(t + iy)), py + (np.sin(t - iy) + np.cos(t + ix))
        c += 1.0 / np.sqrt((px / (np.sin(ix + t) / inten)) ** 2 + (py / (np.cos(iy + t) / inten)) ** 2 + 1e-9)
    c = c / 5.0
    c = 1.17 - np.power(np.maximum(c, 0), 1.4)
    return np.clip(np.power(np.abs(c), 8), 0, 1).astype(np.float32)

def sea_glass(night=False):
    """A wall of blue seawater seen through glass: light shafts from above, ripples of light, bubbles, a glass glare."""
    if not night:
        img = vgrad([(0, (40, 200, 222)), (0.16, (24, 156, 208)), (0.5, (12, 100, 180)), (1, (6, 42, 112))])
        ray_col, ray_amp, caust_amp, glass_amp = (186, 246, 255), 0.95, 0.42, 1.0
    else:
        img = vgrad([(0, (10, 84, 128)), (0.25, (6, 56, 108)), (0.6, (4, 32, 80)), (1, (2, 12, 42))])
        ray_col, ray_amp, caust_amp, glass_amp = (120, 200, 240), 0.45, 0.20, 0.55
    img = mix(img, (214, 252, 255) if not night else (130, 210, 245), np.exp(-full(YY) / 130.0) * (0.55 if not night else 0.3))
    rng = np.random.default_rng(4)
    rays = np.zeros((H, W), np.float32)
    for _ in range(12):
        x0 = rng.uniform(-420, W * 0.9); sig = rng.uniform(12, 46); amp = rng.uniform(0.4, 1.0)
        rays += amp * np.exp(-((XX - (x0 + 0.46 * YY)) ** 2) / (2 * sig ** 2))
    rays = blur(rays / rays.max(), 6) * (1 - YY / H) ** 1.5
    img = mix(img, ray_col, np.clip(rays * ray_amp, 0, 0.75))
    c = np.maximum(caustics(3.4, 5, 2.4, 900), 0.4 * caustics(6.1, 6, 3.0, 700))
    c = np.clip(blur(c, 0.8) * 1.2, 0, 1)
    img = mix(img, (232, 255, 255) if not night else (150, 225, 255), np.clip(c * np.exp(-full(YY) / 420.0) * caust_amp * 1.5, 0, 0.58))
    img = bubbles(img, 12, 80, 3, 15, strength=1.0 if not night else 0.8, tint=(225, 248, 255) if not night else (160, 230, 255))
    img = bubbles(img, 13, 10, 26, 60, strength=0.35, tint=(225, 248, 255))
    img = stars(img, 21, 240, ymax=1.0, bright=0.5 if not night else 1.0, tint=(210, 250, 255))   # specks drifting in the water
    img = glass(img, strength=glass_amp)
    return vignette(img, 0.24)

def sunset(night=False):
    """Evening over the sea: a deep brown sky warming to copper and amber at the horizon, a low sun, lit clouds and a path of light on the water."""
    hz = 0.64
    if not night:
        img = vgrad([(0, (52, 30, 32)), (0.22, (104, 56, 50)), (0.42, (176, 92, 70)), (0.57, (232, 138, 88)), (hz - 0.004, (252, 184, 120)),
                     (hz, (168, 96, 80)), (0.78, (92, 52, 52)), (1, (34, 22, 28))])
        sun_a, cloud_lit, cloud_shade = 0.9, (255, 196, 148), (96, 54, 56)
    else:
        img = vgrad([(0, (14, 10, 22)), (0.25, (34, 20, 34)), (0.5, (70, 36, 48)), (hz - 0.004, (128, 62, 70)),
                     (hz, (74, 38, 52)), (0.8, (38, 24, 38)), (1, (14, 10, 22))])
        sun_a, cloud_lit, cloud_shade = 0.4, (200, 112, 108), (44, 28, 50)
    sx, sy = 560, hz * H
    img = mix(img, (255, 214, 172), glow(sx, sy - 10, 560, 2.3) * sun_a)
    img = mix(img, (255, 160, 120), glow(sx, sy - 10, 980, 2.0) * 0.30 * sun_a)
    img = streaks(img, 31, cloud_lit, 0.5 if not night else 0.3, ymin=0.25, ymax=0.62, scale=(1200, 56))
    img = clouds(img, 41, 0.55, cloud_lit, cloud_shade, sun=(0.0, 1.0), ymin=0.18, ymax=0.60, scale=(620, 120), alpha=0.9 if not night else 0.7, gain=22)
    if not night:
        d = np.sqrt((XX - sx) ** 2 + (YY - (sy - 26)) ** 2)
        img = mix(img, (255, 244, 224), (1 - smoothstep(40, 46, d)) * (YY < sy) * 0.95)       # the low sun
    else:
        img = stars(img, 8, 420, ymax=0.5)
    sea = (YY >= sy).astype(np.float32) * np.ones((H, W), np.float32)
    col = np.exp(-((XX - sx) / (110 + 0.5 * np.maximum(YY - sy, 0))) ** 2)
    streak = smoothstep(0.5, 0.88, noise(300, 5, 77) * 0.6 + noise(140, 3, 78) * 0.4)
    path = sea * col * (0.20 + 0.8 * streak) * np.exp(-np.maximum(YY - sy, 0) / 380.0)
    img = mix(img, (255, 196, 150) if not night else (210, 120, 120), np.clip(path * (1.0 if not night else 0.45), 0, 0.95))
    rip = smoothstep(0.62, 0.9, noise(520, 4, 90)) * sea * 0.10
    img = mix(img, (255, 214, 190) if not night else (170, 110, 140), rip)
    img = glass(img, strength=0.8 if not night else 0.45, edges=False)
    return vignette(img, 0.26)

if __name__ == '__main__':
    import sys
    out = sys.argv[1]
    Image.fromarray(np.clip(sky_day(), 0, 255).astype(np.uint8)).save(out + '/bg-sky-day.png')
    Image.fromarray(np.clip(sky_night(), 0, 255).astype(np.uint8)).save(out + '/bg-sky-night.png')
    for name, fn in (('sea-day', lambda: sea_glass(False)), ('sea-night', lambda: sea_glass(True)), ('dusk-day', lambda: sunset(False)), ('dusk-night', lambda: sunset(True))):
        Image.fromarray(np.clip(fn(), 0, 255).astype(np.uint8)).save(f'{out}/bg-{name}.png')
    print('scenes done')
