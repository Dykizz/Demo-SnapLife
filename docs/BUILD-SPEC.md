# SnapLife AI — Hợp đồng kỹ thuật cho người dựng màn hình

> Đọc `docs/PLAN.md` trước để nắm định vị sản phẩm và hướng thẩm mỹ.
> Tài liệu này là **hợp đồng**: tuân đúng thì 5 nhóm ghép lại thành một sản phẩm,
> làm khác đi thì demo sẽ vỡ ở phần ghép nối.

---

## 1. Chạy demo

Không cần build, không `npm install`.

> ⚠️ **Đừng mở bằng `file://`.** Trình duyệt chặn ES module trên `file://` (CORS, origin `null`).
> Phải chạy qua server tĩnh — đã có sẵn, không phụ thuộc gói ngoài.

```powershell
cd D:\Demo
node tools/serve.mjs 8137          # server tĩnh, chỉ dùng thư viện chuẩn của Node
# rồi mở:
#   http://127.0.0.1:8137/index.html     ← demo tương tác
#   http://127.0.0.1:8137/gallery.html   ← toàn bộ màn hình cạnh nhau
```

Server này **đã được Lead chạy sẵn ở cổng 8137** trong phiên làm việc. Nếu gặp
`EADDRINUSE` thì server đang chạy rồi — cứ dùng luôn. Nếu cổng chết, chạy lại lệnh trên.
Người dùng cuối chỉ cần bấm `open-demo.cmd`.

**Trạng thái khởi động** (dùng để tự kiểm tra rất nhanh):

```js
window.__SNAPLIFE__.ready        // true khi đã nạp xong
window.__SNAPLIFE__.screens      // mảng màn hình đã nạp
window.__SNAPLIFE__.missing      // id màn hình còn thiếu
window.__SNAPLIFE__.errors       // nhóm nạp lỗi
window.__BOOT_ERRORS__           // lỗi runtime đã bắt
document.documentElement.dataset.bootErrors   // chuỗi lỗi, đọc được từ --dump-dom
```

---

## 2. Cấu trúc file & phạm vi ghi

```
src/core/        router, store, dom, icons, ui, audio, cost, registry   ← LEAD, không sửa
src/data/        fixtures, words, photos, story, logic                  ← LEAD, không sửa
styles/          tokens, base, components, shell                        ← LEAD, không sửa
src/screens/X/   ← BẠN (thay X bằng nhóm của bạn)
styles/screens-X.css                                                    ← BẠN
```

> **Tuyệt đối không sửa** file ngoài phạm vi nhóm mình. Cần thêm gì ở tầng dùng chung,
> nhắn Lead qua `send_message` — đừng tự sửa.

Mỗi nhóm có một `manifest.js` đang là `export default []`. Hãy thay bằng danh sách màn hình:

```js
// src/screens/b-capture/manifest.js
import capture from './capture.js';
import regions from './regions.js';
import wordlist from './wordlist.js';
import worddetail from './worddetail.js';
export default [capture, regions, wordlist, worddetail];
```

---

## 3. Hợp đồng màn hình

```js
import { h } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';

export default {
  id: 'home',                       // phải khớp id trong registry (xem §5)
  title: 'Hôm nay',                 // hiện ở rail + thanh tiêu đề
  group: 'a-onboarding',            // thư mục nhóm
  chrome: 'tabbar',                 // 'tabbar' | 'appbar' | 'none'
  tab: 'home',                      // tab sáng trên bottom nav (tuỳ chọn)
  immersive: false,                 // true = ẩn status bar, nội dung tràn viền (màn camera)
  api: [{ key: 'vlm:morning-desk', kind: 'vlm', label: 'Nhận diện ảnh', n: 1 }],
  notes: ['Vì sao thiết kế như vậy — hiện ở cột phải của demo.'],  // tuỳ chọn nhưng nên có
  render(ctx) {
    return h('div.screen', {},
      ui.appBar({ title: 'Hôm nay', back: false }),
      h('div.screen__body', {}, /* ... */));
  },
};
```

