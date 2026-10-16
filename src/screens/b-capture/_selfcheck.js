/* ============================================================================
   Nhóm B — tự kiểm tra trên trình duyệt THẬT (không phải mô phỏng).

   Cách làm: nhúng chính index.html vào một iframe cùng origin rồi điều khiển
   router/store/DOM thật của demo, nên kiểm được cả những thứ chỉ đúng khi ghép
   nối: cost meter idempotent, deep link, toạ độ bbox so với khung ảnh thật.

   Chạy:  chrome --headless=new ... --dump-dom http://127.0.0.1:8137/src/screens/b-capture/_selfcheck.html
   Đọc:   khối <pre id="report">
   File này là công cụ nội bộ của nhóm B (không nằm trong manifest màn hình).
   ========================================================================== */

const report = document.getElementById('report');
const lines = [];
let pass = 0;
let fail = 0;

const paint = () => {
  report.textContent = lines.join('\n');
};
const log = (text) => {
  lines.push(text);
  paint();
};
const check = (label, condition, detail = '') => {
  if (condition) {
    pass += 1;
    log(`PASS  ${label}${detail ? ` · ${detail}` : ''}`);
  } else {
    fail += 1;
    log(`FAIL  ${label}${detail ? ` · ${detail}` : ''}`);
  }
  return Boolean(condition);
};

const frame = document.getElementById('app');
const w = () => frame.contentWindow;
const doc = () => frame.contentWindow.document;
const snap = () => w().__SNAPLIFE__;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function until(fn, ms = 20000, step = 80) {
  const t0 = Date.now();
  for (;;) {
    try {
      const value = fn();
      if (value) return value;
    } catch {
      /* iframe chưa sẵn sàng */
    }
    if (Date.now() - t0 > ms) return null;
    await wait(step);
  }
}

async function go(hash) {
  w().location.hash = hash;
  await until(() => snap() && snap().router.current && doc().documentElement.dataset.ready === 'true');
  await wait(260);
  return snap().router.current.id;
}

const rectOf = (el) => el.getBoundingClientRect();
const pct = (v) => Math.round(v * 100) / 100;

