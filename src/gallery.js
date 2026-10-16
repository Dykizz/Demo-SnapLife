/* ============================================================================
   SnapLife AI — Thư viện màn hình (gallery.html)
   Owner: Lead.
   Dựng MỌI màn hình cùng lúc trong khung thiết bị phẳng để:
     · soi tính nhất quán giữa các nhóm,
     · kiểm tra responsive ở 375 / 390 / 768 / 1024 / 1440.
   ========================================================================== */

import { h, qs, clear } from './core/dom.js';
import { ui, setNav, setOverlayHost } from './core/ui.js';
import { createStore, applyTheme, loadSavedTheme } from './core/store.js';
import { cost } from './core/cost.js';
import { audio } from './core/audio.js';
import { loadScreens, GROUPS, PLANNED } from './core/registry.js';

import * as fixtures from './data/fixtures.js';
import { data } from './data/bundle.js';

const WIDTHS = [375, 390, 768, 1024, 1440];

const store = createStore(fixtures.createInitialState());
const theme = loadSavedTheme();
applyTheme(theme);

const grid = qs('#grid');
let screens = [];

/** Mỗi thẻ là một màn hình, render độc lập trong khung riêng. */
function renderCard(screen, index) {
  const host = h('div.app__screen', { style: { height: 'var(--card-h, 844px)', overflow: 'auto' } });
  const app = h('div.app', { style: { position: 'relative', inset: 'auto', height: '100%' } },
    h('div.app__statusbar', { 'aria-hidden': 'true' }, h('span', {}, '09:41'), h('span', {}, '')),
    host,
    h('div.app__overlay', { style: { position: 'absolute', inset: '0', pointerEvents: 'none' } })
  );

  const ctx = {
    store,
    nav: {
      go: () => ui.toast('Trong thư viện tĩnh, điều hướng bị tắt. Mở index.html để bấm thử.', { iconName: 'info' }),
      back: () => {},
      replace: () => {},
    },
    params: {},
    ui,
    icon: ui.ICON,
    icons: { icon: ui.ICON },
    audio,
    cost,
    data,
    onCleanup: () => {},
    gallery: true,
  };

  try {
    host.appendChild(screen.render(ctx));
  } catch (err) {
    host.appendChild(
      h('div.screen', {}, h('div.screen__body', {},
        ui.empty({ iconName: 'alert-triangle', title: 'Màn hình lỗi', body: String(err && err.message ? err.message : err) })))
    );
  }

  const num = PLANNED.findIndex((p) => p.id === screen.id);
  return h('figure.gcard', { id: `g-${screen.id}` },
    h('figcaption.gcard__cap', {},
      h('span.rail__num', {}, num >= 0 ? String(num + 1).padStart(2, '0') : '—'),
      h('div.grow', {},
        h('div', { style: { fontWeight: '600' } }, screen.title),
        h('div.muted-2', { style: { fontSize: 'var(--fs-xs)' } }, `${screen.id} · ${GROUPS.find((g) => g.dir === screen.group)?.title || screen.group}`)),
      screen.placeholder ? ui.badge('đang dựng', 'warning') : ui.badge('xong', 'success')),
    app);
}

function buildControls() {
  const bar = qs('#widths');
  WIDTHS.forEach((w) => {
    const btn = ui.chip({ label: `${w}px`, selected: w === 390, onClick: () => {
      document.documentElement.style.setProperty('--card-w', w + 'px');
      bar.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
    } });
    bar.appendChild(btn);
  });

  qs('#all-btn').addEventListener('click', () => {
    document.documentElement.style.setProperty('--card-w', '390px');
  });
  qs('#theme-btn').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
}

async function boot() {
  const loaded = await loadScreens();
  screens = loaded.screens;
  setNav({ go: () => {}, back: () => {}, replace: () => {} });
  setOverlayHost(qs('#overlay'));

  const groups = GROUPS.map((g) => ({ ...g, items: screens.filter((s) => s.group === g.dir) })).filter((g) => g.items.length);

  groups.forEach((group) => {
    grid.appendChild(
      h('section.gsection', {},
        h('div.gsection__head', {},
          h('span.label', {}, group.title),
          h('span.badge', {}, `${group.items.filter((i) => !i.placeholder).length}/${group.items.length} xong`),
          h('span.muted-2', { style: { fontSize: 'var(--fs-xs)' } }, `owner: ${group.owner}`)),
        h('div.ggrid', {}, ...group.items.map(renderCard)))
    );
  });

  buildControls();

  qs('#stat').textContent =
    `${screens.filter((s) => !s.placeholder).length}/${PLANNED.length} màn hình đã dựng` +
    (loaded.errors.length ? ` · ${loaded.errors.length} nhóm lỗi` : '');

  window.__SNAPLIFE_GALLERY__ = { screens, missing: loaded.missing, errors: loaded.errors, ready: true };
  document.documentElement.dataset.ready = 'true';
}

boot().catch((err) => {
  console.error('[gallery] lỗi khởi động:', err);
  grid.appendChild(ui.empty({ iconName: 'alert-triangle', title: 'Không dựng được thư viện', body: String(err) }));
});
