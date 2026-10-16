/* ============================================================================
   SnapLife AI — Kiểm tra tầng SHELL: chế độ web & nav thích ứng
   Owner: Lead.

   Vì sao cần harness riêng: `tools/audit.html` render từng màn hình trong một
   khung rời, nên nó KHÔNG thấy được shell — mà "dùng được trên web" phần lớn
   nằm ở shell: nav đổi từ tab bar dưới sang rail trái, khung điện thoại biến mất,
   nội dung có bề rộng tối đa.

   Cách làm: nhúng CHÍNH index.html vào iframe với bề rộng cố định, ép chế độ
   bằng ?mode=web|demo, rồi đo computed style + hình học thật trong iframe.
   ========================================================================== */

const framesHost = document.getElementById('frames');
const reportEl = document.getElementById('report');
const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
}

/** Mở index.html trong iframe với bề rộng và chế độ chỉ định. */
function openFrame({ w, h, mode }) {
  const iframe = document.createElement('iframe');
  iframe.width = String(w);
  iframe.height = String(h);
  iframe.style.width = `${w}px`;
  iframe.style.height = `${h}px`;
  iframe.src = `/index.html?mode=${mode}`;
  framesHost.appendChild(iframe);
  return iframe;
}

async function waitReady(iframe, timeout = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const w = iframe.contentWindow;
    if (w && w.__SNAPLIFE__ && w.__SNAPLIFE__.ready) return true;
    await sleep(120);
  }
  return false;
}

const styleIn = (iframe, selector) => {
  const el = iframe.contentDocument.querySelector(selector);
  return el ? getComputedStyle(el) : null;
};
const rectIn = (iframe, selector) => {
  const el = iframe.contentDocument.querySelector(selector);
  return el ? el.getBoundingClientRect() : null;
};

/* --------------------------- 1 · Chế độ web ------------------------------ */

async function testWebDesktop() {
  const f = openFrame({ w: 1360, h: 900, mode: 'web' });
  if (!(await waitReady(f))) {
    record('01 · Web mode ở 1360px', false, 'app không khởi động trong 20s');
    return;
  }
  await sleep(900);

  const doc = f.contentDocument;
  const mode = doc.documentElement.getAttribute('data-mode');
  const tabbar = styleIn(f, '#tabbar');
  const screen = styleIn(f, '#screen');
  const body = styleIn(f, '.screen__body');
  const statusbar = styleIn(f, '.app__statusbar');
  const rail = styleIn(f, '#rail');
  const device = rectIn(f, '#device');
  const sidebarRect = rectIn(f, '#tabbar');

  record('01 · Web mode ở 1360px: bật đúng chế độ', mode === 'web', `data-mode=${mode}`);

  record(
    '01a · Khung điện thoại biến mất, app tràn khung nhìn',
    Boolean(device) && device.width >= 1340 && device.height >= 880,
    device ? `khung ${Math.round(device.width)}×${Math.round(device.height)}` : 'không tìm thấy #device'
  );

  record(
    '01b · Nav thành RAIL TRÁI (dọc, sát mép trái)',
    Boolean(tabbar) && tabbar.flexDirection === 'column' && sidebarRect && sidebarRect.left < 2 && sidebarRect.width > 180,
    tabbar
      ? `flex-direction=${tabbar.flexDirection} · trái=${sidebarRect ? Math.round(sidebarRect.left) : '?'} · rộng=${sidebarRect ? Math.round(sidebarRect.width) : '?'}`
      : 'không tìm thấy #tabbar'
  );

  record(
    '01c · Chrome điện thoại (giờ giả, thanh home) đã ẩn',
    statusbar && statusbar.display === 'none',
    statusbar ? `statusbar display=${statusbar.display}` : 'không tìm thấy statusbar'
  );

  record(
    '01d · Điều khiển demo shell đã ẩn',
    (!rail || rail.display === 'none') && (!styleIn(f, '.inspector') || styleIn(f, '.inspector').display === 'none'),
    `rail=${rail ? rail.display : 'không có'}`
  );

  record(
    '01e · Nội dung có bề rộng tối đa, canh giữa (không kéo hết chiều rộng)',
    Boolean(body) && body.maxWidth !== 'none' && body.maxWidth !== '' && parseFloat(body.maxWidth) <= 1200,
    body ? `max-width=${body.maxWidth} · padding-left=${body.paddingLeft}` : 'không tìm thấy .screen__body'
  );

  // Tab bar phải thật sự nằm bên trái nội dung.
  const screenRect = rectIn(f, '#screen');
  record(
    '01f · Nội dung nằm BÊN PHẢI rail, không chồng lên',
    Boolean(screenRect && sidebarRect) && screenRect.left >= sidebarRect.right - 2,
    `rail phải=${sidebarRect ? Math.round(sidebarRect.right) : '?'} · nội dung trái=${screenRect ? Math.round(screenRect.left) : '?'}`
  );

  f.remove();
}

