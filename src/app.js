/* ============================================================================
   SnapLife AI — Bootstrap khung demo (demo shell)
   Owner: Lead.
   Nhiệm vụ: dựng rail chọn màn hình, khung thiết bị, bảng inspector, HUD chi phí
   và khởi động router. Không chứa nội dung của bất kỳ màn hình nào.
   ========================================================================== */

import { h, qs, clear, prefersReducedMotion } from './core/dom.js';
import { icon } from './core/icons.js';
import { ui, setNav, setOverlayHost } from './core/ui.js';
import { createStore, applyTheme, loadSavedTheme } from './core/store.js';
import { cost, COST_KINDS } from './core/cost.js';
import { audio } from './core/audio.js';
import { createRouter } from './core/router.js';
import { loadScreens, GROUPS, PLANNED } from './core/registry.js';

import * as fixtures from './data/fixtures.js';
import { data } from './data/bundle.js';

/* ------------------------------ Khởi tạo -------------------------------- */
const store = createStore(fixtures.createInitialState());
const theme = loadSavedTheme();
store.set('theme', theme);
applyTheme(theme);

const railHost = qs('#rail');
const railBody = qs('#rail-body');
const inspectorBody = qs('#inspector-body');
const stageTitle = qs('#stage-title');
const hudHost = qs('#hud');
const appRoot = qs('#app');
const screenHost = qs('#screen');
const tabbarHost = qs('#tabbar');
const statusbarHost = qs('#statusbar');
const overlayHost = qs('#overlay');

setOverlayHost(overlayHost);

let router = null;
let screens = [];
let missingIds = [];
let loadErrors = [];

/* ------------------------------- HUD chi phí ----------------------------- */
const hudNode = ui.costMeter();
hudHost.appendChild(hudNode);

/* -------------------------------- Rail ----------------------------------- */
const FLOWS = [
  { id: 'flow-capture', label: 'Luồng 1 · Ảnh → từ vựng', steps: ['capture', 'regions', 'worddetail'] },
  { id: 'flow-story', label: 'Luồng 2 · Ngữ cảnh của bạn', steps: ['compose', 'reader'] },
  { id: 'flow-speak', label: 'Luồng 3 · Luyện nói', steps: ['speaking'] },
  { id: 'flow-review', label: 'Luồng 4 · Ôn tập 5 dạng', steps: ['review-hub', 'review-run', 'review-summary'] },
  { id: 'flow-daily', label: 'Luồng 5 · Động lực mỗi ngày', steps: ['diary', 'home'] },
];

function renderRail(activeId) {
  clear(railBody);

  // Nhóm màn hình
  GROUPS.forEach((group) => {
    const items = screens.filter((s) => s.group === group.dir);
    if (!items.length) return;
    const groupNode = h('section.rail__group', {},
      h('div.rail__grouptitle', {},
        h('span.label', {}, group.title),
        h('span.badge', {}, `${items.filter((i) => !i.placeholder).length}/${items.length}`)),
      ...items.map((screen) => {
        const num = PLANNED.findIndex((p) => p.id === screen.id);
        const btn = h('button.rail__item', {
          type: 'button',
          'aria-current': screen.id === activeId ? 'true' : undefined,
          title: `${screen.id} — ${screen.title}`,
        },
        h('span.rail__num', {}, num >= 0 ? String(num + 1).padStart(2, '0') : '—'),
        h('span.grow.truncate', {}, screen.title),
        screen.placeholder ? h('span', { style: { color: 'var(--warning)' }, 'aria-hidden': 'true' }, icon('loader', 14)) : null);
        btn.addEventListener('click', () => router.go(screen.id, {}, { replace: true }));
        return btn;
      }));
    railBody.appendChild(groupNode);
  });

  // Luồng demo
  const flowGroup = h('section.rail__group', {},
    h('div.rail__grouptitle', {}, h('span.label', {}, 'Luồng demo')),
    ...FLOWS.map((flow) => {
      const btn = h('button.rail__item', { type: 'button', title: flow.steps.join(' → ') },
        h('span.rail__num', {}, '▶'),
        h('span.grow.truncate', {}, flow.label));
      btn.addEventListener('click', () => {
        router.go(flow.steps[0], {}, { replace: true });
        ui.toast(`Luồng này gồm: ${flow.steps.join(' → ')}`, { iconName: 'arrow-right', ms: 3000 });
      });
      return btn;
    }));
  railBody.appendChild(flowGroup);
}

