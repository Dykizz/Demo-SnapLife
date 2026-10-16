# SnapLife AI — Luồng UX và lý do thiết kế

> Tài liệu này giải thích **vì sao** từng luồng được thiết kế như vậy, không chỉ mô tả nó đi qua đâu.
> Dùng để bảo vệ quyết định trước ban giám khảo và để người viết code sau này không phá vỡ logic.

---

## 0. Mô hình điều hướng

**Năm tab, không hơn** (giới hạn nhận thức: trên 5 mục thì người dùng bắt đầu mất phương hướng):

```
Hôm nay  ·  Đọc  ·  [ Chụp ]  ·  Ôn tập  ·  Tiến độ
```

Nút **Chụp** nằm giữa, nhô lên, và là hành động duy nhất có màu đặc. Lý do: chụp ảnh là
cử chỉ khởi đầu của toàn bộ sản phẩm — mọi thứ khác là hệ quả của nó. Nếu để nó ngang hàng
với bốn tab còn lại, người dùng sẽ không bao giờ chạm tới.

**Deep link là bắt buộc.** Mỗi màn hình mở được trực tiếp bằng `#/<id>`, kể cả khi chưa đi
qua màn trước. Người chấm thi sẽ dán link, không bấm tuần tự. Vì vậy mọi màn hình phải tự
dựng được dữ liệu mặc định của nó thay vì giả định store đã có sẵn.

**Quay lại theo ngăn xếp thật** (dựa trên history của trình duyệt), không phải nút "về trang chủ"
giả. Tab bar khi chuyển tab thì `replace` để không xếp lớp vô hạn.

---

## 1. Luồng "Ảnh → từ vựng" (điểm nhấn 1 · deck tr.4)

```
home ──[Chụp ảnh]──▶ capture ──▶ regions ──▶ wordlist / worddetail
```

| Bước | Màn hình | Người dùng làm gì | Hệ thống phản hồi gì |
|---|---|---|---|
| 1 | `capture` | Ngắm và chụp | Nén ảnh tại client: hiện thẳng `2.4 MB → 380 KB` |
| 2 | `capture` | Chờ | Nói rõ đang gọi **VLM 1 lần** cho ảnh này |
| 3 | `regions` | Xem các vùng AI gợi ý | Mỗi vùng một thẻ từ đầy đủ: từ, IPA, CEFR, nghĩa, ví dụ + dịch |
| 4 | `regions` | Giữ / bỏ / tự khoanh thêm | Vùng tự khoanh hiển thị màu khác (xanh) để thấy ngay nó là của mình |
| 5 | `regions` | "Học với N từ này" | Sang bộ từ |

**Quy tắc cốt lõi: mỗi vùng khoanh sinh đúng một từ.** Không có vùng nào trống nghĩa, không có
vùng nào sinh ra hai từ. Đây là lời hứa ở slide 04; vi phạm nó là mất tính "một-vùng-một-từ"
mà cả tính năng dựa vào.

**Từ do người dùng tự khoanh luôn được ưu tiên** hơn từ AI gợi ý — cả về thứ tự trong danh sách
lẫn màu sắc. Người dùng phải cảm thấy mình là người quyết định, AI chỉ đề xuất.

**Trạng thái bắt buộc phải có:**
- Không có mạng → vẫn cho khoanh vùng thủ công, chỉ chặn bước gọi VLM.
- Không đọc được ảnh (mờ/tối/không có đồ vật) → `systemStates.error`, kèm lối thoát "khoanh vùng thủ công".
- Người dùng bỏ hết từ → nút "Học ngay" phải disable kèm lý do, không im lặng.

---

## 2. Luồng "Ngữ cảnh của bạn" (điểm nhấn 2 · deck tr.5)

```
home ──[Kể chuyện]──▶ compose ──▶ reader ──▶ speaking
```

`compose` cho **chọn một trong hai cách** đưa ngữ cảnh vào, đúng như slide 05:

1. **Kể lại một ngày** — người dùng kể trải nghiệm, đính ảnh đã chụp.
2. **Gõ từ hoặc chủ đề** — người dùng nhập từ muốn học hoặc chủ đề quan tâm.

**Vì sao hai cách chứ không một:** người mới chưa có thói quen kể chuyện sẽ bỏ cuộc ở ô nhập
trống; người đã quen sẽ thấy việc chỉ gõ từ là quá nghèo ngữ cảnh. Hai lối vào phục vụ hai
trạng thái sẵn sàng khác nhau, và cùng đổ về một kết quả.

**`reader` là màn hình đẹp nhất của sản phẩm — và phải là trải nghiệm đọc thật:**
- Cỡ chữ 19px, line-height 1.8, dùng font serif dành cho đọc dài. Đây không phải danh sách từ.
- Từ tiếng Anh nổi **màu cam đất `--highlight`** kèm gạch chân mảnh — đúng mô tả deck
  "chạm vào từ màu cam để nghe và xem nghĩa".