### `ctx` có gì

| Khoá | Nội dung |
|---|---|
| `ctx.ui` | Thư viện component — **dùng cái này**, đừng tự vẽ lại nút/thẻ (§4) |
| `ctx.icon(name, size)` | Icon SVG (§6). Bí danh `ctx.icons.icon` cũng có, nhưng dùng `ctx.icon` cho gọn |
| `ctx.audio` | `speak(text, {lang,rate,onStart,onEnd})` · `stopSpeaking()` · `correct()` · `wrong()` · `tap()` · `chime()` |
| `ctx.nav.go(id, params?, {replace}?)` | Chuyển màn hình. `params` thành query, đọc lại bằng `ctx.params` |
| `ctx.nav.back()` | Quay lại |
| `ctx.store` | `get(path, fallback)` · `set(path, value)` · `set({...})` · `update(fn)` · `push(path, item)` · `state` |
| `ctx.params` | Object tham số từ URL, ví dụ `{ word: 'mug' }` |
| `ctx.cost` | `ctx.cost.log({kind,label,n})` khi người dùng chủ động gọi lại AI |
| `ctx.data` | Toàn bộ dữ liệu demo (§7) |
| `ctx.onCleanup(fn)` | Đăng ký hàm dọn dẹp (clearInterval, removeEventListener…) |
| `ctx.gallery` | `true` khi render trong `gallery.html` — khi đó đừng chạy interval/autoplay |

### Quy ước bắt buộc

1. **Bọc ngoài cùng**: `h('div.screen', {}, ui.appBar(...), h('div.screen__body', {}, ...))`.
   `screen__body` đã có padding ngang và khoảng cách dọc chuẩn — đừng tự thêm padding ngang.
2. **App bar dùng `ui.appBar`**, không tự viết header. `back: true` sẽ gọi `nav.back()`.
3. **Nút, thẻ, chip, badge, tiến độ dùng `ui.*`**. Chỉ viết CSS mới khi thật sự cần một thành phần chưa có.
4. **Màu chỉ qua token** (`var(--primary)`, `var(--ink-2)`…), **không hardcode hex** trong màn hình.
   Cần màu mới → viết vào `styles/screens-<nhóm>.css` bằng `var()` có sẵn.
5. **Không emoji làm icon.** Dùng `ctx.icon('camera')`. Streak dùng icon `flame`, không dùng 🔥.
6. **Touch target ≥ 44×44px**; nút chỉ có icon phải có `aria-label`.
7. **Chữ trên nền phải đạt tương phản ≥ 4.5:1.** Dùng `--ink` cho chữ chính, `--ink-2` cho chữ phụ.
8. **Chuyển động** dùng token `var(--dur)` / `var(--ease)`; mọi thứ phải tắt được dưới
   `prefers-reduced-motion` (tokens.css đã lo, chỉ cần đừng viết `animation` cứng trong JS).
9. **Trạng thái rỗng / loading / lỗi** phải có thật, không chỉ đường hạnh phúc.
   Dùng `ui.empty`, `ui.skeleton`, `ui.callout`.
10. **Không thêm thư viện ngoài.** Không React, không Tailwind CDN.

---

## 4. Thư viện component (`ctx.ui`)

