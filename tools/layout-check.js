/* ============================================================================
   Đo bố cục KHUNG SHELL của index.html ở CẢ HAI chế độ, nhiều bề rộng.

   Vì sao cần: audit theo từng màn hình chỉ soi bên trong .app, nên nó KHÔNG thấy
   lỗi của khung shell — đúng loại lỗi đã lọt ra bản demo (<body> và <div> cùng
   mang class "shell" khiến cả trang co vào ~604px bên trái, rail/khung điện
   thoại/inspector chồng lên nhau).

   Bốn luật kiểm, đều là lỗi THẬT:
     1. sai chế độ          — ?mode=web mà data-mode lại khác
     2. đè nhau (2 CHIỀU)   — hai khối giao nhau cả x lẫn y
     3. cột giữa bị co      — .stage hẹp bất thường, dấu hiệu lưới hỏng
     4. thứ tự cột sai      — rail phải nằm trước stage, stage trước inspector
   Cộng thêm: tràn ngang và lỗi runtime.

   Khoảng trống hai bên khung điện thoại là CĂN GIỮA có chủ ý, nên chỉ ghi ra
   như số liệu tham khảo, không tính là lỗi.

   Kết quả: <pre id="report">, data-verdict, data-failures (đọc bằng --dump-dom).
   ========================================================================== */

const P = new URLSearchParams(location.search);
const WIDTHS = (P.get('w') || '958,1278,1534,1917')
  .split(',')
  .map((n) => parseInt(n, 10))
  .filter((n) => n > 0);
const HEIGHT = parseInt(P.get('h') || '901', 10);
const MODES = ['demo', 'web'];
const MIN_STAGE = 200; // px — dưới mức này là lưới hỏng, không phải bố cục hẹp

/* Kiểm tỉ lệ khung điện thoại: chiều cao cửa sổ thay đổi KHÔNG được bóp méo khung.
   Đây là lỗi đã lọt ra bản demo: `.device { max-height: calc(100vh - 190px) }` ép
   khung từ 844px xuống 532px trên laptop, tỉ lệ 390:844 bị phá và màn hình bên
   trong chỉ còn ~508px nên nội dung bị cắt cụt. */
const ASPECT_W = parseInt(P.get('aw') || '1534', 10);
const HS = (P.get('hs') || '600,722,900,1000')
  .split(',')
  .map((n) => parseInt(n, 10))
  .filter((n) => n > 0);
const WANT_RATIO = 844 / 390; // 2.1641

const report = document.getElementById('report');
const host = document.getElementById('host');
const lines = [];
let failures = 0;

const fmt = (n) => Math.round(n);

function rectOf(win, sel) {
  const el = win.document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = win.getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || r.width < 1 || r.height < 1) return null;
  return { x: r.left, r: r.right, w: r.width, y: r.top, b: r.bottom, h: r.height };
}

/* Đè nhau phải xét CẢ HAI trục: topbar nằm hàng trên, rail hàng dưới — trùng x
   là đúng thiết kế, không phải lỗi. */
function overlap2d(a, b) {
  if (!a || !b) return 0;
  const ox = Math.min(a.r, b.r) - Math.max(a.x, b.x);
  const oy = Math.min(a.b, b.b) - Math.max(a.y, b.y);
  return ox > 1 && oy > 1 ? Math.min(ox, oy) : 0;
}

function loadSrc(src, w, h) {
  return new Promise((resolve) => {
    const f = document.createElement('iframe');
    f.width = w;
    f.height = h;
    /* Tham số chống cache phải nằm TRƯỚC dấu #. Nếu chèn sau, nó thành một phần
       của fragment và đổi luôn route (`#/home` biến thành `#/home&r=xxx`), router
       không tìm thấy màn hình đó. */
    const hash = src.indexOf('#');
    const base = hash >= 0 ? src.slice(0, hash) : src;
    const frag = hash >= 0 ? src.slice(hash) : '';
    f.src = base + (base.includes('?') ? '&' : '?') + 'r=' + Math.random().toString(36).slice(2) + frag;
    f.onload = () => setTimeout(() => resolve(f), 2600); // chờ font + boot
    host.appendChild(f);
  });
}

function load(mode, w, h) {
  return loadSrc('/index.html?mode=' + mode + '#/home', w, h || HEIGHT);
}

