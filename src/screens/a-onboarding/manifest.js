/* ============================================================================
   Nhóm A — Nhập môn & Trang chủ
   Owner: screens-onboard  (phạm vi ghi: src/screens/a-onboarding/**, styles/screens-a.css)

   splash      → thương hiệu, tự chuyển sau 2s
   onboarding  → 3 slide: vấn đề → giải pháp 3 bước → quyền riêng tư & xin quyền
   placement   → 8 câu xếp trình độ, kết quả CEFR + lộ trình
   topics      → chọn nhiều chủ đề, ghi ctx.store 'interests'
   home        → streak, câu hôm nay, 3 hành động, chọn phiên 2/10/20
   ========================================================================== */

import splash from './splash.js';
import onboarding from './onboarding.js';
import placement from './placement.js';
import topics from './topics.js';
import home from './home.js';

export default [splash, onboarding, placement, topics, home];
