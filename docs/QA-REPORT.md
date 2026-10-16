# SnapLife AI — Báo cáo QA độc lập

> **Người thực hiện:** `qa-verify` (teammate độc lập, không thuộc nhóm màn hình nào)
> **Ngày chốt:** 2026-10-16 · cổng cuối chạy lúc **15:22** trên cây đã đóng băng (file cuối cùng sửa 15:03:54)
> **Đối tượng:** prototype giao diện SnapLife AI dựng từ `SnapLife-AI-Pitch-Deck.pdf` (12 trang, đội Prompt and Chill)
> **Phạm vi ghi của tôi:** `docs/QA-REPORT.md` + `tools/qa-*`. Tôi **không sửa** `src/**`, `styles/**`, `index.html`, `gallery.html`, hay các harness của Lead.

---

## 0. Tóm tắt cho người bận

| Hạng mục | Kết quả |
|---|---|
| 5 cổng đã có của Lead chạy lại độc lập | **5/5 ĐẠT** (98/98 · 16.8%/17.0% · 20/20 · **20/20** · 20/20 + 20/20) |
| Phép thử **mới** tôi tự viết | **12 harness, 57 nhóm phép thử** (deep link, trạng thái rỗng, history, bàn phím, reduced-motion, responsive, theme tối, chi phí AI, toạ độ bbox, điểm ảnh, TTS, tên truy cập) |
| Phát hiện **chặn demo** | 0 |
| Phát hiện **nên sửa** | 3 — cả 3 đã được Lead sửa, tôi **đã đo lại và xác nhận** (§3.1, §3.2, §3.3) |
| Phát hiện **nhỏ** còn tồn | 6 (§3.4 … §3.9) |
| Kết luận | **Sẵn sàng demo**, với 3 rủi ro trình diễn phải biết trước (§6) |

**Điều quan trọng nhất:** 5 cổng của Lead đều xanh **trước và sau** các bản vá, kể cả khi có lỗi rò rỉ sheet và lỗi thiếu tab bar. Nghĩa là bốn cổng đó **không bắt được** ba lỗi dưới đây — chúng chỉ lộ ra khi kiểm bằng tay ở tầng thấp hơn (bàn phím, `history` thật, `chrome` khai báo so với hợp đồng).

---

## 1. Môi trường và cách kiểm

```
Máy:        Windows, D:\Demo
Server:     node tools/serve.mjs 8137  (đã chạy sẵn; tôi không mở thêm)
Trình duyệt: Chrome/153.0.8010.12 — $env:LOCALAPPDATA\ms-playwright\chromium-1243\chrome-win64\chrome.exe
Node:       v22.20.0  (dùng global WebSocket + fetch, KHÔNG cài package nào)
PowerShell: không có `pwsh` trên PATH → gọi script bằng & .\tools\...
```

**Vì sao tôi tự viết harness mới thay vì chỉ chạy lại `tools/audit.html`:** audit do Lead viết và chỉ kiểm những gì Lead đã nghĩ tới. Tôi cần điều khiển trình duyệt ở tầng thấp hơn — `Emulation.setEmulatedMedia`, `Input.dispatchKeyEvent`, `Network.setBlockedURLs`, `history.back()` thật, `Page.captureScreenshot`. Node 22 có sẵn `WebSocket` nên tôi nói trực tiếp Chrome DevTools Protocol, không cần Puppeteer.

**Ghi chú kỹ thuật về cách chạy (đã tốn thời gian, ghi lại để tái lập):**
- Gọi `& $chrome ... > file` từ một số ngữ cảnh **không** đưa stdout của Chromium vào pipeline PowerShell → file ra 0 byte, `$LASTEXITCODE` rỗng. Tôi dùng `Start-Process -Wait -RedirectStandardOutput` (xem `tools/qa-gates.ps1`). Cách của `tools/shoot.ps1` cũng chạy đúng.
- Trong `.ps1` **không được** đặt tên tham số là `$Args` (biến tự động của PowerShell, luôn rỗng) — lần đầu `tools/qa-gates.ps1` của tôi chết vì đúng lỗi này.
- **Không** dùng output của `--dump-dom` để suy luận về chuyển động/transition — giá trị đọc được có thể là trạng thái trung gian. Xem §2.6 về bẫy theme.

**Danh mục harness tôi đã thêm (chỉ trong `tools/qa-*`):**

| File | Kiểm gì | Số nhóm phép thử |
|---|---|---|
| `tools/qa-cdp-lib.mjs` | CDP client tối giản (không phụ thuộc ngoài) | — |
| `tools/qa-cdp.mjs` | A–Q, S: deep link, tham số, rỗng, giữ dữ liệu, history, sheet, Tab, reduced-motion, 375/1440, cuộn đáy, zoom, font offline, chi phí, bbox, tỉ lệ EN, bấm mọi nút | 18 |
| `tools/qa-cdp2.mjs` | H2 rò rỉ sheet · I2 khoá tiêu điểm · J2 reduced-motion sau khi ổn định · K2 phân loại tràn ngang · O2 thời điểm tính phí · P2 hình học bbox · E2 bỏ từ + CTA · A2 bản đồ tab bar · T2 · N2/R2 (bản đầu, sau đó **bị chính tôi bác bỏ**, xem §2.6) | 10 |
| `tools/qa-cdp3.mjs` | C3 đối chiếu nội dung deck theo text thật · D3 bất biến sắc thái · S3 4 trạng thái · P3 quyền riêng tư · R3 số câu 2/10/20 · U3 lối ra · V3 bàn phím · W3 số màn nạp được | 8 |
| `tools/qa-cdp4.mjs` | H4 · T4 1 vùng ↔ 1 thẻ (trang sạch) · O4 chuỗi chi phí speaking · M4 bề ngang khung · BB4 chữ đè lên ảnh · F4 0 API khi ôn · N4 font khi mất mạng (đo bề rộng CHU thật) · R4 theme tối bằng **reload thật** | 8 |
| `tools/qa-cdp5.mjs` | U5 bấm từng nút tìm ngõ cụt · V5 Tab+Enter · Y5 bấm vùng khoanh · N5 tràn ngang 320→1440 · X5 chụp ảnh bìa để đo điểm ảnh | 5 |
| `tools/qa-cdp6/7/8.mjs` | Rò rỉ sheet qua rail · `#overlay` có tràn khỏi khung điện thoại · mở sheet có làm trang tự cuộn | 3 |
| `tools/qa-audio.mjs` | TTS có giọng đọc không (headless) | 1 |
| `tools/qa-buttons.mjs` | 269 nút trên 20 màn có tên truy cập không | 1 |
| `tools/qa-gates.ps1` | Chạy lại cổng 3/4/5 của Lead với cách bắt stdout đáng tin | — |
| `tools/qa-bbox-pixels.py` | Vùng bbox có "có nội dung" hay là nền trơn (thống kê điểm ảnh + 400 khung đối chứng) | 1 |
| `tools/qa-overlay-contrast.py` | Tương phản **giới hạn xấu nhất** của chữ trên chip mờ (tính được, không phải ước lượng) | 1 |
| `tools/qa-cover-text-contrast.py` | Đo tương phản chữ trắng trên ảnh bìa từ **ảnh chụp thật** + giới hạn xấu nhất từ CSS scrim | 1 |

---

## 2. Bảng tổng kết 5 cổng (lệnh + output THẬT)

Tất cả chạy lúc **15:22 ngày 2026-10-16**, sau khi cây đã đóng băng. Output dán nguyên văn.

### 2.1 Cổng 1 — Tương phản token (WCAG 2.1)

```powershell
python tools/check_contrast.py
```

```
================ KẾT LUẬN ================
Đã kiểm 98 cặp màu · 0 cặp không đạt 4.5:1

================ GIÁ TRỊ DUY NHẤT THOẢ MỌI NỀN ================
Không cần đổi token nào.
exit=0
```
(98 cặp = 49 cặp × 2 theme; giá trị thấp nhất ghi nhận được: `--ink-3 trên --primary-soft-2` = **4.62:1** light / **4.60:1** dark — sát ngưỡng nhưng đạt.)
**Kết luận: ĐẠT** (kỳ vọng 98/98).

### 2.2 Cổng 2 — Mật độ tiếng Anh trong đoạn đan xen

```powershell
python tools/check_story_ratio.py
```

```
Đoạn                     EN    VI  Tổng   Ti lệ   Ket luan
--------------------------------------------------------------
ceramic-cup              23   114   137   16.8%   dat
TODAY_RAW                30   146   176   17.0%   dat
--------------------------------------------------------------
Tat ca 2 doan nam trong khoang 15-20%. Dat.
exit=0
```
**Kết luận: ĐẠT** (kỳ vọng 2 đoạn trong 15–20%).

### 2.3 Cổng 3 — Audit giao diện (a11y + touch + tràn ngang + tương phản thực tế)

```powershell
$chrome = "$env:LOCALAPPDATA\ms-playwright\chromium-1243\chrome-win64\chrome.exe"
& $chrome --headless=new --disable-gpu --virtual-time-budget=60000 --dump-dom `
  "http://127.0.0.1:8137/tools/audit.html" > tools\qa-dom-audit.html
Select-String -Path tools\qa-dom-audit.html -Pattern 'data-audit-summary'
```

```
chromium exit=0  stdout bytes=261921
<html lang="vi" data-theme="light" data-audit-done="true"
      data-audit-summary="screens=20/20 errors=0 warns=0 light=0 dark=0"><head>