async function measure(mode, w) {
  const f = await load(mode, w, HEIGHT);
  const win = f.contentWindow;
  const parts = {
    topbar: rectOf(win, '.shell__topbar'),
    rail: rectOf(win, '#rail'),
    stage: rectOf(win, '.stage'),
    device: rectOf(win, '#device'),
    inspector: rectOf(win, '#inspector'),
  };
  const de = win.document.documentElement;
  const modeActual = de.getAttribute('data-mode');
  const errors = (win.__BOOT_ERRORS__ || []).length;

  const pairs = [
    ['topbar', 'rail'],
    ['topbar', 'stage'],
    ['rail', 'stage'],
    ['rail', 'device'],
    ['stage', 'inspector'],
    ['device', 'inspector'],
    ['rail', 'inspector'],
  ];
  const hits = pairs
    .map(([a, b]) => [a + '×' + b, overlap2d(parts[a], parts[b])])
    .filter(([, v]) => v > 2);

  const bad = [];
  if (modeActual !== mode) bad.push(`chế độ sai: ${modeActual}`);
  if (hits.length) bad.push(`đè nhau: ${hits.map(([k, v]) => `${k}=${fmt(v)}px`).join(', ')}`);
  if (parts.stage && parts.stage.w < MIN_STAGE && !parts.rail) {
    /* Chỉ là lỗi khi có rail (tức là chế độ nhiều cột) mà stage vẫn bị co. */
    bad.push(`cột giữa co còn ${fmt(parts.stage.w)}px`);
  }

  /* Thứ tự cột khi cả ba cùng nằm trên một hàng (rail và inspector ngang nhau). */
  if (parts.rail && parts.stage && parts.inspector) {
    const sameRow = Math.abs(parts.rail.y - parts.inspector.y) < 4;
    if (sameRow) {
      if (parts.rail.r > parts.stage.x + 2) bad.push(`rail lấn stage ${fmt(parts.rail.r - parts.stage.x)}px`);
      if (parts.stage.r > parts.inspector.x + 2) bad.push(`stage lấn inspector ${fmt(parts.stage.r - parts.inspector.x)}px`);
    }
  }

  const overflowX = de.scrollWidth - win.innerWidth;
  if (overflowX > 2) bad.push(`tràn ngang ${overflowX}px`);
  if (errors) bad.push(`${errors} lỗi runtime`);

  /* Số liệu tham khảo: khe giữa rail và khung điện thoại (căn giữa có chủ ý). */
  const gutter =
    parts.rail && parts.device ? Math.round(parts.device.x - parts.rail.r) : null;

  const bits = Object.entries(parts)
    .filter(([, p]) => p)
    .map(([k, p]) => `${k}=${fmt(p.x)}..${fmt(p.r)}(${fmt(p.w)})x${fmt(p.y)}`)
    .join(' ');
  lines.push(
    `${bad.length ? '✗' : '✓'} ${mode} @${w}×${HEIGHT}  ${bits}` +
      (gutter !== null ? `  khe(rail→device)=${gutter}` : '') +
      (bad.length ? `\n     → ${bad.join(' | ')}` : '')
  );
  if (bad.length) {
    failures++;
    console.log('FAIL', mode, w, bad.join(' | '));
  }
  f.remove();
}

/* Khung điện thoại phải giữ nguyên 390:844 ở MỌI chiều cao cửa sổ. */
async function checkAspect(h) {
  const f = await loadSrc('/index.html?mode=demo#/home', ASPECT_W, h);
  const win = f.contentWindow;
  const dev = rectOf(win, '#device');
  const vp = rectOf(win, '.device__viewport');
  const appEl = win.document.querySelector('#app');
  const appH = appEl ? appEl.getBoundingClientRect().height : 0;
  const pageH = win.document.documentElement.scrollHeight;

  const bad = [];
  if (!dev) {
    bad.push('không thấy #device');
  } else {
    const ratio = dev.h / dev.w;
    if (Math.abs(ratio - WANT_RATIO) > 0.02) {
      bad.push(
        `khung méo: ${fmt(dev.w)}×${fmt(dev.h)} = tỉ lệ ${ratio.toFixed(3)} (phải ${WANT_RATIO.toFixed(3)})`
      );
    }
  }
  /* Màn hình bên trong phải cao đúng bằng thiết kế, nếu không nội dung bị cắt. */
  if (vp && vp.h < 800) bad.push(`màn hình trong chỉ ${fmt(vp.h)}px (thiết kế 820px)`);
  if (appH && Math.abs(appH - vp.h) > 2) bad.push(`.app lệch màn hình ${fmt(appH)} vs ${fmt(vp.h)}`);
  if (vp && vp.w < 360) bad.push(`màn hình trong hẹp ${fmt(vp.w)}px`);

  const note = pageH > h ? `  trang cuộn ${fmt(pageH - h)}px` : '  vừa cửa sổ';
  lines.push(
    `${bad.length ? '✗' : '✓'} demo @${ASPECT_W}×${h}  device=${dev ? fmt(dev.w) + '×' + fmt(dev.h) : '?'}` +
      ` viewport=${vp ? fmt(vp.w) + '×' + fmt(vp.h) : '?'}${note}` +
      (bad.length ? `\n     → ${bad.join(' | ')}` : '')
  );
  if (bad.length) {
    failures++;
    console.log('FAIL aspect', h, bad.join(' | '));
  }
  f.remove();
}

(async () => {
  for (const w of WIDTHS) {
    for (const mode of MODES) {
      try {
        await measure(mode, w);
      } catch (e) {
        failures++;
        lines.push(`✗ ${mode} @${w} — ngoại lệ: ${e.message}`);
      }
      report.textContent = lines.join('\n');
    }
  }
  /* Tỉ lệ khung điện thoại ở nhiều chiều cao cửa sổ. */
  for (const h of HS) {
    try {
      await checkAspect(h);
    } catch (e) {
      failures++;
      lines.push(`✗ demo @${ASPECT_W}×${h} — ngoại lệ: ${e.message}`);
    }
    report.textContent = lines.join('\n');
  }

  lines.unshift(`SnapLife AI — bố cục khung shell: ${failures ? `${failures} LỖI` : 'tất cả đạt'}`);
  lines.push('--- HET ---');
  report.textContent = lines.join('\n');
  document.documentElement.setAttribute('data-verdict', failures ? 'fail' : 'pass');
  document.documentElement.setAttribute('data-failures', String(failures));
  console.log(lines.join('\n'));
})();
