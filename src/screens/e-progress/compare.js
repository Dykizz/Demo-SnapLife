/* ============================================================================
   Màn compare — "So sánh"  (deck slide 10)
   Owner: Lead (bổ sung sau khi qa-verify chỉ ra mục 10 của deck chưa có màn hình).

   Vì sao thiết kế theo hàng dọc chứ không phải bảng 4 cột:
   Bảng gốc của deck có 3 cột đối thủ + 1 cột mình. Trên khung 390px thì mỗi cột
   còn ~70px, chữ không đọc được. Thay vào đó mỗi tiêu chí là một thẻ: đối thủ xếp
   gọn phía trên bằng chữ mờ để đối chiếu, SnapLife ở dưới bằng chữ đậm + màu nhấn.
   Giữ đủ thông tin của deck mà vẫn đọc được trên điện thoại.

   Ghi chú kỹ thuật: màn này cố ý CHỈ dùng lớp có sẵn trong components.css và
   base.css, không cần thêm CSS riêng — để không phải sửa styles/screens-e.css
   của nhóm E sau khi nhóm đã bàn giao.
   ========================================================================== */

import { h } from '../../core/dom.js';
import { ui } from '../../core/ui.js';

/** Nội dung lấy từ slide 10 — "Khác biệt không nằm ở kho từ, mà ở ngữ cảnh của chính bạn". */
const CRITERIA = [
  {
    label: 'Nguồn từ',
    theirs: [['Duolingo', 'Có sẵn'], ['Memrise', 'Có sẵn'], ['Anki', 'Tự nhập']],
    ours: 'Ảnh & chủ đề của bạn',
    why: 'Từ đến từ thứ bạn vừa chụp, nên nó gắn với một ký ức cụ thể.',
  },
  {
    label: 'Cá nhân hoá',
    theirs: [['Duolingo', 'Theo lộ trình'], ['Memrise', 'Theo khoá học'], ['Anki', 'Do bạn tự chọn']],
    ours: 'Theo đời sống riêng',
    why: 'Cùng trình độ B1, người thích cà phê và người thích thể thao nhận từ khác nhau.',
  },
  {
    label: 'Ngữ cảnh đọc',
    theirs: [['Duolingo', 'Câu mẫu'], ['Memrise', 'Video ngắn'], ['Anki', 'Không có']],
    ours: 'Truyện Việt–Anh của bạn',
    why: 'Đoạn văn tiếng Việt đan 15–20% tiếng Anh — hiểu ngay mà không phải dịch.',
  },
  {
    label: 'Đa dạng ôn tập',
    theirs: [['Duolingo', 'Trung bình'], ['Memrise', 'Trung bình'], ['Anki', 'Thẻ cơ bản']],
    ours: 'Nhiều dạng, theo thời gian',
    why: '5 dạng bài xoay vòng, chọn phiên 2 / 10 / 20 phút tuỳ lúc bạn rảnh.',
  },
  {
    label: 'Chi phí gọi AI',
    theirs: [['Duolingo', '—'], ['Memrise', '—'], ['Anki', 'Không dùng AI']],
    ours: '1 lần/ảnh · 1 lần/câu',
    why: 'Gọi AI một lần rồi tái sử dụng: bài tập sinh bằng quy tắc, ôn tập tốn 0 API call.',
  },
];

const BENEFITS = [
  { icon: 'git-branch', title: 'Hồ sơ tự cập nhật', text: 'Test 3 phút, tự điều chỉnh theo kết quả học.' },
  { icon: 'target', title: 'Chủ đề & sở thích', text: 'Chọn chủ đề quan tâm, AI gợi ý từ sát người học.' },
  { icon: 'flame', title: 'Động lực mỗi ngày', text: 'Số từ đã thuộc, chuỗi ngày, câu động viên kèm nghĩa tiếng Việt.' },
  { icon: 'clock', title: 'Học theo 2 / 10 / 20 phút', text: 'Phiên ngắn khi rảnh, phiên dài khi có thời gian.' },
];

