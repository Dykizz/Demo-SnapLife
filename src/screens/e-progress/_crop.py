import sys
from PIL import Image

# Cắt ảnh chụp ở bề rộng lớn: chrome không tạo viewport đúng kích thước yêu cầu,
# nên chụp cửa sổ lớn hơn rồi cắt đúng (0,0,w,h) — theo docs/WEB-SPEC.md §6.
src, dst, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(src)
im.crop((0, 0, w, h)).save(dst)
out = Image.open(dst)
px = list(out.convert('RGB').resize((max(1, w // 4), max(1, h // 4))).getdata())
n = len(px)
counts = {}
for p in px:
    counts[p] = counts.get(p, 0) + 1
bg, bgn = max(counts.items(), key=lambda kv: kv[1])
mean = tuple(sum(c[i] for c in px) // n for i in range(3))
lum = (mean[0] * 299 + mean[1] * 587 + mean[2] * 114) // 1000
print(f"{dst.split(chr(92))[-1]:26s} {out.size[0]}x{out.size[1]}  lum={lum:3d}  non-bg%={100 * (n - bgn) / n:5.1f}")
