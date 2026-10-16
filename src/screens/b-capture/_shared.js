/* ============================================================================
   Nhóm B — tiện ích dùng chung nội bộ: capture · regions · wordlist · worddetail
   Owner: screens-capture  |  phạm vi ghi: src/screens/b-capture/**

   Không import dữ liệu ở đây: mọi màn hình đọc `ctx.data` theo hợp đồng
   docs/BUILD-SPEC.md §3. File này chỉ chứa hàm thuần, không giữ trạng thái.
   ========================================================================== */

/** A1/A2 = nền tảng, B1/B2 = trung cấp, C1 = cao — khớp bảng màu badge có sẵn. */
export const cefrTone = (cefr) =>
  cefr === 'A1' || cefr === 'A2' ? 'success' : cefr === 'B1' || cefr === 'B2' ? 'warning' : 'danger';

const STATUS_META = {
  known: { label: 'Đã thuộc', tone: 'success' },
  learning: { label: 'Đang học', tone: 'warning' },
  new: { label: 'Từ mới', tone: 'info' },
};

export const statusMeta = (status) =>
  STATUS_META[status] || { label: status || 'Chưa xếp loại', tone: 'outline' };

/**
 * Bỏ dấu tiếng Việt để gõ "cai ca" vẫn tìm ra "cái ca".
 * Người dùng Việt gõ không dấu là chuyện thường, không nên bắt họ gõ đúng dấu.
 */
export const fold = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

/** Khớp một từ với từ khoá tìm kiếm (tiếng Anh, nghĩa Việt hoặc phiên âm). */
export const wordMatches = (word, query) => {
  const q = fold(query);
  if (!q) return true;
  return fold(word.en).includes(q) || fold(word.vi).includes(q) || fold(word.ipa).includes(q);
};

/** Độ trùng nhau của hai vùng — dùng để đặt vùng mới vào chỗ còn trống. */
export function overlapArea(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}
