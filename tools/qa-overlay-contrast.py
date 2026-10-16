"""qa-overlay-contrast.py — Tuong phan cua chu nam tren ANH.

Owner: qa-verify. Pham vi ghi: tools/qa-*

Van de: khong the "do" tuong phan cua chu de len anh bang cach do mot mau nen duy nhat,
vi nen la pixel anh thay doi. Nhung neu chu nam tren mot CHIP CO NEN MO (alpha < 1) thi
co the tinh duoc GIOI HAN XAU NHAT: nen hieu dung = alpha*chip + (1-alpha)*pixel_anh.
Pixel anh nam trong [den, trang], nen gia tri hieu dung cung nam trong khoang do.
Do do ta tinh tuong phan tai HAI dau mut (nen trang nhat va nen den nhat) va lay gia tri
nho hon — do la bao dam tuyet doi, khong phai uoc luong.

Du lieu token lay tu styles/tokens.css (chep tay, co ghi dong).
"""
import sys


def srgb_to_lin(v):
    v = v / 255.0
    return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4


def luminance(rgb):
    r, g, b = (srgb_to_lin(x) for x in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(fg, bg):
    l1, l2 = luminance(fg), luminance(bg)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def over(fg_rgb, alpha, bg_rgb):
    return tuple(fg_rgb[i] * alpha + bg_rgb[i] * (1 - alpha) for i in range(3))


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgba(s):
    inner = s[s.index("(") + 1:s.index(")")]
    parts = [p.strip() for p in inner.split(",")]
    return tuple(int(float(p)) for p in parts[:3]), float(parts[3]) if len(parts) > 3 else 1.0


# styles/tokens.css:129-131 (light) va 185-187 (dark)
CASES = [
    ("light · .bbox__tag (chu tren chip mo)", "rgba(22,16,12,0.74)", "#fff7ef", "styles/tokens.css:130-131"),
    ("dark  · .bbox__tag (chu tren chip mo)", "rgba(0,0,0,0.76)", "#fdf6ef", "styles/tokens.css:186-187"),
]

if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    print("Tuong phan GIOI HAN XAU NHAT cua chu nam tren chip mo de len anh")
    print("(chip alpha tron voi pixel anh; pixel anh chay tu den tuyet doi den trang tuyet doi)")
    print("")
    print("%-44s %10s %10s %10s %s" % ("truong hop", "tren TRANG", "tren DEN", "MIN", "ket luan"))
    worst_all = 99.0
    for name, chip, ink, src in CASES:
        c_rgb, c_a = rgba(chip)
        i_rgb = hex_to_rgb(ink)
        on_white = contrast(i_rgb, over(c_rgb, c_a, (255, 255, 255)))
        on_black = contrast(i_rgb, over(c_rgb, c_a, (0, 0, 0)))
        lo = min(on_white, on_black)
        worst_all = min(worst_all, lo)
        print("%-44s %10.2f %10.2f %10.2f %s  [%s]" % (
            name, on_white, on_black, lo, "DAT >=4.5" if lo >= 4.5 else "KHONG DAT", src))
    print("")
    print("Ket luan: moi chu nam trong .bbox__tag dat toi thieu %.2f:1 tren MOI anh co the co." % worst_all)
    print("Luu y: ket qua nay chi ap dung cho chu CO chip nen. Chu nam truc tiep tren pixel anh")
    print("(khong co nen) thi khong the bao dam bang cach tinh — xem tools/qa-cdp4-report.json muc BB4.")
