/* ============================================================================
   SnapLife AI — Router (dựa trên hash, back của trình duyệt hoạt động thật)
   Owner: Lead.
   Hợp đồng màn hình:
     export default {
       id, title, group, chrome: 'tabbar'|'appbar'|'none', tab,
       api: [{ key, kind, label, n }],   // lời gọi AI màn hình này tiêu tốn
       immersive: true|false,            // ẩn status bar, nội dung tràn viền
       render(ctx) -> HTMLElement
     }
   ========================================================================== */

import { h, clear, prefersReducedMotion } from './dom.js';
import { ui } from './ui.js';
import { audio } from './audio.js';
import { cost } from './cost.js';

const TABS = [
  { id: 'home', label: 'Hôm nay', icon: 'home', screen: 'home' },
  { id: 'reader', label: 'Đọc', icon: 'book-open', screen: 'reader' },
  { id: 'capture', label: 'Chụp', icon: 'camera', screen: 'capture', primary: true },
  { id: 'review', label: 'Ôn tập', icon: 'list-checks', screen: 'review-hub' },
  { id: 'progress', label: 'Tiến độ', icon: 'trending-up', screen: 'progress' },
];

export function createRouter({ host, tabbarHost, statusbarHost, appRoot, screens, store, data, onScreenChange }) {
  const byId = new Map(screens.map((s) => [s.id, s]));
  const state = { current: null, params: {}, screen: null, dispose: [] };

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    if (!raw) return { id: 'home', params: {} };
    const [path, query] = raw.split('?');
    const params = {};
    if (query) {
      for (const pair of query.split('&')) {
        const [k, v] = pair.split('=');
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      }
    }
    return { id: path || 'home', params };
  }

  function currentTab(screen) {
    if (!screen) return '';
    if (screen.tab) return screen.tab;
    const direct = TABS.find((t) => t.screen === screen.id);
    if (direct) return direct.id;
    const groupFallback = {
      'b-capture': 'capture',
      'a-onboarding': '',
      'c-story': 'reader',
      'd-review': 'review',
      'e-progress': 'progress',
    };
    return groupFallback[screen.group] ?? '';
  }

  function buildTabBar(screen) {
    if (!tabbarHost) return;
    const shouldShow = screen?.chrome === 'tabbar';

    // Trên ĐIỆN THOẠI, tab bar chỉ hiện ở những màn khai `chrome: 'tabbar'`.
    // Nhưng ở chế độ web khung rộng, CSS biến nó thành rail trái và LUÔN cho
    // hiện (xem styles/web.css) — nav chính của một web app không được biến mất
    // ở màn `appbar`, nếu không sẽ thừa một cột trống bên trái.
    // Vì vậy: luôn DỰNG đủ 5 tab, chỉ ẩn/hiện bằng `display`.
    tabbarHost.style.display = shouldShow ? '' : 'none';

    const active = currentTab(screen);
    clear(tabbarHost);
    TABS.forEach((tab) => {
      const isActive = tab.id === active;
      const btn = h(
        `button.tab${tab.primary ? '.tab--capture' : ''}`,
        {
          type: 'button',
          'aria-current': isActive ? 'page' : undefined,
          'aria-label': tab.label,
        },
        tab.primary
          ? h('span.tab__fab', {}, ui.ICON(tab.icon, 24))
          : ui.ICON(tab.icon, 22),
        h('span.tab__label', {}, tab.label),
        tab.primary ? null : h('span.tab__dot')
      );
      btn.addEventListener('click', () => {
        // Chuyển tab = bắt đầu lại ngăn xếp điều hướng, không chồng lớp.
        go(tab.screen, {}, { replace: true });
      });
      tabbarHost.appendChild(btn);
    });
  }

  function disposeCurrent() {
    while (state.dispose.length) {
      const fn = state.dispose.pop();
      try {
        fn();
      } catch (err) {
        console.error('[router] dispose lỗi:', err);
      }
    }
  }

  function setStatusbarInvert(invert) {
    if (!statusbarHost) return;
    statusbarHost.classList.toggle('app__statusbar--invert', Boolean(invert));
  }

  function render() {
    const { id, params } = parseHash();
    let screen = byId.get(id);

    if (!screen) {
      screen = {
        id,
        title: 'Không tìm thấy màn hình',
        group: 'e-progress',
        chrome: 'appbar',
        render: () =>
          h('div.screen', {}, h('div.screen__body', {},
            ui.empty({
              iconName: 'alert-triangle',
              title: 'Chưa có màn hình này',
              body: `Không tìm thấy "${id}" trong registry. Chọn màn hình ở cột bên trái.`,
              action: ui.button({ label: 'Về trang Hôm nay', onClick: () => go('home', {}, { replace: true }) }),
            }))),
      };
    }

    disposeCurrent();
    // Sheet/modal của màn cũ phải bị dọn, nếu không nó sẽ đè lên màn mới.
    ui.clearOverlays?.();
    state.current = screen;
    state.params = params;
    store.set('route', { id: screen.id, params });

    // Cost Meter: màn hình tự khai báo chi phí; idempotent theo khoá.
    cost.enterScreen(screen.id, screen.api || []);

    const ctx = {
      store,
      nav: { go, back, replace },
      params,
      ui,
      icon: ui.ICON,
      icons: { icon: ui.ICON },
      audio,
      cost,
      data: data || null,
      onCleanup: (fn) => state.dispose.push(fn),
    };

    let node;
    try {
      node = screen.render(ctx);
    } catch (err) {
      console.error(`[router] màn hình "${screen.id}" lỗi khi render:`, err);
      node = h('div.screen', {}, h('div.screen__body', {},
        ui.empty({
          iconName: 'alert-triangle',
          title: 'Màn hình gặp lỗi',
          body: String(err && err.message ? err.message : err),
        })));
    }

    if (!node) {
      node = h('div.screen', {}, h('div.screen__body', {}, ui.empty({ iconName: 'loader', title: 'Màn hình trống' })));
    }

    clear(host);
    host.appendChild(node);
    host.scrollTop = 0;

    if (appRoot) {
      appRoot.classList.toggle('app--immersive', Boolean(screen.immersive));
    }
    setStatusbarInvert(Boolean(screen.immersive || screen.darkStatusbar));
    buildTabBar(screen);

    if (!prefersReducedMotion()) {
      node.style.animation = 'sl-enter var(--dur-slow) var(--ease-out) both';
    }

    // Cuộn mượt về đầu mỗi lần đổi màn hình (trừ khi người dùng giảm chuyển động).
    onScreenChange?.({ screen, params });
    document.title = `SnapLife AI · ${screen.title || screen.id}`;
    return screen;
  }

  function go(id, params = {}, { replace = false } = {}) {
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const next = `#/${id}${query ? `?${query}` : ''}`;
    if (location.hash === next) {
      render();
      return;
    }
    if (replace) history.replaceState(null, '', next);
    else location.hash = next;
    if (replace) render();
  }

  function back() {
    if (history.length > 1) history.back();
    else go('home', {}, { replace: true });
  }

  function replace(id, params = {}) {
    go(id, params, { replace: true });
  }

  function start() {
    window.addEventListener('hashchange', render);
    render();
    return { go, back, replace, render, get current() { return state.current; }, get params() { return state.params; }, TABS, byId };
  }

  return { start, go, back, replace, render, TABS, byId, get current() { return state.current; }, get params() { return state.params; } };
}
