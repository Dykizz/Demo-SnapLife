/* ============================================================================
   Nhóm B — đo toạ độ THẬT của màn #/regions trong đúng khung 390×844.

   Dùng khi cần đối chiếu ảnh chụp màn hình với DOM: iframe phủ kín viewport nên
   ảnh chụp trang này chính là ảnh chụp index.html#/regions ở đúng khung đó, còn
   số đo đọc được từ <pre id="geo"> trong --dump-dom.
   ========================================================================== */

const frame = document.getElementById('app');
const w = () => frame.contentWindow;
const doc = () => frame.contentWindow.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ?screen=<id>[&word=<id>] — mặc định regions (màn quyết định của nhóm B).
   src do _measure.html đặt ĐỒNG BỘ từ query; ở đây không đổi src nữa, vì đổi
   sau load sẽ làm ảnh chụp headless bắt trúng khung chưa kịp vẽ. */
const qs = new URLSearchParams(location.search);
const target = qs.get('screen') || 'regions';
const word = qs.get('word');

async function until(fn, ms = 40000) {
  const t0 = Date.now();
  for (;;) {
    try {
      if (fn()) return true;
    } catch {
      /* chưa nạp xong */
    }
    if (Date.now() - t0 > ms) return false;
    await wait(60);
  }
}

(async () => {
  const ok = await until(() => w().__SNAPLIFE__ && doc().documentElement.dataset.ready === 'true');
  if (!ok) {
    document.getElementById('geo').textContent = 'data-geometry={"error":"boot-timeout"}';
    return;
  }

  const d = doc();
  const style = d.createElement('style');
  style.textContent = '*{scrollbar-width:none !important} ::-webkit-scrollbar{display:none !important}';
  d.head.appendChild(style);

  const id = decodeURIComponent((w().location.hash || '').replace(/^#\/?/, '').split('?')[0]);
  if (id !== target) {
    w().location.hash = `#/${target}${word ? `?word=${encodeURIComponent(word)}` : ''}`;
    await until(() => w().__SNAPLIFE__.router.current.id === target);
  }
  await wait(400);

  const rect = (sel) => {
    const el = doc().querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 100) / 100);
  };

  const geo = {
    viewport: [window.innerWidth, window.innerHeight],
    device: rect('.device'),
    app: rect('.app'),
    scroll: rect('.app__screen'),
    photoFrame: rect('.photo-frame'),
    photoImg: rect('.photo-frame img'),
    firstCard: rect('.b-wordcard'),
    bboxes: [...doc().querySelectorAll('.photo-frame .bbox')].map((el) => {
      const r = el.getBoundingClientRect();
      return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 100) / 100);
    }),
    words: [...doc().querySelectorAll('.b-wordcard__en')].map((n) => n.textContent),
    cards: doc().querySelectorAll('.b-wordcard').length,
    vlm: w().__SNAPLIFE__.cost.snapshot().totals.vlm,
  };

  document.getElementById('geo').textContent = 'data-geometry=' + JSON.stringify(geo);
  document.documentElement.dataset.measured = 'true';
})();
