"""Prepare demo photos: resize to 1:1, analyse edge energy so Bbox coordinates are plausible."""
import os, json
from PIL import Image, ImageFilter, ImageOps

SRC = r"D:\Demo\assets\photos\_originals"
OUT = r"D:\Demo\assets\photos"
os.makedirs(OUT, exist_ok=True)

MAP = {
    "image-e57e7186.png": "morning-desk",
    "image-e1774cda.png": "rainy-street",
    "image-aebd506a.png": "ceramic-cup",
    "image-086c0131.png": "notebook-pen",
    "image-50ca4487.png": "balcony-plant",
}

report = {}
for src, name in MAP.items():
    p = os.path.join(SRC, src)
    im = Image.open(p).convert("RGB")
    im = ImageOps.fit(im, (900, 900), method=Image.LANCZOS, centering=(0.5, 0.5))
    dst = os.path.join(OUT, name + ".jpg")
    im.save(dst, "JPEG", quality=84, optimize=True, progressive=True)

    # edge-energy heat map on a 6x6 grid -> where the "objects" are
    small = im.convert("L").resize((360, 360), Image.LANCZOS).filter(ImageFilter.FIND_EDGES)
    px = list(small.getdata())
    grid = []
    for gy in range(6):
        row = []
        for gx in range(6):
            tot = 0
            for y in range(gy * 60, gy * 60 + 60):
                base = y * 360
                for x in range(gx * 60, gx * 60 + 60):
                    tot += px[base + x]
            row.append(round(tot / 3600.0, 1))
            report.setdefault(name, {})
        grid.append(row)
    report[name] = grid
    print(name, os.path.getsize(dst) // 1024, "KB")

print(json.dumps(report, indent=1))
