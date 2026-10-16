/* ============================================================================
   Nhóm E — Tiến độ & Hệ thống
   Owner: screens-progress  (phạm vi ghi: src/screens/e-progress/**, styles/screens-e.css)

   Bốn màn hình theo đúng docs/BUILD-SPEC.md §5:
     diary          → nhật ký sắc thái, câu khớp tâm trạng (slide 07)
     progress       → hồ sơ tự cập nhật (slide 11)
     profile        → hồ sơ & quyền riêng tư (slide 11)
     system-states  → trưng bày 4 trạng thái hệ thống
   Cả 4 đều api: [] — không màn nào gọi mô hình.

   Màn thứ năm do LEAD thêm sau khi qa-verify chỉ ra slide 10 của deck chưa có
   màn hình nào thể hiện:
     compare        → so sánh với Duolingo / Memrise / Anki (slide 10)
   Cũng api: [].
   ========================================================================== */

import diary from './diary.js';
import progress from './progress.js';
import profile from './profile.js';
import systemStates from './system-states.js';
import compare from './compare.js';

export default [diary, progress, profile, systemStates, compare];
