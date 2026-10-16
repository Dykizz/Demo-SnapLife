# SnapLife AI — Demo giao diện

> **Học tiếng Anh qua chính câu chuyện và cuộc sống của bạn.**
> Prototype giao diện high-fidelity cho hackathon, dựng từ `SnapLife-AI-Pitch-Deck.pdf`
> (đội thi **Prompt and Chill**: Phùng Phú Tài · Nguyễn Thành Đức · Nguyễn Hồng Sơn · Ngô Đức Huy).

**21 màn hình · 5 luồng bấm được từ đầu tới cuối · sáng/tối · responsive 375→1440 · chạy được khi mất mạng.**

---

## Chạy demo

```powershell
# Cách 1 — bấm đúp vào file này:
open-demo.cmd

# Cách 2 — chạy tay:
cd D:\Demo
node tools/serve.mjs 8137
# mở http://127.0.0.1:8137/index.html
```

> ⚠️ **Đừng mở `index.html` bằng `file://`.** Trình duyệt chặn ES module trên `file://`
> (CORS, origin `null`) nên app sẽ trắng. Luôn chạy qua server tĩnh.
> `tools/serve.mjs` chỉ dùng thư viện chuẩn của Node — không cần `npm install`.

| Trang | Dùng để làm gì |
|---|---|
| `index.html` | **Demo tương tác** — khung điện thoại, chọn màn hình, Cost Meter, bảng giải thích thiết kế |
| `gallery.html` | **Thư viện màn hình** — 21 màn cạnh nhau, đổi bề rộng khung để kiểm responsive |

**Phím tắt trong demo:** `←` `→` đổi màn hình · `T` sáng/tối · `W` chế độ web · `F` chế độ chỉ ứng dụng · `M` tắt/bật âm thanh.

---

## Demo trên nhiều thiết bị

Mặc định mở `index.html` là vào **giao diện web** — trên máy tính cũng vậy, không còn khung điện thoại.
Chế độ khung điện thoại là lựa chọn để trình bày trước ban giám khảo: `?mode=demo` hoặc nhấn `W`.

| Chế độ | Vào bằng | Trông thế nào |
|---|---|---|
| **Web** (mặc định) | mở `index.html` | web app dùng hết khung nhìn; nav đổi theo bề rộng khung |
| **Demo shell** | `?mode=demo` hoặc phím `W` | rail chọn màn hình + **khung điện thoại** + cột giải thích thiết kế |

Trong chế độ web, điều hướng **đổi theo bề rộng khung**:

| Khung | Nav | Bố cục |
|---|---|---|
| 320–599px (điện thoại) | tab bar **dưới**, nút Chụp ở giữa | một cột |
| 600–899px (tablet dọc) | tab bar **dưới** | lưới tự chia cột |
| ≥ 900px (tablet ngang) | **rail trái** dọc, có thương hiệu | canh giữa, `--measure-body` 720 / `--measure-grid` 1040 |
| ≥ 1100px (laptop) | rail trái | 820 / 1160 — nhiều màn chuyển sang 2–3 vùng |
| ≥ 1500px (màn lớn) | rail trái | 900 / 1400 — dashboard nhiều cột |

Chi tiết cấu trúc desktop từng màn: [WEB-SPEC.md](docs/WEB-SPEC.md) §8.

### Điện thoại / tablet thật, cùng wifi

```powershell
cd D:\Demo
node tools/serve.mjs 8137        # mặc định mở lên LAN
```

Server in ra danh sách địa chỉ để mở trên điện thoại, ví dụ:

```
  ĐIỆN THOẠI / TABLET CÙNG WIFI mở một trong các địa chỉ sau:
    http://192.168.1.6:8137/index.html     (Wi-Fi)
```