```
**Kết luận: ĐẠT** (kỳ vọng `screens=20/20 errors=0 warns=0 light=0 dark=0`).

### 2.4 Cổng 4 — Luồng end-to-end

```powershell
& $chrome --headless=new --disable-gpu --window-size=1400,1000 --virtual-time-budget=120000 `
  --dump-dom "http://127.0.0.1:8137/tools/flows.html" > tools\qa-dom-flows.html
Select-String -Path tools\qa-dom-flows.html -Pattern 'data-flows-summary'
```

```
chromium exit=0  stdout bytes=4574
<html lang="vi" data-theme="light" data-flows-done="true" data-flows-summary="20/20"><head>
```
**Kết luận: ĐẠT.** Lưu ý: đề bài giao cho tôi ghi "mong đợi 18/18", nhưng số thật sau các bản vá là **20/20** (Lead đã thêm test 09b cho bản đồ tab bar và test 15 cho rò rỉ sheet). Tôi ghi số tôi đo được, không ghi số được dặn.

### 2.5 Cổng 5 — Chụp ảnh + bắt lỗi runtime cho 20 màn

```powershell
& .\tools\shoot.ps1
python tools\check_shots.py tools\shots
```

```
SnapLife AI - chup man hinh - 2026-10-16 15:22
id                     status           theme
----------------------------------------------------
splash                 ok               light
onboarding             ok               light
placement              ok               light
topics                 ok               light
home                   ok               light
capture                ok               light
regions                ok               light
wordlist               ok               light
worddetail             ok               light
compose                ok               light
reader                 ok               light
speaking               ok               light
stories                ok               light
review-hub             ok               light
review-run             ok               light
review-summary         ok               light
diary                  ok               light
progress               ok               light
profile                ok               light
system-states          ok               light

ok: 20 / 20
Da cat 20/20 anh ve 390x844

Kiem tra 20 anh trong D:\Demo\tools\shots
file                           kxh   mau  khac-nen  hang-chu  ket luan
capture.png              390x844 85367     87.3%       582  ok  (nen 30% giay kem)
...
wordlist.png             390x844  2495     47.7%       321  ok  (nen 79% giay kem)
------------------------------------------------------------------------------
Dat: 20/20
check_shots exit=0
```
**Kết luận: ĐẠT** (20/20 `ok`, 20/20 ảnh có nội dung thật).

### 2.6 Ghi chú: hai phép thử của tôi đã SAI và tôi đã tự bác bỏ

Trung thực về chính mình — vòng 1 và vòng 2 của tôi có hai phép thử cho kết quả **sai**, phải làm lại:

| Phép thử sai | Tôi đã làm gì sai | Số sai | Số đúng sau khi làm lại |
|---|---|---|---|
| N — "mất mạng thì font thế nào" | Chỉ dùng `Network.setBlockedURLs` mà **không tắt cache** → font vẫn được lấy từ cache, `document.fonts.check()` trả `true` một cách vô nghĩa (hàm này trả `true` cả khi **không có** face nào khớp). Đo `width` của phần tử `h1` khối → luôn bằng bề ngang khung, delta = 0. | "delta 0px" | Font bị chặn thật + đo bề rộng **chuỗi chữ** bằng `Range`: **174.1px → 183.8px (+9.7px, +5.6%)**, `document.fonts.size` 28 → **0** (số đầy đủ ở §6.1) |
| R — "theme tối" | Chỉ `localStorage.setItem` rồi đổi hash → app **không đọc lại** theme, `data-theme` vẫn `light`. Tôi gần như đã báo "20 màn không vào được theme tối" — hoàn toàn sai. | "0/20 màn vào dark" | `Page.reload` thật: **20/20 màn `data-theme=dark`, `--paper=#16120e`**, 0 lỗi boot (§3.11, dòng "Theme tối") |

Tôi cũng phải sửa 4 chỗ nữa do **dùng sai selector**, nếu không đã báo lỗi giả:
`regions` dùng class `.is-focused` (tôi tìm `.is-active`), thẻ từ là `section.b-wordcard` (tôi tìm `.wordcard`), nút đóng ở `capture` có nhãn **"Đóng"** (tôi chỉ tìm "Quay lại"), và bộ đếm tab bar phải đọc từ `chrome` khai báo chứ không phải từ `tab`.
Và một phép thử **không kết luận được** đã bị tôi hạ xuống mức "chưa xác minh" thay vì báo lỗi: xoay vòng 5 dạng bài ở `review-run` — màn hình luôn in một bảng liệt kê cả 5 dạng, nên khớp văn bản luôn trả về "Đọc tương tác" và không thể phân biệt dạng đang hỏi (§4.4, gạch đầu dòng "Xoay vòng 5 dạng bài").

**Một bài học về bẫy đã cắn hai nhóm:** với theme, tôi **không bao giờ** đổi `data-theme` trên DOM đã render rồi đo ngay — luôn render mới trong theme đó (`localStorage` + `Page.reload`, hoặc `tools/probe.html?screen=X&theme=dark`). Kết quả ở §3.11 (dòng "Theme tối").

---

## 3. Danh sách phát hiện

### 3.1 [NÊN SỬA — đã được sửa, tôi đã đo lại] Sheet/modal rò rỉ sang màn hình khác

**Bằng chứng (trước khi sửa)** — `node tools/qa-cdp.mjs H`:
```
openedWord: "downpour"          (chạm một từ ở #/reader → sheet mở, có .scrim)
withSheet:   { overlayChildren: 2, scrim: true }
afterNav:    { hash: "#/review-hub", overlayChildren: 2, sheetLeft: true, scrimLeft: true }
```
và `node tools/qa-cdp2.mjs H2` (đường bấm **bàn phím**, không phải `.click()` giả):
```
arrowKey: { before: { hash: "#/reader", sheet: true },
            after:  { hash: "#/speaking", sheet: true, scrim: true } }
```
**Nguyên nhân (chẩn đoán, không sửa):** `ui.sheet()` / `ui.modal()` (`src/core/ui.js:440-497`) append vào `#overlay` dùng chung và chỉ tự gỡ qua `close()` (Esc / bấm scrim / nút ×). `router.render()` gọi `disposeCurrent()` nhưng không ai dọn `#overlay`.
**Ảnh hưởng tới người demo:** đang ở màn Đọc, chạm một từ để xem nghĩa, rồi bấm `←`/`→` (phím tắt có ghi ngay dưới khung demo) hoặc bấm một mục ở rail (rail nằm **ngoài** `#overlay` nên không bị scrim chặn) → màn mới bị tấm scrim che và bảng nghĩa của màn cũ vẫn đè lên.
**Đề xuất (đã nêu cho Lead):** thêm hàm dọn overlay dùng chung và gọi trong `router.render()`; thêm test hồi quy.

**XÁC NHẬN SAU KHI SỬA** — `node tools/qa-cdp2.mjs H2 A2 I2` chạy lại lúc 15:21 trên cây đã vá:
```
arrowKey: { before: { hash: "#/reader", sheet: true },
            after:  { hash: "#/speaking", sheet: false, scrim: false } }
afterEsc: { sheet: false, scrim: false, overlayChildren: 0 }
```
→ **Đã sửa thật.** Lead cũng cho biết lần vá đầu không có tác dụng vì `clearOverlays` không được đưa vào object `ui` nên lời gọi là no-op im lặng, và **test hồi quy 15 mới bắt được**. Đây là lý do một phép thử hồi quy có bằng chứng quan sát (`overlay trước=1 · sau=0`) có giá trị hơn một lời khẳng định "đã sửa".

---

### 3.2 [NÊN SỬA — đã được sửa, tôi đã đo lại] `wordlist` và `stories` thiếu thanh tab, lệch hợp đồng BUILD-SPEC §5

**Bằng chứng (trước khi sửa)** — `node tools/qa-cdp2.mjs A2`:
```
expectedTabbarScreens: [home, wordlist, reader, stories, review-hub, progress]
actualTabbarScreens:   [home, reader, review-hub, progress]
mismatches: ["wordlist: chrome=appbar tabbar=false", "stories: chrome=appbar tabbar=false"]
```
Đối chiếu nguồn: `docs/BUILD-SPEC.md` §5 ghi `**tabbar**` cho cả `wordlist` và `stories`; còn `src/screens/b-capture/wordlist.js:33` và `src/screens/c-story/stories.js:18` khai `chrome: 'appbar'`.
**Ảnh hưởng:** mất thanh điều hướng 5 tab đúng ở hai màn kết thúc hai luồng chính (Bộ từ của tôi, Truyện đã lưu) — đúng chỗ người dùng cần đi tiếp. UX-FLOWS §0 cũng đặt thanh tab làm điều hướng chính.
**Ghi chú công bằng:** Lead đã nhận đây là lỗi chỉ đạo của mình — đề bài trực tiếp cho nhóm B nói `appbar`, trong khi bảng §5 của hợp đồng nói `tabbar`; tài liệu và chỉ đạo mâu thuẫn nhau.

**XÁC NHẬN SAU KHI SỬA** — cùng lệnh, chạy lại 15:21:
```
expectedTabbarScreens: [home, wordlist, reader, stories, review-hub, progress]
actualTabbarScreens:   [home, wordlist, reader, stories, review-hub, progress]
mismatches: []
```
→ **Đã sửa thật.**