(async () => {
  const bootErrors = [];
  const ready = await until(() => snap() && snap().ready && doc().documentElement.dataset.ready === 'true', 45000, 60);
  if (!ready) {
    log('FAIL  index.html không đạt data-ready trong 45s');
    log(`  __SNAPLIFE__=${typeof snap()} · dataset.ready=${doc().documentElement.dataset.ready}`);
    log('data-selfcheck-summary="boot-timeout"');
    return;
  }
  w().addEventListener('error', (e) => bootErrors.push(String(e.message)));

  const api = snap();
  check('index.html khởi động xong (data-ready)', Boolean(api && api.ready));
  check('không có nhóm màn hình lỗi', api.errors.length === 0, `errors=${JSON.stringify(api.errors)}`);
  check(
    'cả 4 id của nhóm B đã nạp',
    ['capture', 'regions', 'wordlist', 'worddetail'].every((id) => api.screens.some((s) => s.id === id)),
    api.screens.filter((s) => s.group === 'b-capture').map((s) => s.id).join(', ')
  );

  /* ---------------------------- 1 · capture ----------------------------- */
  log('\n--- 1 · capture (#/capture) ---');
  const id1 = await go('#/capture');
  check('#/capture mở đúng màn', id1 === 'capture', `id=${id1}`);
  check('có khung ngắm .viewfinder', Boolean(doc().querySelector('.viewfinder')));
  check('có nút chụp .b-shutter', Boolean(doc().querySelector('.b-shutter')));
  const shutterBox = doc().querySelector('.b-shutter').getBoundingClientRect();
  check('nút chụp ≥ 44px', shutterBox.width >= 44 && shutterBox.height >= 44, `${Math.round(shutterBox.width)}×${Math.round(shutterBox.height)}`);
  const vfImg = doc().querySelector('.viewfinder img');
  check('khung ngắm nạp ảnh thật', vfImg && vfImg.naturalWidth > 0, `natural=${vfImg.naturalWidth}×${vfImg.naturalHeight}`);
  check(
    'bốn bước kiến trúc hiện đủ',
    doc().querySelectorAll('.b-step').length === 4,
    [...doc().querySelectorAll('.b-step__t')].map((n) => n.textContent).join(' | ')
  );
  const compressTxt = doc().querySelector('.b-step__v')?.textContent || '';
  check('hiện số liệu nén từ compressInfo()', compressTxt.includes('2.4 MB') && compressTxt.includes('380 KB'), compressTxt);
  check('nút Thư viện mở được bottom sheet', (() => { doc().querySelectorAll('.b-cam__dockrow .btn')[0].click(); return Boolean(doc().querySelector('.sheet .b-lib')); })(),
    `${api.data.photoLibrary.length} ảnh`);

  const costAfterCapture = api.cost.snapshot().totals;

  /* ---------------------------- 2 · regions ----------------------------- */
  log('\n--- 2 · regions (#/regions) — cost meter & bbox ---');
  const id2 = await go('#/regions');
  check('#/regions mở đúng màn', id2 === 'regions', `id=${id2}`);

  const totals = api.cost.snapshot().totals;
  check(
    'Cost Meter: capture → regions, VLM vẫn = 1 (không thành 2)',
    totals.vlm === 1,
    `sau capture vlm=${costAfterCapture.vlm} · sau regions vlm=${totals.vlm}`
  );
  await go('#/wordlist');
  await go('#/regions');
  check('vào lại regions lần 2 vẫn không cộng thêm', api.cost.snapshot().totals.vlm === 1, `vlm=${api.cost.snapshot().totals.vlm}`);

  const photoData = api.data.photoById('morning-desk');
  const frameEl = doc().querySelector('.photo-frame');
  const fr = rectOf(frameEl);
  const imgEl = frameEl.querySelector('img');
  const ir = rectOf(imgEl);
  check('khung ảnh vuông 1:1', Math.abs(fr.width - fr.height) < 0.6, `${pct(fr.width)}×${pct(fr.height)}`);
  check('ảnh phủ kín khung (không lệch tỉ lệ)', Math.abs(ir.width - fr.width) < 0.6 && Math.abs(ir.height - fr.height) < 0.6,
    `img ${pct(ir.width)}×${pct(ir.height)} vs frame ${pct(fr.width)}×${pct(fr.height)}`);

  const boxes = [...frameEl.querySelectorAll('.bbox')];
  check('có đúng 3 vùng khoanh AI', boxes.length === 3, `n=${boxes.length}`);
  check('có đủ 3 thẻ từ đầy đủ', doc().querySelectorAll('.b-wordcard').length === 3, `n=${doc().querySelectorAll('.b-wordcard').length}`);

  log('  vùng ↔ từ ↔ toạ độ thật (đo bằng getBoundingClientRect):');
  let geometryOk = true;
  photoData.regions.forEach((region, i) => {
    const word = api.data.wordById(region.wordId);
    const box = boxes[i];
    const br = rectOf(box);
    const expX = fr.left + (fr.width * region.x) / 100;
    const expY = fr.top + (fr.height * region.y) / 100;
    const expW = (fr.width * region.w) / 100;
    const expH = (fr.height * region.h) / 100;
    const dx = Math.abs(br.left - expX);
    const dy = Math.abs(br.top - expY);
    const dw = Math.abs(br.width - expW);
    const dh = Math.abs(br.height - expH);
    const okGeo = dx < 1 && dy < 1 && dw < 1 && dh < 1;
    geometryOk = geometryOk && okGeo;
    const full = Boolean(word && word.vi && word.ipa && word.example && word.exampleVi);
    if (!full) {
      fail += 1;
      log(`FAIL  vùng ${i + 1} thiếu dữ liệu thẻ từ (wordId=${region.wordId})`);
    }
    log(
      `  ${i + 1}. ${word.en} (${word.cefr}) @ x${region.x}% y${region.y}% ${region.w}×${region.h}%` +
        ` → đo được x${pct(((br.left - fr.left) / fr.width) * 100)}% y${pct(((br.top - fr.top) / fr.height) * 100)}%` +
        ` · lệch ${pct(dx)}/${pct(dy)}px · ${okGeo ? 'khớp' : 'LỆCH'} · đủ nghĩa/IPA/ví dụ: ${full ? 'có' : 'KHÔNG'}`
    );
  });
  check('toạ độ mọi vùng khớp regionFor() < 1px', geometryOk);

  const ipaMono = doc().querySelector('.b-wordcard__ipa');
  check('IPA dùng --font-mono (JetBrains Mono)', getComputedStyle(ipaMono).fontFamily.includes('JetBrains Mono'),
    getComputedStyle(ipaMono).fontFamily.split(',')[0]);
  const card0 = doc().querySelector('.b-wordcard');
  check('thẻ từ có câu ví dụ + bản dịch',
    Boolean(card0.querySelector('.b-wordcard__ex-en')?.textContent) && Boolean(card0.querySelector('.b-wordcard__ex-vi')?.textContent));
  check('thẻ từ có nút nghe', card0.querySelectorAll('.audio-btn').length >= 2, `${card0.querySelectorAll('.audio-btn').length} nút nghe`);
  check('thẻ từ có nhãn CEFR', Boolean(card0.querySelector('.badge')));

  /* touch target — đo cả phần thập phân: 43.999 là nhiễu làm tròn, không phải vi phạm thật */
  const domPath = (el) => {
    const bits = [];
    let cur = el;
    for (let i = 0; i < 3 && cur && cur.tagName; i += 1) {
      bits.unshift(cur.tagName.toLowerCase() + (typeof cur.className === 'string' && cur.className ? '.' + cur.className.trim().split(/\s+/)[0] : ''));
      cur = cur.parentElement;
    }
    return bits.join(' < ');
  };
  const small = [];
  let minTouch = Infinity;
  [...doc().querySelectorAll('.screen.b-regions button, .screen.b-regions .chip, .screen.b-regions .seg__opt')]
    .forEach((el) => {
      const r = rectOf(el);
      if (r.width <= 0 || r.height <= 0) return;
      minTouch = Math.min(minTouch, r.width, r.height);
      // 0.05px là dung sai làm tròn của layout, không phải điểm chạm bị bóp
      if (r.width < 43.95 || r.height < 43.95) {
        small.push(`${el.className.split(' ')[0]} ${r.width.toFixed(3)}×${r.height.toFixed(3)} @ ${domPath(el)}`);
      }
    });
  check('mọi điểm chạm trong regions ≥ 44×44', small.length === 0,
    (small.slice(0, 3).join(' · ') || 'không có vi phạm') + ` · nhỏ nhất ${minTouch.toFixed(3)}px`);

  const grips = doc().querySelectorAll('.bbox__grip').length;
  check('mỗi vùng đang giữ có grip kéo giãn', grips === 3, `grip=${grips}`);

  /* Giữ / Bỏ */
  const beforeCta = doc().querySelector('.screen__cta .btn').textContent.trim();
  const card0Seg = card0.querySelectorAll('.seg__opt');
  card0Seg[1].click();
  await wait(120);
  const dropped = doc().querySelectorAll('.bbox--off').length;
  const restore = doc().querySelectorAll('.b-restore').length;
  const afterCta = doc().querySelector('.screen__cta .btn').textContent.trim();
  check('bấm "Bỏ" → vùng chuyển trạng thái off', dropped === 1, `bbox--off=${dropped}`);
  check('bấm "Bỏ" → hiện dải Hoàn tác', restore === 1, `restore=${restore}`);
  check('CTA đếm lại số từ', beforeCta.includes('3 từ') && afterCta.includes('2 từ'), `${beforeCta} → ${afterCta}`);
  doc().querySelector('.b-restore .btn').click();
  await wait(120);
  check('Hoàn tác → vùng quay lại', doc().querySelectorAll('.bbox--off').length === 0 && doc().querySelectorAll('.b-wordcard').length === 3);

  /* Tự khoanh thêm */
  const addBtn = [...doc().querySelectorAll('.b-regions__tools .btn')].find((b) => b.textContent.includes('Tự khoanh thêm'));
  addBtn.click();
  await wait(150);
  const boxes2 = [...doc().querySelectorAll('.photo-frame .bbox')];
  const userBox = doc().querySelector('.bbox--user');
  check('"Tự khoanh thêm" tạo vùng mới', boxes2.length === 4, `bbox=${boxes2.length}`);
  check('vùng mới đúng kiểu vùng người dùng', Boolean(userBox) && userBox.classList.contains('bbox--user'));
  check('vùng mới có thẻ từ kèm nghĩa', doc().querySelectorAll('.b-wordcard').length === 4, `thẻ=${doc().querySelectorAll('.b-wordcard').length}`);
  check('lưu vào store capture.userRegions', (api.store.get('capture.userRegions', []) || []).length === 1);

  /* kéo bằng bàn phím (khoá mũi tên do ui.bbox lo) */
  const KeyEvent = w().KeyboardEvent;
  const leftBefore = parseFloat(userBox.style.left);
  const hashBefore = w().location.hash;
  const screenBefore = api.router.current.id;
  userBox.dispatchEvent(new KeyEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await wait(80);
  const userBox2 = doc().querySelector('.bbox--user');
  const leftAfter = parseFloat(userBox2.style.left);
  const storedUser = (api.store.get('capture.userRegions', []) || [])[0];
  check('vùng mới dịch chuyển được bằng phím mũi tên', leftAfter > leftBefore, `left ${leftBefore}% → ${leftAfter}%`);
  check(
    'phím mũi tên KHÔNG làm nhảy màn hình (app.js bỏ qua khi target trong .bbox)',
    api.router.current.id === screenBefore && w().location.hash === hashBefore,
    `${hashBefore} → ${w().location.hash} · màn ${screenBefore} → ${api.router.current.id}`
  );
  check('toạ độ mới được ghi lại vào store', storedUser && Math.abs(storedUser.x - leftAfter) < 0.001, `store.x=${storedUser && storedUser.x}`);
  const userCard = doc().querySelector(`.b-wordcard[data-key="${storedUser.key}"]`);
  check('ô toạ độ trên thẻ từ cập nhật theo', Boolean(userCard) && userCard.querySelector('.b-wordcard__coord').textContent.includes(`${Math.round(leftAfter)}%`),
    userCard ? userCard.querySelector('.b-wordcard__coord').textContent : 'không tìm thấy thẻ');

  /* ---------------------------- 3 · wordlist ---------------------------- */
  log('\n--- 3 · wordlist (#/wordlist) ---');
  const id3 = await go('#/wordlist');
  check('#/wordlist mở đúng màn', id3 === 'wordlist', `id=${id3}`);
  const allWords = api.store.get('words', api.data.words);
  check('liệt kê đủ 23 từ', doc().querySelectorAll('.wordrow').length === allWords.length, `${doc().querySelectorAll('.wordrow').length}/${allWords.length}`);
  const search = doc().querySelector('.b-search__input');
  const WinEvent = w().Event;
  search.value = 'cai ca';
  search.dispatchEvent(new WinEvent('input', { bubbles: true }));
  await wait(120);
  const viHits = [...doc().querySelectorAll('.wordrow__en')].map((n) => n.textContent);
  check('tìm không dấu "cai ca" ra "mug"', viHits.includes('mug'), `kết quả: ${viHits.join(', ')}`);
  search.value = 'zzz';
  search.dispatchEvent(new WinEvent('input', { bubbles: true }));
  await wait(120);
  check('lọc rỗng → hiện trạng thái rỗng', Boolean(doc().querySelector('.empty')));
  doc().querySelector('.empty .btn').click();
  await wait(120);
  check('nút xoá bộ lọc trả lại danh sách', doc().querySelectorAll('.wordrow').length === allWords.length);
  const cefrChip = [...doc().querySelectorAll('.chip')].find((c) => c.textContent.startsWith('B2'));
  cefrChip.click();
  await wait(120);
  const b2 = [...doc().querySelectorAll('.wordrow')].length;
  check('lọc CEFR B2 hoạt động', b2 === allWords.filter((x) => x.cefr === 'B2').length, `${b2} từ B2`);

  /* --------------------------- 4 · worddetail --------------------------- */
  log('\n--- 4 · worddetail (#/worddetail?word=downpour) ---');
  const id4 = await go('#/worddetail?word=downpour');
  check('#/worddetail?word=downpour mở đúng màn', id4 === 'worddetail', `id=${id4}`);
  check('hiện đúng từ downpour', doc().querySelector('.b-hero__en').textContent === 'downpour',
    doc().querySelector('.b-hero__en').textContent);
  check('có nghĩa tiếng Việt', doc().querySelector('.b-hero__vi').textContent.includes('mưa'),
    doc().querySelector('.b-hero__vi').textContent);
  check('có nhãn CEFR B2', [...doc().querySelectorAll('.b-hero__tags .badge')].some((b) => b.textContent === 'B2'));
  check('có lịch ôn SRS', Boolean(doc().querySelector('.progress--seg')) && Boolean(doc().querySelector('.b-worddetail__stage-name')),
    doc().querySelector('.b-worddetail__stage-name')?.textContent || '');
  const listenLabels = [...doc().querySelectorAll('.b-listen__t')].map((n) => n.textContent);
  check('có nút "Nghe câu"', listenLabels.includes('Nghe câu'), listenLabels.join(' | '));
  const markBtn = doc().querySelector('.screen__cta .btn');
  check('có nút "Đánh dấu đã thuộc"', markBtn.textContent.includes('Đánh dấu đã thuộc'), markBtn.textContent);
  markBtn.click();
  await wait(150);
  const after = api.store.get('words').find((x) => x.id === 'downpour');
  check('đánh dấu đã thuộc ghi vào store', after.status === 'known', `status=${after.status}`);
  check('nút đổi thành trạng thái đã thuộc', doc().querySelector('.screen__cta .btn').textContent.includes('Đã thuộc'));
  await go('#/worddetail?word=khong-co-tu-nay');
  check('từ không tồn tại → trạng thái rỗng, không crash', Boolean(doc().querySelector('.empty')), doc().querySelector('.empty__title')?.textContent || '');

  /* ------------------ 5 · luồng thật: bấm chụp → regions ---------------- */
  log('\n--- 5 · luồng thật: #/capture → bấm Chụp → #/regions ---');
  await go('#/capture');
  const vlmBeforeShot = api.cost.snapshot().totals.vlm;
  doc().querySelector('.b-shutter').click();
  const reached = await until(() => api.router.current.id === 'regions', 12000);
  check('bấm nút chụp → tự chuyển sang màn Khoanh vùng', Boolean(reached), `màn hiện tại=${api.router.current.id}`);
  const vlmAfterShot = api.cost.snapshot().totals.vlm;
  check('VLM vẫn đúng 1 call cho cả ảnh sau khi chụp', vlmAfterShot === 1, `trước=${vlmBeforeShot} · sau=${vlmAfterShot}`);
  check('regions render lại đủ 3 vùng + 3 thẻ từ', doc().querySelectorAll('.bbox').length === 3 && doc().querySelectorAll('.b-wordcard').length === 3,
    `bbox=${doc().querySelectorAll('.bbox').length} · thẻ=${doc().querySelectorAll('.b-wordcard').length}`);
  check('API call của màn hiện tại = 0 (dùng lại kết quả đã lưu)', api.cost.snapshot().current.api.length === 1 && api.cost.snapshot().totals.llm === 0,
    `apiCalls=${api.cost.snapshot().apiCalls}`);

  /* ------------------ 6 · giao diện sáng / tối (chỉ dùng token) --------- */
  log('\n--- 6 · sáng / tối: màu phải đi theo token, không hardcode ---');
  await go('#/regions');
  const root = doc().documentElement;
  const cvs = (el) => w().getComputedStyle(el);
  const hexToRgb = (hex) => {
    const n = parseInt(String(hex).replace('#', '').trim(), 16);
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
  };
  const token = (name) => w().getComputedStyle(root).getPropertyValue(name);
  const readColors = () => ({
    wordTitle: cvs(doc().querySelector('.b-wordcard__en')).color,
    card: cvs(doc().querySelector('.b-wordcard')).backgroundColor,
    vi: cvs(doc().querySelector('.b-wordcard__vi')).color,
  });
  const lightColors = readColors();
  root.setAttribute('data-theme', 'dark');
  await wait(80);
  const darkColors = readColors();
  check('theme tối: tiêu đề từ đi theo --ink', darkColors.wordTitle === hexToRgb(token('--ink')),
    `${darkColors.wordTitle} vs ${hexToRgb(token('--ink'))}`);
  check('theme tối: mặt thẻ đi theo --card', darkColors.card === hexToRgb(token('--card')),
    `${darkColors.card} vs ${hexToRgb(token('--card'))}`);
  check('theme tối: nghĩa tiếng Việt đi theo --ink', darkColors.vi === hexToRgb(token('--ink')),
    `${darkColors.vi} vs ${hexToRgb(token('--ink'))}`);
  check('sáng và tối thật sự khác nhau', lightColors.wordTitle !== darkColors.wordTitle,
    `${lightColors.wordTitle} → ${darkColors.wordTitle}`);
  root.setAttribute('data-theme', 'light');

  /* ------------------------------- tổng kết ----------------------------- */
  log('\n===== TỔNG KẾT NHÓM B =====');
  log(`data-ready=${doc().documentElement.dataset.ready} · data-boot-errors=${doc().documentElement.dataset.bootErrors || '(rỗng)'} · lỗi window.onerror=${bootErrors.length}`);
  log(`cost meter cuối: ${JSON.stringify(api.cost.snapshot().totals)} · apiCalls=${api.cost.snapshot().apiCalls}`);
  log(`PASS=${pass} · FAIL=${fail}`);
  log(`data-selfcheck-summary="pass=${pass} fail=${fail} vlm=${api.cost.snapshot().totals.vlm}"`);
  document.documentElement.dataset.selfcheck = `pass=${pass} fail=${fail}`;
})().catch((err) => {
  log(`\nLỖI KHÔNG BẮT ĐƯỢC: ${err && err.stack ? err.stack : err}`);
  log('data-selfcheck-summary="crashed"');
});
