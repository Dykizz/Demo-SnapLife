# SnapLife AI — Spec chế độ web & responsive đa thiết bị

> Mục tiêu: demo **dùng được thật trên web** ở mọi thiết bị, không chỉ nằm trong khung điện thoại.
> Hai chế độ trình bày, cùng một bộ màn hình:
>
> | Chế độ | Khi nào | Trông thế nào |
> |---|---|---|
> | **Demo shell** | màn hình rộng ≥ 1100px và bật chế độ demo (mặc định) | rail chọn màn hình + khung điện thoại + cột inspector — để trình bày trước ban giám khảo |
> | **Web mode** | màn hình hẹp, **hoặc** bấm nút "Web" | app tràn khung nhìn như một web app thật; nav đổi theo thiết bị |
>
> Bấm `W` để chuyển qua lại; lựa chọn được nhớ trong `localStorage`.

---

## 1. Breakpoint (dùng thống nhất toàn dự án)

> ⚠️ **Dùng `@container`, KHÔNG dùng `@media` cho bố cục.**
>
> App nằm trong khung điện thoại **390px** ngay cả khi cửa sổ rộng 1440px (chế độ demo).
> `@media (min-width: 900px)` tính theo **viewport**, nên nó vẫn kích hoạt bên trong khung
> 390px và làm vỡ bố cục. `@container appframe (min-width: 900px)` tính theo **bề rộng khung**,
> nên chỉ chạy khi khung thật sự đủ rộng — đúng ở cả ba nơi: khung điện thoại, web mode, harness audit.
>
> Container tên `appframe` do Lead đặt sẵn trên `.device__viewport`, `.app`, `#frame`, `.probe`.
> Viết `@container` ở cấp cao nhất, **không lồng trong `@media`**. Riêng
> `prefers-reduced-motion` thì vẫn dùng `@media` như thường.

```css
@container appframe (min-width: 900px) {
  .ten-luoi { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
  .ten-man .screen__body { max-width: var(--measure-grid); margin-inline: auto; }
}
```

| Tên | Khoảng | Thiết bị đại diện | Nav |
|---|---|---|---|
| `sm` | 320–599px | điện thoại | tab bar **dưới** (5 tab, nút Chụp ở giữa) |
| `md` | 600–899px | điện thoại lớn, tablet dọc | tab bar **dưới**, nội dung rộng hơn |
| `lg` | 900–1279px | tablet ngang, laptop nhỏ | rail **trái** (dọc) |
| `xl` | ≥ 1280px | desktop | rail **trái** + cột nội dung rộng tối đa |

Mobile-first: dùng `min-width`. Các `@media (max-width: …)` vi chỉnh hẹp có sẵn trong
5 file `screens-*.css` cũng nên đổi sang `@container appframe (max-width: …)`.

> **Các con số breakpoint là bề rộng NỘI DUNG, không phải bề rộng cửa sổ.**
> Hệ quả cần biết: trong web mode, rail trái ăn `--sidebar-w` (212px, hoặc 260px khi cửa sổ ≥ 1280px),
> nên bố cục desktop bắt đầu ở cửa sổ ≈ 1112px chứ không phải 900px. Cửa sổ 900–1112px ở web mode
> sẽ thấy rail trái nhưng nội dung vẫn ở dạng tablet (một cột, `--measure-body`). Đây là **hành vi đúng
> theo ngữ nghĩa container query** — bố cục phản ứng theo chỗ nó thật sự có, không theo cửa sổ.
> Trên laptop, chế độ demo (mặc định khi cửa sổ ≥ 1100px) mới là chế độ nên dùng để trình bày.

---

## 2. Bề rộng nội dung — quy tắc quan trọng nhất

Trên màn lớn, **không để nội dung kéo hết chiều rộng**. Chữ dài quá 75 ký tự một dòng là
không đọc được. Dùng biến do Lead đặt trong `styles/web.css`:

```css
--measure-read: 68ch;    /* đoạn văn đọc */
--measure-body: 720px;   /* nội dung dạng danh sách, thẻ */
--measure-grid: 1040px;  /* lưới nhiều cột */
```

Quy tắc áp dụng ở `min-width: 900px`:

