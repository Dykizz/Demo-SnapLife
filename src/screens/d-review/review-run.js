/* ============================================================================
   SnapLife AI — review-run · Phiên ôn 5 dạng (deck tr.8)
   Owner: screens-review.
   api: [] — mọi bài tập sinh bằng quy tắc (buildReviewQueue + clozeBank + SM-2),
   KHÔNG có chỗ nào gọi ctx.cost.log. Cost Meter phải đứng yên suốt phiên.
   Mở thẳng #/review-run khi chưa có hàng đợi vẫn phải chạy: màn hình tự dựng
   một phiên mặc định bằng quy tắc.
   ========================================================================== */

import { h, clear } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';
import { audio } from '../../core/audio.js';
import {
  advance, applySrs, createQueue, feedbackBlock, formatClock, listenBtn, recordResult,
  reviewState, seededShuffle, storyOf, typeMeta, wordOf, wordSheetBody,
} from './shared.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/** Item "chạm ảnh" thiếu vùng đáp án = lỗi dữ liệu; không tự đoán, chỉ đi tiếp không chấm. */
const tapimgMissingTarget = (item) => item
  && item.type === 'tapimg'
  && !(item.regions || []).some((r) => r.isTarget);

const freshQ = () => ({
  locked: false,
  correct: null,
  note: '',
  chosen: null,
  chosenRegion: null,
  matchSel: null,
  matchSelRight: null,
  matched: {},
  wrongIds: {},
  mistakes: 0,
  lastWrong: null,
  focusOn: null,
  focusNext: false,
  focusHint: false,
  flipped: false,
  rightOrder: null,
  readTaps: 0,
  hint: false,
  srsInfo: null,
});

/* ------------------------------ Khối tiêu đề ----------------------------- */

function headBlock(ctx, s, item) {
  const graded = s.results.filter((r) => r.correct === true || r.correct === false);
  const right = graded.filter((r) => r.correct === true).length;
  const wrong = graded.filter((r) => r.correct === false).length;
  const meta = typeMeta(ctx, item.type);
  const elapsed = s.startedAt ? (Date.now() - s.startedAt) / 1000 : 0;
  return h('div.rv-head', {},
    h('div.row.row--between', { style: { alignItems: 'baseline' } },
      h('span.label', {}, `Câu ${s.index + 1}/${s.queue.length}`),
      h('span.rv-head__cost.mono', {}, icon('zap', 13), '0 API call')),
    ui.progressSeg({ total: s.queue.length, done: Math.min(s.answered, s.queue.length), now: s.index, label: 'Tiến độ phiên ôn' }),
    h('div.rv-head__row', {},
      h('span.rv-typebadge', {}, icon(meta.icon, 15), meta.name),
      h('span.rv-count.rv-count--ok', {}, icon('check-circle', 15), `Đúng ${right}`),
      h('span.rv-count.rv-count--no', {}, icon('x-circle', 15), `Sai ${wrong}`),
      h('span.rv-count', {}, icon('clock', 15), formatClock(elapsed))));
}

/* --------------------------------- Đọc ----------------------------------- */

