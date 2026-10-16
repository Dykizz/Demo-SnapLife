import sys, hashlib
from PIL import Image

for path in sys.argv[1:]:
    im = Image.open(path).convert("RGB")
    w, h = im.size
    small = im.resize((max(1, w // 3), max(1, h // 3)))
    px = list(small.getdata())
    n = len(px)
    counts = {}
    for p in px:
        counts[p] = counts.get(p, 0) + 1
    bg, bgn = max(counts.items(), key=lambda kv: kv[1])
    nonbg = n - bgn
    mean = tuple(sum(c[i] for c in px) // n for i in range(3))
    lum = (mean[0] * 299 + mean[1] * 587 + mean[2] * 114) // 1000
    digest = hashlib.sha256(open(path, "rb").read()).hexdigest()[:12]
    name = path.replace("/", "\\").split("\\")[-1]
    print(f"{name:28s} {w}x{h}  mean={mean} lum={lum:3d}  bg={bg} bg%={100*bgn/n:5.1f}  "
          f"non-bg%={100*nonbg/n:5.1f}  colors={len(counts):5d}  sha={digest}")