- `.screen__body` mặc định `max-width: var(--measure-body)`, canh giữa (`margin-inline: auto`).
- Màn nào có lưới nhiều cột (topics, wordlist, review-hub, progress, compare, system-states)
  thì cho body rộng tới `var(--measure-grid)`.
- Riêng đoạn văn đọc (`.interleave`, `article`) giới hạn `max-width: var(--measure-read)`.
- **App bar và tab bar/rail thì tràn hết bề rộng**, chỉ nội dung mới bị giới hạn.

---

## 3. Lưới: một cột thành nhiều cột

Các khối đang xếp dọc nên tự chia cột khi có chỗ. Dùng cách này, **không** hardcode số cột:

```css
@container appframe (min-width: 600px) {
  .ten-luoi { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
}
```

Bắt buộc chia cột ở `min-width: 900px` cho:
- `topics` — lưới chủ đề
- `wordlist` — danh sách từ
- `review-hub` — danh sách 5 dạng bài
- `progress` — các thẻ số liệu (statGrid) và biểu đồ
- `compare` — các thẻ tiêu chí
- `system-states` — 4 khối trạng thái
- `home` — ba hành động chính (đang là 1 hàng ngang + 2 thẻ; trên desktop cho thành 3 cột đều)

---

## 4. Điều hướng thích ứng (Lead làm ở tầng shell, KHÔNG sửa ở màn hình)

- `< 900px`: giữ nguyên tab bar dưới. Không đổi gì trong màn hình.
- `≥ 900px`: tab bar biến thành **rail dọc bên trái**, cao hết khung nhìn, mục đang chọn
  có nền nhấn + thanh chỉ báo bên trái.
- Màn hình **không cần biết** nav đang ở dạng nào — shell lo hết. Vì vậy:
  **đừng thêm `padding-left` hay `margin-left` cho rail vào CSS của nhóm mình.**
- Vùng an toàn dưới (`env(safe-area-inset-bottom)`) xử lý ở shell.

---

## 5. Bắt buộc giữ

- **Touch target ≥ 44×44px** ở mọi bề rộng (audit tự kiểm).
- **Không tràn ngang** ở 375 / 414 / 600 / 768 / 1024 / 1280 / 1440. Đây là tiêu chí nghiệm thu cứng.
- **Không hardcode màu** — chỉ token.
- **Không đổi cấu trúc DOM** nếu chỉ để phục vụ responsive; ưu tiên CSS. Nếu buộc phải sửa JS
  thì chỉ trong thư mục `src/screens/<nhóm>/` của mình.
- **Hai theme** đều phải đúng (sáng + tối).
- `prefers-reduced-motion` vẫn phải tôn trọng.

---

## 6. Cách tự kiểm (bắt buộc chạy trước khi báo xong)

Lead đã thêm tham số bề rộng cho harness audit. Kiểm từng bề rộng:

```powershell
$chrome = "$env:LOCALAPPDATA\ms-playwright\chromium-1243\chrome-win64\chrome.exe"
foreach ($w in 375, 768, 1024, 1440) {
  & $chrome --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=60000 `
    --dump-dom "http://127.0.0.1:8137/tools/audit.html?w=$w" 2>$null | Out-File -Encoding utf8 "tools\_audit-$w.html"
  "$w : " + ([regex]::Match((Get-Content "tools\_audit-$w.html" -Raw -Encoding utf8),'data-audit-summary="([^"]*)"').Groups[1].Value)
}
```

Kết quả mong đợi ở mọi bề rộng: `errors=0 warns=0`, và **nhóm mình không có vi phạm nào**.

Chụp ảnh xem bố cục ở bề rộng lớn. `probe.html` nhận `?w=`/`?h=` (mặc định 390×844) và tự bật
chế độ web để ở bề rộng lớn nav là rail trái:

```powershell
$chrome = "$env:LOCALAPPDATA\ms-playwright\chromium-1243\chrome-win64\chrome.exe"
# 1) chụp ở cửa sổ lớn hơn khung, đường dẫn TUYỆT ĐỐI (đường dẫn tương đối sẽ không tạo được file)
& $chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1400,1000 `
  --virtual-time-budget=8000 --screenshot="D:\Demo\tools\shots\_wide-home.png" `
  "http://127.0.0.1:8137/tools/probe.html?screen=home&w=1024"