```js
ui.appBar({ title, sub, back, close, onBack, actions: [node], overlay, bordered })
ui.iconBtn(name, { label, onClick, variant: 'solid'|'quiet', size, disabled })
ui.button({ label, icon, iconRight, variant: 'primary'|'secondary'|'ghost'|'soft'|'danger',
            size: 'sm'|'lg', block, onClick, disabled, ariaLabel })
ui.btnRow(...nodes)                       // các nút chia đều bề ngang
ui.card({ className, pad: 'lg', children: [...], onClick, ariaLabel })
ui.sectionTitle(label, actionNode)
ui.chip({ label, selected, onClick, icon, size: 'sm', dot })
ui.chipRow([nodes], { scroller: true })   // scroller = cuộn ngang, không xuống dòng
ui.segmented({ options: [{value,label,hint}], value, onChange, stack, ariaLabel })
ui.progress({ value, max, variant: 'success', thin, label })
ui.progressSeg({ total, done, now: -1, label })
ui.ring({ value, max, size, thickness, center: node, variant, label })
ui.stat({ label, value, delta, down, sub })      ui.statGrid([...])
ui.badge(label, 'primary'|'success'|'warning'|'danger'|'info'|'outline', iconName)
ui.list([nodes])                                  ui.listItem({ title, sub, icon, trail, meta, badge, onClick })
ui.wordRow({ word, onClick, trail, cefr })        // hàng từ vựng: en + IPA + nghĩa + CEFR + nút nghe
ui.audioButton({ text, lang, label, wide })       // tự phát TTS, tự đổi trạng thái đang phát
ui.photoFrame({ src, alt, ratio: 'square'|'wide'|'tall', dim, children: [nodes], className })
ui.bbox(region, { label, state: 'on'|'off'|'user', grip, onTap, onChange, ariaLabel })
ui.viewfinder({ src, alt, guide, grid, children })
ui.sheet({ title, sub, body: [nodes], actions, onClose })   // bottom sheet, có scrim + Esc
ui.modal({ title, body, actions, onClose })
ui.toast(message, { tone: 'success'|'danger', iconName, ms })
ui.empty({ iconName, title, body, action })
ui.skeleton('line'|'title'|'short'|'photo')        ui.spinner()
ui.callout({ tone, iconName, title, body })        ui.toggle({ checked, onChange, label })
ui.avatar(name, { large })                         ui.keyval(k, v)
ui.divider(label)                                  ui.fab(iconName, { label, onClick })
ui.barList([{ label, value, color }])              ui.costMeter({ compact })
ui.interleave(paragraphs, { onWordTap(tok, node) })   // đoạn đan xen Việt–Anh, từ tiếng Anh bấm được
```

Component chung đã xử lý sẵn: trạng thái nhấn, focus ring, `aria-label`, bo góc, bóng, dark mode.

---

## 5. Danh sách màn hình & phân công

| id | Nhóm | Chrome | Việc chính |
|---|---|---|---|
| `splash` | a | none | Thương hiệu, 2 giây, rồi sang onboarding |
| `onboarding` | a | none | 3 slide: vấn đề → giải pháp 3 bước → quyền riêng tư & xin quyền |
| `placement` | a | appbar | Test 8 câu, thanh tiến độ, kết quả CEFR |
| `topics` | a | appbar | Chọn chủ đề quan tâm (nhiều lựa chọn) |
| `home` | a | **tabbar** | Trang chủ: streak, câu hôm nay, 3 hành động, chọn phiên 2/10/20 |
| `capture` | b | none, immersive | Khung ngắm camera + hướng dẫn chụp |
| `regions` | b | appbar | Ảnh + các vùng Bbox; mỗi vùng một thẻ từ; giữ/bỏ/thêm |
| `wordlist` | b | **tabbar** | Bộ từ: tìm kiếm, lọc CEFR/trạng thái, sắp xếp |
| `worddetail` | b | appbar | Thẻ từ đầy đủ: IPA, CEFR, nghĩa, ví dụ + dịch, audio, SRS |
| `compose` | c | appbar | Kể lại một ngày / gõ từ & chủ đề, đính ảnh, chọn chủ đề |
| `reader` | c | **tabbar** | Đoạn đan xen, audio, chạm từ → sheet nghĩa |
| `speaking` | c | appbar | Mic + waveform, bạn nói, AI chỉnh lại (diff) |
| `stories` | c | **tabbar** | Truyện đã lưu |
| `review-hub` | d | **tabbar** | Chọn 2/10/20 phút + 5 dạng bài + số từ đến hạn |
| `review-run` | d | appbar | Phiên ôn: 5 dạng bài, phản hồi đúng/sai, cập nhật SRS |
| `review-summary` | d | appbar | Kết quả phiên, từ cần ôn lại, **0 API call** |
| `diary` | e | appbar | Nhật ký sắc thái → câu động viên khớp tâm trạng |
| `progress` | e | **tabbar** | Hồ sơ tự cập nhật: CEFR, lịch streak, phân bố từ, thời gian |
| `profile` | e | appbar | Hồ sơ + quyền riêng tư (không huấn luyện trên dữ liệu người dùng) |
| `compare` | e | appbar | So sánh với Duolingo / Memrise / Anki (slide 10 — Lead bổ sung) |
| `system-states` | e | appbar | Trưng bày 4 trạng thái: rỗng, đang tải, lỗi, offline |

