"""qa-cover-text-contrast.py — Do THAT tuong phan cua chu trang tren anh bia man reader.

Owner: qa-verify. Pham vi ghi: tools/qa-*

Vi sao can script nay: chu trang o `.cs-cover__kicker` / `.cs-cover__caption` nam tren
mot tam scrim gradient (screens-c.css:69-72) phu len ANH. Khong the biet tuong phan
bang cach doc computed style (vi nen la pixel anh + gradient). Nhung model nay KHONG
xem duoc anh — nen thay vi "doan", script nay:
  1. doc toa do tung o chu tu tools/qa-cdp5-report.json (muc X5)
  2. mo anh chup tuong ung (tools/qa-reader-cover-*.png)
  3. cat dung o chu do
  4. loai cac pixel GLYPH (mau gan bang mau chu) khoi tap NEN
  5. voi tung pixel nen con lai: tinh lai mau chu (co opacity) roi tinh tuong phan
  6. bao cao tuong phan trung vi, phan vi 99%, va XAU NHAT

Gioi han: day la do tren ANH CHUP THAT, khong phai suy doan mau nen. Nhung no chi do
duoc 2 anh truyen hien co, khong bao dam cho anh khac.
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FG = (255, 247, 239)  # --overlay-chip-ink
OPACITY = {"kicker": 0.86, "caption": 1.0}


def srgb_to_lin(v):
    v = v / 255.0
    return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4


def lum(rgb):
    r, g, b = (srgb_to_lin(x) for x in rgb[:3])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(fg, bg):
    l1, l2 = lum(fg), lum(bg)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def percentile(values, p):
    if not values:
        return None
    s = sorted(values)
    i = min(len(s) - 1, max(0, int(round((p / 100.0) * (len(s) - 1)))))
    return s[i]


def over(fg, alpha, bg):
    return tuple(fg[i] * alpha + bg[i] * (1 - alpha) for i in range(3))


def main():
    report_path = os.path.join(ROOT, "tools", "qa-cdp5-report.json")
    if not os.path.exists(report_path):
        print("Thieu tools/qa-cdp5-report.json — chay: node tools/qa-cdp5.mjs")
        return 2
    data = json.load(open(report_path, encoding="utf-8"))
    x5 = [r for r in data if r["id"] == "X5"]
    if not x5:
        print("Khong co muc X5 trong bao cao.")
        return 2

    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    print("Do tuong phan chu trang tren anh bia man reader (tren anh chup THAT)\n")
    print("Hai phep do cho 2 cau tra loi khac nhau, ghi ca hai de trung thuc:")
    print("  (1) loai pixel glyph bang khoang cach mau  -> trung vi/p99 dang tin, nhung XAU NHAT")
    print("      bi lan pixel ria chu (antialias) nen KHONG dung lam ket luan.")
    print("  (2) lay NEN tu 2 dai ngay TREN va DUOI hop chu (khong chua glyph) -> uoc luong")
    print("      khoang nen that ma chu nam tren.\n")
    worst_overall = 99.0
    for shot in x5[0]["data"]["shots"]:
        img = Image.open(os.path.join(ROOT, shot["file"])).convert("RGB")
        print("%s   (anh: %s, file: %s, %dx%d)" % (shot["tag"], shot["anh"], shot["file"], img.size[0], img.size[1]))
        for el in shot["elements"]:
            name = el["sel"].split("__")[-1]
            if name not in OPACITY:
                continue
            op = OPACITY[name]
            box = (el["x"], el["y"], el["x"] + el["w"], el["y"] + el["h"])
            crop = img.crop(box)
            px = list(crop.getdata())
            # (1) loai pixel glyph: gan mau chu (sau khi nhan opacity)
            bg_px = []
            for p in px:
                d = abs(p[0] - FG[0]) + abs(p[1] - FG[1]) + abs(p[2] - FG[2])
                if d > 90:
                    bg_px.append(p)
            if not bg_px:
                print("   %-10s khong tach duoc nen" % name)
                continue
            ratios = []
            for bg in bg_px:
                fg_eff = over(FG, op, bg)
                ratios.append(contrast(fg_eff, bg))
            med = percentile(ratios, 50)
            p99 = percentile(ratios, 99)
            lo = min(ratios)

            # (2) nen lay tu 2 dai ngay tren/duoi hop chu
            band = []
            for (by0, by1) in ((el["y"] - 8, el["y"] - 1), (el["y"] + el["h"] + 1, el["y"] + el["h"] + 8)):
                if by0 < 0 or by1 > img.size[1]:
                    continue
                b = img.crop((el["x"], by0, el["x"] + el["w"], by1))
                band.extend(list(b.getdata()))
            if not band:
                print("   %-10s khong lay duoc dai nen" % name)
                continue
            band_ratios = [contrast(over(FG, op, bg), bg) for bg in band]
            band_med = percentile(band_ratios, 50)
            band_p95 = percentile(band_ratios, 95)
            fail = 100.0 * sum(1 for r in band_ratios if r < 4.5) / len(band_ratios)
            worst_overall = min(worst_overall, band_p95)
            verdict = "DAT" if band_p95 >= 4.5 else "CO CHO KHONG DAT"
            print("   %-10s opacity=%.2f | (1) trung vi %5.2f:1 · p99 %5.2f:1 | (2) dai nen: trung vi %5.2f:1 · p95 %5.2f:1 · %.2f%% pixel duoi 4.5  -> %s"
                  % (name, op, med, p99, band_med, band_p95, fail, verdict))
        print("")

    print("Tuong phan p95 XAU NHAT tren 2 dai nen cua ca 2 anh bia: %.2f:1" % worst_overall)
    print("")
    # ---- (3) GIOI HAN XAU NHAT TINH DUOC: scrim gradient + anh trang tuyet doi ----
    print("(3) GIOI HAN XAU NHAT tinh tu CSS scrim (screens-c.css:69-72) — khong phu thuoc vao anh:")
    print("    .cs-cover__scrim phu gradient doc: alpha 0.68 o day, 0.16 o 46%, 0 o 72% (tinh tu duoi len).")
    print("    Lay alpha YEU NHAT trong dai chu lam gia dinh, roi cho pixel anh = TRANG TUYET DOI.")
    for shot in x5[0]["data"]["shots"]:
        cover = None
        for el in shot["elements"]:
            if el["sel"] == ".cs-cover":
                cover = el
        if not cover:
            continue
        H = cover["h"]
        bottom = cover["y"] + H
        worst = 99.0
        worst_label = None
        for el in shot["elements"]:
            name = el["sel"].split("__")[-1]
            if name not in OPACITY:
                continue
            op = OPACITY[name]
            # diem cao nhat cua dai chu (xa day nhat tinh tu duoi len) -> alpha scrim nho nhat
            top = el["y"]
            frac = max(0.0, (bottom - top) / float(H))
            if frac <= 0.46:
                alpha = 0.68 - (frac / 0.46) * (0.68 - 0.16)
            elif frac <= 0.72:
                alpha = 0.16 - ((frac - 0.46) / 0.26) * 0.16
            else:
                alpha = 0.0
            scrim = (12, 8, 5)
            bg_white = tuple(scrim[i] * alpha + 255 * (1 - alpha) for i in range(3))
            fg_eff = over(FG, op, bg_white)
            c = contrast(fg_eff, bg_white)
            if c < worst:
                worst = c
                worst_label = name
        print("    %-12s (scrim alpha yeu nhat trong dai chu ~%.3f)" % (shot["tag"], alpha))
        for el in shot["elements"]:
            name = el["sel"].split("__")[-1]
            if name not in OPACITY:
                continue
            op = OPACITY[name]
            bg_white = tuple(scrim[i] * alpha + 255 * (1 - alpha) for i in range(3))
            fg_eff = over(FG, op, bg_white)
            c = contrast(fg_eff, bg_white)
            print("                 %-8s (opacity %.2f, %s) XAU NHAT tren anh trang tuyet doi: %.2f:1 -> %s"
                  % (name, op, el["fontSize"], c, "DAT >=4.5" if c >= 4.5 else "KHONG DAT"))
    print("")
    print("Nguong WCAG AA cho chu thuong: 4.5:1 (chu lon >=24px hoac >=18.66px bold: 3:1).")
    print("Gioi han: (a) 2 dai nen chi la UOC LUONG cho nen ngay duoi chu, nen trong long hop chu")
    print("co the khac; (b) gia tri NHO NHAT tung pixel bi lan pixel ria chu (antialias) nen khong")
    print("dung lam ket luan — vi vay bao cao p95 va ty le pixel duoi nguong.")
    print("(c) Khong the ket luan thay cho viec nhin anh.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