# 2) cắt đúng khung cần xem
python -c "from PIL import Image; Image.open(r'D:\Demo\tools\shots\_wide-home.png').crop((0,0,1024,900)).save(r'D:\Demo\tools\shots\wide-home.png')"
```

**Kiểm tầng shell (tab bar ↔ rail, chế độ demo ↔ web)** — thứ mà `audit.html` không đo được vì nó
render từng màn rời:

```powershell
& $chrome --headless=new --disable-gpu --window-size=1500,1100 --virtual-time-budget=120000 `
  --dump-dom "http://127.0.0.1:8137/tools/web-check.html" > tools\dom-webcheck.html
Select-String -Path tools\dom-webcheck.html -Pattern 'data-webcheck-summary'
```

Xem `gallery.html` (đổi được bề rộng khung) để soi toàn bộ màn hình cùng lúc.

---

## 7. Nghiệm thu chung của cả nhánh việc

- [ ] Mở `http://<IP-LAN>:8137/index.html` trên điện thoại thật → dùng được, nav ở dưới, không tràn ngang
- [ ] Trên laptop 1440px → nav thành rail trái, nội dung canh giữa, không kéo hết chiều rộng
- [ ] Trên tablet 768px → lưới đã chia 2 cột, chữ vẫn đọc tốt
- [ ] `audit.html?w=` tại 375 / 768 / 1024 / 1440 → `errors=0 warns=0`
- [ ] `tools/web-check.html` → tầng shell đúng (tab bar ↔ rail, chế độ demo ↔ web)
- [ ] `tools/flows.html` → không hỏng phép thử nào (Lead chạy)
- [ ] Cả sáng và tối

### Giới hạn đã biết (ghi để minh bạch, không phải lỗi)

- **`:has()`**: `profile` và `progress` dùng `:has()` để gán cột. Cần Chrome 105+ / Safari 15.4+
  (Safari cũ hơn sẽ rơi về luồng 2 cột tự động — vẫn ≥ 2 cột, chỉ khác thứ tự). Đã cân nhắc thay bằng
  class gán trong JS nhưng **không** làm, để giữ nguyên tắc "responsive chỉ bằng CSS".
- **Không có masonry**: hàng nào có thẻ thấp cạnh thẻ cao sẽ chừa khoảng trống. Đánh đổi bình thường của CSS grid.
- **Firefox/Edge cũ, zoom 200%, trình đọc màn hình**: chưa kiểm — ngoài phạm vi demo hackathon.

---

## 8. Giao diện MÁY TÍNH (≥ 1100px) — nhánh việc bổ sung

> **Bối cảnh:** bản trước đã responsive nhưng nội dung vẫn dừng ở 992–1040px giữa màn 1440px và
> bố cục vẫn là bố cục điện thoại được canh giữa. Mục tiêu bây giờ là **giao diện web máy tính thật**:
> dùng hết không gian, có cấu trúc nhiều vùng, không còn cảm giác "app điện thoại phóng to".

### 8.1 Mặc định đã đổi

`index.html` mặc định **web mode** ở mọi thiết bị. Chế độ khung điện thoại (`?mode=demo` hoặc phím `W`)
vẫn còn nhưng chỉ là lựa chọn để trình bày. Nghĩa là mở trên máy tính sẽ thấy **web app**, không thấy
một chiếc điện thoại ở giữa màn hình.

### 8.2 Hạn mức bề rộng (Lead đặt, các nhóm chỉ dùng)

| Khung | `--measure-body` | `--measure-grid` | `--screen-pad` |
|---|---|---|---|
| < 900px | 720px | 1040px | 20px |
| ≥ 900px | 720px | 1040px | 24px |
| ≥ 1100px | **820px** | **1160px** | 28px |
| ≥ 1500px | **900px** | **1400px** | 40px |

Đặt trên `.screen__body`/`.appbar`/`.screen__cta` trong container query, nên **phản ứng theo bề rộng khung**.
Nhóm chỉ cần `max-width: var(--measure-grid)` cho màn lưới và `var(--measure-body)` cho màn danh sách —
không hardcode số.

### 8.3 Quy tắc bắt buộc cho mọi màn ở desktop

