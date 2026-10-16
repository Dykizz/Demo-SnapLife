"""Cat anh chup tho ve dung 390x844 tu goc tren trai.

Vi sao: `chrome --window-size=390,844` khong tao viewport 390x844 (Chrome ep len
toi thieu ~500x748 roi moi cat anh), nen anh chup truc tiep bi lech/thieu.
tools/probe.html dat khung 390x844 dung tai (0,0) trong mot cua so lon hon;
script nay cat dung phan khung do.

    python tools/crop_shots.py tools/shots            # cat moi file _raw-*.png
"""

import os
import sys
import glob

try:
    from PIL import Image
except ImportError:
    print("Can Pillow: pip install Pillow")
    sys.exit(2)

W, H = 390, 844


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    directory = sys.argv[1] if len(sys.argv) > 1 else os.path.join("tools", "shots")
    raws = sorted(glob.glob(os.path.join(directory, "_raw-*.png")))
    if not raws:
        print(f"Khong thay file _raw-*.png nao trong {directory}")
        return 1

    cropped = 0
    for raw in raws:
        name = os.path.basename(raw).replace("_raw-", "")
        dst = os.path.join(directory, name)
        im = Image.open(raw)
        if im.width < W or im.height < H:
            print(f"  BO QUA {name}: anh tho {im.width}x{im.height} nho hon {W}x{H}")
            continue
        im.crop((0, 0, W, H)).save(dst, "PNG", optimize=True)
        os.remove(raw)
        cropped += 1
        print(f"  {name:<28} {W}x{H}  {os.path.getsize(dst) // 1024} KB")

    print(f"\nDa cat {cropped}/{len(raws)} anh ve {W}x{H} trong {directory}")
    return 0 if cropped == len(raws) else 1


if __name__ == "__main__":
    sys.exit(main())
