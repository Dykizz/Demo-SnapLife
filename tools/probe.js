/* ============================================================================
   SnapLife AI — Dựng MỘT màn hình trong khung 390×844 cố định, để chụp ảnh.
   Owner: Lead.

   Tham số URL:  ?screen=home&theme=dark
   Không cần tham số cũng chạy (mặc định home, theme sáng).

   Vì sao không chụp thẳng index.html: `chrome --window-size=390,844` không tạo
   viewport 390×844 (Chrome ép lên tối thiểu ~500×748 rồi cắt ảnh), nên ảnh chụp
   bị lệch. Ở đây khung được đặt cố định tại (0,0) với đúng kích thước thiết bị,
   nên chỉ cần cắt 390×844 từ góc trên trái là ra ảnh đúng.
   ========================================================================== */

import { h, qs, clear } from '../src/core/dom.js';
import { ui, setNav, setOverlayHost } from '../src/core/ui.js';
import { createStore, applyTheme } from '../src/core/store.js';
import { cost } from '../src/core/cost.js';
import { audio } from '../src/core/audio.js';
import { loadScreens } from '../src/core/registry.js';
import * as fixtures from '../src/data/fixtures.js';
import { data } from '../src/data/bundle.js';

const params = new URLSearchParams(location.search);
const wanted = params.get('screen') || 'home';
const theme = params.get('theme') === 'dark' ? 'dark' : 'light';

/* Bề rộng/cao khung lấy từ ?w= và ?h= (mặc định 390×844 — khung điện thoại).
   Cần cho ảnh chụp ở bề rộng lớn: nếu khung vẫn 390px thì container query
   `appframe` không bao giờ khớp và ảnh không chứng minh được gì. */
const frameW = Math.max(280, Number(params.get('w')) || 390);
const frameH = Math.max(400, Number(params.get('h')) || 844);
document.documentElement.style.setProperty('--frame-w', `${frameW}px`);
document.documentElement.style.setProperty('--frame-h', `${frameH}px`);

/* Khung này mô phỏng CHẾ ĐỘ WEB (không phải demo shell), nên ở bề rộng lớn
   nav phải là rail trái — đúng như người dùng thấy khi mở trên desktop. */
document.documentElement.setAttribute('data-mode', 'web');

applyTheme(theme);

const frame = qs('#frame');
const store = createStore(fixtures.createInitialState());

setNav({ go: () => {}, back: () => {}, replace: () => {} });

async function boot() {
  const { screens } = await loadScreens();
  const screen = screens.find((s) => s.id === wanted) || screens[0];

  const host = h('div.app__screen', { id: 'screen' });
  const tabbar = h('nav.tabbar', { id: 'tabbar', style: { display: 'none' } });
  const overlay = h('div.app__overlay', { id: 'overlay' });

  const app = h('div.app', { id: 'app' },
    h('div.app__statusbar', { id: 'statusbar', 'aria-hidden': 'true' },
      h('span', {}, '09:41'),
      h('span', {}, '')),
    host,
    tabbar,
    h('div.app__homebar', { 'aria-hidden': 'true' }),
    overlay
  );
  frame.appendChild(app);
  setOverlayHost(overlay);

  const ctx = {
    store,
    params: {},
    nav: { go: () => {}, back: () => {}, replace: () => {} },
    ui,
    icon: ui.ICON,
    icons: { icon: ui.ICON },
    audio,
    cost,
    data,
    onCleanup: () => {},
    gallery: true,
  };

  let err = null;
  try {
    host.appendChild(screen.render(ctx));
  } catch (e) {
    err = String((e && e.message) || e);
    host.appendChild(
      h('div.screen', {}, h('div.screen__body', {},
        ui.empty({ iconName: 'alert-triangle', title: 'Màn hình lỗi', body: err })))
    );
  }

  // Vẽ thanh tab cho đúng như trong app thật (5 tab, nút Chụp ở giữa).
  if (screen.chrome === 'tabbar') {
    const TABS = [
      { id: 'home', label: 'Hôm nay', icon: 'home', screen: 'home' },
      { id: 'reader', label: 'Đọc', icon: 'book-open', screen: 'reader' },
      { id: 'capture', label: 'Chụp', icon: 'camera', screen: 'capture', primary: true },
      { id: 'review', label: 'Ôn tập', icon: 'list-checks', screen: 'review-hub' },
      { id: 'progress', label: 'Tiến độ', icon: 'trending-up', screen: 'progress' },
    ];
    const active = screen.tab || TABS.find((t) => t.screen === screen.id)?.id || '';
    tabbar.style.display = '';
    TABS.forEach((t) => {
      tabbar.appendChild(h(`button.tab${t.primary ? '.tab--capture' : ''}`, {
        type: 'button',
        'aria-current': t.id === active ? 'page' : undefined,
        'aria-label': t.label,
      },
        t.primary ? h('span.tab__fab', {}, ui.ICON(t.icon, 24)) : ui.ICON(t.icon, 22),
        h('span.tab__label', {}, t.label),
        t.primary ? null : h('span.tab__dot')
      ));
    });
  }

  if (screen.immersive) {
    app.classList.add('app--immersive');
    qs('#statusbar').classList.add('app__statusbar--invert');
  }

  document.documentElement.setAttribute('data-ready', 'true');
  document.documentElement.setAttribute('data-probe', `${screen.id}|${theme}|${err ? 'ERROR:' + err : 'ok'}`);
  window.__PROBE__ = { screen: screen.id, theme, error: err, ready: true };
}

boot().catch((e) => {
  document.documentElement.setAttribute('data-probe', `boot-failed|${e && e.message}`);
  frame.appendChild(h('pre', { style: { padding: '20px', fontSize: '12px' } }, String(e && e.stack)));
});
