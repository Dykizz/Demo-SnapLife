/* ============================================================================
   Nhóm B — Chụp ảnh & Từ vựng
   Owner: screens-capture  (phạm vi ghi: src/screens/b-capture/**, styles/screens-b.css)

   Luồng 1 của deck (tr.04): ảnh của chính người học → khoanh vùng → thẻ từ.
   capture (chrome none, immersive) → regions (appbar) → wordlist → worddetail.
   ========================================================================== */

import capture from './capture.js';
import regions from './regions.js';
import wordlist from './wordlist.js';
import worddetail from './worddetail.js';

export default [capture, regions, wordlist, worddetail];