**Tab bar có 5 mục** (do shell vẽ, không phải bạn): Hôm nay · Đọc · **Chụp** (nút tròn giữa) · Ôn tập · Tiến độ.
Màn nào cần tab bar thì đặt `chrome: 'tabbar'`.

---

## 6. Icon có sẵn

`ctx.icon(name, size)` — stroke 1.75, 24×24, cùng một họ nét vẽ.

```
home chevron-left chevron-right chevron-down chevron-up arrow-right arrow-left arrow-up-right more-horizontal
camera camera-off image mic mic-off scan crop sparkles wand
volume-2 play pause rotate-ccw headphones waveform
book-open layers list-checks graduation-cap target pencil edit bookmark bookmark-check notebook coffee flame zap
award trending-up calendar clock bar-chart git-branch
check check-circle x x-circle plus minus search filter sliders settings shield lock alert-triangle info
wifi-off cloud-off refresh eye eye-off star heart trash link grid user users sun moon message-circle
thumbs-up download share clipboard file-text loader activity compass map palette globe mouse-pointer move-3d gift
```

Cần icon mới → nhắn Lead, đừng nhúng SVG lạ vào màn hình.

---

## 7. Dữ liệu (`ctx.data`)

```js
ctx.data.user                // { name, cefr:'B1', streak:12, wordsKnown:348, minutesToday:14, xp, level, interests }
ctx.data.words               // 23 từ: { id, en, vi, ipa, pos, cefr, example, exampleVi, topics, status, srs:{stage,reps,lapses,ease,interval,dueInDays} }
ctx.data.wordById(id)  ctx.data.wordByEn('mug')  ctx.data.dueWords()
ctx.data.CEFR_ORDER          // ['A1','A2','B1','B2','C1']

ctx.data.photos              // 5 ảnh: { id, src, alt, caption, takenAt, regions:[{wordId,x,y,w,h}] }
ctx.data.photoById(id)  ctx.data.regionFor(wordId, photoId)  ctx.data.photoLibrary
// Ảnh 1:1. Toạ độ % ánh xạ 1:1. CHỈ 'morning-desk' có regions.

ctx.data.stories             // [{ id, title, date, cefr, photoId, audioSeconds, raw }]
ctx.data.hydrateStory(story) // → { ...story, paragraphs, ratio, englishWords }
ctx.data.parseStory(raw)     // chuỗi → [[{type:'vi'|'en', text}]]
ctx.data.speakingSample      // { transcript, corrected, notes:[{from,to,why}], newWords, score }
ctx.data.userStoryDraft      // đoạn người dùng "đã kể" để demo
ctx.data.sampleTopics        // chip chủ đề gợi ý

ctx.data.moods               // [{ id:'low', label:'Rất thấp', face:'cloud', hint }]
ctx.data.dailySentences      // { low:[{id,en,vi,tone:'acknowledge'}], down, ok, up, great }
ctx.data.topics              // 12 chủ đề { id, label, icon, words }
ctx.data.placementQuestions  // 8 câu { id, level, q, options, answer, note }
ctx.data.levelFromPlacement(correct, total)  // → 'B1'
ctx.data.reviewTypes         // 5 dạng { id, name, icon, desc }
ctx.data.sessionLengths      // [{ value:2|10|20, label, hint, items }]
ctx.data.clozeBank           // câu cloze { wordId, sentence, vi }
ctx.data.onboardingSlides    // 3 slide có sẵn nội dung
ctx.data.systemStates        // { offline, error, 'rate-limited' } mỗi cái có title/body

ctx.data.buildReviewQueue({ allWords, length, types })  // → items 5 dạng
ctx.data.sm2Update(srs, quality)   // 0–5
ctx.data.distractors(wordId, allWords, n)
ctx.data.stageName(stage)  ctx.data.dueLabel(days)
ctx.data.statusCounts(words)  ctx.data.cefrDistribution(words)  ctx.data.stageHistogram(words)
ctx.data.streakCalendar({ weeks: 5 })   // [{ i, done, minutes }]
ctx.data.compressInfo(photoId)          // { from:'2.4 MB', to:'380 KB', ratio }
ctx.data.TEAM                           // 4 thành viên đội thi
```