export default {
  id: 'compare',
  title: 'So sánh',
  group: 'e-progress',
  chrome: 'appbar',
  api: [],
  notes: [
    'Bảng 4 cột của deck không đọc được trên 390px, nên mỗi tiêu chí thành một thẻ dọc: đối thủ ở trên bằng chữ mờ, SnapLife ở dưới bằng chữ đậm + màu nhấn — giữ đủ thông tin mà vẫn đọc được.',
    'Không dùng màu làm tín hiệu duy nhất: cột của mình luôn có nhãn chữ "SnapLife AI" kèm icon, nên người mù màu vẫn theo dõi được.',
    'Ô "chi phí gọi AI" của ba app kia để dấu "—" thay vì đoán số: họ không công bố, nên điền số sẽ là nói sai về đối thủ.',
    'Màn này 0 API call và không cần dữ liệu người dùng — đây là màn duy nhất trả lời trực tiếp câu "khác gì app tôi đang dùng?".',
  ],

  render(ctx) {
    const rows = CRITERIA.map((c) =>
      ui.card({
        className: 'card--pad-lg',
        children: [
          h('div.row.row--between', { style: { alignItems: 'baseline' } },
            h('span.label', {}, c.label),
            ui.badge('SnapLife AI', 'primary')),

          h('ul.stack.stack--tight', { style: { marginTop: 'var(--sp-3)' } },
            ...c.theirs.map(([name, value]) =>
              h('li.row.row--between', { style: { fontSize: 'var(--fs-sm)' } },
                h('span.muted-2', {}, name),
                h('span.muted-2', {}, value)))),

          h('div.divider.divider--tight', {}),

          h('div.row', { style: { alignItems: 'flex-start', gap: 'var(--sp-2)' } },
            h('span', { style: { color: 'var(--success)', flex: '0 0 auto', marginTop: '2px' }, 'aria-hidden': 'true' },
              ctx.icon('check-circle', 20)),
            h('span', { style: { fontWeight: '650', fontSize: 'var(--fs-md)' } }, c.ours)),

          h('p.note', { style: { marginTop: 'var(--sp-3)' } }, c.why),
        ],
      })
    );

    const benefits = BENEFITS.map((b) =>
      ui.card({
        className: 'card--quiet',
        children: h('div.row.row--top', { style: { gap: 'var(--sp-3)' } },
          h('span', {
            'aria-hidden': 'true',
            style: {
              color: 'var(--primary)',
              background: 'var(--primary-soft)',
              borderRadius: 'var(--r-sm)',
              padding: 'var(--sp-2)',
              flex: '0 0 auto',
              display: 'grid',
              placeItems: 'center',
            },
          }, ctx.icon(b.icon, 20)),
          h('div.grow', {},
            h('div', { style: { fontWeight: '650' } }, b.title),
            h('p.note', {}, b.text))),
      })
    );

    return h('div.screen', {},
      ui.appBar({
        title: 'Khác gì app tôi đang dùng?',
        sub: 'Đối chiếu với ba app quen thuộc',
        back: true,
      }),

      h('div.screen__body.e-screen', {},
        ui.callout({
          tone: 'primary',
          iconName: 'sparkles',
          title: 'Khác biệt không nằm ở kho từ',
          body: 'Ba app kia có kho từ rất tốt. Chỗ SnapLife AI khác là nguồn từ: ảnh và câu chuyện của chính bạn.',
        }),

        h('div.stack', {}, ...rows),

        ui.divider('Bạn nhận được gì'),

        h('div.stack.stack--tight', {}, ...benefits),

        ui.callout({
          tone: 'success',
          iconName: 'shield',
          title: 'Không dùng ảnh và giọng nói của người học để huấn luyện mô hình',
          body: 'Đây là cam kết ở phần quyền riêng tư, không phải tuỳ chọn — vì sản phẩm yêu cầu bạn đưa ảnh nhà và giọng nói của chính mình.',
        }),

        h('div.screen__cta', {},
          ui.button({
            label: 'Xem quyền riêng tư',
            icon: 'shield',
            block: true,
            onClick: () => ctx.nav.go('profile'),
          }))),
    );
  },
};