---

### 3.3 [NÊN SỬA / RỦI RO TRÌNH DIỄN — GIỮ NGUYÊN CÓ CHỦ ĐÍCH, đã sửa nhãn] Cost Meter tính tiền lúc **vào màn**, không phải lúc người dùng bấm

**Bằng chứng** — `node tools/qa-cdp2.mjs O2` (mỗi lần đều `cost.reset()` trước):
```
vao #/capture (chưa chụp gì)            -> totals.vlm = 1   ledger ["vlm:morning-desk"]
vao #/reader                             -> totals.llm = 1   ledger ["llm:today"]
vao #/speaking (chưa bấm gì)             -> totals.llm = 1   ledger ["llm:speak-1"]
vao #/speaking?state=corrected (deep link README quảng cáo) -> totals.llm = 1
```
**Ảnh hưởng:** câu chuyện bán hàng của slide 09–10 là *"tiền chỉ tốn khi bạn thật sự yêu cầu"*; nhưng nếu giám khảo **dán deep link** (đúng cách UX-FLOWS §0 dự liệu trước: "người chấm thi sẽ dán link, không bấm tuần tự") thì bộ đếm đã nhảy **trước khi họ làm gì**. Nếu tính lúc bấm thì ngược lại, deep link `#/regions` sẽ thấy 0 và luận điểm "1 lần/ảnh" biến mất khỏi màn hình.
**Đây là một đánh đổi thật, không phải bug.** Lead đã chọn giữ hành vi (để "1 lần/ảnh" nhìn thấy được bằng deep link) và **sửa nhãn ở cột inspector** cho trung thực:
> "Tính theo ẢNH và theo TRUYỆN, không theo từng lần bấm — nên mở thẳng màn hình bằng deep link cũng thấy đúng con số cho một ảnh / một truyện."

**Ghi nhận: quy ước có chủ đích, kèm cảnh báo.** Khi trình diễn, người nói nên chủ động nói câu đó ra trước khi giám khảo kịp thắc mắc — nếu im lặng, con số trên màn `#/capture` (1 API call mà chưa có ảnh nào) trông như lỗi.
**Đề xuất nếu muốn chắc hơn (không bắt buộc):** đổi chữ trên HUD từ "VLM 1×" thành "VLM 1×/ảnh" và đặt cạnh nó một nhãn nhỏ "theo ảnh, không theo lần bấm" — như vậy thông điệp nằm ngay chỗ con số, không phải ở cột phụ.

---

### 3.4 [NHỎ — a11y, CÒN TỒN] Dialog khai `aria-modal="true"` nhưng **không** khoá tiêu điểm

**Bằng chứng** — `node tools/qa-cdp2.mjs I2` (mở sheet ở `#/reader`, bấm Tab 25 lần):
```
totalStops: 25 · stopsInsideDialog: 5 · stopsOutsideDialog: 20
firstEscapes: ["Đặt lại dữ liệu demo", "Xoá bộ đếm chi phí", "BODY", "Danh sách màn hình", ...]
```
`src/core/ui.js:458` đặt `role="dialog" aria-modal="true"`. Theo ARIA, `aria-modal="true"` **hứa** với trình đọc màn hình rằng phần còn lại của trang là trơ — nhưng thực tế Tab đi thẳng ra ngoài dialog (20/25 điểm dừng ở ngoài). Lần đo **sau** khi vá rò rỉ sheet cho đúng kết quả này (5 trong / 20 ngoài), tức lỗi này độc lập với lỗi 3.1 và **chưa được sửa**.
**Ảnh hưởng:** người dùng bàn phím/trình đọc màn hình bị dẫn ra khỏi ngữ cảnh bảng nghĩa vào các nút của khung demo, trong khi được thông báo là đang ở trong dialog. Không ảnh hưởng người dùng cảm ứng (đường demo chính).
**Đề xuất:** hoặc thêm bẫy tiêu điểm (giữ Tab trong `.sheet`, đưa tiêu điểm về phần tử mở khi đóng), hoặc hạ `aria-modal` xuống `false` và đổi thành `role="region"`/`complementary` cho đúng sự thật. Cách thứ hai rẻ hơn và trung thực hơn nếu không kịp làm bẫy.

---

### 3.5 [NHỎ — rủi ro tiềm ẩn] Chữ trắng 10px trên ảnh bìa màn Đọc: giới hạn xấu nhất **4.17:1**, dưới ngưỡng 4.5:1

**Bối cảnh:** `.cs-cover__kicker` ("TRUYỆN CỦA PHÚ TÀI") là chữ trắng `#fff7ef`, cỡ **10px**, `opacity: 0.86`, đặt trên `.cs-cover__scrim` — một gradient dọc `alpha 0.68` ở đáy, `0.16` ở 46%, `0` ở 72% (`styles/screens-c.css:69-72`).

**Bằng chứng — đo trên ẢNH CHỤP THẬT** (`node tools/qa-cdp5.mjs X5` + `python tools/qa-cover-text-contrast.py`):
```
today   (assets/photos/rainy-street.jpg)
   kicker   opacity=0.86 | (1) trung vi 8.83:1 · p99 12.83:1 | (2) dai nen: trung vi 8.92:1 · p95 12.21:1 · 5.62% pixel duoi 4.5
   caption  opacity=1.00 | (1) trung vi 12.21:1 · p99 17.47:1 | (2) dai nen: trung vi 12.00:1 · p95 17.15:1 · 1.98% pixel duoi 4.5
ceramic-cup (assets/photos/ceramic-cup.jpg)
   kicker   opacity=0.86 | trung vi 9.58:1 · p95 12.12:1 · 8.25% pixel duoi 4.5
   caption  opacity=1.00 | trung vi 11.72:1 · p95 15.48:1 · 2.16% pixel duoi 4.5
```
**Giới hạn xấu nhất TÍNH ĐƯỢC** (không phụ thuộc ảnh — cho pixel ảnh = trắng tuyệt đối, dùng alpha scrim yếu nhất trong dải chữ ≈ 0.598):
```
kicker   (opacity 0.86, 10px) -> 4.17:1  -> KHÔNG ĐẠT 4.5:1
caption  (opacity 1.00, 17px) -> 4.98:1  -> ĐẠT
```
**Ảnh hưởng:** với **hai ảnh bìa hiện có** thì đạt thoải mái (trung vị 8.8–9.6:1). Đây là **rủi ro tiềm ẩn**: nếu sau này thay ảnh bìa bằng ảnh sáng (trắng, cánh đồng, giấy), dòng chữ 10px này là chỗ đầu tiên rơi dưới ngưỡng. Không ảnh hưởng buổi demo hôm nay.
**Đề xuất:** tăng alpha scrim ở dải dưới (ví dụ `0.80` thay `0.68`), hoặc bỏ `opacity: 0.86` ở kicker, hoặc đặt kicker vào một chip mờ như `.bbox__tag` (xem §3.11 — chip đó **chứng minh được** ≥ 7.74:1 trên mọi nền).

---

### 3.6 [NHỎ — cần mắt người] Vùng `headphones` trong ảnh `morning-desk` nhìn "giống nền trơn" theo thống kê điểm ảnh

**Bằng chứng** — `python tools/qa-bbox-pixels.py` (so mỗi vùng với **400 khung cùng kích thước đặt ngẫu nhiên** trong ảnh):
```
morning-desk  (900x900)
  vùng            std    edge      mau | pctl_std pctl_edge pctl_mau
  mug            54.0   20.39    22515 |     66.2     89.5     64.0
               -> co noi dung (>=80 pctl)
               khung tot nhat trong +-20%: edge=20.65 tai (x=0.0,y=66.0) — gap 1.01x
  headphones     47.7    7.98    11153 |     47.8     19.5     20.8
               -> giong NEN TRON
               khung tot nhat trong +-20%: edge=13.18 tai (x=40.0,y=47.0) — gap 1.65x
  notebook       52.3   24.29    20749 |     60.8     99.0     45.5
               -> co noi dung (>=80 pctl)
               khung tot nhat trong +-20%: edge=24.41 tai (x=45.5,y=63.0) — gap 1.01x
```
So sánh: `mug` (pctl 89.5) và `notebook` (99.0) đều nằm trong nhóm 10–20% khung "đặc" nhất ảnh, và trong bán kính ±20% **không** có khung nào dày hơn đáng kể (1.01×). Riêng `headphones` ở phân vị **19.5** (nhóm 20% nền trơn nhất) và chỉ cách vị trí hiện tại ~1 bước lưới là có khung dày hơn **1.65×**.
**Ảnh hưởng:** đây là điểm nhấn 1 của cả bài pitch ("mỗi vùng bạn khoanh sinh một từ") — nếu vùng thứ hai nằm trên mặt bàn trống thay vì trên tai nghe thì người xem tinh mắt sẽ thấy ngay.
**Trung thực về giới hạn:** tôi **không xem được ảnh**. "Mật độ cạnh thấp" có thể vì (a) vùng đặt sai chỗ, hoặc (b) tai nghe là vật nhẵn, ít chi tiết, hoặc (c) ảnh mất nét ở vùng đó. Tôi **không** kết luận được là sai — chỉ nói được rằng nó khác hẳn hai vùng còn lại. Chính `src/data/photos.js:19-22` ghi vùng này đã bị "siết lại theo số đo của nhóm B" và tự nhận vùng cũ "dễ ôm cả nền"; con số hiện tại cho thấy nó **vẫn** ở nhóm 20% nền trơn nhất.
**Đề xuất:** người xem được ảnh mở `assets/photos/morning-desk.jpg` và `tools/shots/regions.png`, nhìn vùng thứ 2 (nhãn "2. headphones"). Nếu nó lệch, đổi về `x=40, y=47` (khung dày hơn 1.65×) rồi chạy lại 5 cổng.

