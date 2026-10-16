/* ============================================================================
   SnapLife AI — Audit tự động (chạy trong trình duyệt, đọc bằng --dump-dom)
   Owner: Lead, dùng chung với qa-verify.

   Vì sao cần: mô hình không xem được ảnh chụp màn hình. Thay vì "nhìn rồi đoán",
   harness này render mọi màn hình ở 390×844 rồi ĐO bằng DOM + computed style:
     · lỗi runtime khi render từng màn
     · nút/biểu mẫu thiếu tên truy cập được
     · touch target < 44px
     · tràn ngang (scrollWidth > clientWidth)
     · tương phản chữ theo WCAG 2.1 (>= 4.5:1 thường, >= 3:1 chữ lớn)
     · ảnh hỏng (naturalWidth === 0)
     · màu hex hardcode trong style nội tuyến
     · id trùng giữa các màn hình
   ========================================================================== */

import { h, qs } from '../src/core/dom.js';
import { ui, setNav, setOverlayHost } from '../src/core/ui.js';
import { createStore } from '../src/core/store.js';
import { cost } from '../src/core/cost.js';
import { audio } from '../src/core/audio.js';
import { loadScreens, PLANNED } from '../src/core/registry.js';

import * as fixtures from '../src/data/fixtures.js';
import { data } from '../src/data/bundle.js';

const stage = qs('#stage');
const reportEl = qs('#report');

/**
 * Bề rộng khung đo, lấy từ `?w=768`. Mặc định 390 (điện thoại).
 * Dùng để kiểm responsive ở nhiều thiết bị mà không cần sửa file.
 */
const PROBE_W = Math.max(280, Number(new URLSearchParams(location.search).get('w')) || 390);
document.documentElement.style.setProperty('--probe-w', `${PROBE_W}px`);

/*
 * Đóng băng chuyển động trong lúc đo.
 * Lý do: `.btn` và nhiều component có `transition: color/background`, nên ngay sau
 * khi đổi theme, computed style trả về GIÁ TRỊ TRUNG GIAN của transition — đo vào
 * lúc đó sẽ báo lỗi tương phản giả (chữ của theme cũ trên nền của theme mới).
 * Harness cần trạng thái ĐÃ ĐỨNG YÊN, không phải ảnh chụp giữa hoạt ảnh.
 */
const freeze = document.createElement('style');
freeze.textContent =
  '*, *::before, *::after { transition: none !important; animation: none !important; }';
document.head.appendChild(freeze);
setNav({ go: () => {}, back: () => {}, replace: () => {} });
setOverlayHost(h('div', { id: 'audit-overlay', style: { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '90' } }));

/* --------------------------- Đo màu & tương phản -------------------------- */
function parseColor(str) {
  if (!str) return null;
  const hex = str.match(/#([0-9a-fA-F]{3,8})\b/);
  if (hex) {
    let v = hex[1];
    if (v.length === 3) v = v.split('').map((c) => c + c).join('');
    if (v.length === 6 || v.length === 8) {
      return {
        r: parseInt(v.slice(0, 2), 16),
        g: parseInt(v.slice(2, 4), 16),
        b: parseInt(v.slice(4, 6), 16),
        a: v.length === 8 ? parseInt(v.slice(6, 8), 16) / 255 : 1,
      };
    }
  }
  const m = str.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.%]+))?\s*\)/i);
  if (!m) return null;
  let a = 1;
  if (m[4] !== undefined) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  return { r: +m[1], g: +m[2], b: +m[3], a: Number.isFinite(a) ? a : 1 };
}

/**
 * Màu của lớp nền dạng gradient (background-image). getComputedStyle trả
 * backgroundColor = trong suốt cho gradient, nên nếu bỏ qua bước này thì
 * appbar--overlay (chữ trắng trên gradient tối) sẽ bị báo lỗi tương phản giả.
 * Xấp xỉ bằng điểm dừng đầu tiên của gradient.
 */
function gradientColor(cs) {
  const bi = cs.backgroundImage;
  if (!bi || bi === 'none') return null;
  const tokens = bi.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}\b/g);
  if (!tokens || !tokens.length) return null;
  return parseColor(tokens[0]);
}

