/* ============================================================================
   SnapLife AI — Logic nghiệp vụ của demo
   Owner: Lead.  Thuật toán SM-2 + bộ sinh bài tập bằng QUY TẮC.
   Điểm mấu chốt của deck (tr.8–10): phần lớn bài tập sinh bằng quy tắc,
   không gọi lại AI — nên module này KHÔNG hề chạm tới cost.
   ========================================================================== */

import { CEFR_ORDER, wordById } from './words.js';
import { clozeBank } from './fixtures.js';
import { photos } from './photos.js';

/* ------------------------------- SM-2 ------------------------------------ */
/**
 * Cập nhật lịch ôn theo SM-2 rút gọn.
 * quality: 0–5 (dưới 3 là quên).
 */
export function sm2Update(srs, quality) {
  const next = { ...srs };
  if (quality < 3) {
    next.reps = 0;
    next.lapses = srs.lapses + 1;
    next.interval = 1;
    next.ease = Math.max(1.3, srs.ease - 0.2);
    next.stage = Math.max(0, (srs.stage || 0) - 1);
  } else {
    next.reps = srs.reps + 1;
    if (next.reps === 1) next.interval = 1;
    else if (next.reps === 2) next.interval = 3;
    else next.interval = Math.round(srs.interval * srs.ease);
    next.ease = Math.min(2.8, srs.ease + 0.1);
    next.stage = Math.min(4, (srs.stage || 0) + 1);
  }
  next.dueInDays = next.interval;
  return next;
}

export const stageLabel = [
  'Mới gặp',
  'Nhận ra được',
  'Nhớ ra được',
  'Vững',
  'Đã thuộc',
];

export const stageName = (stage) => stageLabel[Math.min(4, Math.max(0, stage))];

export function dueLabel(dueInDays) {
  if (dueInDays <= 0) return 'Đến hạn hôm nay';
  if (dueInDays === 1) return 'Ôn lại ngày mai';
  return `Ôn lại sau ${dueInDays} ngày`;
}

/* --------------------------- Sinh bài tập -------------------------------- */
function shuffle(list, seed = Math.random) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seed() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Lấy phương án nhiễu cùng trình độ để bài tập không quá dễ. */
export function distractors(wordId, allWords, count = 3) {
  const target = allWords.find((w) => w.id === wordId);
  if (!target) return [];
  const near = allWords.filter((w) => w.id !== wordId && w.cefr === target.cefr);
  const rest = allWords.filter((w) => w.id !== wordId && w.cefr !== target.cefr);
  return shuffle([...shuffle(near), ...shuffle(rest)]).slice(0, count);
}

/** Chọn từ để ôn: ưu tiên từ đến hạn, rồi tới từ đang học, rồi từ mới. */
export function pickReviewWords(allWords, n) {
  const due = allWords.filter((w) => w.srs.dueInDays <= 0 && w.status !== 'known');
  const learning = allWords.filter((w) => w.status === 'learning' && !due.includes(w));
  const fresh = allWords.filter((w) => w.status === 'new' && !due.includes(w));
  const known = allWords.filter((w) => w.status === 'known');
  const ordered = [...due, ...learning, ...fresh, ...known];
  const uniq = [];
  for (const w of ordered) {
    if (!uniq.includes(w)) uniq.push(w);
    if (uniq.length >= n) break;
  }
  return uniq;
}

function clozeFor(wordId) {
  return clozeBank.find((c) => c.wordId === wordId) || null;
}

/**
 * Sinh hàng đợi phiên ôn bằng quy tắc (0 API call).
 * items gồm 5 dạng, xoay vòng để không lặp một dạng bài.
 */
