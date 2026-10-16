# SnapLife AI — Design System (Source of Truth)

> Nguồn gốc: `SnapLife-AI-Pitch-Deck.pdf` (đội Prompt and Chill) + hướng thẩm mỹ do người dùng chốt
> (**Warm Editorial + Soft Depth**, mobile-first, responsive tới tablet/desktop).
>
> Tài liệu này được viết tay và đối chiếu với code thật trong `styles/tokens.css`.
> Không phải output tự động của công cụ sinh design system — vì bản tự động trả về
> Claymorphism + font thiếu nhi + indigo, lệch hẳn định vị sản phẩm (người học người lớn,
> nội dung là đời sống riêng). Đã ghi đè có chủ đích.

---

## 1. Vì sao hướng này

SnapLife AI bán **ngữ cảnh của chính người học**, không bán kho từ vựng. Hướng thẩm mỹ phải
truyền đạt điều đó:

| Quyết định | Lý do |
|---|---|
| Nền giấy kem `#FBF6EF` thay vì trắng/xám | Gợi trang sổ tay — sản phẩm là nhật ký học, không phải dashboard |
| Mực nâu đen `#2A211B` thay vì `#000` | Dịu mắt trên nền kem, vẫn đạt 12:1 |
| Terracotta `#A63D12` thay vì xanh dương/indigo | Tránh trùng Duolingo; ấm, thủ công, "của mình" |
| Cam đất `#B03A0E` riêng cho **từ tiếng Anh trong đoạn đan xen** | Đây là tương tác lõi của sản phẩm, cần một màu dành riêng, đạt 9.26:1 |
| Xanh rừng `#2F6B4F` cho tiến độ | Tách khỏi xanh neon của đối thủ, vẫn đọc tốt |
| Không linh vật, không animation nhảy nhót | Người học là người lớn; động lực đến từ dữ liệu của chính họ |

---

## 2. Màu — token ngữ nghĩa

**Chỉ dùng token, không hardcode hex trong màn hình.** Đã kiểm bằng `tools/check_contrast.py`.

### Light (mặc định)

| Token | Giá trị | Dùng ở đâu |
|---|---|---|
| `--paper` | `#FBF6EF` | nền màn hình |
| `--paper-sunken` | `#F3E9DC` | nền khung demo bên ngoài |
| `--card` | `#FFFFFF` | mặt thẻ nổi |
| `--card-2` | `#FFFCF7` | thẻ phụ |
| `--card-inset` | `#F8F1E7` | nền chìm (segmented, skeleton) |
| `--ink` | `#2A211B` | chữ chính |
| `--ink-2` | `#4E4238` | chữ phụ |
| `--ink-3` | `#6E6055` | nhãn nhỏ, IPA, chú thích |
| `--ink-inverse` | `#FFFAF4` | chữ trên nền mực đảo |
| `--line` / `--line-strong` | `#EADFD1` / `#D9C9B4` | viền, đường kẻ |
| `--primary` | `#A63D12` | hành động chính |
| `--primary-soft` / `--primary-soft-2` | `#FBEADF` / `#F6DCCB` | nền nhấn |
| `--on-primary` | `#FFFFFF` | chữ trên nút chính |
| `--highlight` | `#B03A0E` | **từ tiếng Anh trong đoạn đan xen** |
| `--highlight-soft` | `#FCEBDC` | gạch chân từ tiếng Anh |
| `--success` | `#2F6B4F` | đúng, tiến độ, badge thành công |
| `--warning` | `#8A5A05` | cảnh báo |
| `--danger` | `#A8261C` | lỗi |
| `--info` | `#2C5C7A` | ghi chú |
| `--focus` | `#1B64C9` | viền tiêu điểm bàn phím |

### Dark

Nền `#16120E`, thẻ `#221C16`, mực `#F4ECE1`. `--primary` chuyển thành `#EF8F68` (cam sáng)
vì terracotta tối không đủ tương phản trên nền tối. `--on-primary` chuyển thành `#2A1409`.

**Dark không phải đảo màu máy móc** — mỗi token được chọn lại và đã đo riêng.

### Kết quả đo tương phản (WCAG 2.1)

```
$ python tools/check_contrast.py
Đã kiểm 98 cặp màu · 0 cặp không đạt 4.5:1
```

Vòng đo đầu tiên phát hiện `--ink-3` cũ (`#8B7A6B`) chỉ đạt **3.83:1** trên nền giấy — dưới
ngưỡng 4.5:1 cho chữ 12px. Script tìm được giá trị thoả **mọi nền** cùng lúc
(`--paper`, `--card`, `--card-2`, `--card-inset`, `--paper-sunken`, `--primary-soft`, `--primary-soft-2`)
và kéo theo cả `--ink-2` để giữ 3 cấp chữ tách bạch. Đây là lỗi đã được sửa, không phải lỗi còn tồn.

---

## 3. Chữ

| Vai trò | Font | Cỡ / nhịp | Dùng ở đâu |
|---|---|---|---|
| Display | **Calistoga** | 20–38px, line-height 1.12 | tiêu đề màn hình, số liệu lớn |
| Reading | **Newsreader** | 19px, line-height 1.8 | đoạn văn đan xen, câu ví dụ |
| UI | **Inter** | 13–17px, line-height 1.55 | nhãn, nút, nội dung giao diện |
| Data | **JetBrains Mono** | 10–13px, tracking 0.09em | IPA, CEFR, nhãn nhỏ uppercase, số liệu |

