/* ============================================================================
   SnapLife AI — review-summary · Kết quả phiên + bằng chứng 0 API call (tr.09)
   Owner: screens-review.
   api: [] — màn này chỉ đọc lại kết quả phiên và đối chiếu Cost Meter.
   ========================================================================== */

import { h } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';
import { formatClock, reviewState, wordOf, wordsOf } from './shared.js';

function cefrTone(cefr) {
  if (cefr === 'A1' || cefr === 'A2') return 'success';
  if (cefr === 'C1') return 'danger';
  return 'warning';
}

function wordResultRow(ctx, word, tone) {
  return h('button', {
    type: 'button',
    class: `rv-res rv-res--${tone}`,
    'aria-label': `Mở thẻ từ ${word.en} — ${word.vi}`,
    onclick: () => ctx.nav.go('worddetail', { word: word.id }),
  },
  h('span.rv-res__icon', {}, icon(tone === 'ok' ? 'check-circle' : tone === 'no' ? 'x-circle' : 'book-open', 18)),
  h('div.grow', {},
    h('div.rv-res__title', {}, word.en),
    h('div.muted-2', { style: { fontSize: 'var(--fs-xs)' } },
      `${word.vi} · ${ctx.data.stageName(word.srs.stage)} · ${ctx.data.dueLabel(word.srs.dueInDays)}`)),
  ui.badge(word.cefr, cefrTone(word.cefr)));
}