---

### 3.7 [NHỎ] Trạng thái "bỏ hết từ → nút học bị disable kèm lý do" trong UX-FLOWS §1 **không thể tới được**

**Bằng chứng** — `node tools/qa-cdp2.mjs E2` (bấm "Bỏ" trên từng thẻ cho tới khi không còn thẻ nào bỏ được):
```
ctaBanDau:  { label: "Học với 3 từ này", disabled: false }
daBamBo:    ["Thẻ từ 1: mug", "Thẻ từ 2: headphones", "Thẻ từ 3: notebook", (rồi lặp lại thẻ 3)]
sauKhiBoHet:{ cta: { label: "Học với 1 từ này", disabled: false }, cardsLeft: 1,
              restoreRows: 2, removed: ["ai-0","ai-1"], reasonText: null }
```
`UX-FLOWS.md` §1 bắt buộc: *"Người dùng bỏ hết từ → nút 'Học ngay' phải disable kèm lý do, không im lặng."* `src/screens/b-capture/regions.js:330,345` **có** viết callout "Giữ lại ít nhất một vùng để bắt đầu học." và `disabled: n === 0`, nhưng UI luôn giữ lại ≥ 1 từ (đúng như note ở `regions.js:39`) nên nhánh đó là **code không tới được** và không thể trình diễn cho giám khảo. `reasonText: null` xác nhận callout chưa bao giờ hiện.
**Ảnh hưởng tới demo:** nhỏ. Thực tế đây là hành vi **tốt hơn** yêu cầu (không để người dùng rơi vào ngõ cụt) — nhưng tài liệu hứa một trạng thái mà app không thể hiện, và người chấm đọc UX-FLOWS có thể hỏi "đâu là trạng thái đó?".
**Đề xuất:** hoặc sửa UX-FLOWS §1 cho khớp với thiết kế thật ("luôn giữ tối thiểu một từ, có Hoàn tác"), hoặc giữ đúng ít nhất một từ nhưng **vẫn hiện callout giải thích vì sao không bỏ được từ cuối**.

---

### 3.8 [NHỎ] Deep link có tham số không hợp lệ xử lý **không nhất quán**

**Bằng chứng** — `node tools/qa-cdp.mjs C`:

| Deep link | Kết quả | Đánh giá |
|---|---|---|
| `#/reader?story=khong-co` | fallback + **nói rõ**: "Truyện không tồn tại — Không thấy truyện "khong-co" — đang mở truyện gần nhất." | tốt |
| `#/worddetail?word=khong-co` | trạng thái rỗng đầy đủ: "Không có từ "khong-co" trong bộ từ / Từ này chưa nằm trong bộ từ của bạn..." + lối thoát | tốt |
| `#/speaking?state=bay-ba` | **im lặng** rơi về `idle` (47 node, không một dòng thông báo) | chưa nhất quán |
| `#/wordlist?filter=zzz` | **im lặng** bỏ qua tham số, vẫn hiện đủ 23 từ | chưa nhất quán |
| `#/khong-ton-tai-xyz` | màn "Chưa có màn hình này" + nút về Hôm nay | tốt |

**Ảnh hưởng:** nhỏ. README chỉ quảng cáo 5 deep link và cả 5 đều hoạt động đúng. Nhưng giám khảo hay gõ/dán link bằng tay; một tham số gõ sai sẽ **im lặng** cho ra màn mặc định, khiến người dán link tưởng app hiểu tham số trong khi nó không.
**Đề xuất:** dùng cùng một cách như `#/reader?story=...` — nhận ra tham số không hợp lệ thì hiện một `ui.callout` nhỏ "Không hiểu tham số, đang mở mặc định". Rẻ và làm cho deep link hết im lặng.

---

### 3.9 [NHỎ — tôi chưa kết luận được] Bấm rail khi sheet đang mở: bị nuốt hay không?

Trong `node tools/qa-cdp6.mjs` (viewport 1440×900, đã gọi `scrollIntoView` để mục rail nằm trong tầm bấm, bấm bằng **chuột thật** qua `Input.dispatchMouseEvent`):
```
mucRail:        { x: 172, y: 391, label: "05 Hôm nay" }
sauKhiBamRail:  { hash: "#/reader"  (KHÔNG điều hướng),
                  sheetCon: false, scrimCon: false, overlayChildren: 0 }
```
→ cú bấm **đóng sheet** nhưng **không** điều hướng, tức là rơi vào `.scrim` chứ không vào mục rail.
Nhưng `node tools/qa-cdp7.mjs` (đo hình học ở 1440/1024/390) lại **phản bác**:
```
scrimTranRaNgoaiApp: { traiPhai: false, trenDuoi: false, lechTrai: 0, lechPhai: 0 }
railProbe: { muc: "01 Khởi động", x: 172, y: 231, topElement: "grow truncate", biScrimNuot: false }
```
→ `.scrim` **không** tràn ra ngoài khung `.app`, và `elementFromPoint` tại vị trí mục rail trả về **chính mục rail**, không phải scrim.
Tôi **không giải thích được** hai kết quả này khác nhau (nghi ngờ liên quan tới việc `scrollIntoView` làm cuộn trang/rail khác nhau giữa hai lần chạy). **Tôi không kết luận đó là lỗi.** Vấn đề này chỉ có thể chốt bằng một người ngồi trước trình duyệt thật và bấm tay — và **lỗi 3.1 đã được sửa** nên đường rò rỉ chính không còn, khiến câu hỏi này giảm hẳn mức quan trọng.

---

### 3.10 [TÀI LIỆU — đã được sửa] Số liệu trong README/MASTER lệch so với thực tế

| Tài liệu | Ghi | Số thật tôi đo |
|---|---|---|
| `README.md:136` | "**88/88 cặp ≥ 4.5:1**" | **98/98** |
| `README.md:139` | "Luồng end-to-end: **15/15** phép thử đạt" | **20/20** |
| `MASTER.md:69` | "Đã kiểm 88 cặp màu · 0 cặp không đạt" | 98 cặp |
| `MASTER.md:167` | "88/88 cặp ≥ 4.5:1" | 98/98 |
| `README.md:211` | "không phụ thuộc CDN" | `index.html:10-15` **có** nạp 4 font từ `fonts.googleapis.com` (xem §6.1) |
| `PLAN.md:54,194` | "18 màn + 4 trạng thái" | 20 màn (registry `PLANNED` có 20) |

Lead đã sửa các con số 88→98 và 15→20 trong README/MASTER. **Câu "không phụ thuộc CDN" thì tôi vẫn khuyến nghị sửa** — hoặc bỏ chữ "CDN", hoặc self-host font (xem §6.1). Đây đúng là loại lỗi mà không nhóm màn hình nào nghĩ tới vì ai cũng chỉ đọc phần code của mình.

---

### 3.11 Những gì tôi **thử tìm lỗi và KHÔNG tìm được** (ghi để biết phạm vi đã phủ)

Không phải báo cáo nào cũng có phần này, nhưng nó quan trọng ngang phần lỗi:

| Phép thử | Kết quả đo được |
|---|---|
| 20/20 deep link không qua màn trước | 20/20 `ready`, **0** `data-boot-errors`, **0** lỗi console, 0 ảnh hỏng, 0 tràn ngang. Node/màn: 40 (splash) → 365 (wordlist). Mọi màn đều có `notes` (4–5 mục) |
| Mở cùng một màn hai lần liên tiếp (rail bấm 2 lần + đặt hash trùng) | node **133/133/133**, `#screen` có đúng **1** con, **1** `.screen`, 0 lỗi → không chồng node |
| `history.back()`/`forward()` thật | `#/home → #/capture → #/regions` → back về `#/capture` → forward về `#/regions` → back×2 về `#/home`, app vẫn sống |
| Deep link thẳng vào màn có nút back rồi bấm back | `history.length = 1` → `router.back()` phát hiện và đưa về `#/home` (không văng khỏi demo). Bấm back ở màn đầu: vẫn ở trong app |
| Lọc từ khoá không ra kết quả ở `wordlist` | 23 hàng → **0 hàng**, `.empty` xuất hiện → trạng thái rỗng có thật |
| Giữ dữ liệu khi đổi màn | chọn "20 phút" ở home → `review.length` 10 → **20**, sang `progress` rồi về home vẫn **20**; bỏ 2 từ ở `regions` → sang `wordlist` → về vẫn `removed: ["ai-0","ai-1"]`, 2 dòng Hoàn tác |
| Phím Tab đi hết màn hình | 5 màn × 70 lần Tab: **0** điểm dừng bị kẹt, **0** điểm dừng vào phần tử vô hình/`sr-only`. `wordlist` 66/66 focusable đều thấy được |
| Chỉ dùng Tab + Enter | Tab 10 lần tới thẻ "Chụp ảnh" trên home → **Enter mở `#/capture`** |
| `prefers-reduced-motion: reduce` | `--dur`/`--dur-fast`/`--dur-slow` = **1ms**, số phần tử có `transition-duration > 1ms` = **0**, mọi `animation-duration` = **1ms**; `splash`/`capture`/`review-run` = 0 animation sau khi ổn định |
| Tràn ngang 375px và 1440px (20 màn × 2) | **0** tràn ngang thật. 8 màn có phần tử vượt mép nhưng tất cả nằm trong **scroller ngang cố ý** (đã kiểm bằng cách đi ngược cây tìm `overflow-x: auto/scroll`) — đúng như `audit.js` kết luận |
| Bề ngang 320 / 375 / 390 / 768 / 1024 / 1440 | **0** tràn ở cấp trang. Khung điện thoại co lại theo cửa sổ: `.device` = 272px @320 · 327 @375 · 342 @390 · 420 @768 · 390 @1024 · 390 @1440 |
| Cuộn xuống cuối 10 màn rồi `elementFromPoint` tại tâm từng nút | **0** nút bị tab bar/overlay che |
| Theme tối (reload thật) | **20/20** màn `data-theme=dark`, `--paper=#16120e`, 0 lỗi boot, 0 tràn ngang. Mẫu `.label`: `rgb(173,154,135)` trên `rgb(22,18,14)` = **6.88:1** |
| "0 API call khi ôn tập" | `#/review-hub` → chọn 20 phút → `#/review-run` → trả lời 3 câu: `apiCalls` **0 → 0 → 0 → 0** (vlm/llm/rule đều 0) |
| "VLM chỉ gọi 1 lần cho mỗi ảnh" | reset → vào `#/capture`+`#/regions` **4 vòng** → `totals.vlm = 1`, ledger có đúng `["vlm:morning-desk"]` |
| "1 LLM/truyện" idempotent | sau khi vào `#/reader`, `llm=1`; đi vòng `compose → reader → compose → reader` vẫn **1**, ledger `["llm:today"]` |
| Bấm lần hai mới tính thêm ở `speaking` | `src/screens/c-story/speaking.js:136-139` chỉ `cost.log` khi `retry`; nhãn đổi thành "Nhờ AI chỉnh lần nữa" — đúng thiết kế |
| "Mỗi vùng khoanh sinh đúng một từ" | trang sạch: **3 bbox ↔ 3 thẻ** `section.b-wordcard`, nhãn bbox `["mug","headphones","notebook"]` khớp **chính xác** `cardEn`; `dupWordIds: []`; CTA "Học với 3 từ này" |
| `bbox` có nằm đúng toạ độ `regionFor()`? | khớp `%` trong store **từng chiều**: `dLeft/dTop/dWidth/dHeight = 0.0` cho cả 3 vùng; khung ảnh render đúng **1:1** (416×416) |
| Bấm vùng khoanh có nhảy tới thẻ từ? | có: `.bbox.is-focused` = `ai-1`, thẻ nhảy từ `top 1515` → `223` (scroll 1158) |
| Tỉ lệ % tiếng Anh hiển thị có phải số thật? | `#/reader` hiện **17%**, script tính 17.0% (today) và 16.8% (ceramic-cup) → làm tròn nhất quán |
| Bất biến "sắc thái thấp chỉ nhận câu ghi nhận" (UX-FLOWS §5) | `low`/`down` = 6/6 câu `tone: 'acknowledge'`; `ok`/`up`/`great` = 9/9 câu `'encourage'`; **0 vi phạm** |
| Quyền riêng tư có thật không | `profile` có đúng câu "Không dùng ảnh và giọng nói của người học để huấn luyện mô hình"; toggle `aria-checked=false` + `disabled=true` + class `toggle--locked`; có cả nén phía client và "một lần/ảnh" |
| 4 trạng thái hệ thống | `system-states` có đủ nhãn "TRẠNG THÁI 1 · RỖNG / 2 · ĐANG TẢI / 3 · LỖI / 4 · OFFLINE" + BIẾN THỂ, 5 skeleton, 1 spinner, 1 empty, 3 callout |
| Số câu theo 2/10/20 phút | nhãn CTA: **"Bắt đầu ôn 4 từ" / "10 từ" / "18 từ"** — khớp UX-FLOWS §4 (4/10/18) |
| Ngõ cụt ở 3 màn không có tab bar | **không có ngõ cụt**: `splash` "Vào ngay" → `#/onboarding`; `onboarding` "Bỏ qua" → `#/home`; `capture` "Đóng" → `#/home`; nút chụp → `#/regions` |
| Bấm thử từng nút một lần (home/wordlist/review-hub/diary) | 4/36 nút "không phản hồi" — kiểm lại thì **cả 4** đều là nút đang ở trạng thái đã-chọn sẵn ("10 phút", "Tất cả · 23", "Xoá từ khoá" khi ô tìm kiếm rỗng) → **không có nút chết** |
| Chữ đè lên ảnh có bảo đảm tương phản? | `.bbox__tag` là chip mờ — **giới hạn xấu nhất tính được**: light **≥ 7.74:1**, dark **≥ 10.11:1** trên **mọi** nền ảnh (từ trắng tuyệt đối tới đen tuyệt đối). Xem §3.5 cho chỗ còn hở là `.cs-cover__kicker` |

---

## 4. Những gì tôi **KHÔNG** kiểm được

Đây là phần tôi muốn người đọc kỹ nhất, vì nó giới hạn giá trị của mọi kết luận ở trên.

### 4.1 Tôi không xem được ảnh — giới hạn lớn nhất
Model này **không có đầu vào hình ảnh**. Suốt quá trình kiểm tôi chưa từng "nhìn" một pixel nào theo nghĩa thị giác. Mọi nhận xét về hình thức đều là **số đo gián tiếp** (DOM, computed style, thống kê Pillow). Cụ thể **không** đánh giá được:
- **Nhịp thị giác và bố cục**: màn nào đẹp, chỗ nào nặng/nhẹ, tương phản kích thước chữ có tạo được thứ bậc không, khoảng trắng có thoáng không. `check_shots.py` chỉ nói được "ảnh có nội dung thật, đúng 390×844, có chữ" — nó **không** nói được là đẹp.
- **Ảnh có đúng là vật được mô tả không**: `morning-desk.jpg` có thật sự có ca gốm / tai nghe / sổ không. §3.6 chỉ so được mật độ cạnh, không nhận dạng được vật thể.
- **Chữ có bị vỡ, bị cắt, chồng chữ, hay rơi vào vùng xấu không**: tôi kiểm được tràn khung và che khuất bằng hình chữ nhật, nhưng không kiểm được chữ bị ellipsis xấu, dấu tiếng Việt bị cắt trên, hay chữ tràn khỏi nút.
- **Chất lượng ảnh AI tạo** (5 ảnh `assets/photos/`): độ nét, dị dạng chi tiết, có trông "giả" không.
- **Focus ring có thật sự nhìn thấy được không**: tôi đo được tiêu điểm di chuyển đúng và không vào phần tử vô hình; nhưng độ tương phản **của viền focus so với nền xung quanh** thì chỉ có token `--focus` (5.26:1 light / 8.51:1 dark trên `--paper`) — chưa đo được viền focus khi nó nằm trên **ảnh** hoặc trên thẻ màu.
- **Cảm giác chuyển động**: `--dur-slow 380ms`, spring `cubic-bezier(.34,1.4,.5,1)` — tôi biết giá trị và biết nó tắt dưới reduced-motion, nhưng không biết nó *cảm giác* thế nào.

### 4.2 Tương phản chữ đè lên ảnh chỉ là **giới hạn**, không phải "đo toàn bộ"
Với chip mờ thì tôi tính được giới hạn xấu nhất (chặt chẽ — bao trùm mọi ảnh có thể có, §3.11, dòng "Chữ đè lên ảnh"). Với chữ **không** có chip nền (`.cs-cover__kicker`, `.cs-cover__caption` trên scrim gradient) thì:
- Tôi đo được trên **2 ảnh bìa hiện có** (trung vị 8.8–12.2:1) — đây là số thật từ ảnh chụp.
- Tôi tính được **giới hạn xấu nhất lý thuyết** (kicker 4.17:1, caption 4.98:1).
- Nhưng tôi **không** liệt kê được "mọi ảnh người dùng có thể đưa vào", và phương pháp lấy nền từ hai dải trên/dưới hộp chữ chỉ là **ước lượng** cho nền *bên trong* hộp chữ. Có 2–8% pixel trong dải cho tương phản < 4.5:1 mà tôi **không xác định được** đó là pixel ảnh thật hay là rìa chữ (antialias) lọt vào dải.

### 4.3 Âm thanh / TTS: **chưa kiểm được gì**
`node tools/qa-audio.mjs` trong headless Chromium:
```
coSpeechSynthesis: true · soGiong: 0 · giong: []
```
Headless Chromium **có** API `speechSynthesis` nhưng **0 giọng đọc**. Nghĩa là:
- Toàn bộ nút "Nghe" / "Nghe câu" / "Phát audio" trong 20 màn **chưa từng được tôi xác minh là có phát ra tiếng** — không có gì để phát.
- `check_shots.py` và `audit.js` cũng không thể bắt được điều này (không có ảnh hưởng DOM).
- Trong trình duyệt thật, giọng đọc lấy từ **hệ điều hành**, nên máy nào không có voice `en-US` thì nút "Nghe" im lặng y như headless. Đây là rủi ro trình diễn thật (§6.2).
- Tôi cũng chưa kiểm: ghi âm thật qua `getUserMedia` (headless không có mic), phát lại bản ghi, và trạng thái "đang phát" của nút audio trong trình duyệt thật.

