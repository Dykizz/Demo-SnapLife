# SnapLife AI — Kế hoạch thiết kế demo giao diện (UI/UX)

> Nguồn: `SnapLife-AI-Pitch-Deck.pdf` (12 trang, đội Prompt and Chill).
> Mục tiêu: biến pitch deck thành **prototype chạy được, tương tác được, đủ đẹp để demo trước ban giám khảo**.

---

## 1. Định vị sản phẩm → quyết định thiết kế

SnapLife AI **không** phải một app flashcard. Nó là **cuốn nhật ký học tiếng Anh**: người học đưa ảnh và câu chuyện của chính mình, AI trả lại bài học chuẩn CEFR.

| Đặc tính sản phẩm | Hệ quả UI/UX bắt buộc |
|---|---|
| Ngữ cảnh là ảnh thật của người dùng | Ảnh phải là **nhân vật chính** của màn hình, không phải thumbnail phụ. Tỉ lệ ảnh dọc 3:4, bo góc mềm, đổ bóng nổi. |
| Đoạn văn đan xen 15–20% tiếng Anh | Reader phải là **trải nghiệm đọc**, không phải danh sách. Cần nhịp chữ rộng, serif đọc, từ tiếng Anh nổi màu cam và chạm được. |
| Luồng chụp → khoanh vùng → thẻ từ | Đây là **khoảnh khắc wow**. Overlay khoanh vùng phải mượt, mỗi vùng sinh đúng 1 từ, có thể giữ/bỏ. |
| Luyện nói bằng mic | Ghi âm phải **có hình hài** (waveform, thời lượng), và phần "AI chỉnh lại" phải là **diff trực quan**, không phải đoạn chat. |
| Chi phí AI là điểm bán (gọi 1 lần/ảnh) | Đưa **Cost Meter** vào chính demo: đếm API call theo thời gian thực để chứng minh luận điểm tiết kiệm. |
| Phiên học 2 / 10 / 20 phút | Chọn độ dài là **quyết định đầu tiên**, không phải cài đặt ẩn. |
| Hồ sơ tự cập nhật, chuỗi ngày, câu động viên | Cần một **trang chủ tạo động lực**: streak, số từ đã thuộc, câu mỗi ngày có nghĩa tiếng Việt. |
| "Không dùng ảnh và giọng nói để huấn luyện mô hình" | Phải có màn hình quyền riêng tư nói thẳng điều này — đây là **lợi thế cạnh tranh**, không phải trang pháp lý. |

**Không sao chép Duolingo.** Khác biệt thị giác phải phản ánh khác biệt sản phẩm: ấm, người, có chất giấy — chứ không phải xanh neon và linh vật.

---

## 2. Art direction: Warm Editorial + Soft Depth

| Token | Giá trị | Lý do |
|---|---|---|
| Nền | `#FBF6EF` giấy kem ấm | Gợi trang sổ, không gợi dashboard |
| Mực | `#2A211B` nâu đen ấm | Dịu hơn `#000`, hợp nền kem |
| Chính | `#A63D12` terracotta | Ấm, tự tin, tương phản ≥ 7:1 trên trắng |
| Nhấn từ vựng | `#B03A0E` cam đất | Đúng mô tả deck: "chạm vào từ màu cam" |
| Thành công / tiến độ | `#2F6B4F` xanh rừng | Khác biệt với xanh Duolingo, vẫn đọc được |
| Đường kẻ | `#EADFD1` | Viền mảnh 1px thay vì card viền đậm |
| Nổi khối | 2 tầng shadow mềm | "Soft Depth" — nổi mà không cứng |

**Typography (4 vai trò rõ ràng):**

| Vai trò | Font | Dùng ở đâu |
|---|---|---|
| Display | `Calistoga` | Tiêu đề màn hình, số liệu lớn — ấm, người, không quá trang trí |
| Reading | `Newsreader` | Đoạn văn đan xen, câu ví dụ — thiết kế cho đọc dài |
| UI | `Inter` | Nhãn, nút, body UI — trung tính, dễ đọc ở 15–17px |
| Data | `JetBrains Mono` | IPA, CEFR, nhãn nhỏ uppercase tracking rộng, số liệu |