/* ------------------------------ Inspector -------------------------------- */
function renderInspector(screen) {
  clear(inspectorBody);
  if (!screen) return;

  const group = GROUPS.find((g) => g.dir === screen.group);
  const api = screen.api || [];

  inspectorBody.appendChild(
    h('div.inspector__block', {},
      h('span.label', {}, 'Màn hình đang mở'),
      h('h2.inspector__title', { style: { marginTop: '4px' } }, screen.title),
      h('p.note', { style: { marginTop: '4px' } }, `${screen.id} · ${group ? group.title : screen.group}`))
  );

  inspectorBody.appendChild(
    h('div.inspector__block', {},
      h('span.label', {}, 'Chi phí AI của màn hình'),
      h('p.note', { style: { marginTop: '4px' } },
        'Tính theo ẢNH và theo TRUYỆN, không theo từng lần bấm — nên mở thẳng màn hình bằng deep link cũng thấy đúng con số cho một ảnh / một truyện.'),
      h('div', { style: { marginTop: '8px' } },
        api.length === 0
          ? ui.callout({
              tone: 'success',
              iconName: 'check-circle',
              title: '0 API call',
              body: 'Màn hình này không gọi mô hình. Nội dung sinh bằng quy tắc hoặc đọc từ dữ liệu đã lưu.',
            })
          : h('div.stack.stack--tight', {},
              ...api.map((a) => ui.keyval(a.label || COST_KINDS[a.kind]?.label || a.kind, `${a.n || 1}×`)),
              h('p.note', { style: { marginTop: '6px' } }, 'Chỉ tính một lần cho mỗi ảnh / mỗi câu — vào lại màn hình không cộng thêm.')))
    )
  );

  const snap = cost.snapshot();
  inspectorBody.appendChild(
    h('div.inspector__block', {},
      h('span.label', {}, 'Sổ chi phí cả phiên demo'),
      h('div', { style: { marginTop: '10px' } },
        ui.barList([
          { label: 'VLM', value: snap.totals.vlm, color: 'primary' },
          { label: 'LLM', value: snap.totals.llm, color: 'primary' },
          { label: 'Quy tắc', value: snap.totals.rule, color: 'success' },
          { label: 'TTS', value: snap.totals.tts, color: 'info' },
        ])),
      h('p.note', { style: { marginTop: '10px' } },
        snap.apiCalls === 0
          ? 'Chưa có lời gọi AI nào. Chụp ảnh để thấy bộ đếm tăng đúng 1 lần.'
          : `Tổng ${snap.apiCalls} API call cho ${snap.ledger.length} tác vụ. Phiên ôn tập đứng ngoài con số này.`))
  );

  if (screen.notes && screen.notes.length) {
    inspectorBody.appendChild(
      h('div.inspector__block', {},
        h('span.label', {}, 'Vì sao thiết kế như vậy'),
        h('ul.note-list', { style: { marginTop: '10px' } },
          ...screen.notes.map((n) => h('li', {}, icon('check-circle', 15), h('span', {}, n)))))
    );
  }

  inspectorBody.appendChild(
    h('div.inspector__block', {},
      h('span.label', {}, 'Điều khiển demo'),
      h('div.stack.stack--tight', { style: { marginTop: '10px' } },
        ui.button({ label: 'Đặt lại dữ liệu demo', variant: 'secondary', size: 'sm', icon: 'refresh', block: true, onClick: resetDemo }),
        ui.button({ label: 'Xoá bộ đếm chi phí', variant: 'secondary', size: 'sm', icon: 'zap', block: true, onClick: () => { cost.reset(); renderInspector(router.current); ui.toast('Đã xoá bộ đếm chi phí'); } }))
    )
  );
}

function resetDemo() {
  store.reset();
  store.set('theme', document.documentElement.getAttribute('data-theme') || 'light');
  cost.reset();
  renderInspector(router.current);
  router.render();
  ui.toast('Đã đặt lại dữ liệu demo', { tone: 'success', iconName: 'refresh' });
}

