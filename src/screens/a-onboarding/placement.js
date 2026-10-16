/* ============================================================================
   placement — Test xếp trình độ: 8 câu, phản hồi đúng/sai + note, kết quả CEFR
   Owner: screens-onboard.  chrome 'appbar', api [] (chấm bằng quy tắc).
   ========================================================================== */

import { h, clear } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';

const LETTERS = ['A', 'B', 'C', 'D'];

/** Lộ trình đề xuất — chữ ở đây viết theo trình độ, không phải câu chung chung. */
function roadmap(level) {
  if (level === 'A1' || level === 'A2') {
    return [
      { n: 1, title: '2 tuần đầu · 10 từ mỗi ngày', text: 'Từ lấy từ chủ đề bạn chọn và từ ảnh bạn chụp, nên nhớ nhanh hơn danh sách chung.' },
      { n: 2, title: 'Tuần 3–4 · đọc đoạn ngắn', text: 'Đoạn tiếng Việt đan xen khoảng 15% tiếng Anh, chạm vào từ để nghe và xem nghĩa.' },
      { n: 3, title: 'Sau 6 tuần · làm lại test này', text: 'Đo tiến bộ bằng chính 8 câu vừa rồi — phần chấm không tốn API call nào.' },
    ];
  }
  if (level === 'B1') {
    return [
      { n: 1, title: 'Bắt đầu ở B1 · 10–20 từ mỗi tuần', text: 'Ưu tiên từ xuất hiện trong ngữ cảnh của bạn: công việc, đi lại, thời tiết.' },
      { n: 2, title: 'Đọc và nói song song', text: 'Mỗi đoạn đọc khoảng 20% tiếng Anh, rồi thu âm lại và nhờ AI chỉnh cách diễn đạt.' },
      { n: 3, title: 'Giữ chuỗi ngày, không tăng khối lượng', text: 'Phiên 10 phút đều đặn thắng phiên 40 phút mỗi cuối tuần.' },
    ];
  }
  return [
    { n: 1, title: 'Bắt đầu ở ' + level + ' · tập trung sắc thái từ', text: 'Học theo cụm và sắc thái (drizzle và downpour khác nhau thế nào) thay vì nghĩa một-một.' },
    { n: 2, title: 'Đọc 20% tiếng Anh, viết lại bằng lời của bạn', text: 'Kể lại đoạn đọc bằng chính trải nghiệm của bạn; AI chỉ sửa chỗ chưa tự nhiên.' },
    { n: 3, title: 'Luyện nói có phản hồi khác biệt', text: 'Xem diff giữa câu bạn nói và câu AI chỉnh lại, lặp tới khi trôi chảy.' },
  ];
}

