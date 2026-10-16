/* ============================================================================
   Nhóm E — helper dùng chung trong nội bộ nhóm (diary, progress, profile,
   system-states). Chỉ nằm trong src/screens/e-progress/**.

   Vì sao có file này:
   · icon đi qua ctx.icons.icon (harness cấp), không nhúng SVG lạ vào màn hình;
   · moods[].face trong fixtures dùng tên icon KHÔNG tồn tại trong icons.js
     ('cloud') nên nhóm E map lại sang icon cùng nghĩa;
   · một khối "e-block" thống nhất cho mọi mục, để 4 màn hình đọc như một sản phẩm.
   ========================================================================== */

import { h } from '../../core/dom.js';
import { icon, iconNames } from '../../core/icons.js';

/** Truy cập bộ icon: ưu tiên ctx.icon / ctx.icons.icon do harness truyền vào. */
export function iconOf(ctx) {
  const fromCtx = (ctx && typeof ctx.icon === 'function' && ctx.icon)
    || (ctx && ctx.icons && ctx.icons.icon);
  return typeof fromCtx === 'function' ? fromCtx : icon;
}

const ICON_SET = new Set(iconNames);

/**
 * Icon cho từng mức sắc thái, lấy thẳng từ ctx.data.moods[].face.
 * Có chốt an toàn: nếu fixtures đổi sang tên icon không tồn tại trong icons.js
 * thì rơi về 'minus' thay vì render ra SVG rỗng.
 */
export function moodIconName(mood) {
  const face = mood && mood.face;
  return face && ICON_SET.has(face) ? face : 'minus';
}
export const moodById = (moods, id) => (moods || []).find((m) => m.id === id) || null;
export const moodLevel = (moods, id) => Math.max(1, (moods || []).findIndex((m) => m.id === id) + 1);

/**
 * Nhãn cho hai loại câu trong kho.
 * Deck slide 07: sắc thái thấp nhận câu GHI NHẬN, không cổ vũ sáo rỗng.
 */
export const TONE_META = {
  acknowledge: {
    badgeLabel: 'Câu ghi nhận',
    tone: 'info',
    icon: 'heart',
    title: 'Ghi nhận, không hối thúc',
    why: 'Sắc thái thấp nên câu chỉ ghi nhận ngày hôm nay của bạn — không "cố lên", không hô khẩu hiệu.',
  },
  encourage: {
    badgeLabel: 'Câu động viên',
    tone: 'primary',
    icon: 'zap',
    title: 'Giữ đà, không khen suông',
    why: 'Sắc thái khá nên câu giữ nhịp học. Câu ngắn, cụ thể, không khen suông.',
  },
};

/** Một khối nội dung có nhãn — dùng cho mọi mục của nhóm E. */
export function block({ kicker, title, meta, children, why, className = '' } = {}) {
  const head = kicker || title || meta
    ? h('div.e-block__head', {},
        kicker ? h('span.label', {}, kicker) : null,
        title ? h('h2.e-block__title', {}, title) : null,
        meta ? h('p.e-block__meta', {}, meta) : null)
    : null;

  const body = Array.isArray(children) ? children : [children];

  return h(`section.e-block${className ? '.' + className : ''}`, {},
    head,
    ...body.filter(Boolean),
    why ? whyLine(why) : null);
}

/** Dòng "vì sao thiết kế như vậy" ngay trong màn hình (không chỉ ở cột phải). */
export function whyLine(text) {
  return h('p.e-why', {}, icon('info', 15), h('span', {}, text));
}

/** Danh sách gạch đầu dòng có icon — tái dùng .note-list của tầng dùng chung. */
export function noteList(lines) {
  return h('ul.note-list', {}, ...(lines || []).map((t) => h('li', {}, icon('check-circle', 15), h('span', {}, t))));
}

/** Dòng chú giải cho biểu đồ: có nhãn chữ + số, không truyền đạt bằng màu đơn thuần. */
export function legendRow({ label, value, cls = '' }) {
  return h('div.e-legend', {},
    h(`span.e-legend__dot${cls ? '.' + cls : ''}`, { 'aria-hidden': 'true' }),
    h('span.grow', {}, label),
    h('span.e-legend__n.mono', {}, String(value)));
}