Chọn 4 font là **có chủ đích**: IPA bắt buộc cần font có ký hiệu phiên âm rõ; mono còn tách bạch "dữ liệu học thuật" khỏi "giao diện".

**Chuyển động:** `--dur-fast 140ms` (tap), `--dur 220ms` (chuyển trạng thái), `--dur-slow 380ms` (vào màn hình), easing `cubic-bezier(.2,.8,.2,1)`, spring `cubic-bezier(.34,1.4,.5,1)`. Tất cả tắt dưới `prefers-reduced-motion`.

---

## 3. Bản đồ màn hình (18 màn + 4 trạng thái hệ thống)

| # | ID | Màn hình | Nhóm | Trang deck |
|---|---|---|---|---|
| 1 | `splash` | Khởi động thương hiệu | A | 1 |
| 2 | `onboarding` | 3 slide: vấn đề → giải pháp 3 bước → quyền truy cập | A | 2, 3, 9 |
| 3 | `placement` | Test xếp trình độ 3 phút (adaptive) | A | 11 |
| 4 | `topics` | Chọn chủ đề & sở thích | A | 11 |
| 5 | `home` | **Hôm nay** — streak, câu mỗi ngày, 3 hành động, chọn phiên 2/10/20 | A | 7, 11 |
| 6 | `capture` | Camera + hướng dẫn chụp | B | 4 |
| 7 | `regions` | Khoanh vùng → mỗi vùng sinh 1 thẻ từ | B | 4 |
| 8 | `wordlist` | Bộ từ của tôi (lọc CEFR / trạng thái) | B | 11 |
| 9 | `worddetail` | Thẻ từ đầy đủ: IPA, CEFR, nghĩa, ví dụ + dịch, audio, SRS | B | 4 |
| 10 | `compose` | Kể lại một ngày / gõ từ & chủ đề + đính ảnh | C | 5 |
| 11 | `reader` | Đoạn đan xen 15–20% + audio + chạm từ xem nghĩa | C | 5 |
| 12 | `speaking` | Mic → bạn nói → AI chỉnh lại (diff) | C | 6 |
| 13 | `review-hub` | Chọn phiên 2/10/20 + 5 dạng bài | D | 8 |
| 14 | `review-run` | Phiên ôn: đọc tương tác, cloze, chạm ảnh, ghép cặp, flashcard SRS | D | 8 |
| 15 | `review-summary` | Kết quả phiên + từ cần ôn lại | D | 8, 11 |
| 16 | `diary` | Nhật ký sắc thái → chọn câu động viên | E | 7 |
| 17 | `progress` | Hồ sơ tự cập nhật: CEFR, lịch streak, số từ, thời gian | E | 11 |
| 18 | `profile` | Hồ sơ & Quyền riêng tư | E | 11 |
| 19 | `compare` | So sánh với Duolingo / Memrise / Anki | E | 10 |
| S1–S4 | `state-empty` / `state-loading` / `state-error` / `state-offline` | Trạng thái hệ thống | E | — |

---

## 4. Luồng UX chính (logic, không chỉ là hình)

### Luồng 1 — Từ ảnh đến từ vựng (điểm nhấn 1, deck tr.4)
```
home → [Chụp ảnh] → capture (khung ngắm + gợi ý "chụp đủ sáng, đủ gần")
   → chụp xong → nén tại client (hiện "Đã nén 2.4MB → 380KB")
   → VLM gọi 1 lần → regions: hiện 3 vùng Bbox gợi ý, mỗi vùng 1 thẻ từ
   → người dùng: giữ / bỏ / tự khoanh thêm / thêm từ bằng tay
   → "Học ngay" → reader hoặc wordlist
```
**Quy tắc:** mỗi vùng khoanh = đúng 1 từ. Từ do người dùng tự khoanh **luôn được ưu tiên** so với từ AI gợi ý.

