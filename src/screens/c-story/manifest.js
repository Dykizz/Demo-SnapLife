/* ============================================================================
   Nhóm C — Câu chuyện & Luyện nói
   Owner: screens-story  (phạm vi ghi: src/screens/c-story/**, styles/screens-c.css)

   Bốn màn hình của luồng "Ngữ cảnh của bạn":
     compose  — kể lại một ngày / gõ từ & chủ đề           (appbar, 0 API)
     reader   — đoạn đan xen Việt–Anh + audio + chạm từ    (tabbar, 1 LLM)
     speaking — mic + waveform + diff câu đã sửa           (appbar, 1 LLM)
     stories  — kệ truyện đã lưu                           (appbar, 0 API)
   ========================================================================== */

import compose from './compose.js';
import reader from './reader.js';
import speaking from './speaking.js';
import stories from './stories.js';

export default [compose, reader, speaking, stories];
