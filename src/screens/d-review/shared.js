/* ============================================================================
   SnapLife AI — Nhóm D · Hàm dùng chung cho phiên ôn tập
   Owner: screens-review  |  review-hub, review-run, review-summary
   Toàn bộ bài tập sinh bằng QUY TẮC từ ctx.data — không có lời gọi AI nào ở đây,
   không chạm tới ctx.cost.log. Đó là lý do Cost Meter đứng ở 0 (deck tr.9–10).
   ========================================================================== */

import { h } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';

export const ALL_TYPES = ['read', 'cloze', 'tapimg', 'match', 'srs'];

export const wordsOf = (ctx) => ctx.store.get('words') || [];

export const wordOf = (ctx, id) => wordsOf(ctx).find((w) => w.id === id) || null;

export function typeMeta(ctx, id) {
  return (ctx.data.reviewTypes || []).find((t) => t.id === id)
    || { id, name: id, icon: 'layers', desc: '' };
}

export const typeName = (ctx, id) => typeMeta(ctx, id).name;

export function lengthOptions(ctx) {
  return ctx.data.sessionLengths || [];
}

/** Độ dài phiên phải là một trong 2/10/20 — nếu store có giá trị lạ thì về 10. */
export function normalizeLength(ctx, value) {
  const allowed = lengthOptions(ctx).map((o) => Number(o.value));
  const n = Number(value);
  return allowed.includes(n) ? n : 10;
}

export function lengthLabel(ctx, value) {
  const opt = lengthOptions(ctx).find((o) => Number(o.value) === Number(value));
  return opt ? opt.label : `${value} phút`;
}

function typesFromStore(ctx, raw) {
  const list = Array.isArray(raw) ? raw.filter((t) => ALL_TYPES.includes(t)) : [];
  return list.length ? list : ALL_TYPES.slice();
}

/** Bản sao trạng thái phiên — luôn copy mảng để không sửa thẳng object của store. */
export function reviewState(ctx) {
  const r = ctx.store.get('review') || {};
  return {
    length: normalizeLength(ctx, r.length === undefined ? 10 : r.length),
    types: typesFromStore(ctx, r.types),
    queue: Array.isArray(r.queue) ? r.queue.slice() : [],
    index: Number(r.index) || 0,
    answered: Number(r.answered) || 0,
    correct: Number(r.correct) || 0,
    results: Array.isArray(r.results) ? r.results.slice() : [],
    finished: Boolean(r.finished),
    startedAt: r.startedAt || null,
    finishedAt: r.finishedAt || null,
    knownAtStart: r.knownAtStart === undefined ? null : r.knownAtStart,
    // costAtStart là SỐ apiCalls lúc mở phiên; vẫn đọc được dạng object cũ.
    costAtStart: typeof r.costAtStart === 'number'
      ? r.costAtStart
      : (r.costAtStart && typeof r.costAtStart.apiCalls === 'number'
        ? r.costAtStart.apiCalls
        : (r.costAtStart && typeof r.costAtStart.vlm === 'number' ? 0 : null)),
    costAtStartDetail: r.costAtStartDetail || (r.costAtStart && typeof r.costAtStart.vlm === 'number' ? r.costAtStart : null),
    autoBuilt: Boolean(r.autoBuilt),
  };
}

/* ------------------------------- Hàng đợi -------------------------------- */

/**
 * Bản sao item cho an toàn (không sửa thẳng object mà ctx.data trả về).
 * LƯU Ý: KHÔNG tự suy diễn hay ghi đè đáp án ở tầng màn hình. Đáp án đúng của
 * dạng "chạm ảnh" do ctx.data.buildReviewQueue sinh ra qua cờ `isTarget`;
 * màn hình chỉ trình bày và chấm theo đúng cờ đó. Nếu một item thiếu cờ ấy thì
 * đó là lỗi dữ liệu — phải lộ ra, không được che bằng cách tự chọn một vùng.
 */
function normalizeItem(raw) {
  const item = { ...raw };
  if (item.type === 'tapimg') {
    item.regions = Array.isArray(item.regions) ? item.regions.map((r) => ({ ...r })) : [];
  }
  if (item.type === 'match') {
    item.pairs = Array.isArray(item.pairs) ? item.pairs.map((p) => ({ ...p })) : [];
  }
  if (item.type === 'cloze' && !Array.isArray(item.options)) item.options = [];
  return item;
}

/** Sinh hàng đợi thuần (không ghi store) — dùng để xem trước số câu. */
export function buildQueue(ctx, length, types) {
  const wanted = typesFromStore(ctx, types);
  const items = ctx.data.buildReviewQueue({
    allWords: wordsOf(ctx),
    length: normalizeLength(ctx, length),
    types: wanted,
  });
  return (items || []).map(normalizeItem);
}

/** Ghi hàng đợi mới vào store và trả về queue đã chuẩn hoá. */
export function createQueue(ctx, length, types) {
  const queue = buildQueue(ctx, length, types);
  const snap = ctx.cost.snapshot();
  const counts = ctx.data.statusCounts(wordsOf(ctx));
  const at = Date.now();
  ctx.store.set('review', {
    length: normalizeLength(ctx, length),
    types: typesFromStore(ctx, types),
    queue,
    index: 0,
    answered: 0,
    correct: 0,
    results: [],
    finished: false,
    startedAt: at,
    finishedAt: null,
    knownAtStart: counts.known,
    autoBuilt: false,
    // Mốc đối chiếu của Cost Meter: SỐ API call lúc bắt đầu phiên (đọc lại ở
    // review-summary để chứng minh con số không đổi). Chi tiết theo loại được
    // giữ riêng ở costAtStartDetail, chỉ để hiển thị thêm.
    costAtStart: snap.apiCalls,
    costAtStartDetail: {
      vlm: snap.totals.vlm,
      llm: snap.totals.llm,
      tts: snap.totals.tts,
      rule: snap.totals.rule,
    },
  });
  return queue;
}

