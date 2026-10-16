"""qa-bbox-pixels.py - kiem tra doc lap o tang DIEM ANH xem cac vung bbox co nam tren
"co gi do" hay nam tren nen tron.

Owner: qa-verify. Pham vi ghi: tools/qa-*
Cach lam:
  - Voi moi vung khai bao trong src/data/photos.js (chep tay o day), cat dung khung % do.
  - Do 3 chi so: do lech chuan do sang (std), mat do canh (FIND_EDGES), so mau khac nhau.
  - Sinh 400 khung CUNG KICH THUOC o vi tri ngau nhien trong anh lam mau doi chieu.
  - Tinh phan vi (percentile) cua khung khai bao so voi mau doi chieu.
Ket luan chi co the noi: khung nay "co noi dung" hay "la nen tron" so voi phan con lai
cua anh. No KHONG the noi khung co nam dung len chiec ca / tai nghe / cuon so hay khong,
vi model khong xem duoc anh.
"""
import os
import random
import sys

from PIL import Image, ImageFilter

PHOTOS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "photos")

# Chep tu src/data/photos.js — chi 'morning-desk' co regions.
REGIONS = {
    "morning-desk": [
        {"word": "mug", "x": 0, "y": 61, "w": 30, "h": 28},
        {"word": "headphones", "x": 55, "y": 27, "w": 26, "h": 22},
        {"word": "notebook", "x": 45.5, "y": 68, "w": 34, "h": 26},
    ]
}
SAMPLES = 400
random.seed(20261016)


def stats(img, box):
    crop = img.crop(box)
    px = list(crop.convert("L").getdata())
    n = len(px)
    mean = sum(px) / n
    var = sum((p - mean) ** 2 for p in px) / n
    edges = list(crop.convert("L").filter(ImageFilter.FIND_EDGES).getdata())
    emean = sum(edges) / n
    colors = len(set(crop.convert("RGB").getdata()))
    return {"std": var ** 0.5, "edge": emean, "colors": colors}


def pct(value, pool):
    below = sum(1 for v in pool if v < value)
    return round(100.0 * below / len(pool), 1)


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    print("Kiem tra diem anh cho cac vung bbox khai bao trong photos.js")
    print("Mau doi chieu: %d khung cung kich thuoc dat ngau nhien trong anh\n" % SAMPLES)
    for photo, regions in REGIONS.items():
        path = os.path.join(PHOTOS, photo + ".jpg")
        img = Image.open(path).convert("RGB")
        W, H = img.size
        print("%s  (%dx%d)" % (photo, W, H))
        print("  %-11s %7s %7s %8s | %8s %8s %8s" % (
            "vung", "std", "edge", "mau", "pctl_std", "pctl_edge", "pctl_mau"))
        for r in regions:
            box = (int(W * r["x"] / 100), int(H * r["y"] / 100),
                   int(W * (r["x"] + r["w"]) / 100), int(H * (r["y"] + r["h"]) / 100))
            bw, bh = box[2] - box[0], box[3] - box[1]
            real = stats(img, box)
            pool_std, pool_edge, pool_col = [], [], []
            for _ in range(SAMPLES):
                x0 = random.randint(0, W - bw)
                y0 = random.randint(0, H - bh)
                s = stats(img, (x0, y0, x0 + bw, y0 + bh))
                pool_std.append(s["std"])
                pool_edge.append(s["edge"])
                pool_col.append(s["colors"])
            print("  %-11s %7.1f %7.2f %8d | %8.1f %8.1f %8.1f" % (
                r["word"], real["std"], real["edge"], real["colors"],
                pct(real["std"], pool_std), pct(real["edge"], pool_edge), pct(real["colors"], pool_col)))
            verdict = "co noi dung (>=80 pctl)" if pct(real["edge"], pool_edge) >= 80 else (
                "trung binh" if pct(real["edge"], pool_edge) >= 40 else "giong NEN TRON")
            print("               -> %s" % verdict)

            # Tim khung CUNG KICH THUOC co mat do canh cao nhat trong ban kinh +-20%
            best = None
            cx = r["x"] + r["w"] / 2.0
            cy = r["y"] + r["h"] / 2.0
            for dx in range(-20, 21, 5):
                for dy in range(-20, 21, 5):
                    bx = cx + dx - r["w"] / 2.0
                    by = cy + dy - r["h"] / 2.0
                    if bx < 0 or by < 0 or bx + r["w"] > 100 or by + r["h"] > 100:
                        continue
                    b2 = (int(W * bx / 100), int(H * by / 100),
                          int(W * (bx + r["w"]) / 100), int(H * (by + r["h"]) / 100))
                    e = stats(img, b2)["edge"]
                    if best is None or e > best[0]:
                        best = (e, round(bx, 1), round(by, 1))
            if best:
                print("               khung tot nhat trong +-20%%: edge=%.2f tai (x=%.1f,y=%.1f) — gap %.2fx vung dang dung"
                      % (best[0], best[1], best[2], best[0] / max(real["edge"], 0.01)))
        print("")


if __name__ == "__main__":
    main()
