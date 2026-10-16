"""Do mat do tu tieng Anh trong cac doan van dan xen, doc truc tiep tu src/data/story.js.

Muc tieu cua deck (slide 03/05): 15-20% tu tieng Anh.
Con so nay duoc man reader hien thi that, nen phai do bang script chu khong doan.

    python tools/check_story_ratio.py
"""

import re
import os
import sys

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "data", "story.js")
LOW, HIGH = 15.0, 20.0


def blocks(text):
    """Lay tung doan van tho kem nhan nhan dien (id truyen hoac ten hang so)."""
    out = []
    for m in re.finditer(r"raw:\s*`(.*?)`", text, flags=re.S):
        before = text[: m.start()]
        ids = re.findall(r"id:\s*'([^']+)'", before)
        out.append((ids[-1] if ids else "?", m.group(1)))
    for m in re.finditer(r"const (\w+_RAW)\s*=\s*`(.*?)`\.trim\(\);", text, flags=re.S):
        out.append((m.group(1), m.group(2)))
    return out


def ratio(raw):
    en = 0
    vi = 0
    for para in [p.strip() for p in raw.strip().split("\n\n") if p.strip()]:
        for chunk in re.split(r"(\*\*[^*]+\*\*)", para):
            if not chunk:
                continue
            words = len([w for w in chunk.split() if w])
            if re.fullmatch(r"\*\*[^*]+\*\*", chunk):
                en += words
            else:
                vi += words
    total = en + vi
    return (en, vi, (100.0 * en / total) if total else 0.0)


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    text = open(SRC, encoding="utf-8").read()
    raw_blocks = blocks(text)
    if not raw_blocks:
        print("Khong tim thay doan van nao trong", SRC)
        return 1

    bad = 0
    print("\nMat do tu tieng Anh trong cac doan dan xen")
    print(f"Deck hua: {LOW:.0f}-{HIGH:.0f}%\n")
    print(f"{'Doan':<22} {'EN':>4} {'VI':>5} {'Tong':>5} {'Ti le':>7}   Ket luan")
    print("-" * 62)
    for label, raw in raw_blocks:
        en, vi, pct = ratio(raw)
        ok = LOW <= pct <= HIGH
        mark = "dat" if ok else ("qua thap" if pct < LOW else "qua cao")
        if not ok:
            bad += 1
        print(f"{label:<22} {en:>4} {vi:>5} {en + vi:>5} {pct:>6.1f}%   {mark}")

    print("-" * 62)
    if bad:
        print(f"{bad}/{len(raw_blocks)} doan NGOAI khoang {LOW:.0f}-{HIGH:.0f}% — can chinh van ban.")
        print("Goi y: them/bot tu tieng Anh trong dau **...**, dung sua con so hien thi.")
    else:
        print(f"Tat ca {len(raw_blocks)} doan nam trong khoang {LOW:.0f}-{HIGH:.0f}%. Dat.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