**Chạm vào từ tiếng Anh trong story**: `ctx.data.wordByEn(tok.text)` → object từ (có thể `null`).
Nếu `null`, vẫn hiện sheet với nghĩa suy đoán, đừng để người dùng bấm mà không có gì xảy ra.

---

## 8. Cost Meter — cách khai báo

Đây là **điểm bán** của sản phẩm, phải chính xác:

| Màn hình | `api` khai báo |
|---|---|
| `capture` → `regions` | `[{ key: 'vlm:morning-desk', kind: 'vlm', label: 'Nhận diện ảnh & Bbox', n: 1 }]` |
| `compose` → `reader` | `[{ key: 'llm:today', kind: 'llm', label: 'Viết đoạn đan xen', n: 1 }]` |
| `speaking` | `[{ key: 'llm:speak-1', kind: 'llm', label: 'Chỉnh cách diễn đạt', n: 1 }]` |
| `diary` | không khai báo khi đã có nhật ký (chọn câu từ kho DB) |
| `review-hub`, `review-run`, `review-summary` | **`api: []`** — 0 API call, sinh bằng quy tắc |
| `wordlist`, `worddetail`, `progress`, `profile`, `home` | `api: []` |
| `placement` | `[]` |

Khoá `key` là **idempotent**: vào lại màn hình không cộng thêm. Nếu người dùng bấm nút
"nhờ AI chỉnh lại" lần thứ hai thì gọi `ctx.cost.log({ kind: 'llm', label: 'Chỉnh lại lần 2' })`.

> ⚠️ **Quy ước có chủ đích:** chi phí được tính khi **vào màn hình**, theo đơn vị **ảnh** và **truyện** —
> không phải theo từng lần bấm. Nhờ vậy giám khảo dán thẳng deep link vẫn thấy đúng con số
> "1 lần/ảnh · 1 lần/truyện" của slide 09–10. Đánh đổi: bộ đếm nhảy trước khi người dùng làm gì.
> Cột inspector trong demo ghi rõ quy ước này để không gây hiểu nhầm.

---

## 9. Token thiết kế

**Màu** (chỉ dùng qua `var(...)`):

| Token | Sáng | Dùng ở đâu |
|---|---|---|
| `--paper` | `#FBF6EF` | nền màn hình |
| `--card` / `--card-2` / `--card-inset` | `#FFF` / `#FFFCF7` / `#F8F1E7` | mặt thẻ |
| `--ink` / `--ink-2` / `--ink-3` | `#2A211B` / `#5F5045` / `#8B7A6B` | chữ chính / phụ / mờ |
| `--line` / `--line-strong` | `#EADFD1` / `#D9C9B4` | viền, đường kẻ |
| `--primary` / `--primary-soft` / `--on-primary` | `#A63D12` / `#FBEADF` / `#FFF` | hành động chính |
| `--highlight` / `--highlight-soft` | `#B03A0E` / `#FCEBDC` | **từ tiếng Anh trong đoạn đan xen** |
| `--success` / `--success-soft` | `#2F6B4F` / `#E3EFE7` | đúng, tiến độ |
| `--warning` / `--danger` / `--info` (+ `-soft`) | | cảnh báo, lỗi, ghi chú |

