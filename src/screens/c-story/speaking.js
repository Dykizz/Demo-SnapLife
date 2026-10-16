/* ============================================================================
   Màn speaking — "AI chỉnh lại cách bạn diễn đạt"  (deck slide 06)
   Owner: screens-story.

   Yêu cầu khó nhất của màn này: phần AI sửa phải là một DIFF TRỰC QUAN,
   không phải một đoạn chat. Nên bố cục là:
     câu gốc (chỗ sai gạch ngang)  ↔  câu đã sửa (chỗ mới được tô)
     + danh sách thay đổi kèm lý do, lấy từ ctx.data.speakingSample.notes.
   Phép so khớp ở mức từ dùng LCS (shared.js) nên câu sửa nào cũng ra đúng.
   ========================================================================== */

import { h } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';
import { formatTime, fill, diffWords, changePairs, wordKey } from './shared.js';

const PHASES = ['idle', 'recording', 'recorded', 'correcting', 'corrected'];

function waveform(bars = 26) {
  const wrap = h('div.cs-wave', { 'aria-hidden': 'true' });
  for (let i = 0; i < bars; i += 1) {
    const height = 16 + Math.round(Math.abs(Math.sin(i * 1.7)) * 64);
    wrap.appendChild(h('span.cs-wave__bar', {
      style: { height: `${height}%`, animationDelay: `${(i * 47) % 380}ms` },
    }));
  }
  return wrap;
}

function diffLine(ops, { skip, mark, className }) {
  const nodes = [];
  ops.forEach((op) => {
    if (op.op === skip) return;
    if (nodes.length) nodes.push(document.createTextNode(' '));
    nodes.push(op.op === mark ? h(`span.${className}`, {}, op.text) : document.createTextNode(op.text));
  });
  if (!nodes.length) nodes.push(document.createTextNode('—'));
  return nodes;
}

function scoreRing(label, value) {
  return h('div.cs-score__item', {},
    ui.ring({
      value,
      max: 100,
      size: 74,
      thickness: 7,
      variant: value >= 70 ? 'success' : '',
      label: `${label}: ${value} trên 100`,
      center: h('span.cs-score__n', {}, String(value)),
    }),
    h('span.cs-score__label', {}, label));
}

