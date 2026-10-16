"""Kiểm tra tương phản WCAG 2.1 cho toàn bộ token màu của SnapLife AI.

Đọc trực tiếp styles/tokens.css (không chép tay giá trị), đối chiếu các cặp
(màu chữ, màu nền) thực sự được dùng trong giao diện, cho cả light và dark.
Với cặp không đạt, script đề xuất giá trị tối thiểu cần đạt.

    python tools/check_contrast.py
"""

import re
import os
import sys
import colorsys

TOKENS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "styles", "tokens.css")

TARGET_NORMAL = 4.5
TARGET_LARGE = 3.0  # chữ >= 24px, hoặc >= 18.66px và bold


def parse_tokens(path):
    """Trả về {'light': {...}, 'dark': {...}} từ các khối CSS custom property."""
    text = open(path, encoding="utf-8").read()
    light, dark = {}, {}
    # Khối light: ':root,\n[data-theme="light"] { ... }'  (bỏ qua :root đầu tiên chỉ chứa font/scale)
    def grab(pattern):
        out = {}
        for block in re.findall(pattern, text, flags=re.S):
            for name, value in re.findall(r"(--[a-z0-9-]+)\s*:\s*([^;]+);", block):
                out[name.strip()] = value.strip()
        return out

    light.update(grab(r":root,\s*\n\[data-theme=['\"]light['\"]\]\s*\{(.*?)\n\}"))
    dark.update(grab(r"\[data-theme=['\"]dark['\"]\]\s*\{(.*?)\n\}"))
    return light, dark


def to_rgb(value):
    m = re.search(r"#([0-9a-fA-F]{6})", value)
    if m:
        h = m.group(1)
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    m = re.search(r"rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)", value)
    if m:
        return tuple(float(m.group(i)) for i in (1, 2, 3))
    return None


def channel(v):
    s = v / 255.0
    return s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4


def luminance(rgb):
    r, g, b = rgb
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)


def ratio(fg, bg):
    l1, l2 = luminance(fg), luminance(bg)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def darken_to(rgb, bg, target):
    """Hạ độ sáng dần cho tới khi đạt target (giữ nguyên sắc độ Hue/Sat)."""
    r, g, b = [v / 255.0 for v in rgb]
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    best = None
    for step in range(100, 0, -1):
        vv = v * step / 100.0
        cand = tuple(round(c * 255) for c in colorsys.hsv_to_rgb(h, s, vv))
        if ratio(cand, bg) >= target:
            best = cand
            break
    if best is None and ratio((0, 0, 0), bg) >= target:
        best = (0, 0, 0)
    return best


def lighten_to(rgb, bg, target):
    r, g, b = [v / 255.0 for v in rgb]
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    best = None
    for step in range(100, 0, -1):
        vv = min(1.0, v + (1.0 - v) * step / 100.0)
        cand = tuple(round(c * 255) for c in colorsys.hsv_to_rgb(h, s, vv))
        if ratio(cand, bg) >= target:
            best = cand
            break
    return best


def hexs(rgb):
    return "#%02X%02X%02X" % rgb