/* ------- 1g · Màn khai `appbar` vẫn phải có sidebar ở desktop ------------ */
/* Hồi quy cho lỗi Lead tự tìm ra: router đặt `display:none` cho tab bar ở các
   màn `chrome: 'appbar'`, nên trong web mode ở desktop rail biến mất và thừa
   một cột trống 236px bên trái. */
async function testAppbarScreenKeepsRail() {
  const f = openFrame({ w: 1360, h: 900, mode: 'web' });
  if (!(await waitReady(f))) {
    record('01g · Màn appbar vẫn có rail ở desktop', false, 'app không khởi động trong 20s');
    return;
  }
  // `placement` khai chrome: 'appbar' — trên điện thoại nó ẩn tab bar.
  f.contentWindow.location.hash = '#/placement';
  await sleep(1000);

  const tabbar = styleIn(f, '#tabbar');
  const tabRect = rectIn(f, '#tabbar');
  const screenRect = rectIn(f, '#screen');
  const tabCount = f.contentDocument.querySelectorAll('#tabbar .tab').length;

  record(
    '01g · Màn appbar vẫn có rail ở desktop',
    Boolean(tabbar) && tabbar.display !== 'none' && tabbar.flexDirection === 'column' && tabCount === 5,
    `display=${tabbar ? tabbar.display : '?'} · flex-direction=${tabbar ? tabbar.flexDirection : '?'} · ${tabCount} tab`
  );
  record(
    '01h · Không có cột trống bên trái ở màn appbar',
    Boolean(screenRect && tabRect) && Math.abs(screenRect.left - tabRect.right) < 3,
    `rail phải=${tabRect ? Math.round(tabRect.right) : '?'} · nội dung trái=${screenRect ? Math.round(screenRect.left) : '?'}`
  );

  f.remove();
}

async function testDemoMode() {
  const f = openFrame({ w: 1360, h: 900, mode: 'demo' });
  if (!(await waitReady(f))) {
    record('02 · Chế độ demo ở 1360px', false, 'app không khởi động trong 20s');
    return;
  }
  await sleep(900);

  const mode = f.contentDocument.documentElement.getAttribute('data-mode');
  const tabbar = styleIn(f, '#tabbar');
  const device = rectIn(f, '#device');
  const rail = styleIn(f, '#rail');
  const body = styleIn(f, '.screen__body');

  record('02 · Chế độ demo: bật đúng chế độ', mode === 'demo', `data-mode=${mode}`);
  record(
    '02a · Khung điện thoại quay lại, rộng ~390px',
    Boolean(device) && device.width > 360 && device.width < 430,
    device ? `khung ${Math.round(device.width)}px` : 'không có #device'
  );
  record(
    '02b · Có rail chọn màn hình của khung demo',
    Boolean(rail) && rail.display !== 'none',
    rail ? `rail display=${rail.display}` : 'không tìm thấy #rail'
  );
  // Đây là phép thử quan trọng nhất của cả harness: chứng minh rằng bố cục
  // desktop KHÔNG rò vào khung 390px. Trước đây các nhóm viết
  // `@media (min-width: 900px)` nên trên màn 1440px luật đó vẫn chạy trong
  // khung 390px và làm vỡ bố cục — container query mới sửa được điều này.
  const bodyRect = rectIn(f, '.screen__body');
  const bodyWidth = bodyRect ? bodyRect.width : 9999;
  record(
    '02c · QUAN TRỌNG: luật desktop KHÔNG rò vào khung 390px',
    Boolean(tabbar) && tabbar.flexDirection !== 'column' && bodyWidth <= 392,
    `tabbar flex-direction=${tabbar ? tabbar.flexDirection : '?'} (phải KHÁC 'column') · ` +
      `.screen__body rộng ${Math.round(bodyWidth)}px (phải ≤ 392px)`
  );

  f.remove();
}