export default {
  id: 'review-summary',
  title: 'Kết quả phiên',
  group: 'd-review',
  chrome: 'appbar',
  api: [],
  notes: [
    'Màn tổng kết chỉ đọc lại dữ liệu phiên (results, startedAt, costAtStart) chứ không tính lại bằng AI — nên mở lại lúc nào cũng ra đúng con số cũ.',
    'Khối chi phí đặt cạnh kết quả học tập: nó đối chiếu Cost Meter trước và sau phiên để chứng minh "0 API call" bằng số, không chỉ bằng một dòng chữ (slide 09–10).',
    'Từ đúng và từ sai được tách thành hai danh sách bấm được sang thẻ từ, biến phần tổng kết thành bước tiếp theo chứ không phải điểm dừng.',
    'Biểu đồ theo dạng bài cho thấy cùng một từ được hỏi bằng nhiều dạng — đúng lời hứa ở slide 08.',
  ],
  render(ctx) {
    const s = reviewState(ctx);
    const results = s.results;
    const graded = results.filter((r) => r.correct === true || r.correct === false);
    const right = graded.filter((r) => r.correct === true).length;
    const wrong = graded.filter((r) => r.correct === false).length;
    const readCount = results.filter((r) => r.correct === null || r.correct === undefined).length;
    const accuracy = graded.length ? Math.round((right / graded.length) * 100) : 0;
    const total = s.queue.length;
    const elapsed = s.startedAt ? Math.max(0, ((s.finishedAt || Date.now()) - s.startedAt) / 1000) : 0;

    const snap = ctx.cost.snapshot();
    // Mốc duy nhất để đối chiếu là con số apiCalls ghi lúc mở phiên. Không có mốc
    // (mở thẳng màn tổng kết) thì hiện "—" chứ không được tự nhận là 0.
    const before = s.costAtStart;
    const detail = s.costAtStartDetail;
    const hasBase = typeof before === 'number';
    const deltaCalls = hasBase ? snap.apiCalls - before : null;
    const deltaOf = (kind) => (hasBase && detail && typeof detail[kind] === 'number'
      ? Math.max(0, snap.totals[kind] - detail[kind])
      : null);
    const num = (v) => (v === null ? '—' : String(Math.max(0, v)));

    const counts = ctx.data.statusCounts(wordsOf(ctx));
    const gained = s.knownAtStart === null ? null : counts.known - s.knownAtStart;

    const body = h('div.screen__body');
    const screen = h('div.screen', {},
      ui.appBar({
        title: 'Kết quả phiên ôn',
        sub: results.length ? `${right}/${graded.length} câu chấm điểm đúng · ${formatClock(elapsed)}` : 'Chưa có phiên nào',
        back: true,
      }),
      body,
      h('div.screen__cta', {},
        h('div.rv-cta', {},
          ui.btnRow(
            ui.button({ label: 'Về trang Hôm nay', icon: 'home', variant: 'secondary', onClick: () => ctx.nav.go('home') }),
            ui.button({ label: 'Ôn thêm', icon: 'refresh', onClick: () => ctx.nav.go('review-hub') })))));

    if (!results.length) {
      body.appendChild(ui.callout({
        tone: 'primary',
        iconName: 'info',
        title: 'Chưa có phiên ôn nào trong lượt này',
        body: 'Bạn mở thẳng màn tổng kết nên chưa có dữ liệu. Bắt đầu một phiên ở màn Ôn tập rồi quay lại đây — khối chứng minh chi phí bên dưới vẫn đúng cho mọi phiên.',
      }));
      body.appendChild(ui.button({
        label: 'Bắt đầu ôn tập',
        icon: 'play',
        size: 'lg',
        block: true,
        onClick: () => ctx.nav.go('review-hub'),
      }));
    } else {
      /* ------------------------------ Tổng quan --------------------------- */
      body.appendChild(ui.card({
        className: 'rv-hero',
        pad: 'lg',
        children: [
          h('div.rv-hero__row', {},
            ui.ring({
              value: accuracy,
              max: 100,
              size: 96,
              thickness: 10,
              variant: accuracy >= 70 ? 'success' : '',
              label: `Độ chính xác ${accuracy}%`,
              center: h('div', {},
                h('div.rv-ring__num', {}, `${accuracy}%`),
                h('span.label', {}, 'chính xác')),
            }),
            h('div.grow', {},
              h('h1.h2', {}, accuracy >= 70 ? 'Phiên này khá tốt' : 'Phiên này còn vài từ cần gặp lại'),
              h('p.muted', {}, `Bạn hoàn thành ${results.length}/${total || results.length} câu trong ${formatClock(elapsed)}. Đọc tương tác ${readCount} lượt, ${graded.length} câu có chấm điểm.`),
              h('div.rv-hero__pills', {},
                h('span.rv-pill', {}, icon('check-circle', 14), `Đúng ${right}`),
                h('span.rv-pill', {}, icon('x-circle', 14), `Sai ${wrong}`),
                h('span.rv-pill', {}, icon('clock', 14), formatClock(elapsed))))),
          ui.statGrid([
            { label: 'Đã thuộc thêm', value: gained === null ? '—' : gained > 0 ? `+${gained}` : '0', sub: `${counts.known} từ đã thuộc` },
            { label: 'Từ cần gặp lại', value: String(wrong) },
            { label: 'Lượt đọc', value: String(readCount) },
            { label: 'API call', value: String(deltaCalls), sub: 'sinh bằng quy tắc' },
          ]),
        ],
      }));

      /* ---------------------------- Theo dạng bài ------------------------- */
      const rows = (ctx.data.reviewTypes || []).map((t) => {
        const ofType = results.filter((r) => r.type === t.id);
        const okType = ofType.filter((r) => r.correct === true).length;
        return {
          label: t.name,
          value: ofType.length,
          color: ofType.length && okType === ofType.filter((r) => r.correct !== null).length ? 'success' : 'primary',
        };
      }).filter((r) => r.value > 0);

      if (rows.length) {
        body.appendChild(h('div.stack.stack--tight', {},
          ui.sectionTitle('Bạn đã làm những dạng nào', ui.badge(`${rows.length}/5 dạng`, 'outline')),
          ui.barList(rows),
          h('p.muted-2', { style: { fontSize: 'var(--fs-xs)' } },
            'Một từ có thể xuất hiện ở nhiều dạng — đó là cách phiên ôn không lặp lại nhàm chán.')));
      }

      /* ------------------------------ Từ vựng ----------------------------- */
      const okIds = [...new Set(results.filter((r) => r.correct === true && r.wordId).map((r) => r.wordId))];
      const noIds = [...new Set(results.filter((r) => r.correct === false && r.wordId).map((r) => r.wordId))];
      const okWords = okIds.map((id) => wordOf(ctx, id)).filter(Boolean);
      const noWords = noIds.map((id) => wordOf(ctx, id)).filter(Boolean);

      body.appendChild(h('div.stack.stack--tight', {},
        ui.sectionTitle('Từ bạn nhớ tốt', ui.badge(`${okWords.length} từ`, 'success')),
        okWords.length
          ? h('div.rv-res-list', {}, ...okWords.map((w) => wordResultRow(ctx, w, 'ok')))
          : h('p.muted', {}, 'Chưa có từ nào được chấm đúng trong phiên này.')));

      body.appendChild(h('div.stack.stack--tight', {},
        ui.sectionTitle('Từ cần ôn lại', ui.badge(`${noWords.length} từ`, noWords.length ? 'danger' : 'outline')),
        noWords.length
          ? h('div.rv-res-list', {}, ...noWords.map((w) => wordResultRow(ctx, w, 'no')))
          : h('p.muted', {}, 'Không có từ nào bị chấm sai. Đây là lúc giãn khoảng cách ôn cho nhóm từ còn lại.')));

      /* ---------------------------- Nhật ký câu --------------------------- */
      body.appendChild(h('div.stack.stack--tight', {},
        ui.sectionTitle('Nhật ký từng câu'),
        h('div.rv-log', {}, ...results.map((r, i) => {
          const w = r.wordId ? wordOf(ctx, r.wordId) : null;
          const tone = r.correct === true ? 'ok' : r.correct === false ? 'no' : 'neutral';
          return h('div', { class: `rv-log__row rv-log__row--${tone}` },
            h('span.rv-log__i.mono', {}, String(i + 1).padStart(2, '0')),
            h('span.rv-log__icon', {}, icon(r.correct === true ? 'check-circle' : r.correct === false ? 'x-circle' : 'book-open', 16)),
            h('div.grow', {},
              h('div.rv-log__title', {}, w ? w.en : (ctx.data.reviewTypes.find((t) => t.id === r.type) || {}).name || r.type),
              h('div.muted-2', { style: { fontSize: 'var(--fs-xs)' } },
                `${(ctx.data.reviewTypes.find((t) => t.id === r.type) || {}).name || r.type}${r.note ? ` · ${r.note}` : ''}`)));
        }))));
    }

    /* ------------------- Khối chứng minh 0 API call (slide 09) ------------ */
    body.appendChild(ui.card({
      className: 'rv-cost',
      pad: 'lg',
      children: [
        ui.sectionTitle('Chi phí AI của phiên', ui.badge('slide 09–10', 'outline')),
        h('div.rv-cost__hero', {},
          h('div.rv-cost__n', {},
            h('span.rv-cost__num', {}, hasBase ? String(Math.max(0, deltaCalls)) : '—'),
            h('span.label', {}, 'API call phát sinh')),
          h('div.grow', {},
            ui.keyval('VLM · nhận diện ảnh', hasBase ? `${num(deltaOf('vlm'))} lần` : '—'),
            ui.keyval('LLM · viết đoạn đan xen', hasBase ? `${num(deltaOf('llm'))} lần` : '—'),
            ui.keyval('TTS · tổng hợp giọng đọc', hasBase ? `${num(deltaOf('tts'))} lần` : '—'),
            ui.keyval('Bài tập sinh bằng quy tắc', `${total || results.length} câu`))),
        ui.callout({
          tone: 'success',
          iconName: 'check-circle',
          title: '0 API call — toàn bộ phiên sinh bằng quy tắc',
          body: 'Bài tập lấy từ bộ từ đã lưu và kho câu cloze có sẵn; lịch ôn tính bằng SM-2 ngay trên máy. Không có lời gọi mô hình nào từ lúc bắt đầu phiên tới lúc tổng kết.',
        }),
        hasBase
          ? h('div.rv-cost__compare', {},
              ui.keyval('Cost Meter trước phiên', `${before} API call`),
              ui.keyval('Cost Meter sau phiên', `${snap.apiCalls} API call`),
              ui.badge(deltaCalls === 0 ? 'không đổi' : `${deltaCalls > 0 ? '+' : ''}${deltaCalls}`, deltaCalls === 0 ? 'success' : 'danger', deltaCalls === 0 ? 'check-circle' : 'alert-triangle'))
          : h('p.muted-2', { style: { fontSize: 'var(--fs-xs)' } },
              `Chưa có mốc Cost Meter của phiên (màn này được mở thẳng), nên chưa thể đối chiếu trước/sau. Cost Meter toàn demo hiện tại: ${snap.apiCalls} API call — phiên ôn tập không cộng vào con số này.`),
      ],
    }));

    return screen;
  },
};
