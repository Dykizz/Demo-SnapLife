/* ============================================================================
   SnapLife AI — Kiểm thử luồng end-to-end
   Owner: Lead.  Chạy trong trình duyệt, đọc kết quả bằng --dump-dom.

   Khác với tools/audit.js (kiểm giao diện tĩnh), harness này nhúng CHÍNH
   index.html vào iframe rồi điều khiển nó như người dùng: đổi hash, bấm nút,
   đọc Cost Meter. Nhờ vậy nó bắt được lỗi GHÉP NỐI giữa các nhóm — thứ mà
   kiểm tra từng màn hình riêng lẻ không bao giờ thấy.
   ========================================================================== */

const frame = document.getElementById('app');
const reportEl = document.getElementById('report');

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
}

function win() {
  return frame.contentWindow;
}

/** Chờ app trong iframe khởi động xong. */
async function waitReady(timeout = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const w = win();
    if (w && w.__SNAPLIFE__ && w.__SNAPLIFE__.ready) return true;
    await sleep(120);
  }
  return false;
}

function go(hash) {
  return new Promise((resolve) => {
    const w = win();
    const done = () => {
      w.removeEventListener('hashchange', done);
      resolve();
    };
    if (w.location.hash === hash) {
      resolve();
      return;
    }
    w.addEventListener('hashchange', done);
    w.location.hash = hash;
    setTimeout(resolve, 1600); // lưới an toàn nếu hashchange không bắn
  });
}

function doc() {
  return win().document;
}

function screenHost() {
  return doc().getElementById('screen');
}

/** Bấm phần tử đầu tiên có chữ khớp, trong phạm vi chỉ định. */
function clickByText(text, { selector = 'button, a', root = null, exact = false } = {}) {
  const scope = root || screenHost();
  const nodes = Array.from(scope.querySelectorAll(selector));
  const target = nodes.find((n) => {
    const t = (n.textContent || '').replace(/\s+/g, ' ').trim();
    return exact ? t === text : t.includes(text);
  });
  if (!target) return null;
  target.click();
  return target;
}