### 4.4 Những thứ khác chưa chạm tới
- **Nhấn giữ / bấm đúp** trên nút quan trọng: **chưa kiểm**. Tôi có bấm mỗi nút một lần (§3.11) nhưng không thử double-tap, long-press, hay bấm liên tiếp thật nhanh. Rủi ro thật: double-tap có thể điều hướng hai lần hoặc gọi AI hai lần.
- **Zoom 200% thật**: phép thử của tôi **không hợp lệ** và tôi đã bỏ. Lý do: demo là khung điện thoại **có kích thước cố định**, nên zoom trình duyệt sẽ phóng to cả khung chứ không làm app reflow; tôi ép viewport xuống 195px thì chỉ làm nội dung tràn khỏi khung bị cắt, không mô phỏng được zoom. Muốn kiểm thật phải mở trình duyệt thật và bấm Ctrl+= hai lần.
- **Trình duyệt khác Chromium 153**: Safari/Firefox chưa chạm. Rủi ro cụ thể: `color-mix(in srgb, ...)` (dùng ở `.bbox`, xem `components.css:587`) và `backdrop-filter` (`.bbox__tag`) là hai thứ dễ khác nhau giữa các engine.
- **`prefers-color-scheme` của hệ điều hành**: app mặc định **light** và ghi nhớ lựa chọn, nên tôi không kiểm được nhánh "theo hệ điều hành" (không tồn tại theo thiết kế — `store.js:100-105` giải thích có chủ đích).
- **Đo tính năng "đang tải / lỗi / offline" trong tình huống thật**: tôi chỉ thấy chúng được **trưng bày** ở `system-states`. Tôi **không** kiểm được việc rút mạng thật, mất ảnh thật, hay lỗi VLM thật có dẫn tới đúng 3 trạng thái đó không — vì demo không có backend.
- **Offline thật**: tôi chỉ chặn `fonts.googleapis.com`/`fonts.gstatic.com` (§6.1). Chặn toàn bộ mạng sẽ làm hỏng cả server tĩnh `127.0.0.1:8137` nên không phản ánh tình huống "mất internet, server vẫn chạy".
- **Hiệu năng / thời gian tải**: chưa đo. Chưa biết bundle JS nặng bao nhiêu, màn nào lâu nhất, có jank khi cuộn `wordlist` (365 node) không.
- **Quan hệ cha–con ARIA, thứ tự đọc của trình đọc màn hình, `role` có đúng không**: chưa kiểm. Tôi chỉ kiểm được "focusable nào nhận được Tab" và "nút chỉ có icon có `aria-label` không" — kết quả: **269 nút trên 20 màn, 0 nút thiếu tên truy cập** (không có chữ, không `aria-label`, không `title`) — `node tools/qa-buttons.mjs`.
- **Bấm rail khi sheet mở**: chưa kết luận được (§3.9).
- **Xoay vòng 5 dạng bài ở `review-run`**: **chưa xác minh**. Màn hình luôn in một bảng liệt kê cả 5 dạng, nên phép thử khớp văn bản của tôi luôn trả về dạng đầu tiên ("Đọc tương tác") và **không thể** phân biệt dạng đang được hỏi. Tôi **không** kết luận là không xoay vòng — chỉ nói là tôi không kiểm được bằng cách này.

### 4.5 Một điều tôi không thể làm thay người khác
Tôi kiểm được tính đúng đắn kỹ thuật của bản demo, nhưng **không** kiểm được **độ thuyết phục trước ban giám khảo**: câu chuyện có mạch không, con số có đáng tin không, người nói có bị vấp ở màn nào không. Một app 0 lỗi vẫn có thể thuyết trình dở, và ngược lại.

---

## 5. Đối chiếu 11 mục của deck với màn hình

Deck có **12 trang**: 1 trang bìa + **11 mục được đánh số** (`01 · VẤN ĐỀ` … `11 · LỘ TRÌNH & KẾT`). Cách kiểm: trích text thật từ PDF (`python -c "import pypdf..."` → `tools/_deck.txt`, 9.284 byte), rồi tìm **từng cụm từ khoá của deck** trong `innerText` thật của 20 màn + 5 deep link có tham số, **tách riêng** phần `#screen` và phần bảng inspector (vì cột inspector chứa chữ giải thích nên rất dễ gây dương tính giả — lần chạy đầu của tôi đã bị đúng lỗi này và tôi làm lại).

### 5.1 Bảng đối chiếu

| Deck | Màn hình thể hiện | Bằng chứng đo được | Đánh giá |
|---|---|---|---|
| **Bìa** — SnapLife AI, tagline, 4 thành viên, `mug`/`headphones`/`notebook`, câu đan xen, Audio | `splash` (thương hiệu + tagline + khối đội), `home` (câu mỗi ngày + audio), `regions` (đúng 3 từ `mug`/`headphones`/`notebook` trên ảnh `morning-desk`), `worddetail` (IPA · nghĩa · audio) | `regions`: 3 bbox ↔ 3 thẻ, nhãn `["mug","headphones","notebook"]`; tagline có trên `splash` | **Có**, trừ câu đan xen mẫu của bìa |
| **01 · VẤN ĐỀ** — tốn kém / tốn thời gian / khó nhớ | `onboarding` (slide 1) | `#screen` có "Tốn thời gian" + "bỏ cuộc" ở **onboarding**; riêng "Tốn kém chi phí" và "Khó nhớ" **không xuất hiện nguyên văn ở màn nào** (có thể diễn đạt khác) | **Một phần** |
| **02 · GIẢI PHÁP** — 3 bước khép kín | `onboarding` (slide 2); con số `15–20%` trên `splash` và `reader` | 3 nhãn bước ("Gợi ý từ" / "Đọc truyện đan xen" / "Ôn tập đa dạng") **không** xuất hiện nguyên văn; `15–20%` xuất hiện trên `splash` + inspector của `reader` | **Một phần** |
| **03 · ĐIỂM NHẤN 1** — mỗi vùng khoanh sinh một từ, thẻ từ đầy đủ | `regions` (**nhấn 1**) + `worddetail` | 3 vùng ↔ 3 thẻ, hình học bbox khớp `%` tuyệt đối (delta 0.0 × 4 chiều); `CEFR` trên `regions`/`wordlist`/`reader`/`progress`/`profile` | **Có** |
| **04 · ĐIỂM NHẤN 2** — hai cách đưa ngữ cảnh vào + đoạn đan xen | `compose` + `reader` (**nhấn 2**) | `compose` có "Kể lại một ngày"; "Gõ từ hoặc chủ đề" **không** nguyên văn; `reader` hiện **17% tiếng Anh** (đo thật 17.0% / 16.8%) | **Có** |
| **05 · ĐIỂM NHẤN 3** — mic → AI chỉnh lại (diff) | `speaking` (**nhấn 3**), chỉ khi ở `?state=corrected` | `very like` · `really like` · `make` · `makes` · `Nhờ AI chỉnh` xuất hiện **chỉ** ở `#/speaking?state=corrected` — màn mặc định `#/speaking` **không** có diff | **Có** (nhưng phải bấm đúng trạng thái — xem §5.3) |
| **06 · ĐIỂM NHẤN 4** — câu mỗi ngày theo sắc thái | `diary` (**nhấn 4**) + `home` | "You made it through today." có trên `diary`; bất biến `acknowledge`/`encourage` đúng 15/15 câu | **Có** |
| **07 · ÔN TẬP** — 5 dạng + chọn 2/10/20 | `review-hub` + `review-run` + `review-summary` | 5 tên dạng đủ trên `review-hub` (Cloze · Ghép cặp · Flashcard · Chạm ảnh · Đọc tương tác); CTA 2/10/20 phút → **4 / 10 / 18 từ** | **Có** |
| **08 · CÔNG NGHỆ** — 5 bước kiến trúc + 0 API call | `capture` (nén client) · `regions` (VLM 1 lần + Bbox) · `worddetail` (lưu audio + SRS) · `review-*` (rule-based) · `system-states` | "nén" trên `capture`/`compose`/`profile`/`system-states`; "VLM" trên `home`/`capture`/`regions`/`review-summary`/`profile`/`system-states`; "quy tắc" trên 9 màn. **"Bbox" chỉ có ở cột inspector** (không có trong `#screen` của `capture`/`regions`) | **Một phần** — xem §5.2 |
| **09 · TIẾT KIỆM** — 4 trục + "gọi AI đúng một lần" | `review-summary` (khối "0 API call") + Cost Meter ở khung demo | "0 API call" trong `#screen` của **10 màn** (`home`, `wordlist`, `stories`, `review-hub`, `review-run`, `review-summary`, `diary`, `progress`, `system-states`, `speaking?corrected`); `vlm` idempotent = 1 sau 4 vòng; ôn tập 0 API (đo 4 mốc đều 0) | **Có** |
| **10 · SO SÁNH** — bảng với Duolingo / Memrise / Anki | **KHÔNG có màn hình nào** | Trong `#screen` của cả 20 màn + 5 deep link: `Memrise` **0 lần**, `Anki` **0 lần**, `Duolingo` **0 lần**. `Duolingo` chỉ xuất hiện 1 lần trong **note thiết kế** của `topics` (`topics.js:17`, hiện ở cột inspector). `so sánh` không có trong `#screen` nào | **THIẾU HOÀN TOÀN** |
| **11 · LỘ TRÌNH & KẾT** — MVP + roadmap + quyền riêng tư | `placement` · `topics` · `progress` · `profile` · `onboarding` slide 3 | Cam kết "Không dùng ảnh và giọng nói của người học để huấn luyện mô hình" **có thật** trên `profile` + toggle khoá; MVP 6 mục đều có màn. **Roadmap thiếu**: `Story Chain` 0 lần, `lớp học` 0 lần, `Roadmap` 0 lần, `dán bài báo` 0 lần (chuỗi "Nhật" khớp là do "**Nhật** ký sắc thái", không phải tiếng Nhật) | **Một phần** |