- Hiển thị **tỉ lệ % tiếng Anh thật** đã tính từ chữ (`story.ratio`), không hardcode "15–20%".
  Con số này là bằng chứng cho lời hứa ở slide 03 và 05.
- Chạm từ → bottom sheet có IPA, nghĩa, ví dụ + dịch, nút nghe. Không rời màn hình đọc.
- Bộ đếm "từ mới đã xem" tăng theo thao tác — biến việc đọc thành tiến độ.

**Vì sao dùng bottom sheet chứ không phải trang chi tiết:** rời khỏi đoạn văn để tra một từ là
phá vỡ mạch đọc. Sheet giữ ngữ cảnh còn nguyên phía sau.

---

## 3. Luồng "Luyện nói" (điểm nhấn 3 · deck tr.6)

```
reader ──[Luyện nói]──▶ speaking: idle → recording → recorded → correcting → corrected
```

| Trạng thái | Điều phải thể hiện |
|---|---|
| `recording` | Waveform chuyển động + đồng hồ đếm thật. Ghi âm phải **có hình hài**, không chỉ là một nút đổi màu. |
| `recorded` | Transcript hiện ra — người dùng thấy hệ thống đã nghe được gì |
| `correcting` | Trạng thái chờ có skeleton, không phải màn hình trắng |
| `corrected` | **Diff trực quan**: câu gốc và câu đã sửa, hai chỗ sửa được đánh dấu rõ, kèm giải thích vì sao |

**Vì sao diff chứ không phải chat:** chatbot đẩy người dùng vào thế phải đọc một đoạn văn để
tự tìm ra lỗi. Diff chỉ thẳng vào chỗ sai. Với người học, khoảng cách giữa "đọc thấy đúng" và
"hiểu vì sao sai" chính là chỗ họ bỏ cuộc.

Ví dụ nguyên văn từ deck: `very like → really like`, `make → makes`, kèm lý do ngắn gọn.

**Vòng lặp có chủ đích:** "Nghe lại" → "Nói lại" → (nếu muốn) gọi AI chỉnh lại lần nữa.
Lần gọi thứ hai **có tính phí API** và Cost Meter phải nhảy — đây là cách trung thực để cho
thấy tiền chỉ tốn khi người dùng thật sự yêu cầu thêm.

**Từ mới trong câu nói tự động vào danh sách ôn tập** (deck tr.6). Không cần người dùng bấm "thêm".

---

## 4. Luồng "Ôn tập" (deck tr.8, 9, 10)

```
home ──[Ôn tập]──▶ review-hub ──▶ review-run ──▶ review-summary
```

**Chọn độ dài phiên là quyết định đầu tiên, không phải cài đặt ẩn.** 2 / 10 / 20 phút tương ứng
4 / 10 / 18 câu. Lý do: rào cản lớn nhất của người học không phải thiếu bài tập mà là không biết
mình có đủ thời gian hay không. Hỏi thời gian trước, rồi mới đưa bài tập.

**Năm dạng bài, đúng slide 08:**

| # | Dạng | Cơ chế |
|---|---|---|
| 1 | Đọc tương tác | Chạm từ trong đoạn văn để nghe và xem nghĩa |
| 2 | Cloze điền khuyết | Điền từ đúng vào chỗ trống trong câu |
| 3 | Chạm ảnh | Chọn đúng đồ vật trong ảnh của chính người dùng |
| 4 | Ghép cặp | Nối từ với nghĩa tương ứng |
| 5 | Flashcard SRS | Lặp lại ngắt quãng theo SM-2 |

Cùng một từ đi qua nhiều dạng khác nhau — đó là lý do thứ tự dạng bài được **xoay vòng**, không
lặp một dạng hai lần liên tiếp.

**Vì sao tính năng "chạm ảnh" quan trọng hơn nó trông:** đây là dạng bài duy nhất không thể
sao chép từ app khác, vì nó cần ảnh của chính người học. Nó là bằng chứng sống cho luận điểm
"khác biệt không nằm ở kho từ, mà ở ngữ cảnh của chính bạn" (slide 11).

**Bằng chứng 0 API call — phải chứng minh được, không chỉ tuyên bố:**
- Toàn bộ hàng đợi sinh bằng `buildReviewQueue()` từ quy tắc.
- Phương án nhiễu lấy từ chính kho từ, không gọi mô hình.
- Cost Meter ở khung demo **đứng yên** trong suốt phiên ôn.
- `review-summary` hiển thị khối "0 API call" đối chiếu thẳng với slide 09.

**Phản hồi đúng/sai dùng cả màu và icon** (`check-circle` / `x-circle`). Người mù màu vẫn phải
phân biệt được — đây là lỗi phổ biến nhất ở app học tập.

---

## 5. Luồng "Động lực mỗi ngày" (điểm nhấn 4 · deck tr.7)

```
home ──[Câu hôm nay]──▶ diary ──▶ chọn sắc thái ──▶ câu khớp tâm trạng
```