/* ---------------------------- Điều khiển thanh trên ---------------------- */
function buildTopbar() {
  const tools = qs('#tools');
  clear(tools);

  tools.appendChild(
    ui.iconBtn(store.get('theme') === 'dark' ? 'sun' : 'moon', {
      label: store.get('theme') === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối',
      variant: 'solid',
      onClick: toggleTheme,
    })
  );
  tools.appendChild(
    ui.iconBtn(audio.muted ? 'volume-2' : 'headphones', {
      label: audio.muted ? 'Bật âm thanh' : 'Tắt âm thanh',
      variant: 'solid',
      onClick: (ev) => {
        audio.setMuted(!audio.muted);
        ev.currentTarget.replaceWith(buildMuteBtn());
      },
    })
  );
  tools.appendChild(
    ui.iconBtn('grid', {
      label: 'Mở thư viện màn hình',
      variant: 'solid',
      onClick: () => window.open('gallery.html', '_blank'),
    })
  );
  tools.appendChild(
    ui.iconBtn('globe', {
      label:
        currentMode() === 'web'
          ? 'Về chế độ demo có khung điện thoại (W)'
          : 'Chế độ web toàn màn hình (W)',
      variant: 'solid',
      onClick: () => toggleMode(),
    })
  );
  tools.appendChild(
    ui.iconBtn('eye', {
      label: 'Chế độ chỉ hiện ứng dụng',
      variant: 'solid',
      onClick: toggleFocus,
    })
  );
  qs('#rail-toggle')?.replaceWith(buildRailToggle());
}

function buildMuteBtn() {
  return ui.iconBtn(audio.muted ? 'volume-2' : 'headphones', {
    label: audio.muted ? 'Bật âm thanh' : 'Tắt âm thanh',
    variant: 'solid',
    onClick: (ev) => {
      audio.setMuted(!audio.muted);
      ev.currentTarget.replaceWith(buildMuteBtn());
      ui.toast(audio.muted ? 'Đã tắt âm thanh' : 'Đã bật âm thanh', { iconName: audio.muted ? 'volume-2' : 'headphones' });
    },
  });
}

function buildRailToggle() {
  const btn = ui.iconBtn('list-checks', {
    label: 'Danh sách màn hình',
    variant: 'solid',
    onClick: () => document.body.classList.toggle('shell--rail-open'),
  });
  btn.id = 'rail-toggle';
  return btn;
}

function toggleTheme() {
  const next = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
  store.set('theme', next);
  applyTheme(next);
  buildTopbar();
  ui.toast(next === 'dark' ? 'Giao diện tối' : 'Giao diện sáng', { iconName: next === 'dark' ? 'moon' : 'sun' });
}

function toggleFocus() {
  document.body.classList.toggle('shell--focus');
  const on = document.body.classList.contains('shell--focus');
  ui.toast(on ? 'Chế độ chỉ ứng dụng — nhấn F để thoát' : 'Đã hiện lại khung demo', { iconName: 'eye' });
}

/* --------------------------- Chế độ trình bày ---------------------------- */
/*
 * Hai chế độ, cùng một bộ màn hình (chi tiết: docs/WEB-SPEC.md):
 *   demo — rail chọn màn hình + khung điện thoại + inspector, để trình bày
 *   web  — app tràn khung nhìn như một web app thật, nav đổi theo bề rộng khung
 * Chuyển bằng phím W hoặc nút "Chế độ demo"/"Chế độ web"; nhớ vào localStorage.
 */
/* Khoá có hậu tố .v2. Bản cũ ghi giá trị MẶC ĐỊNH vào 'snaplife.mode' ngay khi
   nạp trang, nên người dùng bị ghim ở chế độ demo; đổi tên khoá để bỏ giá trị đó.
   Xem chú thích trong index.html. */
const MODE_KEY = 'snaplife.mode.v2';

function currentMode() {
  return document.documentElement.getAttribute('data-mode') === 'web' ? 'web' : 'demo';
}

/* Cập nhật mọi nhãn nói về chế độ. KHÔNG ghi localStorage: chế độ mặc định
   không phải là lựa chọn của người dùng nên không được nhớ. */
function syncModeChrome() {
  const mode = currentMode();
  const btn = qs('#mode-toggle');
  if (btn) {
    btn.setAttribute(
      'aria-label',
      mode === 'web'
        ? 'Về chế độ demo có khung điện thoại (phím W)'
        : 'Chuyển sang chế độ web toàn màn hình (phím W)'
    );
    const label = qs('#mode-toggle-label');
    if (label) label.textContent = mode === 'web' ? 'Chế độ demo' : 'Chế độ web';
  }
  buildTopbar();
}

/* Đổi chế độ và GHI NHỚ — chỉ gọi khi người dùng chủ động đổi. */
function setMode(mode, { notify = true } = {}) {
  document.documentElement.setAttribute('data-mode', mode);
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    /* bỏ qua */
  }
  syncModeChrome();
  if (notify) {
    ui.toast(
      mode === 'web'
        ? 'Chế độ web: app tràn màn hình, hợp khi demo trên điện thoại/tablet. Nhấn W để quay lại.'
        : 'Chế độ demo: có khung điện thoại và bảng giải thích thiết kế.',
      { iconName: mode === 'web' ? 'globe' : 'mouse-pointer', ms: 3200 }
    );
  }
}