function findSelectedText(scope = screenHost()) {
  return Array.from(scope.querySelectorAll('[aria-selected="true"], [aria-pressed="true"], [aria-current="page"]'))
    .map((n) => (n.textContent || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

const cost = () => win().__SNAPLIFE__.cost.snapshot().totals;

/* ------------------------------- Các phép thử ---------------------------- */

async function t01_registry() {
  const S = win().__SNAPLIFE__;
  const missing = S.missing || [];
  const errors = S.errors || [];
  record(
    '01 · Mọi màn hình đã được dựng (không còn placeholder)',
    missing.length === 0 && errors.length === 0,
    missing.length ? `còn thiếu: ${missing.join(', ')}` : errors.length ? `nhóm lỗi: ${JSON.stringify(errors)}` : `${S.screens.length} màn hình`
  );
}

async function t02_every_screen_renders() {
  const S = win().__SNAPLIFE__;
  const bad = [];
  for (const screen of S.screens) {
    await go(`#/${screen.id}`);
    await sleep(260);
    const host = screenHost();
    const text = (host.textContent || '');
    if (text.includes('Màn hình gặp lỗi') || text.includes('Không tìm thấy màn hình')) {
      bad.push(`${screen.id} (router báo lỗi)`);
    } else if (text.trim().length < 40) {
      bad.push(`${screen.id} (gần như trống)`);
    }
  }
  record('02 · Mỗi màn hình render được nội dung thật', bad.length === 0, bad.join(' · ') || `${S.screens.length}/${S.screens.length} ok`);
}

async function t03_no_runtime_errors() {
  await go('#/home');
  await sleep(300);
  const errs = win().__BOOT_ERRORS__ || [];
  record('03 · Không có lỗi runtime khi đi qua mọi màn', errs.length === 0, errs.slice(0, 3).join(' | ') || 'sạch');
}

async function t04_cost_idempotent_capture() {
  const S = win().__SNAPLIFE__;
  S.cost.reset();
  await go('#/capture');
  await sleep(300);
  const afterCapture = cost().vlm;
  await go('#/regions');
  await sleep(300);
  const afterRegions = cost().vlm;
  await go('#/capture');
  await sleep(300);
  const afterReturn = cost().vlm;
  record(
    '04 · VLM chỉ gọi 1 lần cho mỗi ảnh (idempotent theo khoá)',
    afterCapture === 1 && afterRegions === 1 && afterReturn === 1,
    `capture=${afterCapture} regions=${afterRegions} quay lại=${afterReturn} (mong đợi 1/1/1)`
  );
}

async function t05_cost_story_and_speaking() {
  const S = win().__SNAPLIFE__;
  S.cost.reset();
  await go('#/reader');
  await sleep(400);
  const afterReader = cost().llm;
  await go('#/speaking');
  await sleep(400);
  const afterSpeaking = cost().llm;
  record(
    '05 · LLM +1 cho truyện, +1 tiếp cho phần chỉnh câu nói',
    afterReader === 1 && afterSpeaking === 2,
    `reader=${afterReader} speaking=${afterSpeaking} (mong đợi 1/2)`
  );
}

async function t06_review_zero_api() {
  const S = win().__SNAPLIFE__;
  S.cost.reset();
  await go('#/review-run');
  await sleep(600);
  const before = S.cost.snapshot().apiCalls;

  // Kiểm luôn tính đúng đắn của hàng đợi sinh bằng quy tắc: mỗi item "chạm ảnh"
  // phải có ĐÚNG MỘT vùng là đáp án. Trước đây logic có fallback `|| photos[0]`
  // sinh ra item không có đáp án đúng nào.
  const queue = (S.store.get('review.queue') || []).slice();
  const taps = queue.filter((it) => it.type === 'tapimg');
  const badTaps = taps.filter(
    (it) => (it.regions || []).filter((r) => r.isTarget).length !== 1
  );
  record(
    '06c · Mọi item "chạm ảnh" có đúng một đáp án',
    taps.length > 0 && badTaps.length === 0,
    `${taps.length} item chạm ảnh · ${badTaps.length} item sai` +
      (taps.length === 0 ? ' — không có item nào, không kiểm được' : '')
  );

  const clickIf = (selector, host) => {
    const n = host.querySelector(selector);
    if (!n || n.disabled) return false;
    n.click();
    return true;
  };

  let actions = 0;
  const kindsSeen = new Set();

  for (let step = 0; step < 30; step += 1) {
    const host = screenHost();
    const badge = host.querySelector('.rv-typebadge');
    if (badge) kindsSeen.add((badge.textContent || '').trim());

    // Trả lời theo đúng dạng bài đang hiện.
    if (clickIf('.rv-opt', host)) {
      actions += 1;
    } else if (clickIf('.rv-flip', host)) {
      actions += 1;
      await sleep(180);
      clickIf('.rv-quality-row button', host);
      actions += 1;
    } else if (clickIf('.bbox[tabindex]', host)) {
      actions += 1;
    } else {
      const items = Array.from(host.querySelectorAll('.rv-match__item'));
      if (items.length >= 2) {
        items[0].click();
        items[1].click();
        actions += 2;
      } else {
        clickIf('.rv-quality-row button', host);
      }
    }

    await sleep(160);

    // Đóng bottom sheet nếu thao tác vừa rồi mở nó.
    const close = host.querySelector('.sheet button[aria-label="Đóng"], .sheet .iconbtn');
    if (close) close.click();

    const next = Array.from(host.querySelectorAll('.rv-next')).find((b) => !b.disabled);
    if (next) {
      next.click();
      actions += 1;
    }
    await sleep(170);
  }

  const after = S.cost.snapshot().apiCalls;
  const review = S.store.get('review', {});
  record(
    '06 · Ôn tập KHÔNG phát sinh API call nào',
    before === 0 && after === 0 && actions > 0,
    `trước=${before} sau=${after} · đã bấm ${actions} lần` +
      (actions === 0 ? ' — TEST KHÔNG CHẠY ĐƯỢC, selector có thể đã đổi' : '')
  );
  record(
    '06b · Phiên ôn có tiến triển thật khi bấm',
    (review.answered ?? 0) > 0,
    `index=${review.index ?? 0} answered=${review.answered ?? 0} correct=${review.correct ?? 0} · dạng bài gặp: ${[...kindsSeen].join(', ') || '(không đọc được)'}`
  );
}

async function t07_session_length_cross_group() {
  const S = win().__SNAPLIFE__;
  await go('#/home');
  await sleep(400);

  // Bấm lựa chọn "20 phút" ở trang chủ (nhóm A).
  const picked = clickByText('20 phút', { selector: 'button' });
  await sleep(300);
  const stored = S.store.get('review.length');
  record(
    '07 · Trang chủ ghi được độ dài phiên vào store',
    stored === 20,
    picked ? `review.length=${stored} (mong đợi 20)` : `không tìm thấy nút "20 phút" · review.length=${stored}`
  );

  // Sang nhóm D xem có tôn trọng giá trị đó không.
  await go('#/review-hub');
  await sleep(400);
  const selected = findSelectedText();
  const hubShows20 = selected.some((t) => t.includes('20 phút'));
  record(
    '07b · Màn ôn tập (nhóm D) đọc đúng lựa chọn của nhóm A',
    hubShows20,
    `lựa chọn đang bật: ${selected.join(' | ') || '(không có aria-selected nào)'}`
  );
}

async function t08_deeplink_word() {
  await go('#/worddetail?word=downpour');
  await sleep(400);
  const text = (screenHost().textContent || '').replace(/\s+/g, ' ');
  record(
    '08 · Deep link có tham số hoạt động (#/worddetail?word=downpour)',
    text.toLowerCase().includes('downpour') && text.includes('trận mưa'),
    text.slice(0, 90)
  );
}

async function t09_tabbar_rules() {
  await go('#/home');
  await sleep(350);
  const bar = doc().getElementById('tabbar');
  const visibleOnHome = bar && getComputedStyle(bar).display !== 'none';
  const tabCount = bar ? bar.querySelectorAll('.tab').length : 0;

  await go('#/splash');
  await sleep(350);
  const hiddenOnSplash = bar && getComputedStyle(bar).display === 'none';

  record(
    '09 · Tab bar hiện đúng chỗ: 5 tab ở trang chủ, ẩn ở màn toàn màn hình',
    visibleOnHome && tabCount === 5 && hiddenOnSplash,
    `home display=${visibleOnHome ? 'hiện' : 'ẩn'} · ${tabCount} tab · splash ${hiddenOnSplash ? 'ẩn đúng' : 'vẫn hiện (sai)'}`
  );

  // qa-verify phát hiện `wordlist` và `stories` từng khai chrome 'appbar' nên mất
  // bottom-nav giữa luồng. Kiểm luôn cả 6 màn phải có tab bar và 3 màn phải ẩn.
  const mustHave = ['home', 'reader', 'review-hub', 'progress', 'wordlist', 'stories'];
  const mustHide = ['splash', 'onboarding', 'capture'];
  const wrong = [];
  for (const id of mustHave) {
    await go(`#/${id}`);
    await sleep(260);
    if (getComputedStyle(bar).display === 'none') wrong.push(`${id} phải có tab bar nhưng đang ẩn`);
  }
  for (const id of mustHide) {
    await go(`#/${id}`);
    await sleep(260);
    if (getComputedStyle(bar).display !== 'none') wrong.push(`${id} phải ẩn tab bar nhưng đang hiện`);
  }
  record(
    '09b · Bản đồ tab bar đúng cho cả 9 màn',
    wrong.length === 0,
    wrong.join(' · ') || `${mustHave.length} màn có tab bar · ${mustHide.length} màn ẩn — đúng`
  );
}

async function t10_story_ratio_honest() {
  await go('#/reader');
  await sleep(500);
  const text = (screenHost().textContent || '');
  const m = text.match(/(\d+)%\s*tiếng Anh/);
  const pct = m ? Number(m[1]) : null;
  record(
    '10 · Tỉ lệ tiếng Anh hiển thị là số thật, nằm trong 15–20%',
    pct !== null && pct >= 15 && pct <= 20,
    pct === null ? 'không tìm thấy con số % trên màn reader' : `hiển thị ${pct}%`
  );
}

async function t11_theme_and_reduced_motion() {
  const root = doc().documentElement;
  const before = root.getAttribute('data-theme');
  // Đổi theme bằng phím tắt T của khung demo.
  doc().dispatchEvent(new KeyboardEvent('keydown', { key: 't', bubbles: true }));
  await sleep(250);
  const after = root.getAttribute('data-theme');
  record('11 · Đổi giao diện sáng/tối được', before !== after, `${before} → ${after}`);

  const motionOk = getComputedStyle(root).getPropertyValue('--dur').trim().length > 0;
  record('11b · Token chuyển động tồn tại để tắt được theo reduced-motion', motionOk, `--dur=${getComputedStyle(root).getPropertyValue('--dur').trim()}`);
}

async function t16_dialog_traps_focus() {
  // Hồi quy cho lỗi qa-verify đo được: dialog khai aria-modal="true" nhưng
  // không bẫy Tab, nên 20/25 điểm dừng Tab rơi ra ngoài dialog.
  await go('#/reader');
  await sleep(700);

  const word = screenHost().querySelector('.en');
  if (!word) {
    record('16 · Dialog khoá tiêu điểm bên trong', false, 'không mở được sheet trên #/reader');
    return;
  }
  word.click();
  await sleep(500);

  const sheet = doc().querySelector('.sheet');
  if (!sheet) {
    record('16 · Dialog khoá tiêu điểm bên trong', false, 'không có .sheet sau khi chạm từ');
    return;
  }

  const list = Array.from(
    sheet.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
        'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((n) => n.getClientRects().length > 0);

  if (list.length < 2) {
    record('16 · Dialog khoá tiêu điểm bên trong', false, `chỉ có ${list.length} phần tử nhận tiêu điểm`);
    return;
  }

  const KeyEvent = win().KeyboardEvent;
  const first = list[0];
  const last = list[list.length - 1];
  const focused = () => doc().activeElement;

  // Tab ở phần tử CUỐI phải vòng về phần tử ĐẦU.
  last.focus();
  sheet.dispatchEvent(new KeyEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
  const wrappedForward = focused() === first;

  // Shift+Tab ở phần tử ĐẦU phải vòng về phần tử CUỐI.
  first.focus();
  sheet.dispatchEvent(new KeyEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
  const wrappedBack = focused() === last;

  record(
    '16 · Dialog khoá tiêu điểm bên trong',
    wrappedForward && wrappedBack,
    `${list.length} phần tử nhận tiêu điểm · Tab ở cuối → đầu: ${wrappedForward} · Shift+Tab ở đầu → cuối: ${wrappedBack}`
  );

  // Đóng bằng Esc và kiểm tra overlay sạch.
  doc().dispatchEvent(new KeyEvent('keydown', { key: 'Escape', bubbles: true }));
  await sleep(300);
  const overlay = doc().getElementById('overlay');
  record(
    '16b · Esc đóng dialog và dọn overlay',
    !overlay || overlay.children.length === 0,
    `overlay còn ${overlay ? overlay.children.length : 0} phần tử`
  );
}

async function t15_sheet_cleared_on_navigate() {
  // Hồi quy cho lỗi qa-verify phát hiện: sheet đang mở ở màn reader vẫn nằm
  // trong #overlay sau khi đổi màn, nên scrim che màn mới mà người dùng vẫn
  // bấm được ra ngoài (nút rail nằm ngoài overlay) → kẹt giao diện.
  await go('#/reader');
  await sleep(700);

  const host = screenHost();
  const word = host.querySelector('.en');
  if (!word) {
    record('15 · Sheet bị dọn khi đổi màn', false, 'không tìm thấy từ .en trên màn reader');
    return;
  }
  word.click();
  await sleep(500);

  const overlay = doc().getElementById('overlay');
  const before = overlay ? overlay.children.length : 0;
  const hadSheet = Boolean(overlay && overlay.querySelector('.sheet'));

  await go('#/speaking');
  await sleep(700);
  const after = overlay ? overlay.children.length : 0;

  record(
    '15 · Sheet bị dọn khi đổi màn',
    hadSheet && before > 0 && after === 0,
    `overlay trước=${before} (có .sheet=${hadSheet}) · sau khi đổi màn=${after} (mong đợi 0)`
  );
}

async function t14_tapimg_is_answerable() {
  // Bài học từ nhóm D: dạng "chạm ảnh" từng sinh ra item KHÔNG có đáp án đúng
  // (fallback `|| photos[0]` trong buildReviewQueue). Đã sửa ở src/data/logic.js.
  // Phép thử này kiểm chính điều đó: đọc từ mục tiêu trong lời nhắc, chạm đúng
  // đồ vật mang tên đó, rồi xác nhận hệ thống chấm ĐÚNG.
  const S = win().__SNAPLIFE__;
  S.cost.reset();
  // Test 06 đã chạy hết một phiên nên review-run sẽ hiện "phiên đã xong".
  // Phải tự đặt lại phiên để nó dựng hàng đợi mới.
  S.store.set('review', {
    ...(S.store.get('review') || {}),
    queue: [],
    index: 0,
    answered: 0,
    correct: 0,
    results: [],
    finished: false,
    startedAt: null,
  });
  await go('#/review-run');
  await sleep(700);

  let found = false;
  for (let step = 0; step < 24 && !found; step += 1) {
    const host = screenHost();
    const prompt = (host.querySelector('.rv-prompt')?.textContent || '') +
      ' ' + (host.querySelector('.card')?.textContent || '');
    const isTap = /Chạm vào/i.test(prompt) && host.querySelector('.bbox');
    if (isTap) {
      const word = (prompt.match(/"([^"]+)"/) || [])[1];
      const review = S.store.get('review', {});
      const item = (review.queue || [])[review.index] || {};
      const targetRegion = (item.regions || []).find((r) => r.isTarget);
      const boxes = Array.from(host.querySelectorAll('.bbox'));

      // Không dùng nhãn để tìm đáp án: màn hình CỐ Ý không dán nhãn từ lên vùng
      // khoanh, vì dán nhãn là lộ đáp án. Khớp theo toạ độ hình học thay vì nhãn.
      const target = boxes.find((b) => {
        const r = targetRegion;
        if (!r) return false;
        return (
          Math.abs(parseFloat(b.style.left || '0') - r.x) < 0.6 &&
          Math.abs(parseFloat(b.style.top || '0') - r.y) < 0.6
        );
      });

      const correctBefore = S.store.get('review.correct', 0);
      if (target) {
        target.click();
        await sleep(340);
        const correctAfter = S.store.get('review.correct', 0);
        record(
          '14 · Dạng "chạm ảnh" trả lời đúng được',
          correctAfter > correctBefore,
          `từ "${word}" · khớp vùng đáp án theo toạ độ (x=${targetRegion?.x} y=${targetRegion?.y}) trong ${boxes.length} vùng · correct ${correctBefore} → ${correctAfter}`
        );
      } else {
        record(
          '14 · Dạng "chạm ảnh" trả lời đúng được',
          false,
          `từ "${word}" · không vùng nào khớp toạ độ đáp án (x=${targetRegion?.x} y=${targetRegion?.y}) · ${boxes.length} vùng, left/top = ${boxes.map((b) => `${b.style.left}/${b.style.top}`).join(', ')}`
        );
      }
      found = true;
      return;
    }
    // Chưa tới dạng chạm ảnh thì trả lời dạng đang hiện rồi đi tiếp.
    const opt = host.querySelector('.rv-opt, .rv-flip, .rv-match__item, .rv-quality-row button');
    if (opt) opt.click();
    await sleep(150);
    const next = Array.from(host.querySelectorAll('.rv-next')).find((b) => !b.disabled);
    if (next) next.click();
    await sleep(180);
  }

  if (!found) {
    record('14 · Dạng "chạm ảnh" trả lời đúng được', false, 'không gặp dạng chạm ảnh trong 24 bước');
  }
}

async function t13_arrow_key_not_hijacked() {
  // Hồi quy cho lỗi do nhóm B báo: khung demo bắt ArrowLeft/Right ở cấp document
  // để đổi màn hình, trong khi ui.bbox cũng dùng hai phím đó để dịch vùng khoanh.
  // Hệ quả trước đây: một lần bấm vừa dịch vùng vừa nhảy màn hình.
  await go('#/regions');
  await sleep(500);

  const host = screenHost();
  const box = host.querySelector('.bbox');
  if (!box) {
    record('13 · Phím mũi tên không bị khung demo giành', false, 'không tìm thấy .bbox trên màn regions');
    return;
  }

  const hashBefore = win().location.hash;
  const leftBefore = box.style.left;
  box.focus();
  const KeyEvent = win().KeyboardEvent;
  box.dispatchEvent(new KeyEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
  await sleep(260);
  const hashAfter = win().location.hash;
  const leftAfter = box.style.left;

  record(
    '13 · Phím mũi tên không bị khung demo giành',
    hashAfter === hashBefore && leftAfter !== leftBefore,
    `hash ${hashBefore} → ${hashAfter} (phải giữ nguyên) · left ${leftBefore || '—'} → ${leftAfter || '—'} (phải dịch)`
  );
}

async function t12_startup_gate() {
  const root = doc().documentElement;
  const ready = root.dataset.ready === 'true';
  const bootErrors = root.dataset.bootErrors || '';
  record(
    '12 · Cổng khởi động của chính index.html',
    ready && !bootErrors,
    `data-ready=${root.dataset.ready} · data-boot-errors="${bootErrors}"`
  );
}

/* ---------------------------------- Chạy --------------------------------- */
async function run() {
  const t0 = Date.now();
  const ok = await waitReady();
  if (!ok) {
    reportEl.textContent = 'KHÔNG khởi động được app trong iframe sau 15s.';
    document.documentElement.setAttribute('data-flows-done', 'failed');
    return;
  }

  const steps = [
    t01_registry,
    t02_every_screen_renders,
    t03_no_runtime_errors,
    t04_cost_idempotent_capture,
    t05_cost_story_and_speaking,
    t06_review_zero_api,
    t07_session_length_cross_group,
    t08_deeplink_word,
    t09_tabbar_rules,
    t10_story_ratio_honest,
    t11_theme_and_reduced_motion,
    t12_startup_gate,
    t13_arrow_key_not_hijacked,
    t14_tapimg_is_answerable,
    t15_sheet_cleared_on_navigate,
    t16_dialog_traps_focus,
  ];

  for (const step of steps) {
    try {
      await step();
    } catch (err) {
      record(step.name, false, `ném lỗi: ${err && err.message ? err.message : err}`);
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const lines = [];
  lines.push('===== SNAPLIFE — KIỂM THỬ LUỒNG END-TO-END =====');
  lines.push(`Thời điểm: ${new Date().toISOString()}`);
  lines.push(`Kết quả  : ${passed}/${results.length} đạt`);
  lines.push('');
  results.forEach((r) => {
    lines.push(`${r.ok ? '[ĐẠT ]' : '[HỎNG]'} ${r.name}`);
    lines.push(`         ${r.detail}`);
  });
  lines.push('');
  lines.push(`Xong sau ${Date.now() - t0}ms`);

  reportEl.textContent = lines.join('\n');
  document.documentElement.setAttribute('data-flows-done', 'true');
  document.documentElement.setAttribute('data-flows-summary', `${passed}/${results.length}`);
  window.__FLOWS__ = { results, passed, total: results.length, done: true };
}

run().catch((err) => {
  reportEl.textContent = 'KIỂM THỬ THẤT BẠI: ' + (err && err.stack ? err.stack : err);
  document.documentElement.setAttribute('data-flows-done', 'failed');
});
