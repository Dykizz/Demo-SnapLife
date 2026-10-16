/* ============================================================================
   splash — Khởi động thương hiệu
   Owner: screens-onboard.  chrome 'none', api [].
   Không phải màn hình chờ: đây là chỗ duy nhất nói trọn định vị sản phẩm.
   ========================================================================== */

import { h } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';

const AUTO_MS = 2000;

export default {
  id: 'splash',
  title: 'Khởi động',
  group: 'a-onboarding',
  chrome: 'none',
  api: [],

  notes: [
    'Splash là màn hình duy nhất nói trọn định vị sản phẩm, nên tagline nằm ngay dưới tên ở cỡ chữ đọc được — không phải dòng pháp lý 10px ở đáy màn.',
    'Ba gạch đầu dòng chính là ba lời hứa sẽ được kiểm chứng ở các màn sau (ảnh thật, đoạn đan xen, chuỗi ngày). Người xem có mốc để đối chiếu thay vì nghe khẩu hiệu.',
    'Thanh tiến trình chạy đúng 2 giây, trùng khớp thời điểm chuyển màn — chuyển động có nghĩa, không phải trang trí. Vẫn có nút "Vào ngay" để giám khảo không phải chờ.',
    'Trong gallery, splash render tĩnh và không tự chuyển: thư viện phải chụp được ảnh mà không bị nhảy màn.',
  ],

  render(ctx) {
    let navigated = false;
    const enter = (replace = true) => {
      if (navigated) return;
      navigated = true;
      ctx.nav.go('onboarding', {}, { replace });
    };

    const points = [
      { icon: 'camera', text: 'Chụp thứ đang ở trước mặt — AI khoanh vùng và sinh thẻ từ' },
      { icon: 'book-open', text: 'Đọc đoạn tiếng Việt đan xen 15–20% tiếng Anh đúng trình độ' },
      { icon: 'flame', text: 'Giữ nhịp mỗi ngày bằng phiên 2, 10 hoặc 20 phút' },
    ];

    const node = h('div.screen.a-splash', {},
      h('div.screen__body.a-splash__body', {},
        h('div.a-splash__glow', { 'aria-hidden': 'true' }),

        h('div.a-splash__hero', {},
          h('div.a-splash__mark', { 'aria-hidden': 'true' },
            icon('camera', 40),
            h('span.a-splash__spark', {}, icon('sparkles', 17))),
          h('div.a-splash__brand', {},
            h('h1.a-splash__name', {}, 'SnapLife AI'),
            h('p.a-splash__tagline', {}, 'Học tiếng Anh qua chính câu chuyện và cuộc sống của bạn')),
          h('ul.a-splash__points', {},
            ...points.map((p) => h('li.a-splash__point', {}, icon(p.icon, 17), h('span', {}, p.text))))),

        h('div.a-splash__foot', {},
          h('div.a-splash__bar', { 'aria-hidden': 'true' }, h('div.a-splash__fill')),
          h('p.a-splash__status', { role: 'status' }, 'Đang chuẩn bị không gian học của bạn…'),
          h('p.label.a-splash__team', {}, ctx.data.TEAM.join(' · ')),
          h('div.a-splash__skip', {},
            ui.button({
              label: 'Vào ngay',
              variant: 'ghost',
              size: 'sm',
              iconRight: 'arrow-right',
              onClick: () => enter(false),
            })))));

    // Gallery render tĩnh: không hẹn giờ, không nhảy màn.
    if (!ctx.gallery) {
      const timer = setTimeout(() => enter(true), AUTO_MS);
      ctx.onCleanup(() => clearTimeout(timer));
    }

    return node;
  },
};
