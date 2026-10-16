/* ============================================================================
   Kiểm thử chế độ demo/web — bắt đúng lỗi người dùng đã gặp:

   (1) Chế độ bị GHIM: bản cũ ghi chế độ MẶC ĐỊNH vào localStorage ngay khi nạp
       trang. Ai từng mở bản cũ (mặc định 'demo' ở cửa sổ ≥1100px) thì mãi mãi
       thấy khung điện thoại, và bản sửa "mặc định là web" không tới được.
       → Test: cài khoá CŨ 'snaplife.mode' = 'demo', nạp index.html KHÔNG query,
         và kỳ vọng data-mode = 'web' (khoá cũ phải bị bỏ qua).
   (2) KHÔNG có đường thoát: demo mode ẩn nút .mode-toggle và nút luôn đặt
       'demo', nên không quay về web được.
       → Test: bấm nút 2 lần, kỳ vọng web → demo → web; và nút phải HIỆN ở cả
         hai chế độ.

   Kết quả: data-verdict / data-failures + <pre id="report">.
   ========================================================================== */

const report = document.getElementById('report');
const host = document.getElementById('host');
const lines = [];
let fails = 0;

function ok(name, pass, extra) {
  lines.push(`${pass ? '✓' : '✗'} ${name}${extra ? '  — ' + extra : ''}`);
  if (!pass) {
    fails++;
    console.log('FAIL', name, extra || '');
  }
  report.textContent = lines.join('\n');
}

function frame(query, w, h) {
  return new Promise((resolve) => {
    const f = document.createElement('iframe');
    f.width = w || 1280;
    f.height = h || 800;
    f.src = '/index.html' + (query || '') + '&r=' + Math.random().toString(36).slice(2) + '#/home';
    f.onload = () => setTimeout(() => resolve(f), 2400);
    host.appendChild(f);
  });
}

const modeOf = (f) => f.contentWindow.document.documentElement.getAttribute('data-mode');
const visible = (f, sel) => {
  const el = f.contentWindow.document.querySelector(sel);
  if (!el) return false;
  const cs = f.contentWindow.getComputedStyle(el);
  return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getBoundingClientRect().width > 1;
};

(async () => {
  /* ---- (1) Khoá cũ bị nhiễm độc không được có hiệu lực ---- */
  try {
    localStorage.setItem('snaplife.mode', 'demo'); // giá trị do bản CŨ ghi
    localStorage.removeItem('snaplife.mode.v2');
  } catch (e) {
    lines.push('! localStorage bị chặn: ' + e.message);
  }
  let f = await frame('?x=1');
  ok('khoá cũ "snaplife.mode"="demo" bị bỏ qua → mặc định là web', modeOf(f) === 'web', 'data-mode=' + modeOf(f));
  f.remove();

  /* ---- (2) Nút đổi chế độ: hiện ở cả hai chế độ, đi được cả hai chiều ---- */
  f = await frame('?mode=web', 1280, 800);
  ok('web mode: nút đổi chế độ HIỆN', visible(f, '#mode-toggle'));
  let label = f.contentWindow.document.querySelector('#mode-toggle-label')?.textContent?.trim();
  ok('web mode: nhãn nút nói sẽ tới demo', label === 'Chế độ demo', 'nhãn="' + label + '"');
  f.contentWindow.document.querySelector('#mode-toggle').click();
  await new Promise((r) => setTimeout(r, 260));
  ok('bấm nút: web → demo', modeOf(f) === 'demo', 'data-mode=' + modeOf(f));
  ok('đã GHI NHỚ lựa chọn vào khoá mới .v2', localStorage.getItem('snaplife.mode.v2') === 'demo', 'v2=' + localStorage.getItem('snaplife.mode.v2'));

  const f2 = await frame('?mode=demo', 1280, 800);
  ok('demo mode: nút đổi chế độ vẫn HIỆN (có đường thoát)', visible(f2, '#mode-toggle'));
  label = f2.contentWindow.document.querySelector('#mode-toggle-label')?.textContent?.trim();
  ok('demo mode: nhãn nút nói sẽ tới web', label === 'Chế độ web', 'nhãn="' + label + '"');
  f2.contentWindow.document.querySelector('#mode-toggle').click();
  await new Promise((r) => setTimeout(r, 260));
  ok('bấm nút: demo → web', modeOf(f2) === 'web', 'data-mode=' + modeOf(f2));
  f2.remove();
  f.remove();

  /* ---- (3) Đổi mặc định KHÔNG bị ghi nhớ khi người dùng không chọn ---- */
  try {
    localStorage.removeItem('snaplife.mode');
    localStorage.removeItem('snaplife.mode.v2');
  } catch (e) {}
  f = await frame('?y=1');
  const wrote = localStorage.getItem('snaplife.mode.v2');
  ok('nạp trang KHÔNG tự ghi chế độ mặc định vào localStorage', wrote === null, 'v2=' + wrote);
  f.remove();

  lines.unshift(`SnapLife AI — kiểm thử chế độ: ${fails ? `${fails} LỖI` : 'tất cả đạt'}`);
  lines.push('--- HET ---');
  report.textContent = lines.join('\n');
  document.documentElement.setAttribute('data-verdict', fails ? 'fail' : 'pass');
  document.documentElement.setAttribute('data-failures', String(fails));
  console.log(lines.join('\n'));
})();