function over(fg, bg) {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

function channel(v) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance({ r, g, b }) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Nền hiệu dụng: đi lên cho tới khi gặp màu đục, có trộn alpha và gradient. */
function effectiveBg(node) {
  let acc = null;
  let cur = node;
  while (cur && cur !== document.documentElement) {
    const cs = getComputedStyle(cur);
    let layer = parseColor(cs.backgroundColor);
    if (!layer || layer.a === 0) {
      const g = gradientColor(cs);
      if (g) layer = g;
    }
    if (layer && layer.a > 0) {
      acc = acc === null ? layer : over(acc, layer);
      if (layer.a >= 0.999) return acc;
    }
    cur = cur.parentElement;
  }
  const rootBg = parseColor(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
  return acc ? over(acc, rootBg) : rootBg;
}

/** Tách danh sách tham số của gradient, tôn trọng dấu ngoặc lồng nhau (color-mix, var). */
function splitTop(str) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of str) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

/** Đọc hướng và các điểm dừng màu của một linear-gradient. */
function parseGradient(value) {
  const g = String(value).match(/(linear|radial)-gradient\(/);
  if (!g) return null;
  const open = value.indexOf('(', value.indexOf(g[0]));
  const inner = value.slice(open + 1, value.lastIndexOf(')'));
  const parts = splitTop(inner);
  const head = parts[0] || '';
  let dir = 'to bottom';
  if (/to\s+top/i.test(head)) dir = 'to top';
  else if (/to\s+right/i.test(head)) dir = 'to right';
  else if (/to\s+left/i.test(head)) dir = 'to left';
  else if (/radial/i.test(g[0])) dir = 'radial';

  const raw = /to\s+(top|bottom|right|left)|radial|deg/i.test(head) ? parts.slice(1) : parts;
  const stops = [];
  raw.forEach((p) => {
    const color = parseColor(p);
    if (!color) return;
    const m = p.match(/([\d.]+)%/);
    stops.push({ color, pos: m ? parseFloat(m[1]) / 100 : null });
  });
  if (!stops.length) return null;
  stops.forEach((s, i) => {
    if (s.pos === null) s.pos = stops.length > 1 ? i / (stops.length - 1) : 0;
  });
  stops.sort((a, b) => a.pos - b.pos);
  return { dir, stops };
}

/** Alpha và màu của lớp phủ TẠI ĐÚNG vị trí của chữ, không phải điểm đậm nhất. */
function layerAt(node, cs, fracX, fracY) {
  const flat = parseColor(cs.backgroundColor);
  const grad = parseGradient(cs.backgroundImage || '');
  if (!grad) return flat && flat.a > 0 ? flat : null;

  let f;
  if (grad.dir === 'to right') f = fracX;
  else if (grad.dir === 'to left') f = 1 - fracX;
  else if (grad.dir === 'to top') f = 1 - fracY;
  else if (grad.dir === 'radial') {
    // Xấp xỉ: lấy điểm dừng đậm nhất (radial không có trục tuyến tính).
    return grad.stops.reduce((a, b) => (a.color.a >= b.color.a ? a : b)).color;
  } else f = fracY;

  f = Math.min(1, Math.max(0, f));
  const s = grad.stops;
  if (s.length === 1) return s[0].color;
  for (let i = 0; i < s.length - 1; i += 1) {
    const a = s[i];
    const b = s[i + 1];
    if (f >= a.pos && f <= b.pos) {
      const t = b.pos === a.pos ? 0 : (f - a.pos) / (b.pos - a.pos);
      return {
        r: a.color.r + (b.color.r - a.color.r) * t,
        g: a.color.g + (b.color.g - a.color.g) * t,
        b: a.color.b + (b.color.b - a.color.b) * t,
        a: a.color.a + (b.color.a - a.color.a) * t,
      };
    }
  }
  return f <= s[0].pos ? s[0].color : s[s.length - 1].color;
}

/**
 * Chữ nằm ĐÈ LÊN ẢNH thì không suy ra được nền bằng cách đi lên cây DOM: lớp phủ
 * thường là phần tử ANH EM định vị chồng lên (ví dụ .cs-cover__scrim), không phải
 * tổ tiên. Hàm này tìm lớp phủ thật sự đi qua điểm giữa của chữ, lấy alpha tại đúng
 * vị trí đó, rồi ước lượng trên giả định ảnh nền là xám trung tính (#808080).
 */
function overlayEstimate(el) {
  const holder = el.closest('.photo-frame, .viewfinder, [data-photo]');
  if (!holder) return null;
  const hr = holder.getBoundingClientRect();
  if (!hr.width || !hr.height) return null;
  const er = el.getBoundingClientRect();
  const px = er.left + er.width / 2;
  const py = er.top + er.height / 2;
  const fracX = (px - hr.left) / hr.width;
  const fracY = (py - hr.top) / hr.height;
  if (fracX < 0 || fracX > 1 || fracY < 0 || fracY > 1) return null;

  let best = null;

  // Nền của CHÍNH phần tử là lớp trên cùng — phải xét trước mọi lớp anh em.
  // Thiếu bước này thì một badge tự mang nền đục vẫn bị đánh giá như thể nó
  // trong suốt (đúng ca mà nhóm B báo cáo).
  const ownCs = getComputedStyle(el);
  const ownLayer = layerAt(el, ownCs, 0.5, 0.5);
  if (ownLayer && ownLayer.a > 0.02) best = ownLayer;

  holder.querySelectorAll('*').forEach((node) => {
    if (node === el || el.contains(node) || node.contains(el)) return;
    const cs = getComputedStyle(node);
    if (cs.position !== 'absolute' && cs.position !== 'fixed') return;
    const r = node.getBoundingClientRect();
    if (px < r.left || px > r.right || py < r.top || py > r.bottom) return;
    const nx = r.width ? (px - r.left) / r.width : 0.5;
    const ny = r.height ? (py - r.top) / r.height : 0.5;
    const layer = layerAt(node, cs, nx, ny);
    if (!layer || layer.a <= 0.02) return;
    if (!best || layer.a > best.a) best = layer;
  });
  return best;
}

function hex({ r, g, b }) {
  const c = (v) => Math.round(v).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

const MID_GRAY = { r: 128, g: 128, b: 128, a: 1 };

function isVisible(el) {
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

function path(el) {
  const bits = [];
  let cur = el;
  for (let i = 0; i < 4 && cur && cur.tagName; i += 1) {
    let bit = cur.tagName.toLowerCase();
    if (cur.className && typeof cur.className === 'string') {
      bit += '.' + cur.className.trim().split(/\s+/).slice(0, 2).join('.');
    }
    bits.unshift(bit);
    cur = cur.parentElement;
  }
  return bits.join(' > ');
}

/* --------------------------- Tên truy cập được --------------------------- */
function accessibleName(el) {
  const aria = el.getAttribute('aria-label');
  if (aria && aria.trim()) return aria.trim();
  const labelledby = el.getAttribute('aria-labelledby');
  if (labelledby) {
    const text = labelledby.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ').trim();
    if (text) return text;
  }
  const title = el.getAttribute('title');
  if (title && title.trim()) return title.trim();
  const alt = el.getAttribute('alt');
  if (alt && alt.trim()) return alt.trim();
  // Bỏ nội dung của svg/ảnh khi đọc chữ hiển thị.
  const clone = el.cloneNode(true);
  clone.querySelectorAll('svg, img').forEach((n) => n.remove());
  const text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
  if (text) return text;
  if (el.tagName === 'INPUT' && el.value) return el.value;
  return '';
}

/* -------------------------------- Kiểm tra -------------------------------- */
const INTERACTIVE = 'button, a[href], input, select, textarea, [role="button"], [role="tab"], [role="switch"], [role="link"], [role="checkbox"]';

/**
 * Theme đang được đo. Mọi vi phạm đều gắn nhãn này để biết lỗi chỉ có ở dark
 * hay ở cả hai — checklist yêu cầu kiểm dark độc lập, không suy ra từ light.
 */
let currentTheme = 'light';

/** Nút nằm trong dòng chữ (từ tiếng Anh bấm được) — miễn quy tắc 44px. */
function isInlineTextControl(el) {
  const cs = getComputedStyle(el);
  return cs.display === 'inline' || el.classList.contains('en');
}

/**
 * Đo CHẤT LƯỢNG responsive, không phải lỗi.
 *
 * Ở bề rộng lớn, một bố cục điện thoại bị kéo giãn sẽ KHÔNG sinh lỗi tràn/kẹt nào —
 * audit thường vẫn báo 0. Nhưng nó vẫn sai: chữ dài quá ~75 ký tự một dòng thì
 * không đọc được, và một cột dọc trên màn 1440px trông như trang web thu nhỏ.
 * Hàm này trả về số đo để đánh giá được điều đó bằng số, thay vì bằng mắt.
 */
function measureResponsive(root) {
  const body = root.querySelector('.screen__body') || root;
  const cs = getComputedStyle(body);
  const padX = parseFloat(cs.paddingLeft || '0') + parseFloat(cs.paddingRight || '0');
  const contentWidth = Math.round(body.getBoundingClientRect().width - padX);

  // Hạn mức bề rộng hiện hành, đọc từ chính phần tử — KHÔNG hardcode.
  // Các biến này đổi theo bậc thang ở màn lớn (1100px → 1160, 1500px → 1400),
  // nên ngưỡng cứng sẽ báo oan khi thiết kế mở rộng cho desktop.
  const gridMax = parseFloat(cs.getPropertyValue('--measure-grid')) || 1040;
  const bodyMax = parseFloat(cs.getPropertyValue('--measure-body')) || 720;

  // Độ dài dòng THẬT: đếm số dòng đã render bằng Range rồi chia cho số ký tự.
  //
  // Vì sao không đo bề rộng khung chứa: một câu gợi ý ngắn nằm trong cột 720px
  // KHÔNG tạo ra dòng 100 ký tự — nó chỉ chiếm một dòng ngắn. Đo bề rộng phần tử
  // sẽ báo oan đúng những chỗ như vậy (4 cảnh báo còn lại đều thuộc dạng này).
  // Tiêu chí typographic đúng là SỐ KÝ TỰ MỘT DÒNG (khuyến nghị 45–75).
  const textRange = document.createRange();
  let worst = null;
  root.querySelectorAll('p, article, .interleave, .note, li').forEach((el) => {
    if (el.closest('.appbar')) return;

    // Chỉ đo phần tử THẬT SỰ chứa chữ trực tiếp: một wrapper như `article.cs-article`
    // có font riêng nhỏ hơn chữ bên trong nên không phản ánh dòng đọc thật.
    const hasOwnText = Array.from(el.childNodes).some(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 0
    );
    if (!hasOwnText) return;

    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length < 40) return; // quá ngắn để có thể thành dòng dài

    textRange.selectNodeContents(el);
    const rects = Array.from(textRange.getClientRects()).filter((r) => r.width > 2 && r.height > 2);
    const lines = Math.max(1, rects.length);
    const charsPerLine = text.length / lines;

    if (!worst || charsPerLine > worst.charsPerLine) {
      worst = { charsPerLine, lines, width: Math.round(el.getBoundingClientRect().width), el, chars: text.length };
    }
  });
  const widestText = worst ? worst.width : 0;
  const widestCh = worst ? Math.round(worst.charsPerLine * 10) / 10 : 0;
  const worstEl = worst ? worst.el : null;

  // Số cột của CHÍNH khối nội dung. Đây mới là chỉ số quan trọng khi kiểm
  // responsive: nếu chỉ báo "số cột lớn nhất của mọi lưới" thì một lưới phụ
  // (ví dụ heatmap 5 tuần × 7 ngày) sẽ luôn hiện 7 và CHE MẤT việc body vẫn
  // đang xếp dọc 1 cột — đúng phê bình của nhóm E.
  const colsOf = (el) => {
    if (!el) return 0;
    const s = getComputedStyle(el);
    if ((s.display === 'grid' || s.display === 'inline-grid') && s.gridTemplateColumns !== 'none') {
      return s.gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length;
    }
    return 0;
  };
  let bodyCols = colsOf(body);
  if (!bodyCols) {
    for (const kid of Array.from(body.children)) {
      const c = colsOf(kid);
      if (c > bodyCols) bodyCols = c;
    }
  }
  if (!bodyCols) bodyCols = 1;

  // Số cột lớn nhất trong các lưới có thật sự chia cột (chỉ số phụ).
  let maxCols = 1;
  root.querySelectorAll('*').forEach((el) => {
    const cols = colsOf(el);
    if (cols > maxCols) maxCols = cols;
  });

  return {
    contentWidth,
    gridMax,
    bodyMax,
    widestText,
    widestCh,
    worstEl,
    chars: worst ? worst.chars : 0,
    lines: worst ? worst.lines : 0,
    maxCols,
    bodyCols,
  };
}

function auditNode(root, screenId, issues) {
  const add = (kind, severity, node, detail) => {
    issues.push({ screen: screenId, kind, severity, where: path(node), detail, theme: currentTheme });
  };

  // 1 · Tràn ngang
  // Phân biệt hai trường hợp: tràn NHÌN THẤY ĐƯỢC (lỗi bố cục) và tràn đã bị
  // tổ tiên cắt bằng overflow hidden (có thể là chủ đích, ví dụ quầng sáng trang trí).
  const scroller = root.querySelector('.screen') || root;
  if (scroller.scrollWidth > scroller.clientWidth + 1) {
    const cs = getComputedStyle(scroller);
    const clipped = cs.overflowX === 'hidden' || cs.overflowX === 'clip';
    // Chỉ ra phần tử nào thực sự vượt mép phải — nếu không, người sửa phải
    // đi dò thủ công trên cả một màn hình.
    const cr = scroller.getBoundingClientRect();
    const offenders = [];
    scroller.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > cr.right + 1 && offenders.length < 3) {
        offenders.push(`${path(el)} vượt ${Math.round(r.right - cr.right)}px`);
      }
    });
    add(
      'overflow-x',
      clipped ? 'warn' : 'error',
      scroller,
      `scrollWidth ${scroller.scrollWidth} > clientWidth ${scroller.clientWidth}` +
        (clipped ? ' — đang bị overflow:hidden cắt; xác nhận là chủ đích' : ' — tràn ra ngoài khung') +
        (offenders.length ? `\n        thủ phạm: ${offenders.join(' | ')}` : '')
    );
  }
  root.querySelectorAll('*').forEach((el) => {
    if (el.scrollWidth <= el.clientWidth + 2 || !isVisible(el)) return;
    const cs = getComputedStyle(el);
    // Chỉ báo khi phần tử THẬT SỰ cắt chữ. overflow: visible nghĩa là chữ vẫn
    // hiển thị đủ (scrollWidth có thể lớn hơn clientWidth chỉ vì padding của
    // nút inline-block — đó là dương tính giả, không phải lỗi).
    const clips = ['hidden', 'clip', 'auto', 'scroll'].includes(cs.overflowX);
    const ellipsis = cs.textOverflow === 'ellipsis';
    if (!clips || ellipsis) return;
    if (el.children.length === 0 && el.textContent.trim()) {
      add('text-clipped', 'warn', el, `chữ bị cắt, không có dấu hiệu (${el.scrollWidth} > ${el.clientWidth})`);
    }
  });

  // 2 · Tên truy cập được + touch target
  root.querySelectorAll(INTERACTIVE).forEach((el) => {
    if (!isVisible(el)) return;

    if (!accessibleName(el)) {
      add('a11y-name', 'error', el, `${el.tagName.toLowerCase()} không có tên truy cập được`);
    }

    const r = el.getBoundingClientRect();
    const min = 44;
    if (!isInlineTextControl(el) && (r.width < min - 0.5 || r.height < min - 0.5)) {
      add('touch-target', 'error', el, `${Math.round(r.width)}×${Math.round(r.height)} < ${min}×${min}`);
    }

    // Trạng thái chọn/phẩm định phải được công bố
    if ((el.getAttribute('role') === 'switch') && el.getAttribute('aria-checked') === null) {
      add('a11y-state', 'error', el, 'role=switch thiếu aria-checked');
    }
  });

  // 3 · Tương phản chữ
  const textNodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const text = n.textContent.trim();
    if (!text) continue;
    const el = n.parentElement;
    if (!el || !isVisible(el)) continue;
    if (el.closest('svg')) continue;
    textNodes.push(el);
  }
  const uniqueText = Array.from(new Set(textNodes));
  uniqueText.forEach((el) => {
    const cs = getComputedStyle(el);
    const fg = parseColor(cs.color);
    if (!fg || fg.a === 0) return;
    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const isLarge = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = isLarge ? 3 : 4.5;

    // Chữ trên ảnh: ước lượng theo lớp phủ thật tại đúng vị trí chữ.
    const ov = overlayEstimate(el);
    let bg;
    let kind = 'contrast';
    let note = '';
    if (ov) {
      bg = over(ov, MID_GRAY);
      kind = 'contrast-over-photo';
      note = ` · ước lượng trên ảnh xám trung tính, lớp phủ alpha ${ov.a.toFixed(2)}`;
    } else {
      bg = effectiveBg(el);
    }

    const composed = fg.a < 1 ? over(fg, bg) : fg;
    const ratio = contrast(composed, bg);
    if (ratio < need) {
      // Kèm giá trị token đã giải TRÊN CHÍNH PHẦN TỬ NÀY: nếu một theme lỗi,
      // đây là thứ phân biệt "token chưa đổi" với "màn hình tự đặt màu riêng".
      const own = getComputedStyle(el);
      const toks = ['--card', '--card-2', '--card-inset', '--primary', '--primary-soft', '--ink']
        .map((t) => `${t}=${own.getPropertyValue(t).trim()}`)
        .join(' ');
      add(
        kind,
        'error',
        el,
        `${ratio.toFixed(2)}:1 (cần ${need}:1) · ${Math.round(size)}px/${weight} · ` +
          `chữ ${hex(composed)} trên nền ${hex(bg)} · "${el.textContent.trim().slice(0, 34)}"${note}\n        ${toks}`
      );
    }
  });

  // 4 · Ảnh hỏng
  root.querySelectorAll('img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) {
      add('broken-image', 'error', img, `không tải được: ${img.getAttribute('src')}`);
    }
  });

  // 5 · Hex hardcode trong style nội tuyến
  root.querySelectorAll('[style]').forEach((el) => {
    const style = el.getAttribute('style') || '';
    if (/#[0-9a-fA-F]{3,8}\b/.test(style)) {
      add('inline-hex', 'warn', el, `màu hex trong style: ${style.slice(0, 70)}`);
    }
  });

  // 6 · id trùng trong cùng màn hình
  const ids = new Map();
  root.querySelectorAll('[id]').forEach((el) => {
    ids.set(el.id, (ids.get(el.id) || 0) + 1);
  });
  ids.forEach((count, id) => {
    if (count > 1) add('duplicate-id', 'error', root, `id "${id}" xuất hiện ${count} lần`);
  });
}