function readView(P) {
  const { ctx, item, q } = P;
  const story = storyOf(ctx, item.storyId);
  const hydrated = story ? (story.paragraphs ? story : ctx.data.hydrateStory(story)) : null;
  const focus = (item.focusWordIds || []).map((id) => wordOf(ctx, id)).filter(Boolean);

  const openWord = (word, text) => {
    if (word) {
      ui.sheet({
        title: word.en,
        sub: story ? `Trong "${story.title}"` : 'Trong đoạn văn của bạn',
        body: wordSheetBody(ctx, word),
      });
    } else {
      ui.sheet({ title: text, sub: 'Chưa có trong bộ từ', body: wordSheetBody(ctx, null) });
    }
  };

  const wrap = h('div.stack', {});
  wrap.appendChild(h('div.rv-qhead', {},
    h('div.grow', {},
      h('div.rv-prompt', {}, item.prompt || 'Chạm vào từ màu cam để nghe và xem nghĩa.'),
      h('div.muted-2', { style: { fontSize: 'var(--fs-xs)', marginTop: '4px' } },
        story ? `${story.title} · ${story.date} · ${focus.length} từ trọng tâm` : 'Đoạn văn của bạn'))));

  const readHint = h('p.rv-hint', {},
    'Chạm vào từ màu cam để nghe và xem nghĩa. Đây là lượt đọc ngữ cảnh, không chấm đúng/sai.');

  wrap.appendChild(ui.card({
    className: 'rv-read',
    pad: 'lg',
    children: [
      hydrated
        ? ui.interleave(hydrated.paragraphs, {
            onWordTap: (tok, node) => {
              q.readTaps += 1;
              node.setAttribute('aria-expanded', 'true');
              openWord(ctx.data.wordByEn(tok.text), tok.text);
              // Cập nhật lời nhắc tại chỗ: không dựng lại DOM để bàn phím không mất tiêu điểm.
              readHint.textContent = `Bạn đã chạm ${q.readTaps} từ. Nghe lại bằng nút loa trong bảng nghĩa, rồi bấm "Đã hiểu, tiếp tục".`;
            },
          })
        : h('p.muted', {}, 'Không tìm thấy đoạn văn cho lượt đọc này.'),
    ],
  }));

  if (focus.length) {
    wrap.appendChild(h('div.stack.stack--tight', {},
      h('span.label', {}, 'Từ trọng tâm của lượt đọc'),
      ui.chipRow(focus.map((w) => ui.chip({
        label: w.en,
        icon: 'volume-2',
        onClick: () => openWord(w, w.en),
      })), { scroller: true })));
  }

  wrap.appendChild(readHint);

  return wrap;
}

/* -------------------------------- Cloze ---------------------------------- */

function clozeView(P) {
  const { ctx, item, q, answer, paint } = P;
  const word = wordOf(ctx, item.wordId);
  const parts = String(item.sentence || '').split('___');
  const blank = h('span', { class: `rv-blank${q.locked ? (q.correct ? ' rv-blank--ok' : ' rv-blank--no') : ''}` },
    q.locked && word ? word.en : '\u00a0');
  const sentence = h('p.rv-sentence', {}, parts[0] || '', blank, parts.slice(1).join('___'));

  const options = h('div.rv-options', {}, ...(item.options || []).map((o, i) => {
    const isChosen = q.chosen === o.id;
    const isRight = o.id === item.wordId;
    let cls = 'rv-opt';
    if (q.locked) cls += isRight ? ' rv-opt--ok' : isChosen ? ' rv-opt--no' : ' rv-opt--dim';
    return h('button', {
      type: 'button',
      class: cls,
      disabled: q.locked,
      'aria-label': `Đáp án ${LETTERS[i] || i + 1}: ${o.en}`,
      onclick: () => {
        q.chosen = o.id;
        answer(isRight, isRight ? 'Chính xác' : 'Chưa đúng', { wordId: item.wordId });
      },
    },
    h('span.rv-opt__key', {}, LETTERS[i] || String(i + 1)),
    h('span.grow.rv-opt__text', {}, o.en),
    q.locked && isRight ? icon('check-circle', 20) : null,
    q.locked && isChosen && !isRight ? icon('x-circle', 20) : null);
  }));

  const wrap = h('div.stack', {});
  wrap.appendChild(h('div.rv-qhead', {},
    h('div.grow', {}, h('div.rv-prompt', {}, item.prompt || 'Điền từ đúng vào chỗ trống.')),
    !q.locked
      ? ui.button({
          label: q.hint && word ? `Bắt đầu bằng "${word.en[0]}" · ${word.en.length} chữ` : 'Gợi ý',
          variant: 'ghost',
          size: 'sm',
          icon: 'sparkles',
          disabled: q.hint,
          onClick: () => { q.hint = true; q.focusHint = true; paint(); },
        })
      : null));

  wrap.appendChild(ui.card({
    className: 'rv-q',
    pad: 'lg',
    children: [
      ui.badge('Cloze điền khuyết', 'outline', 'edit'),
      sentence,
      options,
      !q.locked ? h('p.rv-hint', {}, 'Chọn một đáp án — bạn nhận phản hồi ngay và vẫn còn câu dịch tiếng Việt để đối chiếu.') : null,
    ],
  }));

  if (q.locked) {
    wrap.appendChild(feedbackBlock({
      ok: q.correct === true,
      title: q.correct ? 'Chính xác' : 'Chưa đúng',
      body: h('div.stack.stack--tight', {},
        h('div', {}, item.vi),
        word ? h('div.rv-fb__ans', {}, icon('arrow-right', 14), h('strong', {}, `${word.en} — ${word.vi}`)) : null),
      extra: [listenBtn(word)],
    }));
  }

  return wrap;
}

