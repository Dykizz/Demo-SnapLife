/* ============================================================================
   Màn hình 09 · worddetail — Thẻ từ đầy đủ (deck tr.04)

   Đây là "sản phẩm sau cùng" của luồng ảnh → từ: đủ nghĩa tiếng Việt, IPA, CEFR,
   câu ví dụ có bản dịch, phát âm, và lịch ôn SRS của riêng người học.
   Mở trực tiếp được: #/worddetail?word=downpour   (mặc định: commute)
   api: [] — màn này chỉ đọc dữ liệu, không gọi mô hình.
   Owner: screens-capture  |  phạm vi ghi: src/screens/b-capture/**
   ========================================================================== */

import { h, clear } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';
import { cefrTone, statusMeta } from './_shared.js';

export default {
  id: 'worddetail',
  title: 'Thẻ từ đầy đủ',
  group: 'b-capture',
  chrome: 'appbar',
  api: [],
  notes: [
    'Thứ tự thông tin theo đúng nhịp người học cần: từ → phiên âm (font mono vì là dữ liệu học thuật) → nghĩa Việt → ví dụ có bản dịch → nghe → lịch ôn.',
    'Câu ví dụ dùng font đọc Newsreader cỡ lớn hơn UI vì đây là câu để đọc và nhại lại, không phải nhãn giao diện.',
    'Lịch ôn hiển thị bằng bậc ghi nhớ + số liệu SRS thật (số lần nhớ, số lần quên, hệ số dễ) chứ không chỉ một con số "cấp độ" mơ hồ.',
    'Từ không tồn tại thì hiện trạng thái rỗng có hai lối thoát (bộ từ / khoanh vùng trên ảnh), không để deep link sai làm trắng màn hình.',
    'Nút trước/sau trên app bar giúp ban giám khảo lướt qua nhiều thẻ từ liên tiếp khi thuyết trình.',
  ],

  render(ctx) {
    const data = ctx.data;
    const raw = String(ctx.params.word || 'commute').trim() || 'commute';

    const loadWords = () => ctx.store.get('words', data.words) || data.words;
    let words = loadWords();
    let index = words.findIndex(
      (w) => w.id.toLowerCase() === raw.toLowerCase() || w.en.toLowerCase() === raw.toLowerCase()
    );
    let word = index >= 0 ? words[index] : data.wordById(raw) || data.wordByEn(raw);

    /* --------------------------- Từ không tồn tại --------------------------- */
    if (!word) {
      return h(
        'div.screen.b-screen.b-worddetail',
        {},
        ui.appBar({ title: 'Thẻ từ đầy đủ', sub: `Không tìm thấy "${raw}"`, back: true }),
        h('div.screen__body', {},
          ui.empty({
            iconName: 'search',
            title: `Không có từ "${raw}" trong bộ từ`,
            body: 'Từ này chưa nằm trong bộ từ của bạn. Khoanh vùng trên ảnh để thêm từ mới, hoặc chọn một từ khác trong bộ từ.',
            action: ui.btnRow(
              ui.button({ label: 'Mở bộ từ', icon: 'layers', onClick: () => ctx.nav.go('wordlist') }),
              ui.button({
                label: 'Khoanh vùng trên ảnh',
                icon: 'crop',
                variant: 'secondary',
                onClick: () => ctx.nav.go('regions'),
              })
            ),
          })
        )
      );
    }

    const bar = ui.appBar({
      title: 'Thẻ từ đầy đủ',
      sub: '',
      back: true,
      actions: [
        ui.iconBtn('chevron-left', { label: 'Từ trước', onClick: () => step(-1) }),
        ui.iconBtn('chevron-right', { label: 'Từ tiếp theo', onClick: () => step(1) }),
        ui.iconBtn('layers', { label: 'Mở bộ từ của tôi', onClick: () => ctx.nav.go('wordlist') }),
      ],
    });
    const subNode = bar.querySelector('.appbar__sub');

    const heroHost = h('div.stack.stack--loose');
    const srsHost = h('div');
    const ctaHost = h('div.screen__cta');

    function step(delta) {
      const list = loadWords();
      const i = list.findIndex((w) => w.id === word.id);
      if (i < 0) return;
      const next = list[(i + delta + list.length) % list.length];
      ctx.nav.go('worddetail', { word: next.id });
    }

    function paintSub() {
      if (subNode) subNode.textContent = `${word.en} · ${word.cefr} · ${word.pos}`;
    }

    /* ------------------------------ Thẻ chính ------------------------------ */
    function paintHero() {
      clear(heroHost);
      const meta = statusMeta(word.status);

      heroHost.appendChild(
        ui.card({
          pad: 'lg',
          children: [
            h('div.b-hero', {},
              h('div.b-hero__row', {},
                h('div.grow', {},
                  h('h2.b-hero__en', {}, word.en),
                  h('div.b-hero__ipa.mono', {}, `/${word.ipa}/`)),
                ui.audioButton({ text: word.en, label: `Nghe phát âm ${word.en}` })),
              h('div.b-hero__tags', {},
                ui.badge(word.cefr, cefrTone(word.cefr)),
                ui.badge(word.pos, 'outline'),
                ui.badge(meta.label, meta.tone),
                ...(word.topics || []).map((t) => ui.badge(t, ''))),
              h('p.b-hero__vi', {}, word.vi))
          ],
        })
      );

      heroHost.appendChild(
        ui.card({
          children: [
            ui.sectionTitle('Ví dụ trong ngữ cảnh'),
            h('div.b-listen', {},
              h('div.b-listen__row', {},
                ui.audioButton({ text: word.example, label: `Nghe câu ví dụ: ${word.example}` }),
                h('div.grow', {},
                  h('div.b-listen__t', {}, 'Nghe câu'),
                  h('div.b-listen__sub', {}, 'Giọng Anh · en-US'))),
              h('p.b-wordcard__ex-en', {}, word.example),
              h('p.b-wordcard__ex-vi', {}, word.exampleVi))
          ],
        })
      );

      const related = (loadWords() || [])
        .filter((w) => w.id !== word.id && (w.topics || []).some((t) => (word.topics || []).includes(t)))
        .slice(0, 3);
      if (related.length) {
        heroHost.appendChild(
          h('div.stack.stack--tight', {},
            ui.sectionTitle('Từ cùng chủ đề', h('span.label', {}, 'chạm để mở')),
            ui.list(
              related.map((w) =>
                ui.wordRow({ word: w, cefr: true, onClick: () => ctx.nav.go('worddetail', { word: w.id }) })
              )
            )
          )
        );
      }
    }

    /* -------------------------------- Lịch ôn ------------------------------ */
    function paintSrs() {
      clear(srsHost);
      const stage = word.srs.stage || 0;
      srsHost.appendChild(
        ui.card({
          children: [
            ui.sectionTitle('Lịch ôn của bạn', h('span.badge.badge--success', {}, '0 API call')),
            ui.progressSeg({
              total: 5,
              done: stage + 1,
              now: -1,
              label: `Bậc ghi nhớ ${stage + 1} trên 5`,
            }),
            h('div.row.row--between', {},
              h('span.mono.b-worddetail__stage', {}, `BẬC ${stage + 1}/5`),
              h('span.b-worddetail__stage-name', {}, data.stageName(stage))),
            ui.keyval('Nhớ đúng', `${word.srs.reps} lần`),
            ui.keyval('Từng quên', `${word.srs.lapses} lần`),
            ui.keyval('Hệ số dễ', Number(word.srs.ease).toFixed(2)),
            ui.keyval('Giãn cách tới', word.srs.interval ? `${word.srs.interval} ngày` : 'chưa đặt'),
            ui.callout({
              tone: 'success',
              iconName: 'calendar',
              title: data.dueLabel(word.srs.dueInDays),
              body: 'Ôn tập sinh bằng quy tắc SM-2 nên không tốn API call nào.',
            }),
          ],
        })
      );
    }

    /* --------------------------------- CTA --------------------------------- */
    function paintCta() {
      clear(ctaHost);
      const known = word.status === 'known';
      ctaHost.appendChild(
        known
          ? ui.button({ label: 'Đã thuộc từ này', icon: 'check-circle', variant: 'secondary', block: true, disabled: true })
          : ui.button({ label: 'Đánh dấu đã thuộc', icon: 'bookmark-check', block: true, onClick: markKnown })
      );
      ctaHost.appendChild(
        ui.button({
          label: 'Ôn tập',
          icon: 'list-checks',
          variant: 'secondary',
          onClick: () => ctx.nav.go('review-hub'),
        })
      );
    }

    function markKnown() {
      const id = word.id;
      ctx.store.update((state) => {
        const target = (state.words || []).find((w) => w.id === id);
        if (!target) return;
        target.status = 'known';
        target.srs = data.sm2Update({ ...target.srs }, 5);
      });
      words = loadWords();
      word = words.find((w) => w.id === id) || word;
      paintHero();
      paintSrs();
      paintCta();
      paintSub();
      ui.toast(`Đã đánh dấu "${word.en}" là đã thuộc`, { tone: 'success', iconName: 'check-circle' });
    }

    paintSub();
    paintHero();
    paintSrs();
    paintCta();

    return h(
      'div.screen.b-screen.b-worddetail',
      {},
      bar,
      h('div.screen__body', {}, heroHost, srsHost, ctaHost)
    );
  },
};