export function buildReviewQueue({ allWords, length = 10, types = ['read', 'cloze', 'tapimg', 'match', 'srs'] }) {
  const countMap = { 2: 4, 10: 10, 20: 18 };
  const total = countMap[length] ?? 10;
  const pool = pickReviewWords(allWords, Math.max(total, 12));
  const items = [];

  // 1 · Đọc tương tác — một lượt đọc, chạm từ để nghe
  if (types.includes('read')) {
    items.push({
      type: 'read',
      id: 'read-1',
      title: 'Đọc tương tác',
      prompt: 'Chạm vào từ màu cam để nghe và xem nghĩa.',
      storyId: 'today',
      focusWordIds: pool.slice(0, 5).map((w) => w.id),
    });
  }

  // 2 · Cloze + 4 · Ghép cặp + 5 · Flashcard SRS — sinh theo quy tắc
  let ci = 0;
  let mi = 0;
  let si = 0;
  for (let i = 0; items.length < total && i < pool.length * 3; i += 1) {
    const w = pool[i % pool.length];
    const kind = types[(i + 1) % types.length];
    if (kind === 'cloze') {
      const bank = clozeFor(w.id);
      const sentence = bank || { sentence: `The word "${w.en}" means ___.`, vi: w.vi };
      items.push({
        type: 'cloze',
        id: `cloze-${ci += 1}`,
        title: 'Cloze điền khuyết',
        prompt: bank ? 'Điền từ đúng vào chỗ trống.' : 'Chọn từ khớp với nghĩa tiếng Việt.',
        wordId: w.id,
        sentence: sentence.sentence,
        vi: sentence.vi,
        options: shuffle([w, ...distractors(w.id, allWords, 3)]).map((o) => ({ id: o.id, en: o.en })),
      });
    } else if (kind === 'match') {
      const group = pool.slice(mi * 2, mi * 2 + 3);
      mi += 1;
      const pairs = (group.length === 3 ? group : pool.slice(0, 3)).map((p) => ({ wordId: p.id, en: p.en, vi: p.vi }));
      items.push({
        type: 'match',
        id: `match-${mi}`,
        title: 'Ghép cặp',
        prompt: 'Nối từ tiếng Anh với nghĩa tiếng Việt.',
        pairs,
      });
    } else if (kind === 'srs') {
      items.push({
        type: 'srs',
        id: `srs-${si += 1}`,
        title: 'Flashcard SRS',
        prompt: 'Bạn có nhớ từ này không?',
        wordId: w.id,
        interval: w.srs.interval,
        stage: w.srs.stage,
      });
    } else if (kind === 'tapimg') {
      // CHỈ sinh dạng "chạm ảnh" khi từ mục tiêu THỰC SỰ có trong một ảnh.
      // Trước đây có `|| photos[0]` làm fallback, sinh ra item mà không vùng nào
      // là đáp án đúng — người học bấm kiểu gì cũng sai.
      const photo = photos.find((p) => p.regions.some((r) => r.wordId === w.id));
      if (photo && photo.regions.length >= 2) {
        items.push({
          type: 'tapimg',
          id: `tapimg-${w.id}`,
          title: 'Chạm ảnh',
          prompt: `Chạm vào "${w.en}" trong ảnh của bạn.`,
          wordId: w.id,
          photoId: photo.id,
          regions: photo.regions.map((r) => ({ ...r, isTarget: r.wordId === w.id })),
        });
      }
    }
  }

  // Bảo đảm phiên luôn có ít nhất một dạng "chạm ảnh" khi người dùng bật nó:
  // đây là dạng bài duy nhất không app nào khác làm được, vì nó cần ảnh của
  // chính người học. Chỉ dùng ảnh có sẵn vùng khoanh nên đáp án luôn tồn tại.
  if (types.includes('tapimg') && !items.some((it) => it.type === 'tapimg')) {
    const photo = photos.find((p) => p.regions.length >= 2);
    if (photo) {
      const target = photo.regions[0];
      const w = allWords.find((x) => x.id === target.wordId);
      if (w) {
        items.splice(Math.min(2, items.length), 0, {
          type: 'tapimg',
          id: `tapimg-${w.id}`,
          title: 'Chạm ảnh',
          prompt: `Chạm vào "${w.en}" trong ảnh của bạn.`,
          wordId: w.id,
          photoId: photo.id,
          regions: photo.regions.map((r) => ({ ...r, isTarget: r.wordId === w.id })),
        });
      }
    }
  }

  return items.slice(0, total);
}

/* ----------------------------- Tiến độ ----------------------------------- */
export function cefrDistribution(allWords) {
  return CEFR_ORDER.map((level) => ({
    level,
    total: allWords.filter((w) => w.cefr === level).length,
    known: allWords.filter((w) => w.cefr === level && w.status === 'known').length,
  }));
}

export function statusCounts(allWords) {
  return {
    known: allWords.filter((w) => w.status === 'known').length,
    learning: allWords.filter((w) => w.status === 'learning').length,
    new: allWords.filter((w) => w.status === 'new').length,
    due: allWords.filter((w) => w.srs.dueInDays <= 0).length,
  };
}

export function stageHistogram(allWords) {
  const buckets = [0, 0, 0, 0, 0];
  allWords.forEach((w) => {
    buckets[Math.min(4, Math.max(0, w.srs.stage))] += 1;
  });
  return buckets;
}

/** Lịch 5 tuần × 7 ngày để vẽ heatmap chuỗi ngày. */
export function streakCalendar({ weeks = 5, activeDays = 24, seed = 7 } = {}) {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const cells = [];
  const total = weeks * 7;
  for (let i = 0; i < total; i += 1) {
    const done = i < activeDays && rnd() > 0.18;
    cells.push({ i, done, minutes: done ? 4 + Math.round(rnd() * 24) : 0 });
  }
  return cells;
}

/** Kết quả test xếp trình độ → CEFR. */
export function levelFromPlacement(correct, total) {
  const ratio = total === 0 ? 0 : correct / total;
  if (ratio >= 0.94) return 'C1';
  if (ratio >= 0.8) return 'B2';
  if (ratio >= 0.6) return 'B1';
  if (ratio >= 0.38) return 'A2';
  return 'A1';
}

/* --------------------------- Luồng chụp ảnh ------------------------------ */
export const COMPRESS_PRESETS = [
  { id: 'morning-desk', from: '2.4 MB', to: '380 KB', ratio: 84 },
  { id: 'ceramic-cup', from: '3.1 MB', to: '412 KB', ratio: 87 },
  { id: 'rainy-street', from: '2.8 MB', to: '455 KB', ratio: 84 },
];

export function compressInfo(photoId) {
  return COMPRESS_PRESETS.find((p) => p.id === photoId) || COMPRESS_PRESETS[0];
}

/** Từ mới sinh ra từ một vùng khoanh (dùng khi người dùng tự khoanh thêm). */
export function suggestWordForRegion(region, allWords) {
  const used = new Set(region.wordId ? [region.wordId] : []);
  return allWords.find((w) => !used.has(w.id) && w.status !== 'known') || allWords[0];
}

export const wordName = (id) => wordById(id)?.en ?? id;