- Lần đầu Windows sẽ hỏi cho phép Node.js qua tường lửa → chọn **Private networks** rồi Allow.
- Máy tính và điện thoại phải cùng một mạng wifi.
- Chỉ muốn chạy trên máy này: `node tools/serve.mjs 8137 --local`.
- Link dùng luôn cho người chấm: `index.html?mode=web` (mở thẳng chế độ web) hoặc `?mode=demo`.

> **Vì sao bố cục desktop không phá khung điện thoại:** các nhóm màn hình dùng **container query**
> (`@container appframe (min-width: 900px)`) chứ không phải `@media`. `@media` tính theo *viewport*,
> nên trên màn 1440px nó vẫn kích hoạt bên trong khung 390px và làm vỡ bố cục; `@container` tính theo
> *bề rộng khung* nên chỉ chạy khi khung thật sự đủ rộng. Chi tiết: [WEB-SPEC.md](docs/WEB-SPEC.md).

---

## Bản đồ màn hình

| # | Màn hình | Nhóm | Trang deck |
|---|---|---|---|
| 01 | `splash` Khởi động | Nhập môn | 1 |
| 02 | `onboarding` 3 slide: vấn đề → giải pháp → quyền riêng tư | Nhập môn | 2, 3, 9 |
| 03 | `placement` Test xếp trình độ 3 phút | Nhập môn | 11 |
| 04 | `topics` Chọn chủ đề quan tâm | Nhập môn | 11 |
| 05 | `home` Hôm nay — streak, câu mỗi ngày, 3 hành động | Nhập môn | 7, 11 |
| 06 | `capture` Chụp ngữ cảnh | Chụp ảnh | 4 |
| 07 | `regions` Khoanh vùng → mỗi vùng một thẻ từ | Chụp ảnh | **4 · điểm nhấn 1** |
| 08 | `wordlist` Bộ từ của tôi | Chụp ảnh | 11 |
| 09 | `worddetail` Thẻ từ đầy đủ | Chụp ảnh | 4 |
| 10 | `compose` Kể lại một ngày / gõ từ & chủ đề | Câu chuyện | 5 |
| 11 | `reader` Đoạn văn đan xen Việt–Anh | Câu chuyện | **5 · điểm nhấn 2** |
| 12 | `speaking` Mic → bạn nói → AI chỉnh lại (diff) | Câu chuyện | **6 · điểm nhấn 3** |
| 13 | `stories` Truyện đã lưu | Câu chuyện | — |
| 14 | `review-hub` Chọn phiên 2/10/20 phút | Ôn tập | 8 |
| 15 | `review-run` Phiên ôn 5 dạng bài | Ôn tập | 8 |
| 16 | `review-summary` Kết quả phiên + chứng minh 0 API call | Ôn tập | 8, 9 |
| 17 | `diary` Nhật ký sắc thái → câu động viên | Tiến độ | **7 · điểm nhấn 4** |
| 18 | `progress` Hồ sơ tự cập nhật | Tiến độ | 11 |
| 19 | `profile` Hồ sơ & Quyền riêng tư | Tiến độ | 11 |
| 20 | `compare` So sánh với Duolingo / Memrise / Anki | Hệ thống | **10 · so sánh** |
| 21 | `system-states` Rỗng · đang tải · lỗi · offline | Hệ thống | — |

Mỗi màn mở được trực tiếp bằng deep link, ví dụ `#/reader?story=ceramic-cup`, `#/worddetail?word=downpour`.

---

## 5 luồng chính

```
1 · Ảnh → từ vựng      home → capture → regions → wordlist / worddetail
2 · Ngữ cảnh của bạn   home → compose → reader → speaking
3 · Luyện nói          reader → speaking (idle → recording → recorded → correcting → corrected)
4 · Ôn tập             home → review-hub → review-run (5 dạng) → review-summary
5 · Động lực mỗi ngày  home → diary → câu khớp tâm trạng
```

Giải thích đầy đủ **vì sao** từng luồng được thiết kế như vậy: [`docs/UX-FLOWS.md`](docs/UX-FLOWS.md).