**Chữ**: `--font-display` (Calistoga) cho tiêu đề & số lớn · `--font-read` (Newsreader) cho
đoạn văn đọc · `--font-ui` (Inter) cho UI · `--font-mono` (JetBrains Mono) cho IPA, CEFR, nhãn.

**Cỡ chữ**: `--fs-2xs 10 · --fs-xs 12 · --fs-sm 13 · --fs-base 15 · --fs-md 17 · --fs-lg 20 · --fs-xl 24 · --fs-2xl 30 · --fs-3xl 38`

**Khoảng cách**: `--sp-1..--sp-10` = 4/8/12/16/20/24/32/40/48/64. Bo góc: `--r-sm..--r-2xl`, `--r-full`.
Bóng: `--shadow-1..--shadow-4`. Chuyển động: `--dur-fast 140ms`, `--dur 220ms`, `--dur-slow 380ms`, `--ease`, `--ease-spring`.

**Lớp tiện ích có sẵn trong base.css**: `.stack .stack--tight .stack--loose .row .row--between .row--wrap
.grow .center .mono .truncate .clamp-2 .tx-center .label .h1 .h2 .h3 .lede .muted .muted-2 .read
.anim-enter .anim-stagger .sr-only .hidden`.

**Lớp màn hình**: `.screen` `.screen__body` `.screen__body--tight` `.screen__body--flush` `.screen__cta`
`.en` (từ tiếng Anh bấm được) `.interleave` `.viewfinder` `.photo-frame` `.bbox` `.list` `.listitem` `.wordrow`.

---

## 10. Tự kiểm tra trước khi báo xong

Chạy 5 bước này, **dán kết quả thật vào báo cáo**, đừng chỉ nói "đã xong":

```powershell
$chrome = "$env:LOCALAPPDATA\ms-playwright\chromium-1243\chrome-win64\chrome.exe"
$base   = "http://127.0.0.1:8137/index.html"

# 1. Manifest của nhóm đã có màn hình (không còn rỗng)
Get-Content src\screens\<nhóm>\manifest.js

# 2. Chụp ảnh màn hình mới (390×844) — để người khác xem lại được
& $chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 `
  --window-size=390,844 --virtual-time-budget=5000 `
  --screenshot="tools\shot-<id>.png" "$base#/<id>"

# 3. Bắt lỗi runtime: phải thấy data-ready="true" và KHÔNG có data-boot-errors
& $chrome --headless=new --disable-gpu --virtual-time-budget=5000 --dump-dom `
  "$base#/<id>" > tools\dom-<id>.html
Select-String -Path tools\dom-<id>.html -Pattern 'data-ready="true"'
Select-String -Path tools\dom-<id>.html -Pattern 'data-boot-errors'

# 4. Kiểm tra toàn diện bằng harness của Lead (a11y, tương phản, touch, tràn ngang)
& $chrome --headless=new --disable-gpu --virtual-time-budget=15000 --dump-dom `
  "http://127.0.0.1:8137/tools/audit.html" > tools\dom-audit.html
# đọc khối <pre id="report"> trong file đó

# 5. Không hardcode màu / không emoji trong file của mình
Select-String -Path src\screens\<nhóm>\*.js,styles\screens-*.css -Pattern '#[0-9a-fA-F]{6}|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]'
```

**Checklist cá nhân trước khi báo hoàn thành:**

- [ ] Mọi `id` trong manifest khớp §5 và không trùng nhóm khác
- [ ] Mỗi màn hình mở được trực tiếp bằng `#/<id>` (deep link), không phụ thuộc màn hình trước
- [ ] Không nút nào bấm mà không có phản hồi (kể cả nút chưa làm xong → dùng `ui.toast('Sắp có')`)
- [ ] Có `notes` giải thích 2–4 quyết định thiết kế, viết như đang bảo vệ trước ban giám khảo
- [ ] Ảnh chụp màn hình mới nhất cho thấy màn hình hiển thị đúng, không trắng, không vỡ chữ
- [ ] Đã xem ở cả giao diện sáng và tối (nút mặt trời/mặt trăng ở thanh trên)
