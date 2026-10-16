"""Tai font ve may de demo khong phu thuoc Google Fonts CDN.

Vi sao: qa-verify do duoc rang khi chan CDN thi app van chay (0 loi boot) nhung
mat toan bo web font -> roi ve Georgia. Be rong chuoi tieu de lech +9.7px (+5.6%),
va IPA (ky hieu phien am) hien ra xau nhat. Voi mot demo thiet ke thi do la mat
ban sac thi giac ngay truoc mat giam khao.

Script nay:
  1. Tai CSS cua Google Fonts (kem User-Agent hien dai de nhan woff2).
  2. Tai tung file woff2 ve assets/fonts/.
  3. Viet lai styles/fonts.css voi duong dan noi bo, giu nguyen unicode-range
     (rat quan trong: tieng Viet can subset "vietnamese").

    python tools/fetch_fonts.py
"""

import os
import re
import sys
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
FONT_DIR = os.path.join(ROOT, "assets", "fonts")
CSS_OUT = os.path.join(ROOT, "styles", "fonts.css")

# Cung mot URL ma index.html dang dung.
FAMILIES = (
    "family=Calistoga"
    "&family=Inter:wght@300..700"
    "&family=JetBrains+Mono:wght@400;500"
    "&family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..500"
)
URL = f"https://fonts.googleapis.com/css2?{FAMILIES}&display=swap"

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def fetch(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as resp:
        data = resp.read()
    return data if binary else data.decode("utf-8")


def slug(family, weight, style, subset_hint):
    name = family.lower().replace(" ", "-")
    return f"{name}-{weight}-{style}-{subset_hint}.woff2"


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    os.makedirs(FONT_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(CSS_OUT), exist_ok=True)

    print(f"Tai CSS: {URL}")
    css = fetch(URL)
    print(f"  {len(css)} ky tu, {css.count('@font-face')} khoi @font-face")

    # Moi khoi @font-face co the co comment /* subset */ ngay truoc no.
    blocks = re.split(r"(?=/\*\s*[a-z-]+\s*\*/)", css)
    out = [
        "/* ============================================================================",
        "   SnapLife AI - Font noi bo (tu dong sinh boi tools/fetch_fonts.py)",
        "",
        "   Vi sao khong dung Google Fonts CDN: demo phai chay duoc khi mat mang.",
        "   Neu CDN khong tai duoc, trinh duyet roi ve Georgia va ban sac Calistoga",
        "   bien mat (do lech be rong chu do duoc +5.6%). Font nay nam ngay trong",
        "   assets/fonts/ nen khong phu thuoc mang.",
        "",
        "   KHONG sua file nay bang tay - chay lai: python tools/fetch_fonts.py",
        "   ========================================================================== */",
        "",
    ]

    downloaded = 0
    seen = {}

    for block in blocks:
        if "@font-face" not in block:
            continue
        subset = (re.search(r"/\*\s*([a-z0-9-]+)\s*\*/", block) or [None, "all"])[1]
        family = (re.search(r"font-family:\s*'([^']+)'", block) or [None, "font"])[1]
        weight = (re.search(r"font-weight:\s*([^;]+);", block) or [None, "400"])[1].strip()
        style = (re.search(r"font-style:\s*([^;]+);", block) or [None, "normal"])[1].strip()

        urls = re.findall(r"url\((https://fonts\.gstatic\.com/[^)]+\.woff2)\)", block)
        if not urls:
            continue

        for remote in urls:
            key = (family, weight, style, subset)
            local = seen.get(key) or slug(family, weight.replace(" ", ""), style, subset)
            seen[key] = local
            path = os.path.join(FONT_DIR, local)
            if not os.path.exists(path):
                data = fetch(remote, binary=True)
                with open(path, "wb") as fh:
                    fh.write(data)
                downloaded += 1
            block = block.replace(remote, f"../assets/fonts/{local}")

        out.append(block.strip())

    with open(CSS_OUT, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n\n".join(out) + "\n")

    total = sum(os.path.getsize(os.path.join(FONT_DIR, f)) for f in os.listdir(FONT_DIR))
    print(f"\n  Tai moi: {downloaded} file")
    print(f"  Tong trong assets/fonts: {len(os.listdir(FONT_DIR))} file, {total // 1024} KB")
    print(f"  Da ghi: styles/fonts.css")
    return 0


if __name__ == "__main__":
    sys.exit(main())