export default {
  id: 'speaking',
  title: 'Luyện nói & AI chỉnh',
  group: 'c-story',
  chrome: 'appbar',
  api: [{ key: 'llm:speak-1', kind: 'llm', label: 'Chỉnh cách diễn đạt', n: 1 }],
  notes: [
    'Ghi âm phải "có hình hài": waveform chuyển động + đồng hồ đếm thật + tự dừng đúng 6 giây, nên người xem tin là mic đang chạy.',
    'Phần AI sửa là diff hai dòng đối chiếu (gạch ngang = bỏ, nền xanh = thêm) cộng danh sách lý do — cố ý KHÔNG dùng bong bóng chat, vì chat không cho thấy chính xác chỗ nào đổi.',
    'Phép so khớp chạy bằng LCS trên chữ thật của câu, nên chỗ sửa hiện ra từ dữ liệu chứ không phải tô màu gõ tay.',
    'Gọi AI lần thứ hai tốn thêm 1 LLM và được ghi vào Cost Meter — nút đó tồn tại để chứng minh luận điểm "chỉ gọi khi cần".',
  ],
  render(ctx) {
    const sample = ctx.data.speakingSample;
    const photo = ctx.data.photoById(sample.photoId);
    const instant = Boolean(ctx.gallery);
    const ops = diffWords(sample.transcript, sample.corrected);
    const pairs = changePairs(ops);

    let phase = PHASES.includes(ctx.params.state) ? ctx.params.state : 'idle';
    let elapsed = 0;
    let timer = null;
    let wait = null;
    let speech = null;
    let retries = 0;

    const stage = h('div.cs-stage', {});
    const extra = h('div.cs-extra', {});

    const stopTimer = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const stopSpeech = () => {
      if (speech && !speech.stopped) speech.stop();
      speech = null;
    };
    ctx.onCleanup(() => {
      stopTimer();
      if (wait) clearTimeout(wait);
      stopSpeech();
    });

    const setPhase = (next) => {
      phase = next;
      ctx.store.set('speaking.state', next);
      if (next !== 'recording') stopTimer();
      paint();
    };

    const playBack = (text, lang, message) => {
      stopSpeech();
      speech = ctx.audio.speak(text, { lang });
      ui.toast(message, { iconName: 'volume-2' });
    };

    /* ------------------------------ Ghi âm ------------------------------ */
    function startRecording() {
      elapsed = 0;
      setPhase('recording');
      ctx.audio.recordStart();
      if (instant) {
        setPhase('recorded');
        return;
      }
      timer = setInterval(() => {
        elapsed += 1;
        const label = stage.querySelector('.cs-rec__timer');
        if (label) label.textContent = `${formatTime(elapsed)} / ${formatTime(sample.seconds)}`;
        if (elapsed >= sample.seconds) finishRecording();
      }, 1000);
    }

    function finishRecording() {
      stopTimer();
      elapsed = Math.min(Math.max(elapsed, 1), sample.seconds);
      ctx.store.set({ 'speaking.transcript': sample.transcript, 'speaking.seconds': elapsed });
      setPhase('recorded');
    }

    /* --------------------------- Nhờ AI chỉnh --------------------------- */
    function correct({ retry = false } = {}) {
      if (retry) {
        retries += 1;
        ctx.cost.log({ kind: 'llm', label: `Chỉnh lại lần ${retries + 1}` });
      }
      setPhase('correcting');
      if (wait) clearTimeout(wait);
      wait = setTimeout(() => {
        ctx.store.set('speaking.corrected', sample.corrected);
        setPhase('corrected');
        if (retry) {
          ui.toast('Đã gọi AI lần nữa — Cost Meter vừa tăng thêm 1 LLM', { tone: 'warning', iconName: 'zap', ms: 3000 });
        } else {
          ui.toast('AI đã chỉnh lại — xem 2 chỗ cần sửa', { tone: 'success', iconName: 'sparkles' });
        }
      }, instant ? 0 : 1100);
    }

    function reset() {
      stopTimer();
      elapsed = 0;
      retries = 0;
      ctx.store.set({ 'speaking.state': 'idle', 'speaking.transcript': '', 'speaking.corrected': '' });
      setPhase('idle');
    }

    /* ------------------------------ Các khối ------------------------------ */
    function micButton(node, onClick) {
      return h('button.cs-mic', {
        type: 'button',
        'aria-label': 'Bắt đầu ghi âm',
        onClick,
      }, node);
    }

    function buildStage() {
      if (phase === 'idle') {
        return [
          h('div.cs-rec', {},
            micButton(icon('mic', 40), startRecording),
            h('p.cs-rec__hint', {}, 'Nhấn để nói'),
            h('p.cs-rec__sub', {}, `Nói khoảng ${sample.seconds} giây, không cần đúng ngữ pháp — AI sẽ chỉnh lại.`),
            h('div.cs-rec__preview', { 'aria-hidden': 'true' }, waveform(14))),
        ];
      }

      if (phase === 'recording') {
        return [
          h('div.cs-rec.cs-rec--live', {},
            h('div.cs-wave.cs-wave--live', { 'aria-hidden': 'true' },
              ...waveform().childNodes),
            h('p.cs-rec__timer.mono', { 'aria-live': 'polite' },
              `${formatTime(elapsed)} / ${formatTime(sample.seconds)}`),
            h('button.cs-mic.cs-mic--stop', {
              type: 'button',
              'aria-label': 'Dừng ghi âm và xem câu của bạn',
              onClick: finishRecording,
            }, icon('pause', 34)),
            h('p.cs-rec__sub', {}, 'Đang nghe… nhấn để dừng sớm')),
        ];
      }

      if (phase === 'recorded') {
        return [
          h('div.card.cs-transcript', {},
            h('span.label', {}, 'Câu bạn vừa nói'),
            h('p.cs-transcript__text.read', {}, sample.transcript),
            h('div.row.row--between.cs-transcript__foot', {},
              ui.badge(`ghi âm ${formatTime(sample.seconds)}`, 'outline', 'mic'),
              ui.audioButton({
                text: sample.transcript,
                label: 'Nghe lại bản ghi',
                wide: true,
                onClick: () => ui.toast('Đang phát lại bản ghi', { iconName: 'headphones' }),
              }))),
          h('div.cs-actions', {},
            ui.button({
              label: 'Nhờ AI chỉnh lại',
              icon: 'sparkles',
              block: true,
              onClick: () => correct(),
            }),
            ui.button({
              label: 'Nói lại',
              icon: 'rotate-ccw',
              variant: 'secondary',
              block: true,
              onClick: reset,
            })),
          ui.callout({
            iconName: 'zap',
            title: 'Bước này mới tốn 1 lời gọi AI',
            body: 'Ghi âm và nghe lại chạy trên máy bạn. Chỉ khi bạn bấm "Nhờ AI chỉnh lại" mới có một lời gọi LLM.',
          }),
        ];
      }

      if (phase === 'correcting') {
        return [
          h('div.card.cs-correcting', { role: 'status', 'aria-live': 'polite' },
            h('div.row', {}, ui.spinner(), h('strong', {}, 'Đang đối chiếu câu của bạn…')),
            h('p.muted.cs-correcting__sub', {},
              'So từng từ với cách người bản ngữ hay nói, rồi đánh dấu đúng chỗ cần sửa.'),
            ui.skeleton('line'),
            ui.skeleton('line'),
            ui.skeleton('short')),
        ];
      }

      // ------------------------------ corrected ------------------------------
      const scored = [
        scoreRing('Trôi chảy', sample.score.fluency),
        scoreRing('Ngữ pháp', sample.score.grammar),
        scoreRing('Tự nhiên', sample.score.natural),
      ];

      const changeRows = pairs.map((pair, i) => {
        const note = sample.notes.find(
          (n) => wordKey(n.from) === wordKey(pair.from) || wordKey(n.to) === wordKey(pair.to)
        ) || sample.notes[i];
        return h('div.cs-change', {},
          h('div.cs-change__pair', {},
            h('span.cs-change__from', {}, pair.from),
            icon('arrow-right', 16),
            h('span.cs-change__to', {}, pair.to)),
          h('p.cs-change__why', {}, note ? note.why : 'Cách nói này tự nhiên hơn với người bản ngữ.'));
      });

      return [
        h('div.card.cs-score', {},
          h('div.row.row--between', {},
            h('span.label', {}, 'Điểm của câu này'),
            ui.badge(`chỉnh ${pairs.length} chỗ`, 'warning', 'wand')),
          h('div.cs-score__grid', {}, ...scored)),

        h('div.card.cs-diff', { 'aria-label': 'Câu gốc và câu đã chỉnh' },
          h('div.row.row--between.cs-diff__head', {},
            h('span.label', {}, 'Đối chiếu từng chỗ'),
            h('div.cs-diff__legend', {},
              h('span.cs-diff__key.cs-diff__key--del', {}, 'bỏ'),
              h('span.cs-diff__key.cs-diff__key--ins', {}, 'thêm'))),
          h('div.cs-diff__row.cs-diff__row--before', {},
            h('span.cs-diff__tag', {}, 'Bạn nói'),
            h('p.cs-diff__line.read', {}, ...diffLine(ops, { skip: 'ins', mark: 'del', className: 'cs-diff__del' }))),
          h('div.cs-diff__row.cs-diff__row--after', {},
            h('span.cs-diff__tag', {}, 'AI chỉnh lại'),
            h('p.cs-diff__line.read', {}, ...diffLine(ops, { skip: 'del', mark: 'ins', className: 'cs-diff__ins' })))),

        h('section.cs-changes', {},
          h('span.label', {}, 'Vì sao sửa như vậy'),
          ...changeRows),

        h('div.cs-actions', {},
          ui.button({
            label: 'Nghe lại câu đã sửa',
            icon: 'volume-2',
            block: true,
            onClick: () => playBack(sample.corrected, 'en-US', 'Đang đọc câu đã sửa'),
          }),
          ui.btnRow(
            ui.button({
              label: 'Nói lại',
              icon: 'rotate-ccw',
              variant: 'secondary',
              onClick: reset,
            }),
            ui.button({
              label: 'Nhờ AI chỉnh lần nữa',
              icon: 'refresh',
              variant: 'ghost',
              onClick: () => correct({ retry: true }),
            }))),
      ];
    }

    function buildExtra() {
      if (phase !== 'corrected') return [];
      return [
        h('div.card.cs-newwords', {},
          h('div.row.cs-newwords__head', {},
            icon('list-checks', 18),
            h('div', {},
              h('span.label', {}, 'Từ mới tự động vào danh sách ôn tập'),
              h('p.muted.cs-newwords__sub', {}, 'Sinh bằng quy tắc từ chính câu bạn nói — 0 API call.'))),
          ...sample.newWords.map((w) => h('div.cs-newword', {},
            h('span.cs-newword__en', {}, w.en),
            h('span.cs-newword__note', {}, w.note),
            ui.badge('sẽ ôn ngày mai', 'success', 'calendar')))),
        ui.callout({
          tone: 'success',
          iconName: 'shield',
          title: 'Ghi âm không dùng để huấn luyện mô hình',
          body: 'Bản ghi được xử lý trên máy bạn và chỉ giữ lại khi bạn chọn lưu.',
        }),
      ];
    }

    function paint() {
      fill(stage, ...buildStage());
      fill(extra, ...buildExtra());
      stage.dataset.phase = phase;
    }

    paint();

    if (phase === 'recording') {
      // Deep link #/speaking?state=recording mở thẳng vào trạng thái đang ghi.
      const kick = () => startRecording();
      if (instant) {
        elapsed = 3;
        paint();
      } else {
        requestAnimationFrame(kick);
      }
    }
    if (phase === 'corrected') {
      // Deep link chia sẻ thẳng tới phần diff đã chỉnh.
      ctx.store.set({ 'speaking.transcript': sample.transcript, 'speaking.corrected': sample.corrected });
    }

    return h('div.screen', {},
      ui.appBar({
        title: 'Luyện nói',
        sub: 'AI chỉnh lại cách bạn diễn đạt',
        back: true,
        actions: [ui.iconBtn('info', {
          label: 'Vì sao phần này là bản đối chiếu, không phải chat',
          onClick: () => ui.sheet({
            title: 'Diff, không phải chat',
            sub: 'Quyết định thiết kế của màn luyện nói',
            body: [
              h('p.read', {}, 'Một đoạn chat buộc bạn tự dò xem AI đã đổi chữ nào. Bản đối chiếu chỉ đúng chỗ: từ bị bỏ gạch ngang, từ được thêm tô nền xanh, mỗi chỗ kèm lý do.'),
              h('p.read', {}, 'Bạn cũng thấy ngay chi phí: chỉ nút "Nhờ AI chỉnh lại" mới gọi mô hình, nghe lại và ôn tập thì không.'),
            ],
            actions: ui.button({ label: 'Đã hiểu', block: true, onClick: () => document.querySelector('.scrim')?.click() }),
          }),
        })],
      }),
      h('div.screen__body', { class: 'cs-speaking' },
        h('div.card.cs-prompt', {},
          h('img.cs-prompt__img', { src: photo.src, alt: photo.alt, loading: 'lazy', decoding: 'async' }),
          h('div.grow', {},
            h('span.label', {}, 'Câu hỏi hôm nay'),
            h('p.cs-prompt__text', {}, sample.prompt),
            h('p.cs-prompt__sub', {}, 'Nói tự nhiên, sai cũng không sao — đó mới là chỗ AI giúp được.'))),
        stage,
        extra),
    );
  },
};
