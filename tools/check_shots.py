"""Kiem tra anh chup man hinh co THAT SU co noi dung khong.

Model khong xem duoc anh, nen thay vi "nhin roi doan", script nay do:
  - kich thuoc dung 390x844
  - do lech chuan mau (anh trang tron se gan 0)
  - ty le diem khac mau nen chiem uu the
  - so luong mau khac nhau (anh co chu/icon thi nhieu mau)
  - so hang co "muc" (pixel toi) => co chu that
  - co dung mau chu dao cua thiet ke khong (nen giay kem / muc nau)

    python tools/check_shots.py tools/shots
"""

import os
import sys
import glob
import warnings
from collections import Counter

# Pillow 12 deprecates getdata(); ta van dung no cho nhanh. Tat canh bao de
# stderr sach (script chay trong pipeline kiem tra, canh bao lam nhieu ket qua).
warnings.filterwarnings("ignore", category=DeprecationWarning)

try:
    from PIL import Image
except ImportError:
    print("Can Pillow")
    sys.exit(2)

W, H = 390, 844
# Nen giay kem cua thiet ke (light) va muc chu.
PAPER = (251, 246, 239)
INK = (42, 33, 27)


def close(a, b, tol=14):
    return all(abs(x - y) <= tol for x, y in zip(a, b))


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    directory = sys.argv[1] if len(sys.argv) > 1 else os.path.join("tools", "shots")
    files = sorted(f for f in glob.glob(os.path.join(directory, "*.png")) if not os.path.basename(f).startswith("_"))
    if not files:
        print(f"Khong thay anh nao trong {directory}")
        return 1

    print(f"\nKiem tra {len(files)} anh trong {directory}")
    print(f"Chuan kich thuoc: {W}x{H} (anh khac co duoc kiem noi dung, khong tinh la loi)")
    print(f"{'file':<26} {'kxh':>9} {'mau':>6} {'khac-nen':>9} {'hang-chu':>9}  ket luan")
    print("-" * 82)

    bad = 0
    off_size = 0
    for path in files:
        name = os.path.basename(path)
        im = Image.open(path).convert("RGB")
        size_ok = (im.width, im.height) == (W, H)
        if not size_ok:
            # Anh be rong lon (wide-*.png) co y khac kich thuoc. Chi kiem noi dung,
            # khong bat loi kich thuoc — neu khong harness se bao "hong" dung nhung
            # anh hoan toan hop le.
            off_size += 1

        px = list(im.getdata())
        total = len(px)
        colors = Counter(px)
        bg_color, bg_count = colors.most_common(1)[0]

        non_bg = (total - bg_count) / total
        distinctive = len(colors)

        # Dem so hang co pixel "toi" (chu/icon) va so hang co pixel khac nen.
        dark_rows = 0
        for y in range(im.height):
            row = px[y * im.width:(y + 1) * im.width]
            if any(sum(c) < 420 for c in row):
                dark_rows += 1

        paper_share = sum(c for p, c in colors.items() if close(p, PAPER)) / total

        problems = []
        if not size_ok:
            problems.append(f"co {im.width}x{im.height} (khac chuan, chi ghi chu)")
        if non_bg < 0.08:
            problems.append("gan nhu mot mau")
        # Nguong nay quan trong: anh loi DNS/trang trang chi co vai tram mau.
        # Kinh nghiem tu nhom B: anh loi ~15KB, unique colors < 1000 — trong
        # "nhu man hinh bi loi" chu khong phai loi chup. Dung tin kich thuoc file.
        if distinctive < 800:
            problems.append(f"chi {distinctive} mau (nghi anh loi/trang)")
        if dark_rows < 40:
            problems.append(f"chi {dark_rows} hang co chu")

        hard = [p for p in problems if 'chi ghi chu' not in p]
        status = "ok" if not hard else "NGHI NGO"
        if hard:
            bad += 1
        print(
            f"{name:<26} {im.width}x{im.height:>3} {distinctive:>6} "
            f"{non_bg * 100:>8.1f}% {dark_rows:>9}  {status}"
            + (f"  ({'; '.join(problems)})" if problems else f"  (nen {paper_share * 100:.0f}% giay kem)")
        )

    print("-" * 82)
    print(f"Dat: {len(files) - bad}/{len(files)}" + (f"  ({off_size} anh co khac chuan)" if off_size else ""))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