# (màu chữ, màu nền, nhãn, dùng ở đâu)
USAGE = [
    ("--ink", "--paper", "chữ chính trên nền màn hình"),
    ("--ink", "--card", "chữ chính trên thẻ"),
    ("--ink", "--card-2", "chữ chính trên thẻ phụ"),
    ("--ink", "--card-inset", "chữ chính trên nền chìm"),
    ("--ink-2", "--paper", "chữ phụ trên nền màn hình"),
    ("--ink-2", "--card", "chữ phụ trên thẻ"),
    ("--ink-2", "--card-2", "chữ phụ trên thẻ phụ"),
    ("--ink-2", "--card-inset", "chữ phụ trên nền chìm"),
    ("--ink-2", "--primary-soft", "chữ phụ trên thẻ nhấn"),
    ("--ink-3", "--paper", "nhãn mờ / IPA / appbar__sub trên nền"),
    ("--ink-3", "--card", "nhãn mờ trên thẻ"),
    ("--ink-3", "--card-2", "nhãn mờ trên thẻ phụ"),
    ("--ink-3", "--card-inset", "nhãn mờ trên nền chìm"),
    ("--ink-3", "--primary-soft", "nhãn mờ trên thẻ nhấn"),
    ("--ink-3", "--paper-sunken", "nhãn mờ trên khung demo"),
    ("--primary", "--paper", "chữ/nút nhấn trên nền"),
    ("--primary", "--card", "chữ/nút nhấn trên thẻ"),
    ("--primary", "--primary-soft", "chữ nhấn trên nền nhấn"),
    ("--primary", "--card-inset", "chữ nhấn trên nền chìm"),
    ("--highlight", "--paper", "từ tiếng Anh trong đoạn đan xen"),
    ("--highlight", "--card", "từ tiếng Anh trên thẻ"),
    ("--highlight", "--highlight-soft", "từ tiếng Anh trên nền nhấn"),
    ("--success", "--paper", "trạng thái đúng/thành công"),
    ("--success", "--card", "trạng thái đúng trên thẻ"),
    ("--success", "--success-soft", "badge thành công"),
    ("--warning", "--paper", "trạng thái cảnh báo"),
    ("--warning", "--warning-soft", "badge cảnh báo"),
    ("--danger", "--paper", "trạng thái lỗi"),
    ("--danger", "--card", "trạng thái lỗi trên thẻ"),
    ("--danger", "--danger-soft", "badge lỗi"),
    ("--info", "--paper", "ghi chú thông tin"),
    ("--info", "--info-soft", "callout thông tin"),
    ("--on-primary", "--primary", "chữ trên nút chính"),
    ("--on-primary", "--primary-hover", "chữ trên nút chính khi hover"),
    ("--on-success", "--success", "chữ trên badge thành công / toast"),
    ("--on-warning", "--warning", "chữ trên badge cảnh báo"),
    ("--on-danger", "--danger", "chữ trên nút xoá / toast lỗi"),
    ("--on-info", "--info", "chữ trên badge thông tin"),
    ("--on-highlight", "--highlight", "chữ trên từ tiếng Anh đang mở"),
    ("--ink-inverse", "--ink", "chữ trên thẻ mực đảo"),
    ("--focus", "--paper", "viền tiêu điểm trên nền"),
    ("--focus", "--card", "viền tiêu điểm trên thẻ"),
    ("--ink-3", "--primary-soft-2", "nhãn mờ trên nền nhấn đậm"),
    ("--ink-2", "--primary-soft-2", "chữ phụ trên nền nhấn đậm"),
    ("--ink", "--primary-soft", "chữ chính trên thẻ nhấn"),
    ("--ink", "--success-soft", "chữ chính trên nền thành công"),
    ("--ink", "--warning-soft", "chữ chính trên nền cảnh báo"),
    ("--ink", "--danger-soft", "chữ chính trên nền lỗi"),
    ("--ink", "--info-soft", "chữ chính trên nền thông tin"),
]