/* --------------------------- Ghi kết quả câu ----------------------------- */

/**
 * entry = { id, type, wordId, correct: true|false|null, note }
 * correct = null nghĩa là "đã hoàn thành nhưng không chấm điểm" (dạng đọc).
 */
export function recordResult(ctx, entry) {
  const s = reviewState(ctx);
  const results = s.results.concat([{ ...entry, at: Date.now() }]);
  ctx.store.set({
    'review.results': results,
    'review.answered': s.answered + 1,
    'review.correct': s.correct + (entry.correct === true ? 1 : 0),
  });
  return results;
}

/** Sang câu kế tiếp; trả về true khi phiên đã hết câu. */
export function advance(ctx) {
  const s = reviewState(ctx);
  const next = s.index + 1;
  const finished = next >= s.queue.length;
  ctx.store.set({
    'review.index': next,
    'review.finished': finished,
  });
  if (finished) ctx.store.set('review.finishedAt', Date.now());
  return finished;
}

/** SM-2 ngay trên máy: cập nhật srs của từ rồi ghi lại vào store 'words'. */
export function applySrs(ctx, wordId, quality) {
  const words = wordsOf(ctx);
  const i = words.findIndex((w) => w.id === wordId);
  if (i < 0) return null;
  const before = words[i];
  const after = ctx.data.sm2Update(before.srs, quality);
  let status = before.status;
  if (quality >= 3) status = after.stage >= 4 ? 'known' : 'learning';
  else status = before.status === 'new' ? 'new' : 'learning';
  const updated = { ...before, srs: after, status };
  const next = words.slice();
  next[i] = updated;
  ctx.store.set('words', next);
  return { word: updated, beforeSrs: before.srs, afterSrs: after, statusBefore: before.status, status, quality };
}

/* ------------------------------- Tiện ích -------------------------------- */

export function seededShuffle(list, seed) {
  const arr = list.slice();
  let s = 2166136261;
  const text = String(seed === undefined || seed === null ? 'snaplife' : seed);
  for (let i = 0; i < text.length; i += 1) {
    s ^= text.charCodeAt(i);
    s = Math.imul(s, 16777619);
  }
  s >>>= 0;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function formatClock(seconds) {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function storyOf(ctx, storyId) {
  const stories = ctx.data.stories || [];
  return stories.find((s) => s.id === storyId) || stories[0] || null;
}

/* --------------------------- Khối phản hồi đúng/sai ---------------------- */
/**
 * Phản hồi bắt buộc có CẢ màu và icon (check-circle / x-circle), không chỉ màu —
 * đây là yêu cầu accessibility, không phải trang trí.
 */
export function feedbackBlock({ ok = true, neutral = false, title, body, extra = [] }) {
  const tone = neutral ? 'neutral' : ok ? 'ok' : 'no';
  const iconName = neutral ? 'book-open' : ok ? 'check-circle' : 'x-circle';
  const state = neutral ? 'hoàn thành' : ok ? 'đúng' : 'chưa đúng';
  return h(`div.rv-fb.rv-fb--${tone}`, { role: 'status', 'aria-live': 'polite', 'data-state': state },
    h('div.rv-fb__head', {},
      h('span.rv-fb__icon', {}, icon(iconName, 22)),
      h('div.grow', {},
        h('div.rv-fb__title', {}, title),
        body ? h('div.rv-fb__body', {}, body) : null)),
    extra.length ? h('div.rv-fb__extra', {}, ...extra.filter(Boolean)) : null);
}

/** Nút nghe lại dùng chung cho phần phản hồi. */
export function listenBtn(word) {
  if (!word) return null;
  return ui.audioButton({ text: word.en, wide: true, label: `Nghe lại ${word.en}` });
}

/** Nội dung sheet khi chạm vào một từ tiếng Anh (dạng đọc). */
export function wordSheetBody(ctx, word, extras = []) {
  if (!word) {
    return [
      ui.callout({
        iconName: 'info',
        title: 'Từ này chưa có trong bộ từ của bạn',
        body: 'Bạn vẫn nghe được phát âm. Thêm vào bộ từ ở màn "Khoanh vùng & thẻ từ".',
      }),
      ...extras,
    ];
  }
  return [
    h('div.row', { style: { gap: 'var(--sp-2)', flexWrap: 'wrap' } },
      ui.badge(word.cefr, word.cefr === 'A1' || word.cefr === 'A2' ? 'success' : word.cefr === 'C1' ? 'danger' : 'warning'),
      ui.badge(word.pos, 'outline'),
      ui.badge(ctx.data.stageName(word.srs.stage), 'primary')),
    h('div.rv-word__en', {}, word.en),
    h('div.rv-word__ipa.mono', {}, `/${word.ipa}/`),
    h('div.rv-word__vi', {}, word.vi),
    h('div.rv-word__actions', {}, listenBtn(word)),
    ui.divider(),
    h('p.read', {}, word.example),
    h('p.muted', { style: { marginTop: '6px' } }, word.exampleVi),
    ui.divider(),
    ui.keyval('Ôn lại', ctx.data.dueLabel(word.srs.dueInDays)),
    ...extras,
  ];
}