/* --------------------- 3 · Điện thoại: tab bar dưới --------------------- */

async function testPhoneNarrow() {
  const f = openFrame({ w: 390, h: 844, mode: 'web' });
  if (!(await waitReady(f))) {
    record('03 · Web mode ở 390px (điện thoại)', false, 'app không khởi động trong 20s');
    return;
  }
  await sleep(900);

  const tabbar = styleIn(f, '#tabbar');
  const tabRect = rectIn(f, '#tabbar');
  const device = rectIn(f, '#device');
  const screen = rectIn(f, '#screen');

  record(
    '03 · Web mode ở 390px: nav vẫn là TAB BAR DƯỚI',
    Boolean(tabbar) && tabbar.flexDirection === 'row' && tabRect && tabRect.top > 700 && tabRect.width > 380,
    tabbar
      ? `flex-direction=${tabbar.flexDirection} · top=${tabRect ? Math.round(tabRect.top) : '?'} · rộng=${tabRect ? Math.round(tabRect.width) : '?'}`
      : 'không tìm thấy #tabbar'
  );

  record(
    '03a · App tràn đúng khung điện thoại, không có khung giả',
    Boolean(device) && Math.abs(device.width - 390) < 2 && Boolean(screen) && screen.width <= 390,
    device ? `khung ${Math.round(device.width)}×${Math.round(device.height)}` : 'không có #device'
  );

  const overflow = f.contentDocument.querySelector('.screen');
  record(
    '03b · Không tràn ngang ở 390px',
    Boolean(overflow) && overflow.scrollWidth <= overflow.clientWidth + 1,
    overflow ? `scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}` : 'không có .screen'
  );

  f.remove();
}

/* ------------------------------ 4 · Tablet ------------------------------ */

async function testTablet() {
  const f = openFrame({ w: 820, h: 1024, mode: 'web' });
  if (!(await waitReady(f))) {
    record('04 · Web mode ở 820px (tablet dọc)', false, 'app không khởi động trong 20s');
    return;
  }
  await sleep(900);

  const tabbar = styleIn(f, '#tabbar');
  const tabRect = rectIn(f, '#tabbar');
  record(
    '04 · 820px: nav vẫn ở dưới (điện thoại lớn / tablet dọc)',
    Boolean(tabbar) && tabbar.flexDirection === 'row' && tabRect && tabRect.top > 900,
    tabbar ? `flex-direction=${tabbar.flexDirection} · top=${tabRect ? Math.round(tabRect.top) : '?'}` : 'không tìm thấy #tabbar'
  );

  // Không có phần tử nào rộng hơn khung.
  const host = f.contentDocument.getElementById('screen');
  const over = host ? host.scrollWidth - host.clientWidth : 0;
  record('04a · Không tràn ngang ở 820px', over <= 1, `chênh lệch ${over}px`);

  f.remove();
}

/* --------------------------------- Chạy --------------------------------- */
async function run() {
  const t0 = Date.now();
  const steps = [testWebDesktop, testAppbarScreenKeepsRail, testDemoMode, testPhoneNarrow, testTablet];
  for (const step of steps) {
    try {
      await step();
    } catch (err) {
      record(step.name, false, `ném lỗi: ${err && err.message ? err.message : err}`);
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const lines = [];
  lines.push('===== SNAPLIFE — KIỂM TRA CHẾ ĐỘ WEB & NAV THÍCH ỨNG =====');
  lines.push(`Thời điểm : ${new Date().toISOString()}`);
  lines.push(`Kết quả   : ${passed}/${results.length} đạt`);
  lines.push('');
  results.forEach((r) => {
    lines.push(`${r.ok ? '[ĐẠT ]' : '[HỎNG]'} ${r.name}`);
    lines.push(`         ${r.detail}`);
  });
  lines.push('');
  lines.push(`Xong sau ${Date.now() - t0}ms`);

  reportEl.textContent = lines.join('\n');
  document.documentElement.setAttribute('data-webcheck-done', 'true');
  document.documentElement.setAttribute('data-webcheck-summary', `${passed}/${results.length}`);
  window.__WEBCHECK__ = { results, passed, total: results.length, done: true };
}

run().catch((err) => {
  reportEl.textContent = 'KIỂM TRA THẤT BẠI: ' + (err && err.stack ? err.stack : err);
  document.documentElement.setAttribute('data-webcheck-done', 'failed');
});
