"""
Regenerate every logo/icon in the app from one image.

To change the logo later:
  1. Replace assets/brand/logo-source.png with the new logo (PNG or JPG,
     at least 1024px; a plain light background works best).
  2. Run:  pip install pillow && python scripts/make-icons.py
  3. Rebuild the app.

Creates: assets/images/logo.png (in-app logo), assets/icon.png (app icon),
Android adaptive icon layers, splash image and web favicon.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "brand" / "logo-source.png"
A = ROOT / "assets"

src = Image.open(SRC).convert("RGB")
bg = src.getpixel((5, 5))

# Crop to the artwork: everything noticeably darker than the background.
gray = ImageOps.grayscale(src)
mask = gray.point(lambda v: 255 if v < 200 else 0)
# Ignore tiny marks in the corners (e.g. a watermark).
w, h = src.size
mask.paste(0, (int(w * 0.95), int(h * 0.9), w, h))
box = mask.getbbox() or (0, 0, w, h)
art = src.crop(box)

def square(img, size, fill, pad):
    """Fit `img` centred on a square canvas, leaving `pad` (0-0.5) margin each side."""
    inner = int(size * (1 - 2 * pad))
    im = img.copy()
    im.thumbnail((inner, inner), Image.LANCZOS)
    canvas = Image.new("RGB", (size, size), fill)
    canvas.paste(im, ((size - im.width) // 2, (size - im.height) // 2))
    return canvas

white = (255, 255, 255)
square(art, 1024, bg, 0.10).save(A / "images" / "logo.png", optimize=True)
square(art, 1024, white, 0.12).save(A / "icon.png")
square(art, 1024, white, 0.24).save(A / "android-icon-foreground.png")
Image.new("RGB", (1024, 1024), white).save(A / "android-icon-background.png")

mono = square(art, 1024, white, 0.24).convert("L").point(lambda v: 255 if v < 150 else 0)
Image.merge("LA", (mono, mono)).save(A / "android-icon-monochrome.png")

splash = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
s = square(art, 1024, white, 0.20).convert("RGBA")
splash.paste(s, (0, 0))
splash.save(A / "splash-icon.png")

square(art, 48, white, 0.04).save(A / "favicon.png")
print("Icons regenerated from", SRC.relative_to(ROOT), "- artwork box", box)