/* ------------------------------ Chạm ảnh --------------------------------- */

function tapimgView(P) {
  const { ctx, item, q, answer } = P;
  const photo = ctx.data.photoById(item.photoId);
  const target = wordOf(ctx, item.wordId);
  const regions = item.regions || [];
  // Đáp án đúng do ctx.data sinh ra qua cờ isTarget. Nếu thiếu, đây là lỗi dữ liệu:
  // màn hình KHÔNG tự chọn vùng thay thế — chỉ báo ra và cho đi tiếp không chấm.
  const missingTarget = tapimgMissingTarget(item);

  const choose = (i) => {
    if (q.locked || missingTarget) return;
    q.chosenRegion = i;
    const ok = Boolean(regions[i] && regions[i].isTarget);
    answer(ok, ok ? 'Đúng đồ vật' : 'Chưa đúng', { wordId: item.wordId });
  };

  const nodes = regions.map((r, i) => {
    const rw = wordOf(ctx, r.wordId);
    const isChosen = q.chosenRegion === i;
    const state = missingTarget ? 'off' : q.locked ? (r.isTarget ? 'user' : isChosen ? 'on' : 'off') : 'on';
    const node = ui.bbox(r, {
      label: q.locked || missingTarget ? (rw ? rw.en : '') : undefined,
      state,
      onTap: missingTarget ? undefined : () => choose(i),
    });
    if (!q.locked && !missingTarget) {
      node.tabIndex = 0;
      node.setAttribute('role', 'button');
      node.setAttribute('aria-label', `Vùng ${i + 1} trên ảnh`);
      node.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); choose(i); }
      });
    }
    if (q.locked && isChosen && !r.isTarget) node.classList.add('rv-bbox--wrong');
    return node;
  });

  const wrap = h('div.stack', {});
  wrap.appendChild(h('div.rv-qhead', {},
    h('div.grow', {},
      h('div.rv-prompt', {}, item.prompt || 'Chạm vào đồ vật đúng trong ảnh.'),
      h('div.muted-2', { style: { fontSize: 'var(--fs-xs)', marginTop: '4px' } },
        `${photo.caption} · ${photo.takenAt} · ${regions.length} vùng khoanh`))));

  if (missingTarget) {
    wrap.appendChild(ui.callout({
      tone: 'warning',
      iconName: 'alert-triangle',
      title: 'Câu này thiếu vùng đáp án',
      body: 'Hàng đợi không có vùng nào mang cờ isTarget — lỗi ở bước sinh bài tập, không phải ở người học. Màn hình cố ý không tự đoán đáp án: bấm Tiếp để qua câu khác, câu này không được chấm.',
    }));
  }

  wrap.appendChild(h('div.rv-photo', {},
    ui.photoFrame({ src: photo.src, alt: photo.alt, ratio: 'square', children: nodes })));

  if (!q.locked && !missingTarget) {
    wrap.appendChild(h('p.rv-hint', {},
      'Chạm vào vùng đúng trong ảnh, hoặc dùng Tab rồi Enter để chọn bằng bàn phím. Ảnh vuông 1:1 nên vùng khoanh khớp đúng toạ độ.'));
  }

  if (q.locked && !missingTarget) {
    wrap.appendChild(feedbackBlock({
      ok: q.correct === true,
      title: q.correct ? 'Đúng đồ vật' : 'Chưa đúng',
      body: target
        ? h('div.stack.stack--tight', {},
            h('div', {}, `${target.en} — ${target.vi}`),
            h('div.muted-2', { style: { fontSize: 'var(--fs-xs)' } }, 'Vùng đúng đã được tô xanh trên ảnh.'))
        : h('div', {}, 'Đã chấm xong.'),
      extra: [listenBtn(target)],
    }));
  }

  return wrap;
}

