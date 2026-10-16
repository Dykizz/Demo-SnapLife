/* ============================================================================
   SnapLife AI — Registry màn hình
   Owner: Lead.
   Nạp 5 nhóm bằng dynamic import + try/catch: một nhóm lỗi KHÔNG làm sập demo.
   Màn hình chưa làm xong vẫn hiện trong rail dưới dạng "đang hoàn thiện",
   nên trong lúc 5 nhóm làm song song, khung demo vẫn chạy và bấm được.
   ========================================================================== */

import { h } from './dom.js';
import { ui } from './ui.js';

export const GROUPS = [
  { id: 'a', dir: 'a-onboarding', title: 'Nhập môn & Trang chủ', owner: 'screens-onboard' },
  { id: 'b', dir: 'b-capture', title: 'Chụp ảnh & Từ vựng', owner: 'screens-capture' },
  { id: 'c', dir: 'c-story', title: 'Câu chuyện & Luyện nói', owner: 'screens-story' },
  { id: 'd', dir: 'd-review', title: 'Ôn tập', owner: 'screens-review' },
  { id: 'e', dir: 'e-progress', title: 'Tiến độ & Hệ thống', owner: 'screens-progress' },
];

/** Bản đồ màn hình đã chốt — dùng cho rail và để phát hiện màn hình còn thiếu. */
export const PLANNED = [
  { id: 'splash', title: 'Khởi động', group: 'a-onboarding' },
  { id: 'onboarding', title: 'Onboarding 3 bước', group: 'a-onboarding' },
  { id: 'placement', title: 'Test xếp trình độ', group: 'a-onboarding' },
  { id: 'topics', title: 'Chọn chủ đề', group: 'a-onboarding' },
  { id: 'home', title: 'Hôm nay', group: 'a-onboarding' },

  { id: 'capture', title: 'Chụp ngữ cảnh', group: 'b-capture' },
  { id: 'regions', title: 'Khoanh vùng & thẻ từ', group: 'b-capture' },
  { id: 'wordlist', title: 'Bộ từ của tôi', group: 'b-capture' },
  { id: 'worddetail', title: 'Thẻ từ đầy đủ', group: 'b-capture' },

  { id: 'compose', title: 'Kể lại một ngày', group: 'c-story' },
  { id: 'reader', title: 'Đoạn đan xen', group: 'c-story' },
  { id: 'speaking', title: 'Luyện nói & AI chỉnh', group: 'c-story' },
  { id: 'stories', title: 'Truyện đã lưu', group: 'c-story' },

  { id: 'review-hub', title: 'Chọn phiên ôn', group: 'd-review' },
  { id: 'review-run', title: 'Phiên ôn 5 dạng', group: 'd-review' },
  { id: 'review-summary', title: 'Kết quả phiên', group: 'd-review' },

  { id: 'diary', title: 'Nhật ký sắc thái', group: 'e-progress' },
  { id: 'progress', title: 'Hồ sơ tự cập nhật', group: 'e-progress' },
  { id: 'profile', title: 'Hồ sơ & Quyền riêng tư', group: 'e-progress' },
  { id: 'compare', title: 'So sánh', group: 'e-progress' },
  { id: 'system-states', title: 'Trạng thái hệ thống', group: 'e-progress' },
];

function placeholder(spec) {
  const group = GROUPS.find((g) => g.dir === spec.group);
  return {
    id: spec.id,
    title: spec.title,
    group: spec.group,
    chrome: 'appbar',
    placeholder: true,
    render() {
      return h('div.screen', {},
        ui.appBar({ title: spec.title, sub: 'Đang hoàn thiện', back: true }),
        h('div.screen__body', {},
          ui.empty({
            iconName: 'loader',
            title: 'Màn hình đang được dựng',
            body: `Nhóm ${group ? group.title : spec.group} (${group ? group.owner : '—'}) đang thực hiện màn hình "${spec.id}".`,
            action: ui.badge('đang hoàn thiện', 'warning'),
          }),
          ui.callout({
            iconName: 'info',
            title: 'Vẫn bấm được',
            body: 'Các màn hình đã xong vẫn hoạt động bình thường. Đây là placeholder do registry tạo.',
          })
        ));
    },
  };
}

/**
 * @returns {Promise<{ screens: object[], missing: string[], errors: object[] }>}
 */
export async function loadScreens() {
  const screens = [];
  const errors = [];

  for (const group of GROUPS) {
    try {
      const mod = await import(`../screens/${group.dir}/manifest.js`);
      const list = Array.isArray(mod.default) ? mod.default : [];
      for (const item of list) {
        if (!item || !item.id || typeof item.render !== 'function') {
          errors.push({ group: group.dir, reason: `mục không hợp lệ: ${item && item.id}` });
          continue;
        }
        screens.push({ ...item, group: item.group || group.dir, groupTitle: group.title });
      }
    } catch (err) {
      errors.push({ group: group.dir, reason: String(err && err.message ? err.message : err) });
    }
  }

  const loadedIds = new Set(screens.map((s) => s.id));
  const missing = PLANNED.filter((p) => !loadedIds.has(p.id));
  for (const spec of missing) screens.push(placeholder(spec));

  // Sắp xếp theo đúng thứ tự đã chốt trong PLANNED để rail đọc như một câu chuyện.
  const order = new Map(PLANNED.map((p, i) => [p.id, i]));
  screens.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));

  return { screens, missing: missing.map((m) => m.id), errors };
}

export function groupOf(dir) {
  return GROUPS.find((g) => g.dir === dir);
}