### Cost Meter — biến luận điểm kiến trúc thành thứ nhìn thấy được

Khung demo có bộ đếm chạy thật, hiện ở thanh trên và ở cột phải:

| Hành động | Bộ đếm |
|---|---|
| Chụp 1 ảnh → nhận diện | VLM **+1**, và chỉ +1 dù vào lại màn bao nhiêu lần |
| AI viết đoạn đan xen | LLM **+1** |
| Nhờ AI chỉnh câu nói | LLM **+1** (bấm lần hai mới +1 tiếp) |
| Chọn câu động viên, mở bộ từ, xem tiến độ | **+0** |
| Toàn bộ phiên ôn tập | **+0** |

Đây là cách diễn đạt kỹ thuật của câu ở slide 10: *"Sáng tạo không nằm ở việc gọi AI nhiều hơn,
mà ở việc gọi AI đúng một lần."*

---

## Kiểm chứng

**Chín cổng** kiểm tra. Một lệnh chạy hết:

```powershell
cd D:\Demo
& .\tools\verify-all.ps1            # thêm -Shots nếu muốn chụp ảnh lại luôn
```

Script in ra `[ OK ]` / `[FAIL]` cho từng cổng và thoát khác 0 nếu có cổng hỏng.
Muốn chạy tay từng cổng thì xem danh sách bên dưới.

> **Lưu ý:** `pwsh` (PowerShell 7) không phải máy nào cũng có — dùng `& .\tools\verify-all.ps1`
> chứ đừng gọi `pwsh -File ...`.

> **Lưu ý về PowerShell:** các file `.ps1` trong dự án cố tình viết **thuần ASCII**.
> Windows PowerShell 5.1 đọc `.ps1` theo ANSI khi file thiếu BOM, nên bất kỳ ký tự có dấu nào
> cũng làm vỡ cú pháp. Giữ ASCII thì script chạy đúng dù được lưu bởi công cụ nào.
> Ngoài ra Chromium luôn ghi vài dòng cảnh báo ra `stderr` dù ảnh vẫn ghi ra bình thường —
> vì vậy `shoot.ps1` không đặt `$ErrorActionPreference = 'Stop'`.

```powershell
cd D:\Demo
$chrome = "$env:LOCALAPPDATA\ms-playwright\chromium-1243\chrome-win64\chrome.exe"
$env:PYTHONIOENCODING='utf-8'

# 1 · Tương phản màu WCAG 2.1 trên toàn bộ token
python tools/check_contrast.py

# 2 · Mật độ từ tiếng Anh trong đoạn đan xen (deck hứa 15–20%)
python tools/check_story_ratio.py

# 3 · Audit giao diện: a11y, touch target, tràn ngang, tương phản thực tế, ảnh hỏng
& $chrome --headless=new --disable-gpu --virtual-time-budget=40000 --dump-dom `
  "http://127.0.0.1:8137/tools/audit.html" > tools\dom-audit.html
Select-String -Path tools\dom-audit.html -Pattern 'data-audit-summary'

# 4 · Kiểm thử luồng end-to-end (nhúng chính index.html vào iframe rồi bấm nút)
& $chrome --headless=new --disable-gpu --window-size=1400,1000 --virtual-time-budget=120000 --dump-dom `
  "http://127.0.0.1:8137/tools/flows.html" > tools\dom-flows.html
Select-String -Path tools\dom-flows.html -Pattern 'data-flows-summary'

# 5 · Chụp ảnh + bắt lỗi runtime cho cả 21 màn hình
& .\tools\shoot.ps1

# 6 · Kiểm chế độ web & nav thích ứng (tab bar dưới ↔ rail trái, chế độ demo ↔ web)
#     Đây là tầng shell — audit.html không đo được vì nó render từng màn rời.
& $chrome --headless=new --disable-gpu --window-size=1500,1100 --virtual-time-budget=120000 --dump-dom `
  "http://127.0.0.1:8137/tools/web-check.html" > tools\dom-webcheck.html