### 5.2 Slide **CHƯA** được thể hiện

1. **`10 · SO SÁNH` — thiếu hoàn toàn.** Bảng so sánh 4 tiêu chí với Duolingo/Memrise/Anki là mục duy nhất không có bất kỳ màn hình nào. Đây cũng là mục chứa câu định vị mạnh nhất của deck (*"Khác biệt không nằm ở kho từ, mà ở ngữ cảnh của chính bạn"*). Nếu ban giám khảo đối chiếu deck với demo, đây là lỗ hổng dễ thấy nhất.
   **Đề xuất:** hoặc thêm một khối so sánh 4 dòng vào `progress` (chỗ đã có sẵn `ui.barList`/`ui.keyval`), hoặc thêm 1 slide trong bộ slide thuyết trình nói rõ "phần so sánh chúng tôi trình bày bằng lời, không dựng màn hình". Đừng để nó im lặng.
2. **Roadmap của `11 · LỘ TRÌNH & KẾT`:** 5 mục roadmap (dán bài báo làm nguồn từ · chấm câu viết theo tiêu chí · hội thoại nhập vai/Story Chain · thêm tiếng Nhật/Hàn/Trung · chế độ lớp học cho giáo viên) không xuất hiện ở màn nào.
3. **`08 · CÔNG NGHỆ` mục 5 "Mô hình phân tầng"** (mô hình nhỏ cho việc đơn giản, mô hình mạnh chỉ để viết truyện): chuỗi "phân tầng" **0 lần** trong toàn bộ 20 màn.
4. Hai chi tiết nhỏ của **bìa**: câu đan xen mẫu nguyên văn (*"Sáng nay mình uống cà phê trong chiếc mug mới…"*) không có trong app (app dùng đoạn `downpour` khác); chữ "Audio" của bìa không tương ứng một thành phần đặc biệt.

### 5.3 Ba việc cần nhớ khi dùng deck làm kịch bản demo

- **`05 · ĐIỂM NHẤN 3` (diff `very like → really like`) chỉ hiện ở `#/speaking?state=corrected`.** Mở `#/speaking` mặc định chỉ thấy nút mic. Khi trình diễn phải dán đúng deep link này (README có ghi), hoặc bấm: mic → chờ 6 giây → "Nhờ AI chỉnh lại" → chờ ~1.1 giây.
- **`15–20%` trên `splash` là nhãn tĩnh, còn con số **17%** trên `reader` mới là số tính từ chữ.** Đừng để bị hỏi "sao chỗ này 15–20% chỗ kia 17%".
- **`0 API call` xuất hiện ở 10 màn**, trong đó có những màn không liên quan tới ôn tập (`home`, `diary`, `progress`). Khi trình diễn, nên chỉ vào `review-summary` để câu chuyện rõ ràng.

---

## 6. Kết luận: có sẵn sàng demo trước ban giám khảo?

**CÓ — sẵn sàng.** Cụ thể:

- 5/5 cổng của Lead đạt, số liệu tôi tự chạy lại **trùng khớp** (98/98 · 16.8%/17.0% · 20/20 · 20/20 · 20/20+20/20).
- 20/20 màn mở được bằng deep link, **0** lỗi runtime, **0** lỗi console, mỗi màn đều có `notes` giải thích thiết kế (4–5 mục) — đây là tài sản lớn khi bị hỏi "vì sao thiết kế vậy".
- Các bất biến kiến trúc mà deck dùng để bán (1 VLM/ảnh idempotent, 1 LLM/truyện idempotent, 0 API khi ôn tập, mỗi vùng một từ, bbox khớp toạ độ) tôi **đo lại độc lập** và **đều đúng**.
- Hai lỗi nặng nhất tôi tìm được (rò rỉ sheet, thiếu tab bar) **đã được sửa và tôi đã đo lại xác nhận bằng phép thử độc lập**, không chỉ tin lời.

**Còn tồn (không cản trở demo):** 1 lỗi a11y nhỏ (dialog không khoá tiêu điểm, §3.4), 1 rủi ro tương phản tiềm ẩn trên ảnh bìa (§3.5), 1 vùng bbox cần mắt người xác nhận (§3.6), 1 trạng thái tài liệu hứa nhưng không tới được (§3.7), 3 chỗ deep link im lặng (§3.8).

### 3 rủi ro LỚN NHẤT khi trình diễn trực tiếp

**1. Web font nạp từ Google CDN — mất internet thì giao diện đổi nhưng app không sập.**
`index.html:10-15` nạp cả 4 font (Calistoga · Inter · Newsreader · JetBrains Mono) từ `fonts.googleapis.com`, và **trong repo không có bản font nào** (`assets/` chỉ có 5 ảnh .jpg, `tokens.css` không có `@font-face`). Đo thật (chặn 2 domain + tắt cache + profile sạch, `node tools/qa-cdp4.mjs N4`):
```
coMang:   fontsSize=28, titleIntrinsicW=174.1, boot=null
chanCdn:  fontsSize=0,  titleIntrinsicW=183.8, boot=null, docH chênh -1px
requests bị chặn: fonts.googleapis.com/css2... transferSize=0 (failed)
```
Đọc số này ra: app **vẫn chạy** (0 lỗi boot), nhưng **0 web font** tải được, chữ tiêu đề rộng ra **+9.7px (+5.6%)** vì rơi về Georgia. Trang chủ chỉ lệch 1px chiều cao, nên **hầu như không vỡ layout** — nhưng toàn bộ bản sắc thị giác "Warm Editorial" (Calistoga cho tiêu đề, JetBrains Mono cho IPA/CEFR) biến mất, và IPA (`/ˈhed.fəʊnz/`) là chỗ dễ xấu nhất vì rơi về font hệ thống.
**Giảm thiểu (rẻ, ~15 phút):** tải 4 file `.woff2` vào `assets/fonts/`, viết `@font-face` + `font-display: swap` trong `tokens.css`, bỏ 3 thẻ `<link>` Google. Khi đó demo chạy được cả khi hội trường mất wifi. Nếu không kịp: **sửa câu "không phụ thuộc CDN" trong README** (đang không đúng) và chuẩn bị trước một hotspot điện thoại.

**2. TTS trong trình duyệt thật phụ thuộc gói giọng của hệ điều hành — không ai kiểm được nó ở đây.**
Đo được: headless Chromium có `speechSynthesis` nhưng **`getVoices().length = 0`** (`node tools/qa-audio.mjs`). Nên mọi nút "Nghe"/"Nghe câu"/"Phát audio" trong 20 màn **chưa từng được xác minh là có tiếng**, và **cả 5 cổng đều không thể phát hiện** điều này (không có dấu vết nào trong DOM). Trong trình duyệt thật, Chrome lấy giọng từ Windows; máy thiếu voice `en-US` thì nút bấm **không báo lỗi, chỉ im lặng** — và màn `speaking` mất luôn phần "nghe lại" là một nửa vòng lặp luyện nói.
**Giảm thiểu:** trước khi lên sân khấu, mở `#/reader` và bấm một nút "Nghe" trên **đúng máy sẽ trình diễn**; kiểm tra `chrome://settings` → Languages → Speech nếu không có tiếng. Đừng để nút "Nghe" là điểm chính của phần thuyết trình luồng 3; nếu buộc phải dùng, có sẵn câu chữ để nói tiếp nếu máy im.

**3. Dán deep link: 3/5 link của README vẫn đúng, nhưng bất kỳ tham số gõ sai nào cũng **im lặng**, và deep link còn làm Cost Meter nhảy trước khi thao tác.**
Đo được (§3.8): `#/reader?story=khong-co` → fallback **có** báo ("Không thấy truyện … đang mở truyện gần nhất") — tốt; nhưng `#/speaking?state=bay-ba` rơi về idle **im lặng**, `#/wordlist?filter=zzz` bỏ qua tham số **im lặng**. Thêm nữa (§3.3): dán `#/capture` hay `#/speaking?state=corrected` là Cost Meter đã là **1 API call** dù chưa ai làm gì — trong khi câu chuyện của slide 09–10 là "tiền chỉ tốn khi bạn yêu cầu".
**Giảm thiểu:** khi demo, **chỉ dán đúng 5 link trong README** (cả 5 đã kiểm, đều hoạt động); và nói trước một câu về Cost Meter theo ảnh/truyện (nhãn mới của Lead đã ghi ở cột inspector, nhưng phải nói ra). Nếu có 5 phút rảnh: thêm một `ui.callout` khi tham số không nhận diện được, và đổi nhãn HUD thành "VLM **1×/ảnh**" để con số tự giải thích.