export default {
  id: 'placement',
  title: 'Test xếp trình độ',
  group: 'a-onboarding',
  chrome: 'appbar',
  api: [],

  notes: [
    'Đây là màn hình chứng minh SnapLife AI cá nhân hoá theo trình độ, nên phản hồi phải dạy được điều gì: mỗi câu trả lời đi kèm note giải thích, không chỉ báo đúng/sai.',
    'Nút "Câu tiếp theo" ở trạng thái disabled cho tới khi trả lời — buộc người dùng đọc phản hồi trước khi đi tiếp, và cũng là chỗ thể hiện trạng thái disabled thật của bộ component.',
    'Cấp độ câu (A1–C1) hiện bằng nhãn mono ở góc phải để thấy độ khó tăng dần, đúng tinh thần test thích ứng của deck.',
    'Kết quả không chỉ trả về chữ CEFR mà còn kèm lộ trình theo trình độ và câu nhắc "chấm bằng quy tắc, 0 API call" — bằng chứng cho luận điểm tiết kiệm chi phí.',
  ],

  render(ctx) {
    const questions = ctx.data.placementQuestions;
    const state = { index: 0, picked: null, revealed: false, answers: [], finished: false };
    ctx.store.set('placement.started', true);

    const body = h('div.screen__body');
    const node = h('div.screen', {},
      ui.appBar({
        title: 'Xếp trình độ',
        sub: `${questions.length} câu · khoảng 3 phút`,
        back: true,
        actions: [ui.iconBtn('rotate-ccw', { label: 'Làm lại từ đầu', onClick: () => reset() })],
      }),
      body);

    const scrollTop = () => requestAnimationFrame(() => node.closest('.app__screen')?.scrollTo({ top: 0 }));

    /* ------------------------------- Thao tác ----------------------------- */
    function reset() {
      state.index = 0;
      state.picked = null;
      state.revealed = false;
      state.answers = [];
      state.finished = false;
      ctx.store.set('placement.answers', []);
      ctx.store.set('placement.result', null);
      paint();
    }

    function answer(choice) {
      if (state.revealed) return;
      const q = questions[state.index];
      state.picked = choice;
      state.revealed = true;
      state.answers[state.index] = { id: q.id, level: q.level, picked: choice, correct: choice === q.answer };
      ctx.store.set('placement.answers', state.answers.slice());
      paint({ focusCta: true });
    }

    function next() {
      if (!state.revealed) return;
      if (state.index === questions.length - 1) {
        state.finished = true;
        const correct = state.answers.filter((a) => a && a.correct).length;
        ctx.store.set('placement.result', ctx.data.levelFromPlacement(correct, questions.length));
        paint();
        scrollTop();
        return;
      }
      state.index += 1;
      state.picked = null;
      state.revealed = false;
      ctx.store.set('placement.index', state.index);
      paint();
      scrollTop();
    }

    /* ------------------------------- Câu hỏi ------------------------------ */
    function optionButton(text, i, q) {
      let mod = '';
      let trail = null;
      if (state.revealed) {
        if (i === q.answer) {
          mod = '.a-pl__opt--ok';
          trail = icon('check-circle', 18);
        } else if (i === state.picked) {
          mod = '.a-pl__opt--no';
          trail = icon('x-circle', 18);
        } else {
          mod = '.a-pl__opt--dim';
        }
      }
      const btn = h(`button.a-pl__opt${mod}`, {
        type: 'button',
        disabled: state.revealed || undefined,
        'aria-pressed': String(i === state.picked),
      },
      h('span.a-pl__key.mono', {}, LETTERS[i] || String(i + 1)),
      h('span.grow', {}, text),
      trail);
      btn.addEventListener('click', () => answer(i));
      return btn;
    }

    function questionView() {
      const q = questions[state.index];
      const done = state.index + (state.revealed ? 1 : 0);
      const correctSoFar = state.answers.filter((a) => a && a.correct).length;

      return h('div.a-pl', {},
        h('div.a-pl__meta', {},
          h('span.label', {}, `Câu ${state.index + 1}/${questions.length}`),
          h('span.a-pl__score.mono', {}, `${correctSoFar} câu đúng`),
          ui.badge(q.level, 'outline')),

        ui.progress({
          value: done,
          max: questions.length,
          label: `Đã làm ${done} trên ${questions.length} câu`,
        }),

        ui.card({ pad: 'lg', className: 'a-pl__card', children: [h('p.a-pl__q', {}, q.q)] }),

        h('div.a-pl__opts', {}, ...q.options.map((text, i) => optionButton(text, i, q))),

        state.revealed
          ? h('div.a-pl__feedback', { role: 'status', 'aria-live': 'polite' },
              ui.callout({
                tone: state.picked === q.answer ? 'success' : 'danger',
                iconName: state.picked === q.answer ? 'check-circle' : 'x-circle',
                title: state.picked === q.answer
                  ? 'Chính xác'
                  : `Chưa đúng — đáp án là "${q.options[q.answer]}"`,
                body: q.note,
              }))
          : null,

        h('div.a-cta', {}, ui.button({
          label: state.index === questions.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo',
          iconRight: 'arrow-right',
          block: true,
          disabled: !state.revealed,
          onClick: next,
        })));
    }

    /* ------------------------------- Kết quả ------------------------------ */
    function resultView() {
      const correct = state.answers.filter((a) => a && a.correct).length;
      const total = questions.length;
      const level = ctx.data.levelFromPlacement(correct, total);
      const matchesProfile = level === ctx.data.user.cefr;

      return h('div.a-pl', {},
        ui.card({ pad: 'lg', className: 'a-pl__result', children: [
          h('span.label', {}, 'Trình độ hiện tại'),
          h('div.a-pl__level', {}, level),
          h('p.muted', {}, `Bạn trả lời đúng ${correct}/${total} câu.`),
          h('div.a-pl__result-meta', {},
            h('span.mono', {}, `CEFR ${level}`),
            ui.badge(matchesProfile ? 'Khớp hồ sơ' : `Hồ sơ đang ghi ${ctx.data.user.cefr}`, matchesProfile ? 'success' : 'warning')),
        ] }),

        ui.callout({
          tone: 'success',
          iconName: 'zap',
          title: '8 câu này chấm bằng quy tắc — 0 API call',
          body: 'Chỉ khi chụp ảnh hoặc nhờ viết đoạn đọc thì mô hình mới được gọi, và mỗi ảnh đúng một lần.',
        }),

        h('div', {},
          ui.sectionTitle('Lộ trình đề xuất cho bạn'),
          h('div.a-steps', { style: { marginTop: 'var(--sp-4)' } },
            ...roadmap(level).map((s) => h('div.a-step', {},
              h('span.a-step__num.mono', {}, String(s.n)),
              h('div.grow', {},
                h('div.a-step__title', {}, s.title),
                h('div.a-step__text', {}, s.text)))))),

        h('div.a-cta', {},
          h('div.stack.stack--tight', {},
            ui.button({ label: 'Chọn chủ đề quan tâm', iconRight: 'arrow-right', block: true, onClick: () => ctx.nav.go('topics') }),
            ui.btnRow(
              ui.button({ label: 'Làm lại', variant: 'secondary', icon: 'rotate-ccw', onClick: reset }),
              ui.button({ label: 'Về trang Hôm nay', variant: 'secondary', onClick: () => ctx.nav.go('home', {}, { replace: true }) })))));
    }

    function paint({ focusCta = false } = {}) {
      clear(body);
      body.appendChild(state.finished ? resultView() : questionView());
      // Sau khi chốt đáp án, đưa tiêu điểm sang nút đi tiếp để người dùng bàn phím
      // không phải tab qua 4 đáp án vừa bị khoá.
      if (focusCta) requestAnimationFrame(() => body.querySelector('.a-cta .btn')?.focus());
    }

    paint();
    return node;
  },
};