- **Dùng hết bề rộng tới `--measure-grid`** ở màn có lưới/bảng; màn danh sách thì `--measure-body`.
- **Không để một cột dọc dài** ở 1100px+: chia thành lưới hoặc nhiều vùng.
- **Dòng chữ vẫn ≤ 80 ký tự.** Cột lưới thì rộng, nhưng KHỐI CHỮ phải tự giới hạn
  (`max-width: var(--measure-read)`). Đây là lỗi dễ mắc nhất khi mở rộng bề rộng — cổng đo sẽ bắt.
- `@container appframe (min-width: 1100px)` cho tầng desktop; giữ `900px` cho tablet ngang.
- Bố cục điện thoại (< 900px) **không được đổi**.
- Touch target ≥ 44px, không hardcode màu, cả sáng và tối.

### 8.4 Cấu trúc desktop yêu cầu theo màn

| Nhóm | Màn | Cấu trúc ở ≥ 1100px |
|---|---|---|
| A | `home` | Dashboard: cột trái = chuỗi ngày + số liệu; giữa = câu hôm nay + 3 hành động (3 cột); phải = phiên ôn |
| A | `onboarding` | 2 vùng: nội dung chính bên trái, điểm nhấn/quyền bên phải |
| A | `placement` | Câu hỏi bên trái, 4 đáp án bên phải (2 cột), tiến độ trên cùng |
| A | `topics` | Lưới 4–5 cột, body tới `--measure-grid` |
| B | `wordlist` | **Cột lọc bên trái (sticky)** + danh sách từ 2 cột bên phải (kiểu bảng) |
| B | `regions` | 2 vùng: ảnh 1:1 sticky bên trái (~460px) + thẻ từ 2 cột bên phải. **Ảnh phải giữ vuông 1:1** |
| B | `worddetail` | 2 vùng: thông tin từ bên trái, ví dụ + SRS bên phải |
| B | `capture` | Khung ngắm canh giữa ~560px, 4 bước kiến trúc thành dải ngang dưới |
| C | `reader` | 3 vùng: rail trái = bìa + audio + bộ đếm từ; giữa = bài đọc ≤ 68ch; (không cần cột 3) |
| C | `compose` | 2 vùng: ô nhập bên trái, ảnh + chip chủ đề bên phải |
| C | `speaking` | 2 vùng: transcript bên trái, diff + lý do sửa bên phải (điểm bán của slide 06) |
| C | `stories` | Lưới 3–4 cột |
| D | `review-hub` | 2–3 cột: chọn độ dài | 5 dạng bài | phiên sắp bắt đầu |
| D | `review-run` | Câu hỏi bên trái, đáp án + phản hồi đúng/sai bên phải; **nút Tiếp luôn trong khung nhìn** |
| D | `review-summary` | Dashboard: thẻ kết quả + biểu đồ thành lưới |
| E | `progress` | Dashboard 3 cột (đã có 2 — mở lên 3 ở ≥ 1500px) |
| E | `profile` | 2 vùng: cài đặt bên trái, quyền riêng tư + minh bạch chi phí bên phải |
| E | `compare` | Lưới 3 cột tiêu chí + 2 cột lợi ích |
| E | `diary` | 2 vùng: thang sắc thái + câu bên trái, lịch sử 7 ngày bên phải |
| E | `system-states` | Lưới 4 cột |

### 8.5 Cách tự kiểm

```powershell
$chrome = "$env:LOCALAPPDATA\ms-playwright\chromium-1243\chrome-win64\chrome.exe"
foreach ($w in 375, 768, 1024, 1280, 1500) {
  & $chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1500,950 --virtual-time-budget=60000 `
    --dump-dom "http://127.0.0.1:8137/tools/audit.html?w=$w" 2>$null | Out-File -Encoding utf8 "tools\_dk-$w.html"
  "$w : " + ([regex]::Match((Get-Content "tools\_dk-$w.html" -Raw -Encoding utf8),'data-audit-summary="([^"]*)"').Groups[1].Value)
}
```
Mong đợi: màn của nhóm mình **0 vi phạm ở mọi bề rộng**, và ở 1280/1500 cột `body` phải ≥ 2 với màn
có cấu trúc nhiều vùng. Chụp ảnh 1500×950 bằng `tools/probe.html?screen=X&w=1500&h=950` để đối chiếu.