/* ------------------------------ Ghép cặp --------------------------------- */

function matchView(P) {
  const { ctx, item, q, answer, paint } = P;
  const pairs = item.pairs || [];
  if (!q.rightOrder) {
    q.rightOrder = seededShuffle(pairs.map((p) => p.wordId), `${item.id}-${pairs.length}`);
  }
  const matchedCount = pairs.filter((p) => q.matched[p.wordId]).length;
  const pairOf = (id) => pairs.find((p) => p.wordId === id) || { wordId: id, en: id, vi: id };

  const attempt = (rightId, leftId) => {
    q.matchSel = null;
    q.matchSelRight = null;
    const ok = rightId === leftId;
    if (ok) {
      q.matched[leftId] = true;
      audio.correct();
    } else {
      q.mistakes += 1;
      q.wrongIds[leftId] = true;
      q.lastWrong = { rightId, leftId };
      audio.wrong();
    }
    const allDone = pairs.every((p) => q.matched[p.wordId]);
    if (allDone) {
      answer(q.mistakes === 0, q.mistakes === 0 ? 'Ghép đúng mọi cặp' : `Ghép xong, ${q.mistakes} lần chọn sai`, { wordId: null });
    } else {
      // Giữ người dùng bàn phím ở lại khu vực bài tập sau khi dựng lại DOM.
      q.focusNext = true;
      paint();
    }
  };

  const tapLeft = (id) => {
    if (q.matched[id] || q.locked) return;
    q.lastWrong = null;
    if (q.matchSel === id) { q.matchSel = null; q.focusOn = { side: 'en', id }; paint(); return; }
    if (q.matchSelRight) attempt(q.matchSelRight, id);
    else { q.matchSel = id; q.focusOn = { side: 'en', id }; paint(); }
  };

  const tapRight = (id) => {
    if (q.matched[id] || q.locked) return;
    q.lastWrong = null;
    if (q.matchSel) attempt(id, q.matchSel);
    else if (q.matchSelRight === id) { q.matchSelRight = null; q.focusOn = { side: 'vi', id }; paint(); }
    else { q.matchSelRight = id; q.focusOn = { side: 'vi', id }; paint(); }
  };

  const leftIds = pairs.map((p) => p.wordId);
  const leftBtns = [];
  const rightBtns = [];

  const column = (label, ids, mode, sink) => h('div.rv-match__col', {},
    h('span.label', {}, label),
    ...ids.map((id) => {
      const pair = pairOf(id);
      const done = Boolean(q.matched[id]);
      const sel = mode === 'en' ? q.matchSel === id : q.matchSelRight === id;
      const wrong = !done && q.lastWrong && (mode === 'en' ? q.lastWrong.leftId === id : q.lastWrong.rightId === id);
      const btn = h('button', {
        type: 'button',
        class: `rv-match__item${done ? ' rv-match__item--done' : ''}${sel ? ' rv-match__item--sel' : ''}${wrong ? ' rv-match__item--no' : ''}`,
        'aria-pressed': String(sel),
        disabled: done || q.locked,
        'aria-label': `${mode === 'en' ? 'Từ' : 'Nghĩa'}: ${mode === 'en' ? pair.en : pair.vi}${done ? ' — đã ghép đúng' : ''}`,
        onclick: () => (mode === 'en' ? tapLeft(id) : tapRight(id)),
      },
      h('span.grow', {}, mode === 'en' ? pair.en : pair.vi),
      done ? icon('check-circle', 18) : null);
      sink.push({ id, node: btn });
      return btn;
    }));

  const wrap = h('div.stack', {});
  wrap.appendChild(h('div.rv-qhead', {},
    h('div.grow', {},
      h('div.rv-prompt', {}, item.prompt || 'Nối từ tiếng Anh với nghĩa tiếng Việt.'),
      h('div.muted-2', { style: { fontSize: 'var(--fs-xs)', marginTop: '4px' } },
        `Đã nối ${matchedCount}/${pairs.length} cặp · chọn một bên rồi chọn bên còn lại`))));

  wrap.appendChild(ui.card({
    className: 'rv-q',
    pad: 'lg',
    children: [
      h('div.rv-match', {},
        column('Từ tiếng Anh', leftIds, 'en', leftBtns),
        h('div.rv-match__link', { 'aria-hidden': 'true' }, icon('link', 18)),
        column('Nghĩa tiếng Việt', q.rightOrder, 'vi', rightBtns)),
      !q.locked
        ? h('p.rv-hint', {}, 'Bấm được cả bằng bàn phím: Tab tới một mục, Enter để chọn, Tab sang mục tương ứng, Enter để nối.')
        : null,
    ],
  }));

  // Giữ tiêu điểm bàn phím trong khu vực bài tập sau mỗi lần dựng lại DOM.
  if (q.focusOn) {
    const found = (q.focusOn.side === 'en' ? leftBtns : rightBtns).find((it) => it.id === q.focusOn.id && !it.node.disabled);
    q.focusOn = null;
    if (found) requestAnimationFrame(() => found.node.focus());
  } else if (q.focusNext) {
    q.focusNext = false;
    const next = leftBtns.find((it) => !it.node.disabled) || rightBtns.find((it) => !it.node.disabled);
    if (next) requestAnimationFrame(() => next.node.focus());
  }

  if (q.locked) {
    wrap.appendChild(feedbackBlock({
      ok: q.correct === true,
      title: q.correct ? 'Ghép đúng mọi cặp' : 'Ghép xong',
      body: h('div.stack.stack--tight', {},
        ...pairs.map((p) => h('div.rv-fb__pair', {},
          icon('check-circle', 14),
          h('span', {}, `${p.en} — ${p.vi}`))),
        q.mistakes ? h('div.muted-2', { style: { fontSize: 'var(--fs-xs)' } }, `Bạn chọn sai ${q.mistakes} lần trước khi nối hết. Các cặp này sẽ quay lại ở phiên sau.`) : null),
    }));
  }

  return wrap;
}

