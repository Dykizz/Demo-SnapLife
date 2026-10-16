"""Doc anh chup man hinh cua nguoi dung de suy ra be rong CSS.

Khong the nhin anh, nen do bang so:
  · bounding box cua noi dung (khac mau nen)
  · su doi xung cua le trai / le phai  -> shell co canh giua khong
  · be rong khung dien thoai (vung toi) -> scale = 390 / be_rong_do_duoc
"""
import sys
from PIL import Image

path = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\Admin\.dsh\attachments\v1\objects\a4\a447e19bb26a8e54eb586a396a8d83d2d4e5cf208bc9b8945420dc7ada08f890"
im = Image.open(path).convert("RGB")
W, H = im.size
px = im.load()
print(f"image {W}x{H}")

# --- mau nen: lay o goc phai duoi (vung trong) va goc trai tren ---
def sample(x, y):
    return px[x, y]

print("bg right-bottom", sample(W - 8, H - 8), " right-mid", sample(W - 8, H // 2))
print("bg left-top    ", sample(2, 2), " left-mid", sample(2, H // 2))

# --- bounding box noi dung: khac mau nen tai cot x=W-8 ---
def diff(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])

bg = sample(W - 8, H // 2)
THRESH = 14
minx, maxx, miny, maxy = W, -1, H, -1
colcount = [0] * W
for y in range(0, H, 2):
    for x in range(0, W, 2):
        if diff(px[x, y], bg) > THRESH:
            colcount[x] += 1
            if x < minx: minx = x
            if x > maxx: maxx = x
            if y < miny: miny = y
            if y > maxy: maxy = y
print(f"content bbox x[{minx}..{maxx}] y[{miny}..{maxy}]  width={maxx-minx+1}")
print(f"le trai={minx}  le phai={W-1-maxx}")

# --- tim cac cot TRONG (khong co pixel noi dung) de thay ranh gioi khoi ---
gaps = []
run_start = None
for x in range(W):
    empty = colcount[x] == 0
    if empty and run_start is None:
        run_start = x
    elif not empty and run_start is not None:
        if x - run_start >= 12:
            gaps.append((run_start, x - 1, x - run_start))
        run_start = None
if run_start is not None and W - run_start >= 12:
    gaps.append((run_start, W - 1, W - run_start))
print("khoang trong rong >=12px:", gaps[:12])

# --- khung dien thoai: vien toi. Tim cot co nhieu pixel rat toi ---
dark_cols = [0] * W
for y in range(0, H, 2):
    for x in range(0, W, 2):
        r, g, b = px[x, y]
        if r < 90 and g < 90 and b < 90:
            dark_cols[x] += 1
dk = [x for x in range(W) if dark_cols[x] > 8]
if dk:
    print(f"vung toi (khung dt): x {dk[0]}..{dk[-1]}  rong~{dk[-1]-dk[0]+1}")
    # tim nhom lien tuc
    groups, s = [], dk[0]
    for i in range(1, len(dk)):
        if dk[i] - dk[i-1] > 6:
            groups.append((s, dk[i-1]))
            s = dk[i]
    groups.append((s, dk[-1]))
    print("nhom vung toi:", groups[:8])
else:
    print("khong tim thay vung toi")