---

## 7. Phụ lục — cách chạy lại toàn bộ

```powershell
cd D:\Demo
# 0) server phải đang chạy (đừng mở thêm nếu cổng 8137 đã bận)
node tools/serve.mjs 8137

# 1) 5 cổng của Lead, bắt stdout đáng tin bằng Start-Process
& .\tools\qa-gates.ps1
& .\tools\shoot.ps1

# 2) harness độc lập của tôi (Node 22, không cần npm install)
node tools/qa-cdp.mjs            # 18 nhóm A–Q, S   -> tools/qa-cdp-report.json
node tools/qa-cdp2.mjs           # 10 nhóm H2..R2   -> tools/qa-cdp2-report.json
node tools/qa-cdp2.mjs H2 A2 I2  # chỉ chạy vài nhóm (dùng để kiểm lại bản vá)
node tools/qa-cdp3.mjs           # 8 nhóm C3..W3    -> tools/qa-cdp3-report.json
node tools/qa-cdp4.mjs           # 8 nhóm H4..R4    -> tools/qa-cdp4-report.json
node tools/qa-cdp5.mjs           # 5 nhóm U5..X5    -> tools/qa-cdp5-report.json
node tools/qa-cdp6.mjs ; node tools/qa-cdp7.mjs ; node tools/qa-cdp8.mjs
node tools/qa-audio.mjs          # TTS: headless có 0 giọng đọc
node tools/qa-buttons.mjs        # 269 nút / 20 màn: 0 nút thiếu tên truy cập

# 3) đo điểm ảnh / tương phản trên ảnh (Pillow)
python tools/qa-bbox-pixels.py
python tools/qa-overlay-contrast.py
python tools/qa-cover-text-contrast.py   # cần chạy qa-cdp5.mjs trước (nó chụp ảnh bìa)
```

Tất cả kết quả thô đã lưu cạnh script: `tools/qa-cdp*-report.json`, `tools/qa-cdp*-out*.txt`,
`tools/qa-gates-final.txt`, `tools/qa-verify-fixes.txt`, `tools/qa-cover-contrast-out.txt`,
`tools/qa-reader-cover-{today,ceramic-cup}.png`.

---

*Báo cáo này do `qa-verify` viết. Mọi khẳng định đều kèm lệnh và output thật; hai phép thử của tôi bị sai đã được tự bác bỏ và ghi rõ ở §2.6; những gì tôi không kiểm được ghi ở §4 — trong đó giới hạn lớn nhất là tôi **không có đầu vào hình ảnh**, nên các nhận xét về thẩm mỹ và về việc vùng khoanh có nằm đúng trên đồ vật hay không đều là số đo gián tiếp, không phải quan sát.*

---

# PHỤ LỤC CỦA LEAD — cập nhật sau khi báo cáo QA được chốt

> Phần này do Lead thêm vào, **không sửa** nội dung báo cáo gốc ở trên. Báo cáo gốc
> phản ánh đúng trạng thái tại thời điểm QA chạy (20 màn hình). Sau đó Lead bổ sung
> một màn hình và sửa vài chỗ mà chính báo cáo này chỉ ra.

## 1 · Đã xử lý các phát hiện của QA

| Phát hiện | Mức độ QA xếp | Xử lý |
|---|---|---|
| Sheet/modal rò rỉ sang màn khác | nên sửa | `ui.clearOverlays()` + gọi trong `router.render()`; test hồi quy **15** |
| `wordlist` / `stories` thiếu tab bar | nên sửa | đổi sang `chrome: 'tabbar'` + `tab`; test hồi quy **09b** phủ 9 màn. **Lỗi ở tầng chỉ đạo của Lead**, không phải của nhóm B/C |
| Cost Meter tính tiền lúc vào màn | nên sửa | giữ hành vi (cần cho demo), sửa nhãn ở inspector cho trung thực; ghi thành quy ước ở BUILD-SPEC §8 |
| Dialog `aria-modal="true"` không khoá tiêu điểm | nhỏ | **đã sửa**: bẫy Tab/Shift+Tab trong `ui.sheet()` và `ui.modal()`, trả tiêu điểm về chỗ cũ khi đóng; test hồi quy **16 / 16b** |
| README ghi "không phụ thuộc CDN" là sai | rủi ro trình diễn #1 | **đã sửa tận gốc**: tự chứa font (`assets/fonts/`, 28 woff2, 934 KB, có subset `vietnamese`) qua `tools/fetch_fonts.py`; 0 tham chiếu CDN |
| Tài liệu lệch số (88/88, 15/15) | nhỏ | đã sửa trong README và MASTER |
| `08 · CÔNG NGHỆ` mục "mô hình phân tầng" chưa có | thiếu | **không sửa** — chấp nhận thiếu. Màn `capture` đã thể hiện 4/5 bước của slide 08 (nén tại client · VLM 1 lần · lưu DB · rule engine) nhưng bước "mô hình nhỏ cho việc đơn giản, mô hình mạnh chỉ để viết truyện" không có màn hình nào. Nên **nói ra bằng lời** khi trình bày, đừng để giám khảo tự phát hiện |
| `10 · SO SÁNH` thiếu hoàn toàn | thiếu | **đã bổ sung màn `compare`** — xem mục 2 |

## 2 · Màn hình mới: `compare` (slide 10 · SO SÁNH)

`src/screens/e-progress/compare.js` · 21 màn hình thay vì 20.

Bảng 5 cột của deck không đọc được trên khung 390px (mỗi cột ~70px), nên mỗi tiêu chí
thành một thẻ dọc: ba đối thủ xếp trên bằng chữ mờ để đối chiếu, SnapLife ở dưới bằng
chữ đậm + màu nhấn. Giữ đủ 5 tiêu chí và 4 lợi ích của slide 10.

Hai quyết định đáng nói:
- Ô "chi phí gọi AI" của Duolingo/Memrise để dấu **"—"** thay vì điền số: họ không công bố,
  nên điền số sẽ là nói sai về đối thủ.
- Cột của mình luôn có **nhãn chữ "SnapLife AI"** kèm icon, không chỉ dựa vào màu.

## 3 · Trạng thái các cổng SAU khi sửa (Lead tự chạy lại)

| Cổng | QA đo (20 màn) | Sau khi sửa (21 màn) |
|---|---|---|
| Tương phản token | 98/98 | **98/98** |
| Tỉ lệ tiếng Anh | 16.8% · 17.0% | **16.8% · 17.0%** |
| Audit giao diện | 20/20 · 0/0 | **21/21 · 0 lỗi · 0 cảnh báo** (light + dark) |
| Kiểm thử luồng end-to-end | 20/20 | **22/22** (thêm test 15 rò rỉ sheet, 16 bẫy tiêu điểm) |
| Chụp ảnh + nội dung ảnh | 20/20 · 20/20 | **21/21 · 21/21** |

## 4 · Một hồi quy do chính bản vá font gây ra, đã sửa

Tự chứa font khiến font **thật** được áp dụng ở thời điểm đo, và lộ ra lỗi bố cục mà
trước đó bị che: **4 màn tràn ngang 2–15px** (`regions`, `worddetail`, `reader`, `profile`).

Nguyên nhân nằm ở thư viện component của Lead, không phải ở các nhóm: `.btn` có
`white-space: nowrap` + `min-width: auto` nên trong hàng flex nút **không co được dưới bề
rộng nhãn**, đẩy cả hàng ra ngoài khung. Đã sửa tại gốc: nhãn nút được xuống dòng
(`white-space: normal` + `overflow-wrap: break-word` + `min-width: 0`), `.btn-row` và
`.screen__cta` cho phép `flex-wrap`, `.chip-scroller` có `min-width: 0`.

Đo lại ở **cả hai cấu hình** (có và không có thanh cuộn chiếm chỗ): **0 lỗi, 0 cảnh báo**.

## 5 · Những điểm QA nêu mà Lead GIỮ NGUYÊN (có lý do)

- **`.cs-cover__kicker` 10px chữ trắng trên ảnh bìa**: giới hạn xấu nhất 4.17:1 (< 4.5).
  Với 2 ảnh bìa hiện có thì đo thật 8.8–9.6:1 nên **đang đạt**. Đây là rủi ro nếu sau này
  thay ảnh bìa sáng — cần siết lớp phủ `.cs-cover__scrim` khi đổi ảnh.
- **Vùng `headphones`**: QA đo mật độ cạnh trong vùng ở phân vị 19.5 và nghi vùng đặt sai.
  Không ai trong nhóm xem được ảnh, nên **cần một người nhìn** `assets/photos/morning-desk.jpg`
  và vùng thứ 2 trong `tools/shots/regions.png` để phân xử. Nghi vấn của QA: thử `x=40, y=47`.
- **`daily.history` không có ngày**: chấp nhận cho demo; bản thật cần dạng `{date, mood}`.
- **Tham số deep link sai xử lý không nhất quán** (`#/reader?story=khong-co` báo rõ,
  `#/speaking?state=bay-ba` im lặng): giữ nguyên vì demo chỉ dùng 5 deep link đã kiểm.
- **Nhấn giữ / bấm đúp, zoom 200% thật, Firefox/Safari, hiệu năng**: chưa kiểm — nằm ngoài
  phạm vi demo hackathon.