### Luồng 2 — Ngữ cảnh của bạn (điểm nhấn 2, deck tr.5)
```
home → [Kể chuyện] → compose: kể trải nghiệm + đính ảnh + chip chủ đề
   → AI viết lại, đan 15–20% tiếng Anh đúng trình độ
   → reader: từ tiếng Anh màu cam, chạm → sheet IPA/nghĩa/audio
   → "Thêm vào bộ từ" → SRS khởi tạo
```

### Luồng 3 — Luyện nói (điểm nhấn 3, deck tr.6)
```
reader (hoặc home) → [Mic] → speaking: waveform + 0:06
   → bạn nói → transcript → [Nhờ AI chỉnh lại]
   → diff: very like → really like ; make → makes
   → nghe lại → nói lại (vòng lặp tới khi trôi chảy)
   → từ mới trong câu nói TỰ ĐỘNG vào danh sách ôn tập
```

### Luồng 4 — Ôn tập 5 dạng (deck tr.8)
```
home → [Ôn tập] → review-hub: chọn 2/10/20 phút
   → review-run: đọc tương tác → cloze → chạm ảnh → ghép cặp → flashcard SRS
   → mỗi câu: đúng/sai + phản hồi tức thì + cập nhật SRS (SM-2)
   → review-summary: từ đã thuộc / cần ôn lại / API call = 0
```

### Luồng 5 — Động lực mỗi ngày (điểm nhấn 4, deck tr.7)
```
home → thẻ "Câu hôm nay"
   → có nhật ký hôm qua? → phân loại sắc thái → chọn câu khớp tâm trạng
   → không có → câu động viên kế tiếp trong kho (0 API call)
   → luôn kèm nghĩa tiếng Việt
```

### Cost Meter — minh hoạ luận điểm kiến trúc (deck tr.9–10)
Một HUD trong demo shell đếm realtime: `VLM 1×/ảnh`, `LLM 1×/câu chuyện`, `0 API call khi ôn tập`.
Chuyển màn hình ôn tập → kim chỉ 0. Đây là **bằng chứng trực quan** cho slide "tiết kiệm".

---

## 5. Kiến trúc kỹ thuật (không cần build, mở là chạy)

```
D:\Demo\
├─ index.html            ← demo shell: khung điện thoại + router + rail chọn màn hình
├─ gallery.html          ← toàn bộ màn hình cạnh nhau (kiểm tra responsive 375→1440)
├─ README.md
├─ docs/                 ← PLAN.md, BUILD-SPEC.md, UX-FLOWS.md, SCREEN-MAP.md, QA-REPORT.md
├─ design-system/snaplife-ai/MASTER.md
├─ src/
│   ├─ core/             ← router, store, dom, icons, ui (components), audio, cost-meter, registry
│   ├─ data/             ← fixtures.js, story.js, photos.js
│   └─ screens/
│       ├─ a-onboarding/  (Teammate A)
│       ├─ b-capture/     (Teammate B)
│       ├─ c-story/       (Teammate C)
│       ├─ d-review/      (Teammate D)
│       └─ e-progress/    (Teammate E)
├─ styles/               ← tokens, base, components, shell (Lead) + screens-a…e (mỗi nhóm 1 file)
├─ assets/photos/        ← ảnh do AI tạo, dùng làm ảnh "của người dùng"
└─ tools/                ← script screenshot Chromium headless + kiểm tra tương phản
```

**Hợp đồng màn hình (bắt buộc mọi teammate tuân theo):**
```js
export default {
  id: 'home',
  title: 'Hôm nay',
  group: 'a',
  chrome: 'tabbar' | 'appbar' | 'none',
  tab: 'home',                        // tab đang sáng trên bottom nav (nếu có)
  render(ctx) { return HTMLElement }  // ctx = { store, nav, ui, icons, data, photos, cost }
};
```
- **Không** ai sửa file ngoài thư mục nhóm mình + `styles/screens-<nhóm>.css`.
- `src/core/registry.js` nạp nhóm bằng dynamic import + try/catch → một nhóm lỗi không làm sập demo.
- Mọi màn hình tự chạy được ở 375 / 390 / 768 / 1024 / 1440.