**Logic chọn câu, đúng slide 07:**

```
Có nhật ký hôm qua?
├── Có  → phân loại sắc thái → chọn câu khớp tâm trạng
└── Không → lấy câu động viên kế tiếp trong kho
```
Kho câu lưu sẵn trong DB → **không tốn thêm API call** trong cả hai nhánh.

**Quyết định tinh tế nhất của cả sản phẩm nằm ở đây:**
> Sắc thái thấp nhận câu **GHI NHẬN**, không cổ vũ sáo rỗng.

Người đang mệt mà nhận "Cố lên! Bạn làm được mà!" sẽ thấy bị phủ nhận cảm xúc. Vì vậy
nhóm `low` và `down` chỉ trả về câu `tone: 'acknowledge'` ("You made it through today."),
nhóm `up` và `great` mới trả về `'encourage'`. **Hai nhóm này không được trộn.**

Câu luôn kèm **nghĩa tiếng Việt** — vì đây là câu tiếng Anh người dùng gặp lúc tâm trạng
không tốt, không phải lúc muốn tra từ điển.

---

## 6. Luồng "Hồ sơ tự cập nhật" (deck tr.11)

```
placement (test 3 phút) ──▶ topics (chọn sở thích) ──▶ home
                                   │
                        progress ◀──┴──▶ diary
```

- **Test 3 phút, 8 câu, có giải thích từng câu.** Trắc nghiệm không giải thích thì chỉ là
  bài kiểm tra, không phải bài học — và người dùng sẽ bỏ qua nó.
- **Chủ đề quan tâm điều chỉnh gợi ý từ.** Cùng trình độ B1 nhưng người thích cà phê và
  người thích thể thao nhận từ khác nhau.
- **Tiến độ không chỉ là số từ.** Có: chuỗi ngày, phân bố từ theo CEFR, histogram giai đoạn
  SRS, phút học tuần. Người học cần thấy nhiều hơn một con số để biết mình đang đi đúng hướng.

---

## 7. Quyền riêng tư — lợi thế cạnh tranh, không phải trang pháp lý (deck tr.9, 11)

Ở buổi onboarding (slide 3/3) và ở `profile`, nói thẳng:

> **Không dùng ảnh và giọng nói của người học để huấn luyện mô hình.**

Ba dữ kiện đi kèm để lời nói có sức nặng:
- Ảnh được nén **trên máy người dùng** trước khi tải lên.
- Mỗi ảnh chỉ gọi mô hình thị giác **đúng một lần**.
- Công tắc "dùng dữ liệu để huấn luyện" hiển thị **đang tắt** và có giải thích vì sao không bật —
  đây là cam kết sản phẩm, không phải tuỳ chọn người dùng.

Với một sản phẩm yêu cầu người dùng đưa ảnh nhà và giọng nói của chính họ, đây là điều kiện
để tồn tại, không phải điểm cộng.

---

## 8. Cost Meter — biến kiến trúc thành thứ nhìn thấy được

Toàn bộ luận điểm "tiết kiệm" ở slide 09–10 chỉ thuyết phục nếu **nhìn thấy được**. Vì vậy khung
demo có một bộ đếm chạy thật:

| Hành động | Cost Meter |
|---|---|
| Chụp 1 ảnh → nhận diện | VLM **+1** (và chỉ +1, dù vào lại màn `regions` bao nhiêu lần) |
| AI viết đoạn đan xen | LLM **+1** |
| Nhờ AI chỉnh câu nói | LLM **+1** (bấm lần hai mới +1 tiếp) |
| Chọn câu động viên từ kho | **+0** |
| Toàn bộ phiên ôn tập | **+0** |
| Mở bộ từ, tiến độ, hồ sơ | **+0** |

Khoá tính chi phí là **idempotent**: đó chính là cách diễn đạt kỹ thuật của câu
*"sáng tạo không nằm ở việc gọi AI nhiều hơn, mà ở việc gọi AI đúng một lần"* (slide 10).

---

## 9. Ma trận trạng thái bắt buộc

Mỗi màn hình phải được thiết kế cho 4 trạng thái, không chỉ đường hạnh phúc:

| Trạng thái | Yêu cầu |
|---|---|
| **Rỗng** | Nói rõ vì sao rỗng và đưa một hành động cụ thể. Không dùng "Chưa có dữ liệu." |
| **Đang tải** | Skeleton đúng hình dạng nội dung sắp hiện, không phải spinner giữa màn hình trắng. |
| **Lỗi** | Nói được cái gì hỏng, và có lối thoát (thử lại / làm cách khác). |
| **Offline** | **Vẫn ôn tập được** — vì bài tập sinh bằng quy tắc và audio đã cache. Đây là hệ quả trực tiếp của kiến trúc, phải nói ra. |

Màn `system-states` trưng bày cả bốn trạng thái trong một chỗ để người chấm thấy sản phẩm
đã nghĩ tới đường xấu.