def main():
    light, dark = parse_tokens(TOKENS)
    if not light or not dark:
        print("Không đọc được token từ", TOKENS)
        return 1

    failures = []
    checked = 0

    for theme_name, tokens in (("light", light), ("dark", dark)):
        print(f"\n================ {theme_name.upper()} ================")
        for fg_name, bg_name, label in USAGE:
            fg_val, bg_val = tokens.get(fg_name), tokens.get(bg_name)
            if fg_val is None or bg_val is None:
                print(f"  BỎ QUA  {label} — thiếu token {fg_name if fg_val is None else bg_name}")
                continue
            fg, bg = to_rgb(fg_val), to_rgb(bg_val)
            if fg is None or bg is None:
                print(f"  BỎ QUA  {label} — không phân tích được màu ({fg_val} / {bg_val})")
                continue
            checked += 1
            r = ratio(fg, bg)
            ok = r >= TARGET_NORMAL
            mark = "OK  " if ok else "LỖI "
            print(f"  {mark} {r:5.2f}:1  {fg_name} trên {bg_name}  — {label}")
            if not ok:
                fixed = darken_to(fg, bg, TARGET_NORMAL) if luminance(fg) < luminance(bg) else lighten_to(fg, bg, TARGET_NORMAL)
                suggestion = f"{fg_name}: {hexs(fixed)} (hiện {fg_val})" if fixed else f"{fg_name}: cần đổi hẳn màu"
                failures.append((theme_name, fg_name, bg_name, label, r, suggestion))

    print("\n================ KẾT LUẬN ================")
    print(f"Đã kiểm {checked} cặp màu · {len(failures)} cặp không đạt {TARGET_NORMAL}:1")
    for theme_name, fg_name, bg_name, label, r, suggestion in failures:
        print(f"  [{theme_name}] {r:.2f}:1  {fg_name} trên {bg_name} ({label})")
        print(f"        → đề xuất: {suggestion}")

    # Một token thường phải đạt trên NHIỀU nền. Tìm một giá trị duy nhất thoả tất cả.
    print("\n================ GIÁ TRỊ DUY NHẤT THOẢ MỌI NỀN ================")
    must_fix = {}
    for theme_name, fg_name, bg_name, *_ in failures:
        must_fix.setdefault((theme_name, fg_name), set()).add(bg_name)

    if not must_fix:
        print("Không cần đổi token nào.")

    for (theme_name, fg_name), bg_names in sorted(must_fix.items()):
        tokens = light if theme_name == "light" else dark
        fg_val = tokens.get(fg_name)
        fg = to_rgb(fg_val) if fg_val else None
        if fg is None:
            continue
        # Thêm mọi nền khác mà token này cũng đang được dùng trên đó.
        all_bgs = {b for f, b, _ in USAGE if f == fg_name and tokens.get(b)}
        bgs = sorted(all_bgs)
        bg_rgbs = [(b, to_rgb(tokens[b])) for b in bgs]
        bg_rgbs = [(b, rgb) for b, rgb in bg_rgbs if rgb]

        def worst(cand):
            return min(ratio(cand, rgb) for _, rgb in bg_rgbs) if bg_rgbs else 0

        r, g, b = [v / 255.0 for v in fg]
        h, s, v0 = colorsys.rgb_to_hsv(r, g, b)
        avg_bg_lum = sum(luminance(rgb) for _, rgb in bg_rgbs) / max(1, len(bg_rgbs))
        # Chữ sáng hơn nền thì làm sáng thêm, chữ tối hơn nền thì làm tối đi.
        go_lighter = luminance(fg) > avg_bg_lum

        best = None
        for step in range(0, 101):
            if go_lighter:
                vv = min(1.0, v0 + (1.0 - v0) * step / 100.0)
            else:
                vv = v0 * (100 - step) / 100.0
            cand = tuple(round(c * 255) for c in colorsys.hsv_to_rgb(h, s, vv))
            if worst(cand) >= TARGET_NORMAL + 0.1:  # biên an toàn, tránh đúng 4.50 sát nút
                best = cand
                break

        if best:
            detail = ", ".join(f"{b} {ratio(best, rgb):.2f}" for b, rgb in bg_rgbs)
            print(f"  [{theme_name}] {fg_name}: {fg_val} → {hexs(best)}  (thấp nhất {worst(best):.2f}:1)")
            print(f"        nền phải thoả: {detail}")
        else:
            print(f"  [{theme_name}] {fg_name}: không có giá trị nào cùng sắc độ thoả mọi nền — cần đổi cách dùng")

    return 1 if failures else 0


if __name__ == "__main__":
    # Windows console mặc định là cp1258 — ép UTF-8 để in được tiếng Việt.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    sys.exit(main())