/* ---------------------------------- Chạy ---------------------------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const started = Date.now();
  const { screens, missing, errors: loadErrors } = await loadScreens();
  const store = createStore(fixtures.createInitialState());
  const allIssues = [];
  const perScreen = [];
  const placeholders = [];

  for (const screen of screens) {
    const probe = h('div.probe', { class: 'probe' });
    const ctx = {
      store, params: {},
      nav: { go: () => {}, back: () => {}, replace: () => {} },
      ui, icon: ui.ICON, icons: { icon: ui.ICON }, audio, cost, data,
      onCleanup: () => {},
      gallery: true, // chặn interval/autoplay khi audit
    };

    let renderError = null;
    const t0 = performance.now();
    try {
      const node = screen.render(ctx);
      if (node) probe.appendChild(node);
      else renderError = 'render() trả về rỗng';
    } catch (err) {
      renderError = String(err && err.message ? err.message : err);
    }
    const renderMs = Math.round(performance.now() - t0);

    stage.appendChild(probe);
    if (renderError) {
      allIssues.push({ screen: screen.id, kind: 'render-throw', severity: 'error', where: screen.id, detail: renderError });
    }

    perScreen.push({
      id: screen.id,
      title: screen.title,
      placeholder: Boolean(screen.placeholder),
      nodes: 0,
      renderMs,
      issues: 0,
    });
    if (screen.placeholder) placeholders.push(screen.id);
  }

  // Đo ở TRẠNG THÁI ĐÃ ỔN ĐỊNH, không phải lúc vừa render: nhiều màn hình hiển thị
  // skeleton rồi chuyển sang nội dung thật sau ~1s (ví dụ reader, speaking).
  // Đo sớm sẽ báo lỗi giả trên bộ khung rỗng.
  await sleep(2600);

  const perScreenIssues = new Map();
  const themeTotals = { light: 0, dark: 0 };
  const tokenDump = {};
  const DUMP_TOKENS = ['--paper', '--paper-sunken', '--card', '--card-2', '--card-inset', '--ink', '--ink-2', '--ink-3', '--primary', '--primary-soft', '--highlight', '--on-primary', '--line'];

  // Kiểm CẢ HAI theme. Chỉ đổi thuộc tính data-theme — token là CSS variable nên
  // computed style đổi ngay, không cần render lại màn hình.
  for (const theme of ['light', 'dark']) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    await sleep(340); // chờ style ổn định theo token mới

    // Ghi lại giá trị token THẬT SỰ được áp dụng — để không phải suy đoán
    // khi một theme lỗi tương phản. Đo cả trên :root lẫn trên một phần tử thật,
    // vì custom property có thể bị ghi đè cục bộ ở tầng màn hình.
    const rootCs = getComputedStyle(document.documentElement);
    tokenDump[theme] = DUMP_TOKENS.map((t) => `${t}=${rootCs.getPropertyValue(t).trim()}`).join('  ');
    const sampleEl = stage.querySelector('.card') || stage.querySelector('*');
    if (sampleEl) {
      const s = getComputedStyle(sampleEl);
      tokenDump[theme] +=
        `\n   → trên phần tử thật <${sampleEl.tagName.toLowerCase()} class="${(sampleEl.className || '').toString().slice(0, 40)}">` +
        ` --card=${s.getPropertyValue('--card').trim()}` +
        ` --ink=${s.getPropertyValue('--ink').trim()}` +
        ` bg=${s.backgroundColor}` +
        ` color=${s.color}`;
    }

    screens.forEach((screen, i) => {
      const probe = stage.children[i];
      if (!probe) return;
      const before = allIssues.length;
      auditNode(probe, screen.id, allIssues);
      const delta = allIssues.length - before;
      themeTotals[theme] += delta;

      const entry = perScreen[i];
      entry.issues += delta;
      if (theme === 'light') {
        entry.nodes = probe.querySelectorAll('*').length;
        // Xem trước nội dung: phát hiện ngay màn hình render ra nhầm nhánh
        // (ví dụ rơi vào nhánh lỗi mà không ném exception).
        entry.preview = (probe.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 110);
        entry.rsv = measureResponsive(probe);
        perScreenIssues.set(screen.id, entry);
      }
    });
  }
  document.documentElement.setAttribute('data-theme', 'light');

  // Ở bề rộng lớn: nội dung kéo hết chiều rộng nghĩa là chưa áp `max-width`.
  // Không sinh lỗi tràn nên audit thường bỏ sót — cảnh báo riêng.
  // Ngưỡng lấy từ `--measure-grid` của chính màn hình, không hardcode.
  if (PROBE_W >= 1100) {
    perScreen.forEach((entry) => {
      if (entry.placeholder || !entry.rsv) return;
      const limit = (entry.rsv.gridMax || 1040) + 40;
      if (entry.rsv.contentWidth > limit) {
        allIssues.push({
          screen: entry.id,
          kind: 'stretch',
          severity: 'warn',
          where: '.screen__body',
          detail:
            `nội dung rộng ${entry.rsv.contentWidth}px trên khung ${PROBE_W}px, ` +
            `vượt hạn mức --measure-grid=${entry.rsv.gridMax}px — chưa áp max-width`,
          theme: 'all',
        });
      }
      // Ngưỡng 80 ký tự/dòng. Có hai mốc được dẫn phổ biến: Bringhurst 45–75
      // (chặt) và Butterick 45–90 (thoáng). Chọn 80 làm mốc cảnh báo để cổng này
      // bắt được dòng thật sự khó đọc mà không báo oan ở 77.
      if (entry.rsv.widestCh > 80) {
        const el = entry.rsv.worstEl;
        let diag = '';
        if (el) {
          const s = getComputedStyle(el);
          diag = ` · ${entry.rsv.chars} ký tự trên ${entry.rsv.lines} dòng · max-width=${s.maxWidth} · font-size=${s.fontSize}`;
        }
        allIssues.push({
          screen: entry.id,
          kind: 'long-line',
          severity: 'warn',
          where: el ? path(el) : 'khối chữ',
          detail:
            `${entry.rsv.widestCh} ký tự một dòng (khối rộng ${entry.rsv.widestText}px) — ` +
            `nên ≤ 75 ký tự/dòng${diag}`,
          theme: 'all',
        });
      }
    });
  }

  // Đợi ảnh ổn định rồi kiểm ảnh hỏng.
  await sleep(1200);
  screens.forEach((screen, i) => {
    const probe = stage.children[i];
    if (!probe) return;
    probe.querySelectorAll('img').forEach((img) => {
      if (img.complete && img.naturalWidth === 0) {
        allIssues.push({ screen: screen.id, kind: 'broken-image', severity: 'error', where: 'img', detail: `không tải được: ${img.getAttribute('src')}` });
      }
    });
  });

  const byKind = {};
  allIssues.forEach((i) => { byKind[i.kind] = (byKind[i.kind] || 0) + 1; });
  const errors = allIssues.filter((i) => i.severity === 'error');
  const warns = allIssues.filter((i) => i.severity === 'warn');

  const lines = [];
  lines.push('===== SNAPLIFE AUDIT =====');
  lines.push(`Thời điểm      : ${new Date().toISOString()}`);
  lines.push(`Bề rộng khung  : ${PROBE_W}px  (đổi bằng ?w=768)`);
  lines.push(`Màn hình nạp   : ${screens.length - placeholders.length}/${PLANNED.length} đã dựng · ${placeholders.length} placeholder`);
  lines.push(`Render         : ${perScreen.reduce((a, s) => a + s.renderMs, 0)}ms tổng, chậm nhất ${Math.max(0, ...perScreen.map((s) => s.renderMs))}ms`);
  lines.push(`Lỗi render     : ${allIssues.filter((i) => i.kind === 'render-throw').length}`);
  lines.push(`Tổng vi phạm   : ${allIssues.length} (error ${errors.length} · warn ${warns.length})`);
  lines.push(`Theo theme     : light ${themeTotals.light} · dark ${themeTotals.dark}  (kiểm độc lập cả hai)`);
  lines.push(`Theo loại      : ${JSON.stringify(byKind)}`);
  if (loadErrors.length) lines.push(`Nhóm nạp lỗi   : ${JSON.stringify(loadErrors)}`);
  if (placeholders.length) lines.push(`Còn placeholder: ${placeholders.join(', ')}`);
  lines.push('');
  lines.push('----- THEO MÀN HÌNH -----');
  lines.push('id               node   ms  nội-dung  body  max  kt/dòng  kết quả');
  perScreen.forEach((s) => {
    const flag = s.placeholder ? 'PLACEHOLDER' : s.issues === 0 ? 'sạch' : `${s.issues} vi phạm`;
    const rsv = s.rsv || { contentWidth: 0, maxCols: 0, bodyCols: 0, widestCh: 0 };
    lines.push(
      `${s.id.padEnd(16)} ${String(s.nodes).padStart(5)} ${String(s.renderMs).padStart(4)} ` +
        `${String(rsv.contentWidth).padStart(8)}px ${String(rsv.bodyCols ?? 1).padStart(4)} ` +
        `${String(rsv.maxCols).padStart(4)} ${String(rsv.widestCh ?? 0).padStart(8)}  ${flag}`
    );
    lines.push(`                 "${s.preview || '(không có chữ)'}"`);
  });
  lines.push('');
  lines.push('----- TOKEN THẬT SỰ ÁP DỤNG THEO THEME -----');
  Object.entries(tokenDump).forEach(([theme, dump]) => {
    lines.push(`[${theme}]`);
    dump.split('  ').forEach((pair) => lines.push('   ' + pair));
  });
  lines.push('');
  lines.push('----- CHI TIẾT (tối đa 120 dòng) -----');
  allIssues.slice(0, 120).forEach((i) => {
    lines.push(`[${i.severity.toUpperCase()}·${i.theme || 'all'}] ${i.screen} · ${i.kind} · ${i.where}\n        ${i.detail}`);
  });
  if (allIssues.length > 120) lines.push(`… còn ${allIssues.length - 120} vi phạm nữa`);
  lines.push('');
  lines.push(`Xong sau ${Date.now() - started}ms`);

  const text = lines.join('\n');
  reportEl.textContent = text;
  document.documentElement.setAttribute('data-audit-done', 'true');
  document.documentElement.setAttribute(
    'data-audit-summary',
    `w=${PROBE_W} screens=${screens.length - placeholders.length}/${PLANNED.length} errors=${errors.length} warns=${warns.length} light=${themeTotals.light} dark=${themeTotals.dark}`
  );

  // Bản JSON máy đọc được, để script khác lấy ra nếu cần.
  const pre = document.createElement('pre');
  pre.id = 'report-json';
  pre.style.display = 'none';
  pre.textContent = JSON.stringify({ perScreen, issues: allIssues, loadErrors, placeholders }, null, 1);
  document.body.appendChild(pre);

  window.__AUDIT__ = { perScreen, issues: allIssues, loadErrors, placeholders, done: true };
}

run().catch((err) => {
  reportEl.textContent = 'AUDIT THẤT BẠI: ' + (err && err.stack ? err.stack : err);
  document.documentElement.setAttribute('data-audit-done', 'failed');
});
