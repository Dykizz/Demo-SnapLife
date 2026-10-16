/* ============================================================================
   topics — Chọn nhiều chủ đề quan tâm, ghi vào ctx.store 'interests'
   Owner: screens-onboard.  chrome 'appbar', api [].
   ========================================================================== */

import { h, clear } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';

export default {
  id: 'topics',
  title: 'Chọn chủ đề',
  group: 'a-onboarding',
  chrome: 'appbar',
  api: [],

  notes: [
    'Chọn chủ đề là lúc sản phẩm hỏi "bạn sống quanh cái gì" — đúng khác biệt so với lộ trình có sẵn của Duolingo. Vì vậy câu dẫn nói rõ chủ đề quyết định từ vựng, đoạn đọc và bài ôn.',
    'Mỗi ô là một nút lớn (không phải chip nhỏ) để ngón tay chạm chắc chắn, kèm số từ thật của chủ đề — người dùng biết mình đang chọn cái gì to cỡ nào.',
    'Trạng thái chọn hiện bằng cả viền, nền và dấu check ở góc, không chỉ đổi màu: người mù màu vẫn phân biệt được.',
    'Nút "Tiếp tục" bị khoá khi chưa chọn gì, và thay vì im lặng thì có callout nói thẳng vì sao nên chọn — không để người dùng bấm mãi mà không hiểu.',
  ],

  render(ctx) {
    const all = ctx.data.topics;
    const valid = new Set(all.map((t) => t.id));
    const selected = new Set(
      (ctx.store.get('interests', []) || []).filter((id) => valid.has(id))
    );

    const grid = h('div.a-topics__grid');
    const hintHost = h('div');
    const countBadge = ui.badge(`0/${all.length} chọn`, 'outline');

    const commit = () => ctx.store.set('interests', [...selected]);

    const cta = ui.button({
      label: 'Tiếp tục',
      iconRight: 'arrow-right',
      block: true,
      disabled: selected.size === 0,
      onClick: () => {
        commit();
        ui.toast(`Đã lưu ${selected.size} chủ đề`, { tone: 'success', iconName: 'check-circle' });
        ctx.nav.go('home', {}, { replace: true });
      },
    });

    const suggestBtn = ui.button({
      label: 'Chọn gợi ý theo hồ sơ',
      variant: 'soft',
      size: 'sm',
      icon: 'sparkles',
      onClick: () => {
        (ctx.data.user.interests || []).forEach((id) => {
          if (valid.has(id)) selected.add(id);
        });
        commit();
        paint();
        ui.toast('Đã chọn theo sở thích trong hồ sơ của bạn', { iconName: 'sparkles' });
      },
    });

    function topicCard(topic) {
      const on = selected.has(topic.id);
      const node = ui.card({
        className: 'a-topic',
        ariaLabel: `${topic.label}, ${topic.words} từ${on ? ', đang chọn' : ''}`,
        children: [
          h('span.a-topic__check', { 'aria-hidden': 'true' }, icon('check', 14)),
          h('span.a-topic__art', {}, icon(topic.icon, 20)),
          h('span.a-topic__label', {}, topic.label),
          h('span.a-topic__count.mono', {}, `${topic.words} từ`),
        ],
        onClick: () => {
          if (selected.has(topic.id)) selected.delete(topic.id);
          else selected.add(topic.id);
          commit();
          paint();
        },
      });
      node.setAttribute('aria-pressed', String(on));
      if (on) node.classList.add('a-topic--on');
      return node;
    }

    function paint() {
      clear(grid);
      all.forEach((t) => grid.appendChild(topicCard(t)));

      countBadge.textContent = `${selected.size}/${all.length} chọn`;
      countBadge.className = `badge badge--${selected.size === 0 ? 'outline' : 'primary'}`;

      clear(hintHost);
      if (selected.size === 0) {
        hintHost.appendChild(ui.callout({
          tone: 'warning',
          iconName: 'alert-triangle',
          title: 'Chưa chọn chủ đề nào',
          body: 'Không chọn vẫn dùng được, nhưng từ vựng sẽ chung chung — đúng thứ bạn vừa thấy ở màn trước.',
        }));
      } else if (selected.size < 3) {
        hintHost.appendChild(ui.callout({
          iconName: 'info',
          title: `Đã chọn ${selected.size} chủ đề`,
          body: 'Thêm một hai chủ đề nữa để AI có đủ ngữ cảnh viết đoạn đọc sát với bạn.',
        }));
      } else {
        hintHost.appendChild(ui.callout({
          tone: 'success',
          iconName: 'check-circle',
          title: `Đã chọn ${selected.size} chủ đề`,
          body: 'Đủ để bắt đầu. Bạn đổi lại bất cứ lúc nào trong phần Hồ sơ.',
        }));
      }

      cta.disabled = selected.size === 0;
      suggestBtn.disabled = selected.size >= all.length;
    }

    const node = h('div.screen', {},
      ui.appBar({
        title: 'Chủ đề quan tâm',
        sub: 'Chọn những gì bạn gặp mỗi ngày',
        back: true,
        actions: [ui.iconBtn('home', { label: 'Về trang Hôm nay', onClick: () => ctx.nav.go('home', {}, { replace: true }) })],
      }),
      h('div.screen__body', {},
        ui.callout({
          iconName: 'sparkles',
          title: 'Chủ đề quyết định nội dung bạn học',
          body: 'Từ vựng, đoạn đọc và bài ôn đều lấy từ những chủ đề này. Chọn ít nhất 3 để bắt đầu.',
        }),
        h('div.row.row--between.row--wrap', {}, countBadge, suggestBtn),
        grid,
        hintHost,
        h('div.a-cta', {}, cta)));

    paint();
    return node;
  },
};
