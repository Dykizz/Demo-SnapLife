/* ============================================================================
   SnapLife AI — Bộ icon SVG (theo phong cách Lucide, stroke 1.75, 24×24)
   Owner: Lead.
   QUY TẮC: không dùng emoji làm icon. Mọi icon lấy từ đây để đồng nhất nét vẽ.
   Icon mặc định aria-hidden="true"; nút chỉ có icon phải tự đặt aria-label.
   ========================================================================== */

import { fromHTML } from './dom.js';

const S = 'stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"';

export const ICONS = {
  /* --- Điều hướng --- */
  home: `<path ${S} d="M3 10.5 12 3l9 7.5"/><path ${S} d="M5.5 9.5V20h13V9.5"/><path ${S} d="M9.5 20v-5.5h5V20"/>`,
  'chevron-left': `<path ${S} d="m14.5 5-7 7 7 7"/>`,
  'chevron-right': `<path ${S} d="m9.5 5 7 7-7 7"/>`,
  'chevron-down': `<path ${S} d="m5 9.5 7 7 7-7"/>`,
  'chevron-up': `<path ${S} d="m5 14.5 7-7 7 7"/>`,
  'arrow-right': `<path ${S} d="M4 12h15"/><path ${S} d="m13 6 6 6-6 6"/>`,
  'arrow-left': `<path ${S} d="M20 12H5"/><path ${S} d="m11 18-6-6 6-6"/>`,
  'arrow-up-right': `<path ${S} d="M7 17 17 7"/><path ${S} d="M8 7h9v9"/>`,
  'more-horizontal': `<circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>`,

  /* --- Camera, ảnh, mic --- */
  camera: `<path ${S} d="M3.5 8.5a2 2 0 0 1 2-2h1.9l1.2-2h6.8l1.2 2h1.9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><circle ${S} cx="12" cy="13" r="3.9"/>`,
  'camera-off': `<path ${S} d="M3 3l18 18"/><path ${S} d="M8.8 6.5 9.6 4.5h4.8l1.2 2h1.9a2 2 0 0 1 2 2v9"/><path ${S} d="M6 6.9a2 2 0 0 0-2.5 1.9V17.5a2 2 0 0 0 2 2h13"/><path ${S} d="M9.6 12.3a3.9 3.9 0 0 0 5.2 5"/>`,
  image: `<rect ${S} x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle ${S} cx="8.8" cy="9.8" r="1.6"/><path ${S} d="m4 17 4.8-4.6a2 2 0 0 1 2.7 0L20 20"/>`,
  mic: `<rect ${S} x="9" y="3" width="6" height="11" rx="3"/><path ${S} d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path ${S} d="M12 18v3"/>`,
  'mic-off': `<path ${S} d="M3 3l18 18"/><path ${S} d="M15 5.2A3 3 0 0 0 9 6v5.5"/><path ${S} d="M5.5 11.5a6.5 6.5 0 0 0 10 5.6"/><path ${S} d="M18.5 11.5v.6"/><path ${S} d="M12 18v3"/>`,
  scan: `<path ${S} d="M4 8.5V6.5A2.5 2.5 0 0 1 6.5 4h2"/><path ${S} d="M15.5 4h2A2.5 2.5 0 0 1 20 6.5v2"/><path ${S} d="M20 15.5v2a2.5 2.5 0 0 1-2.5 2.5h-2"/><path ${S} d="M8.5 20h-2A2.5 2.5 0 0 1 4 17.5v-2"/><path ${S} d="M3.5 12h17"/>`,
  crop: `<path ${S} d="M6.5 2.5v15h15"/><path ${S} d="M2.5 6.5h15v15"/>`,
  'sparkles': `<path ${S} d="m12 3 1.9 4.9L18.8 9.8l-4.9 1.9L12 16.6l-1.9-4.9L5.2 9.8l4.9-1.9z"/><path ${S} d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>`,
  wand: `<path ${S} d="m14.5 6.5 3 3"/><path ${S} d="M4 20 15.5 8.5a2.1 2.1 0 0 1 3 3L7 23z" transform="translate(0,-2.5)"/><path ${S} d="M6 4.5l.7 1.6 1.6.7-1.6.7L6 9.1l-.7-1.6L3.7 6.8l1.6-.7z"/>`,

  /* --- Âm thanh --- */
  'volume-2': `<path ${S} d="M11 5 6.5 9H3.5v6h3L11 19z"/><path ${S} d="M15.2 8.8a4.5 4.5 0 0 1 0 6.4"/><path ${S} d="M18 6a8 8 0 0 1 0 12"/>`,
  play: `<path ${S} d="M7.5 5.2v13.6L19 12z"/>`,
  pause: `<path ${S} d="M9 5.5v13"/><path ${S} d="M15 5.5v13"/>`,
  'rotate-ccw': `<path ${S} d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path ${S} d="M3.5 4.5V10H9"/>`,
  headphones: `<path ${S} d="M4 14.5v-2a8 8 0 0 1 16 0v2"/><rect ${S} x="2.8" y="13.5" width="4.4" height="6.5" rx="2.2"/><rect ${S} x="16.8" y="13.5" width="4.4" height="6.5" rx="2.2"/>`,
  waveform: `<path ${S} d="M3 12h1.6"/><path ${S} d="M7 8.5v7"/><path ${S} d="M11 5.5v13"/><path ${S} d="M15 8v8"/><path ${S} d="M19 10.5v3"/>`,

  /* --- Học tập --- */
  'book-open': `<path ${S} d="M12 6.5C10.5 5 8.5 4.4 4.5 4.5v13C8.5 17.4 10.5 18 12 19.5c1.5-1.5 3.5-2.1 7.5-2V4.5c-4-.1-6 .5-7.5 2z"/><path ${S} d="M12 6.5v13"/>`,
  layers: `<path ${S} d="m12 3 8.5 4.5L12 12 3.5 7.5z"/><path ${S} d="m4.5 12.5 7.5 4 7.5-4"/><path ${S} d="m4.5 16.5 7.5 4 7.5-4"/>`,
  'list-checks': `<path ${S} d="M10 6.5h10"/><path ${S} d="M10 12h10"/><path ${S} d="M10 17.5h10"/><path ${S} d="m3.5 6 1.6 1.6L8 4.8"/><path ${S} d="m3.5 11.4 1.6 1.6L8 10.2"/><path ${S} d="m3.5 16.8 1.6 1.6L8 15.6"/>`,
  'graduation-cap': `<path ${S} d="m12 4 9 4.5-9 4.5-9-4.5z"/><path ${S} d="M6.5 10.6V16c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-5.4"/><path ${S} d="M20.5 9v5.5"/>`,
  target: `<circle ${S} cx="12" cy="12" r="8.2"/><circle ${S} cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>`,
  pencil: `<path ${S} d="M16.8 3.9a2.1 2.1 0 0 1 3 3L8.5 18.2l-4 1 1-4z"/><path ${S} d="m15.3 5.4 3.3 3.3"/>`,
  edit: `<path ${S} d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/><path ${S} d="M17.3 3.9a2.1 2.1 0 0 1 3 3L12 15.2l-3.6.9.9-3.6z"/>`,
  bookmark: `<path ${S} d="M6.5 4.5h11v15.6L12 16.4l-5.5 3.7z"/>`,
  'bookmark-check': `<path ${S} d="M6.5 4.5h11v15.6L12 16.4l-5.5 3.7z"/><path ${S} d="m9.4 9.6 1.8 1.8 3.4-3.6"/>`,
  notebook: `<path ${S} d="M5.5 3.5h13v17h-13z"/><path ${S} d="M5.5 3.5A2 2 0 0 0 3.5 5.5v13a2 2 0 0 0 2 2"/><path ${S} d="M9 7.5h6"/><path ${S} d="M9 11h6"/>`,
  coffee: `<path ${S} d="M4.5 8h12v5.5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path ${S} d="M16.5 9.5h1.6a2.6 2.6 0 0 1 0 5.2h-1.6"/><path ${S} d="M4.5 21.5h12"/>`,
  flame: `<path ${S} d="M12 3c3.2 3.1 5.5 5.6 5.5 9a5.5 5.5 0 0 1-11 0c0-1.6.7-3 1.7-4.2.5 1.4 1.4 2.2 2.3 2.4C10.2 8 10.8 5.5 12 3z"/>`,
  zap: `<path ${S} d="M13.5 2.5 5 13.5h5l-1 8 8.5-11h-5z"/>`,
  award: `<circle ${S} cx="12" cy="9.5" r="5.5"/><path ${S} d="m8.4 14.2-1.4 7 5-2.6 5 2.6-1.4-7"/>`,
  'trending-up': `<path ${S} d="m3.5 17 5.5-5.5 3.5 3.5 8-8"/><path ${S} d="M15.5 7h5v5"/>`,
  calendar: `<rect ${S} x="3.5" y="5.5" width="17" height="15" rx="2.5"/><path ${S} d="M3.5 10.5h17"/><path ${S} d="M8 3.5v4"/><path ${S} d="M16 3.5v4"/>`,
  clock: `<circle ${S} cx="12" cy="12" r="8.5"/><path ${S} d="M12 7.5V12l3.2 2"/>`,
  'bar-chart': `<path ${S} d="M5 20V11"/><path ${S} d="M12 20V4.5"/><path ${S} d="M19 20v-6"/>`,
  'git-branch': `<circle ${S} cx="6.5" cy="5.5" r="2.5"/><circle ${S} cx="6.5" cy="18.5" r="2.5"/><circle ${S} cx="17.5" cy="9.5" r="2.5"/><path ${S} d="M6.5 8v8"/><path ${S} d="M15 9.5H11a4.5 4.5 0 0 0-4.5 4.5"/>`,

  /* --- Trạng thái / hệ thống --- */
  check: `<path ${S} d="m4.5 12.5 5 5 10-11"/>`,
  'check-circle': `<circle ${S} cx="12" cy="12" r="8.5"/><path ${S} d="m8 12.2 2.8 2.8 5.4-5.8"/>`,
  x: `<path ${S} d="M5.5 5.5l13 13"/><path ${S} d="M18.5 5.5l-13 13"/>`,
  'x-circle': `<circle ${S} cx="12" cy="12" r="8.5"/><path ${S} d="m9 9 6 6"/><path ${S} d="m15 9-6 6"/>`,
  plus: `<path ${S} d="M12 5v14"/><path ${S} d="M5 12h14"/>`,
  minus: `<path ${S} d="M5 12h14"/>`,
  search: `<circle ${S} cx="11" cy="11" r="6.5"/><path ${S} d="m16 16 4.5 4.5"/>`,
  filter: `<path ${S} d="M4 6.5h16"/><path ${S} d="M7 12h10"/><path ${S} d="M10 17.5h4"/>`,
  sliders: `<path ${S} d="M5 6.5h14"/><path ${S} d="M5 17.5h14"/><circle ${S} cx="9.5" cy="6.5" r="2.2"/><circle ${S} cx="15" cy="17.5" r="2.2"/>`,
  settings: `<circle ${S} cx="12" cy="12" r="3"/><path ${S} d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.5 15a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 4.6V4.5a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.8h.1a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.3 1z"/>`,
  shield: `<path ${S} d="M12 3.2 5 6v5.5c0 4.3 2.9 7.6 7 9.3 4.1-1.7 7-5 7-9.3V6z"/><path ${S} d="m9.2 12.2 2 2 3.6-3.8"/>`,
  lock: `<rect ${S} x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path ${S} d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>`,
  'alert-triangle': `<path ${S} d="M10.3 4.3 2.8 17.2A2 2 0 0 0 4.5 20.2h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z"/><path ${S} d="M12 9.5v4"/><circle cx="12" cy="16.6" r="1" fill="currentColor" stroke="none"/>`,
  info: `<circle ${S} cx="12" cy="12" r="8.5"/><path ${S} d="M12 11v5.5"/><circle cx="12" cy="8.2" r="1" fill="currentColor" stroke="none"/>`,
  'wifi-off': `<path ${S} d="M3 3l18 18"/><path ${S} d="M8.8 15.2a4.5 4.5 0 0 1 6.4 0"/><path ${S} d="M5.5 11.6a9 9 0 0 1 3.4-2"/><path ${S} d="M15.1 9.6a9 9 0 0 1 3.4 2"/><path ${S} d="M2.5 8.5A13 13 0 0 1 8 5.4"/><path ${S} d="M16 5.4a13 13 0 0 1 5.5 3.1"/><circle cx="12" cy="18.4" r="1.1" fill="currentColor" stroke="none"/>`,
  'cloud-off': `<path ${S} d="M3 3l18 18"/><path ${S} d="M8.6 6.5A6.5 6.5 0 0 1 19 11.6h.6a4 4 0 0 1 2.6 6.9"/><path ${S} d="M17 19.5H7a4.5 4.5 0 0 1-.9-8.9"/>`,
  cloud: `<path ${S} d="M7 18.5h10.2a4.2 4.2 0 0 0 .6-8.4 6 6 0 0 0-11.7-1.3A4.2 4.2 0 0 0 7 18.5z"/>`,
  refresh: `<path ${S} d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/><path ${S} d="M20.5 4.5V10H15"/>`,
  eye: `<path ${S} d="M2.8 12S6.2 6 12 6s9.2 6 9.2 6-3.4 6-9.2 6-9.2-6-9.2-6z"/><circle ${S} cx="12" cy="12" r="2.8"/>`,
  'eye-off': `<path ${S} d="M3 3l18 18"/><path ${S} d="M10.6 6.3A9.6 9.6 0 0 1 12 6c5.8 0 9.2 6 9.2 6a17 17 0 0 1-3.3 3.9"/><path ${S} d="M6.4 8A17 17 0 0 0 2.8 12s3.4 6 9.2 6a9.4 9.4 0 0 0 3.3-.6"/><path ${S} d="M9.9 10.2a2.8 2.8 0 0 0 3.9 3.9"/>`,
  star: `<path ${S} d="m12 3.6 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.6l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>`,
  heart: `<path ${S} d="M12 20s-7.5-4.4-7.5-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.5 2.8c0 5-7.5 9.4-7.5 9.4z"/>`,
  trash: `<path ${S} d="M4.5 6.5h15"/><path ${S} d="M9 6.5V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8v1.7"/><path ${S} d="M6.5 6.5 7.6 20a1.4 1.4 0 0 0 1.4 1.3h6a1.4 1.4 0 0 0 1.4-1.3l1.1-13.5"/>`,
  link: `<path ${S} d="M9.5 14.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path ${S} d="M14.5 9.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`,
  grid: `<rect ${S} x="4" y="4" width="7" height="7" rx="2"/><rect ${S} x="13" y="4" width="7" height="7" rx="2"/><rect ${S} x="4" y="13" width="7" height="7" rx="2"/><rect ${S} x="13" y="13" width="7" height="7" rx="2"/>`,
  user: `<circle ${S} cx="12" cy="8.5" r="4"/><path ${S} d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>`,
  users: `<circle ${S} cx="9.5" cy="8.5" r="3.6"/><path ${S} d="M3 20a6.5 6.5 0 0 1 13 0"/><path ${S} d="M16 5.2a3.6 3.6 0 0 1 0 6.8"/><path ${S} d="M18 14.4a6.5 6.5 0 0 1 3 5.6"/>`,
  sun: `<circle ${S} cx="12" cy="12" r="4.2"/><path ${S} d="M12 2.5v2.2"/><path ${S} d="M12 19.3v2.2"/><path ${S} d="M4.2 4.2 5.8 5.8"/><path ${S} d="m18.2 18.2 1.6 1.6"/><path ${S} d="M2.5 12h2.2"/><path ${S} d="M19.3 12h2.2"/><path ${S} d="M4.2 19.8 5.8 18.2"/><path ${S} d="m18.2 5.8 1.6-1.6"/>`,
  moon: `<path ${S} d="M20 14.5A8.3 8.3 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>`,
  'message-circle': `<path ${S} d="M20.5 11.8a8.2 8.2 0 0 1-11.9 7.3L3.5 20.5l1.4-5.1A8.2 8.2 0 1 1 20.5 11.8z"/>`,
  'thumbs-up': `<path ${S} d="M7 21V10.5l4-7.5a2.6 2.6 0 0 1 2.5 2.6V9h4.9a2.4 2.4 0 0 1 2.3 3l-1.7 7a2.4 2.4 0 0 1-2.3 2z"/><path ${S} d="M7 10.5H3.5V21H7"/>`,
  download: `<path ${S} d="M12 3.5v11"/><path ${S} d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path ${S} d="M4 20.5h16"/>`,
  share: `<circle ${S} cx="18" cy="5.5" r="2.6"/><circle ${S} cx="6" cy="12" r="2.6"/><circle ${S} cx="18" cy="18.5" r="2.6"/><path ${S} d="m8.3 10.7 7.4-3.7"/><path ${S} d="m8.3 13.3 7.4 3.7"/>`,
  clipboard: `<path ${S} d="M9 4.5H7.5A2 2 0 0 0 5.5 6.5v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-13a2 2 0 0 0-2-2H15"/><rect ${S} x="9" y="2.8" width="6" height="3.4" rx="1.4"/>`,
  'file-text': `<path ${S} d="M13.5 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8.5z"/><path ${S} d="M13.5 3.5v5h5"/><path ${S} d="M9 13h6"/><path ${S} d="M9 16.5h4"/>`,
  loader: `<path ${S} d="M12 3.5v4"/><path ${S} d="M12 16.5v4"/><path ${S} d="M5.1 5.1 8 8"/><path ${S} d="m16 16 2.9 2.9"/><path ${S} d="M3.5 12h4"/><path ${S} d="M16.5 12h4"/><path ${S} d="M5.1 18.9 8 16"/><path ${S} d="m16 8 2.9-2.9"/>`,
  activity: `<path ${S} d="M3.5 12h4l2.5-6 4 12 2.5-6h4"/>`,
  compass: `<circle ${S} cx="12" cy="12" r="8.5"/><path ${S} d="m15.5 8.5-2 5-5 2 2-5z"/>`,
  map: `<path ${S} d="M9.5 4.5 3.5 7v13l6-2.5 5 2.5 6-2.5V4l-6 2.5z"/><path ${S} d="M9.5 4.5v13"/><path ${S} d="M14.5 6.5v13"/>`,
  palette: `<path ${S} d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-.9 2-1.9 0-1.4-1.3-1.6-1.3-2.7 0-.9.7-1.6 1.6-1.6h1.8a4.4 4.4 0 0 0 4.4-4.4c0-3.6-3.7-6.4-8.5-6.4z"/><circle cx="8" cy="10.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="8" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="10.5" r="1.1" fill="currentColor" stroke="none"/>`,
  globe: `<circle ${S} cx="12" cy="12" r="8.5"/><path ${S} d="M3.5 12h17"/><path ${S} d="M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.4-5.3-3.4-8.5S9.8 5.8 12 3.5z"/>`,
  'mouse-pointer': `<path ${S} d="m5 3.5 5.5 16 2.4-6.6 6.6-2.4z"/>`,
  'move-3d': `<path ${S} d="M12 3.5 20 8v8l-8 4.5L4 16V8z"/><path ${S} d="M12 12v8.5"/><path ${S} d="m12 12 8-4"/><path ${S} d="m12 12-8-4"/>`,
  gift: `<rect ${S} x="3.5" y="8.5" width="17" height="12" rx="2.2"/><path ${S} d="M3.5 12.5h17"/><path ${S} d="M12 8.5v12"/><path ${S} d="M12 8.5C10.5 4.5 8.6 3.5 7.4 3.5a2.5 2.5 0 0 0 0 5"/><path ${S} d="M12 8.5c1.5-4 3.4-5 4.6-5a2.5 2.5 0 0 1 0 5"/>`,
};

/** Trả về <svg> phần tử đã dựng sẵn. */
export function icon(name, size = 20, opts = {}) {
  const body = ICONS[name];
  const px = typeof size === 'number' ? `${size}px` : size;
  const markup =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${px}" height="${px}" ` +
    `aria-hidden="${opts.labelled ? 'false' : 'true'}" ${
      opts.labelled ? `role="img" aria-label="${opts.labelled}"` : 'focusable="false"'
    } ${opts.class ? `class="${opts.class}"` : ''}>${body ?? ''}</svg>`;
  const node = fromHTML(markup).firstElementChild;
  return node;
}

/** Tên icon hợp lệ — dùng để kiểm tra khi viết màn hình. */
export const iconNames = Object.keys(ICONS);
