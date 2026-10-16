/* ============================================================================
   SnapLife AI — review-hub · Chọn phiên ôn (deck tr.8)
   Owner: screens-review.
   api: [] — mọi con số và hàng đợi ở đây sinh bằng quy tắc, không gọi mô hình.
   ========================================================================== */

import { h, clear } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';
import {
  ALL_TYPES, buildQueue, createQueue, lengthLabel, lengthOptions, normalizeLength,
  reviewState, wordOf, wordsOf,
} from './shared.js';

export default {
  id: 'review-hub',
  title: 'Chọn phiên ôn',
  group: 'd-review',
  chrome: 'tabbar',
  tab: 'review',
  api: [],
  notes: [
    'Độ dài phiên đọc sẵn từ store (review.length): chọn 20 phút ở trang Hôm nay thì mở lại đây vẫn thấy 20 được chọn — người học không phải quyết định hai lần.',
    'Năm dạng bài hiện kèm mô tả và bật/tắt được, nên cùng một từ có thể được hỏi bằng nhiều dạng khác nhau — đúng lời hứa "không lặp lại nhàm chán" ở slide 08.',
    'Con số trên nút "Bắt đầu" lấy từ hàng đợi sinh thật bằng buildReviewQueue, không hardcode: đổi độ dài hay bỏ một dạng là số câu đổi theo ngay.',
    'Cả màn hình khai báo api: [] vì bài tập lấy từ bộ từ đã lưu + clozeBank và tính bằng SM-2 tại máy — Cost Meter phải đứng ở 0 (slide 09–10).',
  ],
  render(ctx) {
    const state = {
      length: normalizeLength(ctx, ctx.store.get('review.length', 10)),
      types: reviewState(ctx).types,
    };

    const appBar = ui.appBar({ title: 'Ôn tập', sub: 'Phiên 2 / 10 / 20 phút · 5 dạng bài', back: false });
    const body = h('div.screen__body');
    const cta = h('div.screen__cta');
    const screen = h('div.screen', {}, appBar, body, cta);

    const toggle = (id) => {
      const on = state.types.includes(id);
      if (on && state.types.length <= 1) {
        ui.toast('Cần giữ ít nhất một dạng bài', { tone: 'danger', iconName: 'alert-triangle' });
        return;
      }
      state.types = on
        ? state.types.filter((t) => t !== id)
        : ALL_TYPES.filter((t) => state.types.includes(t) || t === id);
      ctx.store.set('review.types', state.types);
      paint();
    };

    const start = () => {
      createQueue(ctx, state.length, state.types);
      ctx.nav.go('review-run');
    };

    function paint() {
      clear(body);
      clear(cta);

      const words = wordsOf(ctx);
      const counts = ctx.data.statusCounts(words);
      const picked = lengthOptions(ctx).find((o) => Number(o.value) === state.length);
      const preview = buildQueue(ctx, state.length, state.types);
      const prevSession = reviewState(ctx);

      /* -------------------------------- Hero ------------------------------ */
      body.appendChild(ui.card({
        className: 'rv-hero',
        pad: 'lg',
        children: [
          h('div.rv-hero__row', {},
            ui.ring({
              value: Math.min(counts.due, words.length || 1),
              max: words.length || 1,
              size: 88,
              thickness: 10,
              variant: 'success',
              label: `${counts.due} từ đến hạn trong ${words.length} từ`,
              center: h('div', {},
                h('div.rv-ring__num', {}, String(counts.due)),
                h('span.label', {}, 'từ')),
            }),
            h('div.grow', {},
              h('h1.h2', {}, counts.due > 0 ? 'Hôm nay tới lượt ôn' : 'Hôm nay đã sạch lượt đến hạn'),
              h('p.muted', {}, counts.due > 0
                ? `${counts.due} từ đang chờ bạn. Chọn một phiên vừa sức rồi bắt đầu.`
                : 'Không còn từ nào đến hạn — phiên này sẽ ôn lại nhóm từ bạn đã thuộc để giữ nhịp.'),
              h('div.rv-hero__pills', {},
                h('span.rv-pill', {}, icon('check-circle', 14), `Đã thuộc ${counts.known}`),
                h('span.rv-pill', {}, icon('activity', 14), `Đang học ${counts.learning}`),
                h('span.rv-pill', {}, icon('sparkles', 14), `Từ mới ${counts.new}`)))),
        ],
      }));

      /* ------------------------- Lời hứa 0 API call ----------------------- */
      body.appendChild(ui.callout({
        tone: 'success',
        iconName: 'zap',
        title: '0 API call khi ôn tập',
        body: 'Bài tập sinh bằng quy tắc từ bộ từ đã lưu và kho câu có sẵn; SM-2 tính ngay trên máy. Cost Meter ở thanh trên đứng yên suốt phiên — bạn kiểm chứng được.',
      }));

      /* ---------------------------- Độ dài phiên -------------------------- */
      body.appendChild(h('div.stack.stack--tight', {},
        ui.sectionTitle('Độ dài phiên'),
        ui.segmented({
          options: lengthOptions(ctx).map((o) => ({ value: o.value, label: o.label, hint: o.hint })),
          value: state.length,
          ariaLabel: 'Độ dài phiên ôn',
          onChange: (value) => {
            state.length = normalizeLength(ctx, value);
            ctx.store.set('review.length', state.length);
            paint();
          },
        }),
        h('p.muted-2', { style: { fontSize: 'var(--fs-xs)' } },
          picked ? `${picked.hint} — khoảng ${picked.items} câu` : '')));

      /* ----------------------------- 5 dạng bài --------------------------- */
      body.appendChild(h('div.stack.stack--tight', {},
        ui.sectionTitle('5 dạng bài', ui.badge(`${state.types.length}/5 đang bật`, state.types.length === 5 ? 'success' : 'outline')),
        h('div.rv-types', {},
          ...(ctx.data.reviewTypes || []).map((t) => {
            const on = state.types.includes(t.id);
            return h('button', {
              type: 'button',
              class: `rv-type${on ? ' rv-type--on' : ''}`,
              'aria-pressed': String(on),
              'aria-label': `${t.name}: ${on ? 'đang bật' : 'đang tắt'}. ${t.desc}`,
              onclick: () => toggle(t.id),
            },
            h('span.rv-type__icon', {}, icon(t.icon, 20)),
            h('div.grow', {},
              h('div.rv-type__name', {}, t.name),
              h('div.rv-type__desc', {}, t.desc)),
            h('span.rv-type__state', {}, icon(on ? 'check-circle' : 'plus', 18), h('span', {}, on ? 'Bật' : 'Tắt')));
          })),
        h('p.muted-2', { style: { fontSize: 'var(--fs-xs)' } },
          'Cùng một từ sẽ quay lại ở dạng khác trong phiên, nên bạn nhớ theo ngữ cảnh chứ không học vẹt một kiểu câu hỏi.')));

      /* ------------------------------ Xem trước --------------------------- */
      const previewWords = [...new Set(preview.filter((it) => it.wordId).map((it) => it.wordId))]
        .map((id) => wordOf(ctx, id)).filter(Boolean).slice(0, 5);

      body.appendChild(ui.card({
        className: 'rv-preview',
        children: [
          h('div.row.row--between', { style: { alignItems: 'baseline' } },
            h('span.label', {}, 'Phiên sắp bắt đầu'),
            ui.badge(`${preview.length} câu`, preview.length ? 'primary' : 'danger')),
          h('div.rv-preview__row', {},
            h('div', {}, h('div.rv-preview__k', {}, lengthLabel(ctx, state.length)), h('div.muted-2', { style: { fontSize: 'var(--fs-xs)' } }, 'thời lượng')),
            h('div', {}, h('div.rv-preview__k', {}, `${state.types.length} dạng`), h('div.muted-2', { style: { fontSize: 'var(--fs-xs)' } }, 'bài tập')),
            h('div', {}, h('div.rv-preview__k', {}, '0'), h('div.muted-2', { style: { fontSize: 'var(--fs-xs)' } }, 'API call'))),
          previewWords.length
            ? h('div.rv-preview__words', {},
                ...previewWords.map((w) => h('span.rv-pill', {}, w.en)))
            : null,
          preview.length === 0
            ? ui.callout({ tone: 'warning', iconName: 'alert-triangle', title: 'Chưa sinh được câu nào', body: 'Bật thêm ít nhất một dạng bài để có phiên ôn.' })
            : null,
        ],
      }));

      if (prevSession.results.length) {
        body.appendChild(ui.button({
          label: `Xem lại kết quả phiên vừa rồi (${prevSession.results.length} câu)`,
          variant: 'ghost',
          size: 'sm',
          icon: 'bar-chart',
          onClick: () => ctx.nav.go('review-summary'),
        }));
      }

      /* -------------------------------- CTA ------------------------------- */
      cta.appendChild(ui.button({
        label: preview.length ? `Bắt đầu ôn ${preview.length} từ` : 'Chọn thêm dạng bài',
        icon: 'play',
        size: 'lg',
        block: true,
        disabled: preview.length === 0,
        ariaLabel: `Bắt đầu phiên ôn ${preview.length} câu`,
        onClick: start,
      }));
    }

    paint();
    return screen;
  },
};
