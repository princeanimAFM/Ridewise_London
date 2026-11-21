import numpy as np
from PIL import Image, ImageFilter

def _box1d(a, r, axis):
    n = a.shape[axis]
    pad = [(0, 0)] * a.ndim; pad[axis] = (r + 1, r)
    p = np.pad(a, pad, mode='edge')
    c = np.cumsum(p, axis=axis, dtype=np.float64)
    hi = [slice(None)] * a.ndim; lo = [slice(None)] * a.ndim
    hi[axis] = slice(2 * r + 1, 2 * r + 1 + n); lo[axis] = slice(0, n)
    return ((c[tuple(hi)] - c[tuple(lo)]) / (2 * r + 1)).astype(np.float32)

def box_blur(a, r, passes=3):
    out = a.astype(np.float32)
    for _ in range(passes):
        out = _box1d(_box1d(out, r, 0), r, 1)
    return out

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

def refine_edges(a, alpha, B):
    """The first matte says "backdrop or not" from how far a pixel is from the backdrop colour, which cannot tell a pixel that is
    half suit and half backdrop from a whole suit pixel. Here, for the pixels at the edge, the share of suit is worked out from where
    the pixel sits on the line between the backdrop colour and the colour of the solid pixels just inside the edge."""
    solid = (alpha > 0.985).astype(np.float32)
    deep = (box_blur(solid, 3, passes=1) > 0.999).astype(np.float32)          # solid, and at least 3 px from any edge
    den = box_blur(deep, 7)
    Fi = box_blur(a * deep[..., None], 7) / np.maximum(den[..., None], 1e-3)
    dF = Fi - B
    denom = (dF ** 2).sum(-1)
    proj = np.clip(((a - B) * dF).sum(-1) / np.maximum(denom, 1.0), 0, 1)
    band = (alpha > 0.02) & (deep < 0.5) & (den > 0.02) & (denom > 40.0 ** 2)
    return np.where(band, proj, alpha).astype(np.float32)


def subject_matte(path, centre_hue):
    """Returns (rgb float32 HxWx3, alpha HxW, backdrop estimate HxWx3) for a studio photo with a coloured backdrop."""
    im = Image.open(path).convert('RGB')
    a = np.array(im).astype(np.float32)
    hsv = np.array(im.convert('HSV')).astype(np.float32)
    h, s = hsv[..., 0], hsv[..., 1]
    if centre_hue is None:  # the backdrop's own hue: the median along the picture's edges
        edge = np.concatenate([h[:40].ravel(), h[-40:].ravel(), h[:, :40].ravel(), h[:, -40:].ravel()])
        centre_hue = float(np.median(edge))
    w0 = np.clip(1 - np.abs(h - centre_hue) / 28, 0, 1) ** 0.7 * np.clip((s - 12) / 25, 0, 1)
    conf = (w0 > 0.5).astype(np.float32)
    num = box_blur(a * conf[..., None], 36); den = box_blur(conf, 36)
    B = num / np.maximum(den[..., None], 1e-4)
    d = np.sqrt(((a - B) ** 2).sum(-1))
    alpha = smoothstep(9, 42, d)
    alpha = np.where(den > 0.02, alpha, 1.0).astype(np.float32)
    # the studio floor's shadow and reflections are the backdrop's own colour, just lighter or darker: the suit (red),
    # shoes (black), shirt (white), tie (blue) and skin never are, so anything saturated in the backdrop's hue is backdrop
    dh = np.abs(h - centre_hue)
    dh = np.minimum(dh, 255 - dh)
    v = hsv[..., 2]
    kill = smoothstep(20, 11, dh) * smoothstep(22, 46, s) * smoothstep(26, 60, v)
    alpha = (alpha * (1 - kill)).astype(np.float32)
    # close tiny holes inside the subject, keep soft edges
    solid = (box_blur((alpha > 0.97).astype(np.float32), 3) > 0.5)
    alpha = np.where(solid, 1.0, alpha).astype(np.float32)
    alpha = refine_edges(a, alpha, B.astype(np.float32))
    return a, alpha, B.astype(np.float32)

def composite(a, alpha, B, bg):
    """Swap the studio backdrop for `bg` (HxWx3 float) keeping the soft edges: out = alpha*F + (1-alpha)*bg."""
    al = alpha[..., None]
    F = np.clip((a - (1 - al) * B) / np.maximum(al, 0.08), 0, 255)
    # colours right on the edge still carry a trace of the studio backdrop (a thin olive line on the red suit shows up against
    # a dark sky), so edge pixels take the colour of the solid pixels just inside them instead
    solid = (alpha > 0.985).astype(np.float32)
    deep = (box_blur(solid, 2, passes=1) > 0.999).astype(np.float32)
    den = box_blur(deep, 6)
    Fi = box_blur(a * deep[..., None], 6) / np.maximum(den[..., None], 1e-3)
    w = smoothstep(0.985, 0.3, alpha)[..., None] * (den[..., None] > 0.03)
    F = F * (1 - w) + Fi * w
    al2 = np.clip((al - 0.05) / 0.90, 0, 1)
    return np.clip(al2 * F + (1 - al2) * bg, 0, 255)