/* ---------------------------- Flashcard SRS ------------------------------ */

function srsView(P) {
  const { ctx, item, q, answer, paint } = P;
  const word = wordOf(ctx, item.wordId);

  if (!word) {
    return h('div.stack', {},
      ui.callout({
        tone: 'warning',
        iconName: 'alert-triangle',
        title: 'Không tìm thấy từ này trong bộ từ',
        body: 'Từ có thể đã bị xoá. Bấm Tiếp để qua câu khác — phiên vẫn tính là hoàn thành.',
      }));
  }

  const revealed = q.flipped;
  const front = h('div.rv-card__face', {},
    h('div.row', { style: { gap: 'var(--sp-2)' } },
      ui.badge(word.cefr, 'outline'),
      ui.badge(word.pos, 'outline')),
    h('div.rv-card__en', {}, word.en),
    h('div.rv-card__ipa.mono', {}, `/${word.ipa}/`),
    h('div.rv-card__listen', {}, ui.audioButton({ text: word.en, wide: true, label: `Nghe ${word.en}` })),
    h('div.rv-card__tap', {}, icon('refresh', 15), 'Chạm để lật thẻ'));

  const back = h('div.rv-card__face.rv-card__face--back', {},
    h('div.label', {}, 'Nghĩa'),
    h('div.rv-card__vi', {}, word.vi),
    h('p.read', { style: { marginTop: 'var(--sp-3)' } }, word.example),
    h('p.muted', {}, word.exampleVi),
    h('div.rv-card__meta', {},
      ui.keyval('Giai đoạn', ctx.data.stageName(word.srs.stage)),
      ui.keyval('Ôn lại', ctx.data.dueLabel(word.srs.dueInDays))));

  const card = h('button', {
    type: 'button',
    class: `rv-flip${revealed ? ' rv-flip--back' : ''}${q.locked ? ' rv-flip--locked' : ''}`,
    'aria-pressed': String(revealed),
    disabled: q.locked,
    'aria-label': revealed
      ? `Mặt sau của thẻ: ${word.en} nghĩa là ${word.vi}`
      : `Lật thẻ để xem nghĩa của ${word.en}`,
    onclick: () => {
      if (revealed) return;
      q.flipped = true;
      audio.select();
      paint();
    },
  }, revealed ? back : front);

  const qBtn = (label, quality, iconName, variant, hint) => h('div.rv-quality', {},
    (() => {
      const btn = ui.button({
        label,
        icon: iconName,
        variant,
        block: true,
        ariaLabel: `${label} — cập nhật lịch ôn theo SM-2`,
        onClick: () => {
          const info = applySrs(ctx, word.id, quality);
          q.srsInfo = info;
          answer(quality >= 3, quality >= 3 ? 'Đã ghi nhận — từ giãn ra' : 'Đã ghi nhận — từ quay lại sớm', { wordId: word.id });
        },
      });
      btn.classList.add('rv-quality__btn');
      return btn;
    })(),
    h('span.rv-quality__hint', {}, hint));

  const wrap = h('div.stack', {});
  wrap.appendChild(h('div.rv-qhead', {},
    h('div.grow', {},
      h('div.rv-prompt', {}, item.prompt || 'Bạn có nhớ từ này không?'),
      h('div.muted-2', { style: { fontSize: 'var(--fs-xs)', marginTop: '4px' } },
        !revealed ? 'Lật thẻ trước, rồi tự chấm mức độ nhớ.' : 'Tự chấm mức độ nhớ — SM-2 tính lịch ôn ngay tại máy.'))));

  wrap.appendChild(card);

  if (revealed && !q.locked) {
    wrap.appendChild(h('div.stack.stack--tight', {},
      h('span.label', {}, 'Bạn nhớ từ này ở mức nào?'),
      h('div.rv-quality-row', {},
        qBtn('Quên', 1, 'rotate-ccw', 'danger', 'Gặp lại ngay'),
        qBtn('Khó', 3, 'minus', 'secondary', 'Giãn chậm'),
        qBtn('Dễ', 5, 'check-circle', 'primary', 'Giãn nhanh')),
      h('p.rv-hint', {}, 'Chọn xong, lịch ôn của từ cập nhật bằng SM-2 và được lưu vào bộ từ của bạn.')));
  }

  if (q.locked && q.srsInfo) {
    const info = q.srsInfo;
    wrap.appendChild(feedbackBlock({
      ok: q.correct === true,
      title: q.correct ? 'Đã ghi nhận — từ giãn ra' : 'Đã ghi nhận — từ quay lại sớm',
      body: h('div.stack.stack--tight', {},
        h('div', {}, ctx.data.dueLabel(info.afterSrs.dueInDays)),
        h('div.muted-2', { style: { fontSize: 'var(--fs-xs)' } },
          `Giai đoạn ${ctx.data.stageName(info.beforeSrs.stage)} lên ${ctx.data.stageName(info.afterSrs.stage)} · ease ${info.beforeSrs.ease.toFixed(2)} lên ${info.afterSrs.ease.toFixed(2)} · trạng thái ${info.status}`)),
      extra: [listenBtn(word)],
    }));
  }

  return wrap;
}