Select-String -Path tools\dom-webcheck.html -Pattern 'data-webcheck-summary'

# 7 · Kiểm bố cục ở từng bề rộng thiết bị (bảng có cột "nội-dung" và "cột")
foreach ($w in 375, 768, 1024, 1440) {
  & $chrome --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=60000 --dump-dom `
    "http://127.0.0.1:8137/tools/audit.html?w=$w" > "tools\dom-audit-$w.html"
  "$w : " + ([regex]::Match((Get-Content "tools\dom-audit-$w.html" -Raw -Encoding utf8),'data-audit-summary="([^"]*)"').Groups[1].Value)
}

# 8 · Bố cục KHUNG SHELL ở cả hai chế độ (rail / khung điện thoại / inspector)
#     và gallery.html. Audit không đo được tầng này vì nó render từng màn rời.
& $chrome --headless=new --disable-gpu --virtual-time-budget=30000 --dump-dom `
  "http://127.0.0.1:8137/tools/layout-check.html?w=958,1278,1534,1917&h=901" > tools\_gate-layout.txt
(Get-Content tools\_gate-layout.txt -Raw) -split "`n" | Select-String 'data-verdict|✓|✗'

# 9 · Chế độ demo/web: khoá localStorage cũ bị nhiễm độc, nút đổi chế độ hai chiều
& $chrome --headless=new --disable-gpu --virtual-time-budget=30000 --dump-dom `
  "http://127.0.0.1:8137/tools/mode-check.html" > tools\_gate-mode.txt
Select-String -Path tools\_gate-mode.txt -Pattern 'data-verdict'
```

> Trong PowerShell, gọi script bằng `& .\tools\shoot.ps1`.
> Nếu máy có `pwsh` (PowerShell 7) thì `pwsh -File tools\shoot.ps1` cũng được.

**Kết quả hiện tại** (chạy `& .\tools\verify-all.ps1`, tất cả `[ OK ]`):

| Cổng | Kết quả |
|---|---|
| 1 · Bố cục khung shell | **đạt** ở 958 / 1278 / 1534 / 1917 px × {demo, web}; và tỉ lệ khung điện thoại **390×844** đúng ở 4 chiều cao cửa sổ 600/722/900/1000 |
| 2 · Chế độ demo ↔ web | **9/9 phép thử** (khoá cũ bị bỏ qua, nút đi được cả hai chiều) |
| 3 · Audit giao diện | **21/21 màn hình · 0 lỗi · 0 cảnh báo** ở cả 5 bề rộng 375/768/1024/1280/1500, cả light và dark |
| 4 · Tầng shell web | **18/18** (tab bar dưới ↔ rail trái, vùng chạm, bề rộng nội dung) |
| 5 · Luồng end-to-end | **22/22 phép thử đạt** |
| 6 · Tương phản token | **98 cặp màu, 0 cặp dưới 4.5:1** (cả light và dark) |
| 7 · Mật độ tiếng Anh | **16.8%** và **17.0%** — trong khoảng 15–20% của deck |
| 8 · Ảnh chụp + kiểm nội dung | **50/50** ảnh hợp lệ |

### Bẫy đã gặp ở tầng shell (ghi lại để không tái phạm)

Ba lỗi dưới đây **audit không bắt được**, vì `tools/audit.html` render từng màn rời bên trong
một khung `.probe` — nó không đi qua khung shell của `index.html`. Đó là lý do có cổng 1 và 2.

1. **`<body class="shell">` và `<div class="shell">` trùng class.** `body` cũng khớp luật
   `.shell { display: grid; grid-template-columns: 264px minmax(0,1fr) 300px }`, nên cả trang
   co lại trong cột 264px đầu: rail, khung điện thoại và inspector chồng lên nhau trong ~604px
   bên trái, phần còn lại của cửa sổ trống. Chế độ web không lộ vì `[data-mode='web'] div.shell`
   ghi đè `display: block` — **chỉ demo mode mới thấy**, đúng thứ người xem nhìn thấy.
   Nay mọi luật bố cục của shell đều ghi `div.shell`, không bao giờ là `.shell` trần.
2. **Chế độ bị ghim vào `localStorage`.** `boot()` gọi `setMode(currentMode())`, tức là ghi
   *chế độ mặc định* như thể người dùng đã chọn. Ai từng mở bản cũ (mặc định `demo` ở cửa sổ
   ≥1100px) thì mãi mãi thấy khung điện thoại — bản sửa "mặc định là web" không tới được máy họ.
   Thêm nữa nút đổi chế độ chỉ biết `setMode('demo')` và bị ẩn trong demo mode, nên không có
   đường thoát ngoài phím `W`. Nay: khoá đổi thành `snaplife.mode.v2` (bỏ giá trị cũ nhiễm độc),
   mặc định **không** được ghi nhớ, và nút hiện ở cả hai chế độ và đi được cả hai chiều.
3. **Khung điện thoại bị bóp méo chiều cao.** `.device` có `max-height: calc(100vh - 190px)`.
   Trên laptop cửa sổ cao ~722px CSS thì khung bị ép còn 532px: tỉ lệ 390:844 (0.462) thành
   0.73 — điện thoại bẹt ra, và màn hình bên trong chỉ còn ~508px thay vì 820px nên nội dung
   bị cắt cụt. Một khung thiết bị là ảnh chụp thiết kế: bóp một chiều là sai tỉ lệ **và** sai
   luôn bố cục bên trong. Nay `.device` cố định 390×844 và khi cửa sổ thấp hơn thì **trang
   cuộn** (rail và inspector vẫn sticky nên không mất ngữ cảnh). Cổng 1 đo tỉ lệ này ở 4 chiều
   cao cửa sổ; muốn xem trọn khung không phải cuộn thì cần cửa sổ cao ≥ ~1050px.

Chi tiết đợt kiểm tra độc lập: [`docs/QA-REPORT.md`](docs/QA-REPORT.md).

### Deep link phục vụ trình diễn và QA

Ngoài deep link cho từng màn, có vài deep link đi thẳng vào một trạng thái — rất tiện khi demo
trước ban giám khảo vì không phải bấm qua nhiều bước:

| Link | Mở thẳng |
|---|---|
| `#/reader?story=ceramic-cup` | Truyện thứ hai |
| `#/reader?word=mug` | Đoạn đọc kèm sheet nghĩa của từ `mug` đang mở |
| `#/speaking?state=recording` | Màn luyện nói đang ở trạng thái ghi âm |
| `#/speaking?state=corrected` | Màn luyện nói đang ở trạng thái đã sửa xong (thấy diff ngay) |
| `#/worddetail?word=downpour` | Thẻ từ đầy đủ của một từ bất kỳ |

### Harness tự kiểm của từng nhóm

Mỗi nhóm dựng thêm harness riêng trong thư mục màn hình của mình. Chúng không nằm trong manifest
nên không ảnh hưởng demo, nhưng chạy lại được khi cần:

| Harness | Nhóm | Kiểm gì |
|---|---|---|
| `src/screens/b-capture/_selfcheck.html` | B | 60 phép thử: toạ độ bbox so với `regionFor()`, Giữ/Bỏ, tự khoanh thêm, Cost Meter idempotent |
| `src/screens/e-progress/_selftest.html` | E | 55 phép thử: sắc thái → câu, heatmap 35 ô, CEFR 5 mức, công tắc `trainOnData` |
| `src/screens/e-progress/_cssprobe.html` | E | Đo tương phản ở cả hai theme bằng cách render mới |
| `src/screens/e-progress/_preview.html` | E | Chụp một màn ở theme chỉ định (`?screen=X&theme=dark`) |
| `tools/probe.html` | Lead | Dựng một màn trong khung 390×844 cố định — nền tảng của `shoot.ps1` |

---

## Design system

Hướng thẩm mỹ: **Warm Editorial + Soft Depth** — nền giấy kem, mực nâu ấm, terracotta làm màu hành động,
từ tiếng Anh nổi **màu cam đất**. Cố ý khác Duolingo: sản phẩm bán *ngữ cảnh của chính bạn*, không bán kho từ.

- Nguồn sự thật: [`design-system/snaplife-ai/MASTER.md`](design-system/snaplife-ai/MASTER.md)
- Token trong code: [`styles/tokens.css`](styles/tokens.css)
- Bốn font, bốn vai trò: **Calistoga** (tiêu đề) · **Newsreader** (đọc) · **Inter** (giao diện) · **JetBrains Mono** (IPA, CEFR, số liệu)

---

## Cấu trúc

```
index.html                 demo tương tác          gallery.html   thư viện màn hình
open-demo.cmd              mở demo bằng 1 cú bấm

src/core/                  router · store · dom · icons · ui · audio · cost · registry
src/data/                  fixtures · words · photos · story · logic
src/screens/
  a-onboarding/            splash onboarding placement topics home
  b-capture/               capture regions wordlist worddetail
  c-story/                 compose reader speaking stories
  d-review/                review-hub review-run review-summary
  e-progress/              diary progress profile system-states
styles/                    tokens base components shell + screens-{a..e}
assets/photos/             ảnh "của người dùng" (AI tạo, 900×900)
tools/                     server, audit, kiểm thử luồng, chụp ảnh, kiểm tương phản
docs/                      PLAN · BUILD-SPEC · UX-FLOWS · QA-REPORT
design-system/             MASTER.md — nguồn sự thật về thiết kế
```

**Ảnh demo là ảnh AI tạo** (5 ảnh 900×900 trong `assets/photos/`). Toạ độ khoanh vùng không phải số đoán:
chúng được suy ra bằng `tools/detect_regions.py` (dò mật độ cạnh) rồi đối chiếu với bố cục đã mô tả khi tạo ảnh.

---

## Ghi chú kỹ thuật

- **Vì sao vanilla JS + ES module, không React/Tailwind?** Demo phải chạy được ngay trước mặt ban giám khảo.
  Không bước build, không `npm install` — chỉ cần một server tĩnh.
- **Không phụ thuộc mạng.** Bốn font (Calistoga · Newsreader · Inter · JetBrains Mono) được **tự chứa**
  trong `assets/fonts/` (28 file woff2, 934 KB, có cả subset `vietnamese`), sinh bởi `tools/fetch_fonts.py`.
  Ảnh cũng nằm trong `assets/photos/`. Rút mạng vẫn demo được đúng thiết kế — đây là điều qa-verify
  đã đo và buộc tôi sửa: trước đó font nạp từ Google Fonts CDN, mất mạng thì rơi về Georgia và
  bề rộng chuỗi tiêu đề lệch +5.6%.
- **Vì sao bbox tính bằng %?** Ảnh co giãn thế nào thì toạ độ vẫn đúng. Nhưng vì vậy ảnh **phải** được
  render trong khung **vuông 1:1** — đổi tỉ lệ khung là bbox lệch ngay.
- **Chi phí AI là idempotent theo khoá.** Khoá `vlm:morning-desk` chỉ cộng một lần cho cả phiên,
  nên vào lại màn `regions` bao nhiêu lần cũng không làm con số sai.
- **Không dùng ảnh chụp màn hình để kiểm tra tự động.** Mô hình không xem được ảnh, nên
  `tools/audit.js` đo bằng DOM + computed style (tương phản, touch target, tràn ngang, tên truy cập được),
  và `tools/flows.js` bấm nút thật trong iframe. Ảnh chụp chỉ để **người** xem lại.
