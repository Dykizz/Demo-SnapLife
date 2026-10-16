"""Derive plausible object bounding boxes from a photo by local edge-energy blob detection.

Used to place the demo's AI-suggested capture regions on real object areas instead of guessing.
Output: percentage boxes (x, y, w, h) relative to the square image.
"""
import os, json, sys
from PIL import Image, ImageFilter

PHOTOS = r"D:\Demo\assets\photos"
GRID = 16  # 16x16 analysis grid


def energy_grid(path, grid=GRID):
    im = Image.open(path).convert("L").resize((512, 512), Image.LANCZOS).filter(ImageFilter.FIND_EDGES)
    cell = 512 // grid
    px = list(im.getdata())
    out = []
    for gy in range(grid):
        row = []
        for gx in range(grid):
            tot = 0
            for y in range(gy * cell, gy * cell + cell):
                base = y * 512
                for x in range(gx * cell, gx * cell + cell):
                    tot += px[base + x]
            row.append(tot / float(cell * cell))
        out.append(row)
    return out


def blobs(grid, top=3):
    flat = [(grid[y][x], x, y) for y in range(len(grid)) for x in range(len(grid))]
    flat.sort(reverse=True)
    picked = []
    for val, x, y in flat:
        if all(abs(x - px) + abs(y - py) > 4 for _, px, py in picked):
            picked.append((val, x, y))
        if len(picked) == top:
            break
    boxes = []
    for val, cx, cy in picked:
        thresh = val * 0.45
        x0 = x1 = cx
        y0 = y1 = cy
        # flood outwards while neighbours stay above threshold
        for y in range(len(grid)):
            for x in range(len(grid)):
                if grid[y][x] >= thresh and abs(x - cx) <= 5 and abs(y - cy) <= 5:
                    x0, x1 = min(x0, x), max(x1, x)
                    y0, y1 = min(y0, y), max(y1, y)
        n = len(grid)
        step = 100.0 / n
        # pad a little so the box breathes around the object, then clamp
        bx = max(0.0, x0 * step - step * 0.35)
        by = max(0.0, y0 * step - step * 0.35)
        bw = min(100.0 - bx, (x1 - x0 + 1) * step + step * 0.7)
        bh = min(100.0 - by, (y1 - y0 + 1) * step + step * 0.7)
        boxes.append({
            "peak": round(val, 1),
            "cell": [cx, cy],
            "x": round(bx, 1), "y": round(by, 1),
            "w": round(bw, 1), "h": round(bh, 1),
        })
    boxes.sort(key=lambda b: -b["peak"])
    return boxes


if __name__ == "__main__":
    names = sys.argv[1:] or ["morning-desk", "notebook-pen", "ceramic-cup"]
    result = {}
    for n in names:
        g = energy_grid(os.path.join(PHOTOS, n + ".jpg"))
        result[n] = blobs(g, top=4)
    print(json.dumps(result, indent=1))