function questionView(P) {
  if (P.item.type === 'read') return readView(P);
  if (P.item.type === 'cloze') return clozeView(P);
  if (P.item.type === 'tapimg') return tapimgView(P);
  if (P.item.type === 'match') return matchView(P);
  if (P.item.type === 'srs') return srsView(P);
  return h('div.stack', {}, ui.callout({ tone: 'warning', iconName: 'alert-triangle', title: 'Dạng bài chưa hỗ trợ', body: `Item "${P.item.type}" không nằm trong 5 dạng. Bấm Tiếp để qua câu khác.` }));
}

/* --------------------------------- Màn hình ------------------------------ */

export default {
  id: 'review-run',
  title: 'Phiên ôn 5 dạng',
  group: 'd-review',
  chrome: 'appbar',
  api: [],
  notes: [
    'Mở thẳng #/review-run vẫn chạy: chưa có hàng đợi thì màn hình tự sinh phiên mặc định bằng quy tắc và nói rõ điều đó — người chấm không bao giờ gặp màn trắng.',
    'Năm dạng bài dùng chung một hàng đợi: đọc tương tác, cloze, chạm ảnh (bbox 1:1), ghép cặp, flashcard SRS. Sau mỗi câu, index/answered/correct/results được ghi lại vào store để màn tổng kết đọc được.',
    'Phản hồi đúng/sai luôn có icon check-circle / x-circle kèm màu, không dựa vào màu đơn thuần; ghép cặp bấm được bằng bàn phím (Tab + Enter hai bên) chứ không chỉ kéo thả.',
    'Mọi câu trả lời đều ghi lịch ôn vào store "words": flashcard dùng mức người học tự chấm (Quên / Khó / Dễ), còn cloze — chạm ảnh — ghép cặp suy ra chất lượng từ việc đúng hay sai. Tất cả tính bằng SM-2 ngay trên máy nên api: [] và Cost Meter đứng ở 0.',
  ],
  render(ctx) {
    let bootNote = 0;
    if (!reviewState(ctx).queue.length) {
      const st = reviewState(ctx);
      bootNote = createQueue(ctx, st.length, st.types).length;
      ctx.store.set('review.autoBuilt', true);
    }

    const root = h('div.screen');
    // Bàn phím dùng mũi tên trên vùng khoanh / lựa chọn không được đổi màn hình
    // (shell nghe mũi tên ở document để chuyển màn — chặn tại màn này).
    root.addEventListener('keydown', (ev) => {
      if (ev.key.startsWith('Arrow')) ev.stopPropagation();
    });
    let q = freshQ();
    let qKey = null;

    const newQueue = () => {
      const st = reviewState(ctx);
      const built = createQueue(ctx, st.length, st.types);
      qKey = null;
      paint();
      ui.toast(`Đã tạo phiên mới ${built.length} câu bằng quy tắc — 0 API call`, { tone: 'success', iconName: 'zap' });
    };

    const focusAfterPaint = (selector) => {
      requestAnimationFrame(() => {
        const node = root.querySelector(selector);
        if (node) node.focus();
      });
    };

    const answer = (isCorrect, note, opts = {}) => {
      if (q.locked) return;
      const s = reviewState(ctx);
      const item = s.queue[s.index];
      if (!item) return;
      q.locked = true;
      q.correct = isCorrect;
      q.note = note;

      // Mỗi câu trả lời đều cập nhật lịch ôn của từ trong store 'words'.
      // Dạng SRS đã tự chấm theo mức người học chọn trước khi gọi answer().
      if (item.type !== 'srs' && isCorrect !== null) {
        let ids = [];
        if (item.type === 'cloze' || item.type === 'tapimg') ids = item.wordId ? [item.wordId] : [];
        else if (item.type === 'match') {
          const all = (item.pairs || []).map((p) => p.wordId);
          ids = isCorrect ? all : all.filter((id) => q.wrongIds[id]);
        }
        ids.forEach((id) => applySrs(ctx, id, isCorrect ? 4 : 2));
      }

      recordResult(ctx, {
        id: item.id,
        type: item.type,
        wordId: opts.wordId === undefined ? (item.wordId || null) : opts.wordId,
        correct: isCorrect,
        note,
      });
      if (isCorrect === false) audio.wrong();
      else audio.correct();
      paint();
      focusAfterPaint('.rv-next');
    };

    const next = () => {
      const s = reviewState(ctx);
      const item = s.queue[s.index];
      if (!item) return;
      const tapimgBroken = tapimgMissingTarget(item);
      if (!q.locked) {
        if (item.type !== 'read' && !tapimgBroken) return;
        q.locked = true;
        recordResult(ctx, {
          id: item.id,
          type: item.type,
          wordId: item.wordId || null,
          correct: null,
          note: tapimgBroken ? 'thiếu vùng đáp án — không chấm' : `chạm ${q.readTaps} từ`,
        });
      }
      const finished = advance(ctx);
      if (finished) {
        ctx.nav.go('review-summary');
        return;
      }
      qKey = null;
      paint();
      focusAfterPaint('.rv-opt:not([disabled]), .rv-match__item:not([disabled]), .rv-flip, .bbox[tabindex], .en');
    };

    function paint() {
      const s = reviewState(ctx);
      const item = s.queue[s.index];
      const key = `${s.index}|${s.queue.length}`;
      if (qKey !== key) {
        q = freshQ();
        qKey = key;
      }
      clear(root);

      root.appendChild(ui.appBar({
        title: 'Phiên ôn tập',
        sub: item
          ? `Câu ${s.index + 1}/${s.queue.length} · ${typeMeta(ctx, item.type).name}`
          : s.queue.length ? 'Đã hết câu' : 'Chưa có câu nào',
        back: true,
        actions: [ui.iconBtn('refresh', { label: 'Tạo phiên mới bằng quy tắc (0 API call)', onClick: newQueue })],
      }));

      const body = h('div.screen__body.rv-run');
      const cta = h('div.screen__cta');
      root.appendChild(body);
      root.appendChild(cta);

      if (bootNote && !s.results.length) {
        body.appendChild(ui.callout({
          tone: 'primary',
          iconName: 'sparkles',
          title: `Đã tự dựng phiên mặc định ${bootNote} câu`,
          body: 'Bạn mở thẳng màn này nên hệ thống sinh hàng đợi bằng quy tắc (0 API call). Muốn đổi độ dài hay bỏ bớt dạng bài thì về màn Ôn tập.',
        }));
      }

      if (!s.queue.length) {
        body.appendChild(ui.empty({
          iconName: 'layers',
          title: 'Chưa có câu hỏi nào',
          body: 'Hàng đợi đang rỗng. Về màn Ôn tập để bật dạng bài rồi tạo phiên.',
          action: ui.button({ label: 'Về chọn phiên', icon: 'arrow-left', onClick: () => ctx.nav.go('review-hub') }),
        }));
        return;
      }

      if (!item) {
        const graded = s.results.filter((r) => r.correct === true || r.correct === false);
        const right = graded.filter((r) => r.correct === true).length;
        body.appendChild(ui.empty({
          iconName: 'award',
          title: 'Phiên ôn đã xong',
          body: `Bạn hoàn thành ${s.results.length}/${s.queue.length} câu, đúng ${right}/${graded.length} câu có chấm điểm.`,
          action: h('div.stack.stack--tight', {},
            ui.button({ label: 'Xem kết quả phiên', icon: 'bar-chart', block: true, onClick: () => ctx.nav.go('review-summary') }),
            ui.button({ label: 'Ôn thêm phiên nữa', icon: 'refresh', variant: 'secondary', block: true, onClick: () => ctx.nav.go('review-hub') })),
        }));
        return;
      }

      body.appendChild(headBlock(ctx, s, item));
      body.appendChild(questionView({ ctx, s, item, q, answer, next, paint }));

      /* ------------------------------- CTA ------------------------------- */
      const isLast = s.index === s.queue.length - 1;
      const missingTapTarget = tapimgMissingTarget(item);
      const canNext = q.locked || item.type === 'read' || missingTapTarget;
      const label = item.type === 'read' ? 'Đã hiểu, tiếp tục' : isLast ? 'Xem kết quả phiên' : 'Tiếp';
      const btn = ui.button({
        label,
        icon: item.type === 'read' ? 'check' : isLast ? 'bar-chart' : undefined,
        iconRight: item.type === 'read' || isLast ? undefined : 'arrow-right',
        size: 'lg',
        block: true,
        disabled: !canNext,
        ariaLabel: canNext ? label : 'Chọn đáp án trước khi sang câu tiếp theo',
        onClick: next,
      });
      btn.classList.add('rv-next');

      const hint = !canNext
        ? item.type === 'match'
          ? 'Nối hết các cặp để đi tiếp.'
          : 'Chọn đáp án để đi tiếp.'
        : null;

      cta.appendChild(h('div.rv-cta', {},
        hint ? h('p.rv-cta__hint', {}, icon('info', 14), hint) : null,
        btn));

      if (item.type === 'srs' && q.flipped && !q.locked) focusAfterPaint('.rv-quality__btn');
      if (item.type === 'cloze' && q.focusHint) {
        q.focusHint = false;
        focusAfterPaint('.rv-opt');
      }
    }

    paint();
    return root;
  },
};