**Vì sao 4 font:** IPA (`ˈhed.fəʊnz`) cần font có ký hiệu phiên âm rõ — mono làm việc đó tốt
hơn sans. Mono còn tách bạch "dữ liệu học thuật" khỏi "giao diện". Newsreader tách "nội dung
để đọc" khỏi "nội dung để bấm". Bốn font, bốn vai trò, không chồng lấn.

Thang cỡ: `10 · 12 · 13 · 15 · 17 · 20 · 24 · 30 · 38`. Không dùng cỡ ngoài thang.

---

## 4. Khoảng cách, bo góc, độ nổi

- **Khoảng cách**: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64` (`--sp-1..--sp-10`). Nhịp 4/8.
- **Bo góc**: `6 · 10 · 14 · 18 · 24 · 32 · full` (`--r-xs..--r-2xl`). Nút luôn `--r-full`.
- **Độ nổi — "Soft Depth"**: hai tầng bóng, không dùng viền đậm.
  ```
  --shadow-1  0 1px 2px rgba(42,33,27,.06)
  --shadow-2  0 1px 2px rgba(42,33,27,.05), 0 6px 16px -8px rgba(42,33,27,.22)
  --shadow-3  0 2px 4px rgba(42,33,27,.05), 0 16px 36px -16px rgba(42,33,27,.3)
  --shadow-4  0 30px 60px -24px rgba(42,33,27,.34)
  ```
  Vì sao hai tầng: một tầng bóng duy nhất hoặc quá dẹt (không nổi) hoặc quá đen (trông cũ).
  Tầng thứ hai là bóng lan toả âm, tạo cảm giác vật đặt trên giấy.

---

## 5. Chuyển động

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--dur-instant` | 80ms | phản hồi nhấn (`transform: scale`) |
| `--dur-fast` | 140ms | đổi màu, hover |
| `--dur` | 220ms | chuyển trạng thái, mở sheet |
| `--dur-slow` | 380ms | vào màn hình, thanh tiến độ |
| `--ease` | `cubic-bezier(.2,.8,.2,1)` | mặc định |
| `--ease-spring` | `cubic-bezier(.34,1.4,.5,1)` | nút chụp, toggle |

**Nguyên tắc**: một thời lượng cho mọi thứ là lỗi. Nhấn phải phản hồi trong ~80ms (dưới
ngưỡng cảm nhận trễ), còn vào màn hình thì chậm rãi hơn để mắt theo kịp.
Toàn bộ `--dur-*` bị ép về 1ms dưới `prefers-reduced-motion`, kèm override
`animation-duration` / `transition-duration` cho mọi phần tử.

---

## 6. Component

Thư viện nằm ở `styles/components.css` (hình thức) + `src/core/ui.js` (hàm dựng DOM).
Màn hình **không** tự vẽ lại nút/thẻ — luôn dùng `ctx.ui.*`.

| Nhóm | Component |
|---|---|
| Khung | `appBar` `iconBtn` `fab` `sectionTitle` |
| Hành động | `button` `btnRow` `chip` `chipRow` `segmented` `toggle` |
| Nội dung | `card` `list` `listItem` `callout` `badge` `keyval` `divider` `stat` `statGrid` |
| Học tập | `wordRow` `audioButton` `interleave` `bbox` `photoFrame` `viewfinder` |
| Tiến độ | `progress` `progressSeg` `ring` `barList` |
| Trạng thái | `empty` `skeleton` `spinner` `toast` `sheet` `modal` |
| Chi phí | `costMeter` |

Chuẩn chung mọi component đã thoả: touch target ≥44px, `aria-label` khi chỉ có icon,
focus ring thấy rõ, trạng thái nhấn có phản hồi, không nhảy bố cục khi nhấn.

---

## 7. Quy tắc bất di bất dịch

1. Không emoji làm icon. Chỉ SVG cùng một họ nét (stroke 1.75).
2. Không hardcode màu trong màn hình. Chỉ token.
3. Touch target ≥ 44×44px; nút chỉ có icon phải có `aria-label`.
4. Chữ ≥ 4.5:1 (đo bằng script, không đoán bằng mắt).
5. Không truyền đạt thông tin chỉ bằng màu — luôn kèm icon, nhãn hoặc số.
6. Ảnh dọc/vuông giữ đúng tỉ lệ; toạ độ bbox tính bằng % để co giãn không lệch.
7. Mọi thứ chuyển động được thì phải tắt được dưới `prefers-reduced-motion`.
8. Trạng thái rỗng / đang tải / lỗi / offline phải có thiết kế thật.

---

## 8. Kiểm chứng

| Cổng | Công cụ | Ngưỡng |
|---|---|---|
| Tương phản token | `python tools/check_contrast.py` | 98/98 cặp ≥ 4.5:1 |
| A11y + touch + tràn ngang + tương phản thực tế | `tools/audit.html` qua Chromium headless | 0 error, 0 warn |
| Lỗi runtime từng màn | `pwsh tools/shoot.ps1` | mọi màn `ok` |
| Responsive | `gallery.html` ở 375 / 390 / 768 / 1024 / 1440 | không tràn ngang |
