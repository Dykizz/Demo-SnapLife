/* ============================================================================
   Nhóm C — tiện ích dùng chung cho compose / reader / speaking / stories
   Owner: screens-story.  Hàm thuần, không phụ thuộc tầng nào khác.

   Vì sao có file này: cả ba màn đều cần đếm từ thật của đoạn, và màn speaking
   cần một phép so khớp câu gốc ↔ câu đã sửa để dựng diff trực quan. Viết một
   lần rồi dùng lại, tránh ba bản logic lệch nhau.
   ========================================================================== */

/** Giây → m:ss (đồng hồ audio, đồng hồ ghi âm). */
export function formatTime(total) {
  const s = Math.max(0, Math.round(Number(total) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Thay toàn bộ con của một node — đổi trạng thái mà không dựng lại cả màn. */
export function fill(node, ...kids) {
  node.replaceChildren(...kids.filter((k) => k !== null && k !== undefined && k !== false));
  return node;
}

export function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Khoá so khớp từ: bỏ dấu câu, không phân biệt hoa thường. */
export function wordKey(raw) {
  return String(raw).toLowerCase().replace(/[^a-z0-9']/g, '');
}

function tokens(text) {
  return (String(text).match(/\S+/g) || []).map((t) => ({ text: t, key: wordKey(t) }));
}

/**
 * So khớp ở mức từ bằng LCS (khoảng cách soạn thảo).
 * Trả về [{ op:'same'|'del'|'ins', text }] theo đúng thứ tự đọc.
 * Đây là dữ liệu thật cho phần diff, không phải chỗ sửa được tô tay.
 */
export function diffWords(before, after) {
  const a = tokens(before);
  const b = tokens(after);
  const n = a.length;
  const m = b.length;

  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i].key && a[i].key === b[j].key
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i].key && a[i].key === b[j].key) {
      ops.push({ op: 'same', text: a[i].text });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ op: 'del', text: a[i].text });
      i += 1;
    } else {
      ops.push({ op: 'ins', text: b[j].text });
      j += 1;
    }
  }
  while (i < n) { ops.push({ op: 'del', text: a[i].text }); i += 1; }
  while (j < m) { ops.push({ op: 'ins', text: b[j].text }); j += 1; }
  return ops;
}

/** Gom các cặp "bỏ → thêm" liền nhau thành danh sách chỗ cần sửa. */
export function changePairs(ops) {
  const pairs = [];
  let removed = [];
  let added = [];
  const flush = () => {
    if (!removed.length && !added.length) return;
    pairs.push({ from: removed.join(' '), to: added.join(' ') });
    removed = [];
    added = [];
  };
  for (const op of ops) {
    if (op.op === 'del') removed.push(op.text);
    else if (op.op === 'ins') added.push(op.text);
    else flush();
  }
  flush();
  return pairs.filter((p) => p.from || p.to);
}

/** Câu chứa từ vừa chạm — để sheet nói "trong đoạn này…". */
export function sentenceAround(paragraphText, word) {
  const sentences = String(paragraphText || '').split(/(?<=[.!?…])\s+/);
  const needle = wordKey(word);
  return sentences.find((s) => wordKey(s).includes(needle)) || String(paragraphText || '').trim();
}

/** Tô đậm từ khoá trong một câu, trả về mảng node con. */
export function emphasise(sentence, word, strongTag = 'strong') {
  const parts = String(sentence).split(new RegExp(`(${escapeRegExp(word)})`, 'gi'));
  return parts.filter(Boolean).map((part) => (
    wordKey(part) === wordKey(word)
      ? Object.assign(document.createElement(strongTag), { textContent: part })
      : document.createTextNode(part)
  ));
}