function toggleMode() {
  setMode(currentMode() === 'web' ? 'demo' : 'web');
}

/* ------------------------------- Bàn phím -------------------------------- */
function wireKeyboard() {
  document.addEventListener('keydown', (ev) => {
    const tag = (ev.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || ev.target.isContentEditable) return;

    // Không GIÀNH phím mũi tên với những thành phần tự xử lý chúng.
    // ui.bbox dùng phím mũi tên để dịch vùng khoanh; nếu khung demo cũng bắt
    // ArrowLeft/Right thì một lần bấm vừa dịch vùng vừa đổi màn hình.
    if (
      ev.target.closest?.(
        'input, textarea, select, [contenteditable="true"], .bbox, ' +
          '[role="tablist"], [role="slider"], [role="switch"], [role="listbox"], [role="grid"]'
      )
    ) {
      return;
    }

    const order = screens.map((s) => s.id);
    const i = order.indexOf(router.current?.id);
    if (ev.key === 'ArrowRight' && i >= 0) router.go(order[(i + 1) % order.length], {}, { replace: true });
    else if (ev.key === 'ArrowLeft' && i >= 0) router.go(order[(i - 1 + order.length) % order.length], {}, { replace: true });
    else if (ev.key === 'f' || ev.key === 'F') toggleFocus();
    else if (ev.key === 'w' || ev.key === 'W') toggleMode();
    else if (ev.key === 't' || ev.key === 'T') toggleTheme();
    else if (ev.key === 'm' || ev.key === 'M') { audio.setMuted(!audio.muted); buildTopbar(); }
    else if (ev.key === 'Escape') document.body.classList.remove('shell--rail-open', 'shell--focus');
  });
}

/* -------------------------------- Khởi động ------------------------------ */
async function boot() {
  const loaded = await loadScreens();
  screens = loaded.screens;
  missingIds = loaded.missing;
  loadErrors = loaded.errors;

  if (loadErrors.length) {
    console.warn('[SnapLife] Nhóm màn hình nạp lỗi:', loadErrors);
  }

  router = createRouter({
    host: screenHost,
    tabbarHost,
    statusbarHost,
    appRoot,
    screens,
    store,
    data,
    onScreenChange: ({ screen }) => {
      renderRail(screen.id);
      renderInspector(screen);
      if (stageTitle) {
        stageTitle.textContent = screen.title;
      }
    },
  });

  setNav(router);
  router.start();

  renderRail(router.current?.id);
  renderInspector(router.current);
  buildTopbar();
  wireKeyboard();

  // Đồng bộ nhãn nút theo chế độ đang bật — KHÔNG ghi localStorage.
  // (Trước đây chỗ này gọi setMode(currentMode()) nên chế độ MẶC ĐỊNH bị ghi nhớ
  //  như thể người dùng đã chọn, khiến mọi thay đổi mặc định sau đó vô hiệu.)
  syncModeChrome();
  // Nút đổi chế độ theo CẢ HAI CHIỀU. Trước đây nó luôn setMode('demo'), nên khi
  // đã ở demo mode thì bấm nút cũng không thoát ra được.
  qs('#mode-toggle')?.addEventListener('click', toggleMode);

  if (missingIds.length) {
    const done = PLANNED.length - missingIds.length;
    ui.toast(`Đã nạp ${done}/${PLANNED.length} màn hình · còn ${missingIds.length} đang dựng`, {
      iconName: 'loader',
      ms: 3200,
    });
  }

  const clock = qs('#clock');
  const paintClock = () => {
    const now = new Date();
    clock.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };
  paintClock();
  setInterval(paintClock, 20000);

  // Cho QA và các teammate khác kiểm tra nhanh trạng thái nạp màn hình.
  window.__SNAPLIFE__ = {
    store, router, cost, audio, ui, data,
    get screens() { return screens; },
    get missing() { return missingIds; },
    get errors() { return loadErrors; },
    ready: true,
  };
  document.documentElement.dataset.ready = 'true';
}

boot().catch((err) => {
  console.error('[SnapLife] Khởi động lỗi:', err);
  screenHost.appendChild(
    h('div.screen', {}, h('div.screen__body', {},
      ui.empty({ iconName: 'alert-triangle', title: 'Không khởi động được demo', body: String(err && err.message ? err.message : err) })))
  );
});