**Vì sao vanilla JS + ES modules?** Demo hackathon phải mở được bằng double-click, không `npm install`, không lỗi build trước mặt giám khảo. Tailwind CDN cũng bị loại vì phụ thuộc mạng khi trình diễn.

---

## 6. Phân chia subagent (Agent Teams)

| Teammate | Phạm vi ghi (disjoint) | Bàn giao |
|---|---|---|
| **Lead** | `index.html`, `gallery.html`, `src/core/**`, `src/data/**`, `styles/{tokens,base,components,shell}.css`, `docs/PLAN.md`, `docs/BUILD-SPEC.md`, `assets/**`, `README.md` | Foundation + tích hợp + QA cuối |
| `screens-onboard` | `src/screens/a-onboarding/**`, `styles/screens-a.css` | splash, onboarding, placement, topics, home |
| `screens-capture` | `src/screens/b-capture/**`, `styles/screens-b.css` | capture, regions, wordlist, worddetail |
| `screens-story` | `src/screens/c-story/**`, `styles/screens-c.css` | compose, reader, speaking |
| `screens-review` | `src/screens/d-review/**`, `styles/screens-d.css` | review-hub, review-run (5 dạng), review-summary |
| `screens-progress` | `src/screens/e-progress/**`, `styles/screens-e.css` | diary, progress, profile, 4 trạng thái hệ thống |
| `qa-verify` | `docs/QA-REPORT.md`, `tools/**` | Audit độc lập: screenshot mọi màn, console error, tương phản, touch target, reduced-motion, responsive |

**Thứ tự bắt buộc:** Lead foundation → (5 teammate song song) → qa-verify (blocked_by cả 5) → Lead tích hợp & QA cuối.

**Vì sao tách như vậy:** mỗi nhóm theo *luồng người dùng*, không theo *loại file*. Người làm luồng chụp ảnh giữ trọn từ màn hình camera tới thẻ từ, nên logic khoanh vùng → sinh từ → thêm vào SRS nhất quán trong một đầu. Không ai chạm file của ai.

---

## 7. Tiêu chí nghiệm thu (Definition of Done)

**Chức năng**
- [ ] 18 màn + 4 trạng thái hệ thống điều hướng được, back hoạt động đúng.
- [ ] Luồng 1–5 bấm được từ đầu tới cuối, không ngõ cụt.
- [ ] Cost Meter cập nhật đúng: 1 VLM/ảnh, 1 LLM/truyện, 0 API khi ôn tập.
- [ ] 5 dạng ôn tập đều trả lời được và có phản hồi đúng/sai + cập nhật tiến độ.
- [ ] `gallery.html` hiển thị mọi màn ở 375/768/1024/1440 không vỡ layout.

**Chất lượng UI/UX (theo `ui-ux-pro-max` pro-rules)**
- [ ] Không dùng emoji làm icon — toàn bộ SVG, cùng một họ icon, stroke 1.75.
- [ ] Touch target ≥ 44×44px, khoảng cách ≥ 8px.
- [ ] Tương phản chữ ≥ 4.5:1 (kiểm bằng script, cả light và dark).
- [ ] Focus ring thấy rõ, điều hướng bàn phím được, `aria-label` cho nút chỉ có icon.
- [ ] `prefers-reduced-motion` được tôn trọng.
- [ ] Safe-area trên/dưới: header và tab bar không đè nội dung.
- [ ] Không hardcode màu trong màn hình — chỉ dùng token ngữ nghĩa.

**Bàn giao**
- [ ] `README.md` hướng dẫn mở + bản đồ màn hình + phím tắt.
- [ ] `docs/UX-FLOWS.md` giải thích logic từng luồng kèm lý do thiết kế.
- [ ] `docs/QA-REPORT.md` có screenshot thật + danh sách lỗi đã sửa.
