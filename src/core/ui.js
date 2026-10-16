/* ============================================================================
   SnapLife AI — Thư viện component dùng chung (trả về DOM node)
   Owner: Lead.  Màn hình KHÔNG tự vẽ lại nút/thẻ — dùng các hàm ở đây.
   Mọi thành phần đều đã thoả: touch target ≥44px, aria-label, focus thấy rõ.
   ========================================================================== */

import { h, fromHTML, clear, clamp, prefersReducedMotion } from './dom.js';
import { icon } from './icons.js';
import { audio } from './audio.js';
import { cost, COST_KINDS } from './cost.js';

let nav = null;
let overlayHost = null;

export function setNav(router) {
  nav = router;
}

export function setOverlayHost(node) {
  overlayHost = node;
}

function host() {
  if (!overlayHost) {
    overlayHost = h('div', { class: 'app__overlay', style: { position: 'absolute', inset: '0', zIndex: '55', pointerEvents: 'none' } });
    document.body.appendChild(overlayHost);
  }
  return overlayHost;
}

function interactive(node) {
  node.style.pointerEvents = 'auto';
  return node;
}

/**
 * Dọn mọi sheet / modal / toast đang mở.
 * Router gọi hàm này trước khi render màn hình mới: nếu không, sheet của màn cũ
 * vẫn nằm trong #overlay và đè lên màn mới (scrim chặn cả màn hình, mà nút rail
 * lại nằm ngoài #overlay nên người dùng vẫn bấm đi tiếp được — thành ra kẹt).
 */
export function clearOverlays() {
  const node = host();
  clear(node);
  return node;
}

/* ============================== App bar ================================== */
export function appBar({ title, sub, back = false, close = false, onBack, actions = [], overlay = false, bordered = true } = {}) {
  const lead = back || close
    ? iconBtn(back ? 'chevron-left' : 'x', {
        label: back ? 'Quay lại' : 'Đóng',
        onClick: onBack || (() => nav && nav.back()),
      })
    : null;

  return h(
    `header.appbar${overlay ? '.appbar--overlay' : ''}${bordered ? '.appbar--bordered' : ''}`,
    {},
    lead,
    h('div.appbar__head', {}, title ? h('h1.appbar__title', {}, title) : null, sub ? h('p.appbar__sub', {}, sub) : null),
    actions.length ? h('div.row', { style: { gap: '4px' } }, actions) : null
  );
}

export function iconBtn(name, { label, onClick, variant = '', size = 22, disabled = false } = {}) {
  const btn = h(
    `button.iconbtn${variant ? '.iconbtn--' + variant : ''}`,
    { type: 'button', 'aria-label': label || undefined, disabled: disabled || undefined },
    icon(name, size)
  );
  if (onClick) btn.addEventListener('click', (ev) => { audio.tap(); onClick(ev); });
  return btn;
}

/* ================================= Nút =================================== */
export function button({ label, icon: iconName, iconRight, variant = 'primary', size = '', block = false, onClick, disabled = false, type = 'button', ariaLabel } = {}) {
  const cls = [
    'btn',
    variant && variant !== 'primary' ? `btn--${variant}` : '',
    size ? `btn--${size}` : '',
    block ? 'btn--block' : '',
  ].filter(Boolean).join(' ');

  const node = h(
    `button.${cls.split(' ').join('.')}`,
    { type, disabled: disabled || undefined, 'aria-label': ariaLabel || undefined },
    iconName ? icon(iconName, size === 'lg' ? 22 : 19) : null,
    label ?? null,
    iconRight ? icon(iconRight, 19) : null
  );
  if (onClick) node.addEventListener('click', (ev) => { audio.tap(); onClick(ev); });
  return node;
}

export function btnRow(...buttons) {
  return h('div.btn-row', {}, ...buttons.filter(Boolean));
}

/* ============================== Thẻ / khối =============================== */
export function card({ className = '', pad, children, onClick, ariaLabel } = {}) {
  const node = h(`div.card${pad === 'lg' ? '.card--pad-lg' : ''}${className ? '.' + className.split(' ').join('.') : ''}`,
    { 'aria-label': ariaLabel || undefined },
    ...(Array.isArray(children) ? children : [children]).filter(Boolean)
  );
  if (onClick) {
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', '0');
    node.style.cursor = 'pointer';
    node.addEventListener('click', () => { audio.tap(); onClick(); });
    node.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onClick(); }
    });
  }
  return node;
}

export function sectionTitle(label, action) {
  return h(
    'div.row.row--between',
    { style: { alignItems: 'baseline' } },
    h('span.label', {}, label),
    action || null
  );
}

/* ================================ Chip =================================== */
export function chip({ label, selected = false, onClick, icon: iconName, size = '', dot = false } = {}) {
  const node = h(
    `button.chip${size ? '.chip--' + size : ''}`,
    { type: 'button', 'aria-pressed': String(Boolean(selected)) },
    dot ? h('span', { style: { width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor', flex: '0 0 auto' } }) : null,
    iconName ? icon(iconName, 15) : null,
    h('span', {}, label)
  );
  node.addEventListener('click', () => {
    (selected ? audio.tap : audio.select)();
    onClick?.(!selected);
  });
  return node;
}

export function chipRow(chips, { scroller = false } = {}) {
  return h(`div.${scroller ? 'chip-scroller' : 'chip-row'}`, {}, ...chips.filter(Boolean));
}

/* ============================== Segmented ================================ */
export function segmented({ options, value, onChange, stack = false, ariaLabel }) {
  const group = h(`div.seg${stack ? '.seg--stack' : ''}`, { role: 'tablist', 'aria-label': ariaLabel });
  const buttons = options.map((opt) => {
    const isOn = String(opt.value) === String(value);
    const btn = h('button.seg__opt', {
      type: 'button',
      role: 'tab',
      'aria-selected': String(isOn),
      title: opt.hint || undefined,
    }, opt.label);
    btn.addEventListener('click', () => {
      audio.select();
      onChange?.(opt.value);
    });
    group.appendChild(btn);
    return btn;
  });
  group.setValue = (next) => {
    buttons.forEach((btn, i) => btn.setAttribute('aria-selected', String(String(options[i].value) === String(next))));
  };
  return group;
}

/* ============================== Progress ================================= */
export function progress({ value, max = 100, variant = '', thin = false, label }) {
  const pct = clamp((value / max) * 100, 0, 100);
  return h(
    `div.progress${variant ? '.progress--' + variant : ''}${thin ? '.progress--thin' : ''}`,
    { role: 'progressbar', 'aria-valuenow': Math.round(pct), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': label || 'Tiến độ' },
    h('div.progress__bar', { style: { width: pct + '%' } })
  );
}

export function progressSeg({ total, done, now = -1, label }) {
  const segs = [];
  for (let i = 0; i < total; i += 1) {
    const cls = i < done ? 'progress__seg--done' : i === now ? 'progress__seg--now' : '';
    segs.push(h(`span.progress__seg${cls ? '.' + cls : ''}`));
  }
  return h('div.progress.progress--seg', { role: 'progressbar', 'aria-valuenow': done, 'aria-valuemax': total, 'aria-label': label || 'Tiến độ phiên học' }, ...segs);
}

export function ring({ value, max = 100, size = 96, thickness = 9, center, variant = '', label }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = clamp(value / max, 0, 1);
  const offset = c * (1 - pct);
  const svg = fromHTML(
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
       <circle class="ring__track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${thickness}"/>
       <circle class="ring__value" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${thickness}"
         stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"/>
     </svg>`
  ).firstElementChild;

  const inner = h('div.ring__inner', {});
  if (center) inner.appendChild(center);

  return h(
    `div.ring${variant ? '.ring--' + variant : ''}`,
    { role: 'img', 'aria-label': label || `${Math.round(pct * 100)}%` },
    svg,
    inner
  );
}

/* ================================ Stat =================================== */
export function stat({ label, value, delta, down = false, sub }) {
  return h(
    'div.stat',
    {},
    h('span.label', {}, label),
    h('span.stat__value', {}, value),
    delta ? h(`span.stat__delta${down ? '.stat__delta--down' : ''}`, {}, delta) : null,
    sub ? h('span', { style: { fontSize: '12px', color: 'var(--ink-3)' } }, sub) : null
  );
}

export function statGrid(stats) {
  return h('div.stat-grid', {}, ...stats.map((s) => card({ className: 'card--quiet', children: stat(s) })));
}

export function badge(label, tone = '', iconName) {
  return h(`span.badge${tone ? '.badge--' + tone : ''}`, {}, iconName ? icon(iconName, 12) : null, label);
}

/* ============================== Danh sách ================================ */
export function list(items) {
  return h('div.list', {}, ...items.filter(Boolean));
}

export function listItem({ title, sub, icon: iconName, trail, onClick, meta, badge: badgeNode }) {
  const Tag = onClick ? 'button' : 'div';
  const node = h(
    `${Tag}.listitem`,
    { type: onClick ? 'button' : undefined },
    iconName ? h('span', { class: 'empty__art', style: { width: '40px', height: '40px', margin: '0', borderRadius: '12px' } }, icon(iconName, 20)) : null,
    h('div.listitem__body', {},
      h('div.listitem__title', {}, title),
      sub ? h('div.listitem__sub', {}, sub) : null),
    badgeNode || null,
    meta ? h('span.mono', { style: { fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' } }, meta) : null,
    trail !== false ? h('span.listitem__trail', {}, trail || icon('chevron-right', 18)) : null
  );
  if (onClick) node.addEventListener('click', () => { audio.tap(); onClick(); });
  return node;
}

/* ============================= Thẻ từ vựng =============================== */
export function wordRow({ word, onClick, trail = 'audio', cefr = true }) {
  const node = h(
    'button.wordrow',
    { type: 'button', 'aria-label': `${word.en}, ${word.vi}. Nghe phát âm` },
    h('div.listitem__body', {},
      h('div.wordrow__en', {}, word.en),
      h('div.wordrow__ipa', {}, `/${word.ipa}/`),
      h('div.wordrow__vi', {}, word.vi)),
    h('div.wordrow__side', {},
      cefr ? badge(word.cefr, word.cefr === 'A1' || word.cefr === 'A2' ? 'success' : word.cefr === 'B1' || word.cefr === 'B2' ? 'warning' : 'danger') : null,
      trail === 'audio' ? audioButton({ text: word.en, label: `Nghe ${word.en}` }) : trail)
  );
  node.addEventListener('click', (ev) => {
    if (ev.target.closest('.audio-btn')) return;
    audio.tap();
    onClick?.();
  });
  return node;
}

export function audioButton({ text, lang = 'en-US', label, wide = false, autoLabel = true, onClick }) {
  const btn = h(
    `button.audio-btn${wide ? '.audio-btn--wide' : ''}`,
    { type: 'button', 'aria-label': label || (autoLabel ? `Nghe phát âm: ${text}` : undefined), 'data-playing': 'false' },
    icon('volume-2', 19),
    wide ? h('span', { style: { fontSize: 'var(--fs-sm)', fontWeight: '600' } }, 'Nghe') : null
  );
  let handle = null;
  btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (handle && !handle.stopped) {
      handle.stop();
      btn.dataset.playing = 'false';
      handle = null;
      return;
    }
    onClick?.();
    btn.dataset.playing = 'true';
    handle = audio.speak(text, {
      lang,
      onEnd: () => {
        btn.dataset.playing = 'false';
        handle = null;
      },
    });
  });
  return btn;
}

/* ============================== Ảnh + Bbox =============================== */
export function photoFrame({ src, alt, ratio = 'square', children, dim = false, className = '' }) {
  return h(
    `div.photo-frame${ratio === 'wide' ? '.photo-frame--wide' : ratio === 'tall' ? '.photo-frame--tall' : ''}${dim ? '.photo-frame--dim' : ''}${className ? '.' + className : ''}`,
    {},
    h('img', { src, alt, loading: 'lazy', decoding: 'async' }),
    ...(children ? (Array.isArray(children) ? children : [children]) : [])
  );
}

/**
 * Vùng khoanh trên ảnh. Toạ độ tính bằng % để ảnh co giãn thế nào cũng đúng.
 * region = { x, y, w, h }  |  opts.onChange(region) khi người dùng kéo/thả.
 */
export function bbox(region, { label, state = 'on', tone, interactive: isInteractive = true, grip = false, onTap, onChange, ariaLabel } = {}) {
  const cls = ['bbox'];
  if (state === 'off') cls.push('bbox--off');
  else if (state === 'user' || tone === 'user') cls.push('bbox--user');
  else if (state === 'on') cls.push('bbox--on');

  const node = h(
    `div.${cls.join('.')}`,
    {
      style: {
        left: region.x + '%',
        top: region.y + '%',
        width: region.w + '%',
        height: region.h + '%',
        touchAction: 'none',
      },
      role: 'group',
      'aria-label': ariaLabel || label || 'Vùng khoanh',
    },
    label ? h(`span.bbox__tag${state === 'user' ? '.bbox__tag--user' : ''}`, {}, label) : null,
    grip ? h('span.bbox__grip', { 'aria-hidden': 'true' }, icon('move-3d', 15)) : null
  );

  if (onTap) {
    node.style.cursor = 'pointer';
    node.addEventListener('click', (ev) => {
      if (ev.__dragged) return;
      audio.tap();
      onTap(ev);
    });
  }

  if (isInteractive && onChange) {
    let mode = null;
    let start = null;
    const parent = () => node.parentElement;

    const toPct = (ev) => {
      const box = parent().getBoundingClientRect();
      return {
        x: ((ev.clientX - box.left) / box.width) * 100,
        y: ((ev.clientY - box.top) / box.height) * 100,
      };
    };

    const apply = (next) => {
      node.style.left = next.x + '%';
      node.style.top = next.y + '%';
      node.style.width = next.w + '%';
      node.style.height = next.h + '%';
    };

    node.addEventListener('pointerdown', (ev) => {
      if (!isInteractive) return;
      const onGrip = ev.target.closest('.bbox__grip');
      mode = onGrip ? 'resize' : 'move';
      const p = toPct(ev);
      start = { px: p.x, py: p.y, ...region };
      node.setPointerCapture(ev.pointerId);
      ev.__dragged = false;
      node.style.zIndex = '5';
    });

    node.addEventListener('pointermove', (ev) => {
      if (!mode || !start) return;
      const p = toPct(ev);
      const dx = p.x - start.px;
      const dy = p.y - start.py;
      if (Math.abs(dx) > 0.6 || Math.abs(dy) > 0.6) ev.__dragged = true;
      let next;
      if (mode === 'move') {
        next = {
          x: clamp(start.x + dx, 0, 100 - start.w),
          y: clamp(start.y + dy, 0, 100 - start.h),
          w: start.w,
          h: start.h,
        };
      } else {
        next = {
          x: start.x,
          y: start.y,
          w: clamp(start.w + dx, 12, 100 - start.x),
          h: clamp(start.h + dy, 12, 100 - start.y),
        };
      }
      apply(next);
      region = next;
    });

    const release = (ev) => {
      if (!mode) return;
      mode = null;
      node.style.zIndex = '';
      try {
        node.releasePointerCapture(ev.pointerId);
      } catch {
        /* bỏ qua */
      }
      if (ev.__dragged) onChange({ ...region });
    };
    node.addEventListener('pointerup', release);
    node.addEventListener('pointercancel', release);

    node.addEventListener('keydown', (ev) => {
      const step = ev.shiftKey ? 5 : 1.5;
      const map = { ArrowLeft: ['x', -step], ArrowRight: ['x', step], ArrowUp: ['y', -step], ArrowDown: ['y', step] };
      const move = map[ev.key];
      if (!move) return;
      ev.preventDefault();
      const next = { ...region };
      next[move[0]] = clamp(next[move[0]] + move[1], 0, 100 - next[move[0] === 'x' ? 'w' : 'h']);
      region = next;
      apply(next);
      onChange({ ...region });
    });
  }

  return node;
}

export function viewfinder({ src, alt, guide = true, grid = true, children }) {
  return h(
    'div.viewfinder',
    {},
    h('img', { src, alt, decoding: 'async' }),
    grid ? h('div.viewfinder__grid') : null,
    guide ? h('div.viewfinder__guide') : null,
    ...(children ? (Array.isArray(children) ? children : [children]) : [])
  );
}

/* ============================ Overlay: sheet ============================= */
export function sheet({ title, sub, body, actions, onClose, ariaLabel }) {
  const root = host();
  const wrap = h('div', { style: { position: 'absolute', inset: '0', pointerEvents: 'auto' } });
  // Nhớ phần tử đang có tiêu điểm để trả lại khi đóng.
  const returnFocus = document.activeElement;

  const close = () => {
    wrap.remove();
    document.removeEventListener('keydown', onKey);
    if (returnFocus && typeof returnFocus.focus === 'function') {
      try {
        returnFocus.focus();
      } catch {
        /* bỏ qua */
      }
    }
    onClose?.();
  };

  /**
   * Bẫy tiêu điểm: `aria-modal="true"` là lời hứa với trình đọc màn hình rằng
   * phần còn lại của trang không tương tác được. Nếu không bẫy Tab thì lời hứa
   * đó sai — qa-verify đo được 20/25 điểm dừng Tab rơi ra ngoài dialog.
   */
  const focusables = () =>
    Array.from(
      panel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
          'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((n) => n.getClientRects().length > 0);

  const onKey = (ev) => {
    if (ev.key === 'Escape') {
      close();
      return;
    }
    if (ev.key !== 'Tab') return;
    const list = focusables();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement;
    const inside = panel.contains(active);
    if (ev.shiftKey && (active === first || !inside)) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && (active === last || !inside)) {
      ev.preventDefault();
      first.focus();
    }
  };

  const scrim = h('div.scrim', {});
  scrim.addEventListener('click', close);

  const panel = h(
    'div.sheet',
    { role: 'dialog', 'aria-modal': 'true', 'aria-label': ariaLabel || title || 'Bảng thông tin' },
    h('div.sheet__grab', { 'aria-hidden': 'true' }),
    h('div.sheet__head', {},
      h('div.grow', {}, h('h2.sheet__title', {}, title), sub ? h('p.appbar__sub', {}, sub) : null),
      iconBtn('x', { label: 'Đóng', onClick: close, variant: 'quiet' })),
    h('div.sheet__body', {}, ...(Array.isArray(body) ? body : [body]).filter(Boolean)),
    actions ? h('div', { style: { padding: '0 20px 20px' } }, actions) : null
  );

  wrap.appendChild(scrim);
  wrap.appendChild(panel);
  root.appendChild(wrap);
  document.addEventListener('keydown', onKey);
  // Đưa tiêu điểm vào bảng để bàn phím và trình đọc màn hình theo kịp.
  requestAnimationFrame(() => panel.querySelector('button')?.focus());
  return { close, panel };
}

export function modal({ title, body, actions, onClose }) {
  const root = host();
  const wrap = h('div', { style: { position: 'absolute', inset: '0', pointerEvents: 'auto' } });
  const returnFocus = document.activeElement;
  const close = () => {
    wrap.remove();
    document.removeEventListener('keydown', onKey);
    if (returnFocus && typeof returnFocus.focus === 'function') {
      try {
        returnFocus.focus();
      } catch {
        /* bỏ qua */
      }
    }
    onClose?.();
  };

  const panel = h('div.modal', { role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'Hộp thoại' },
    title ? h('h2.sheet__title', { style: { marginBottom: '8px' } }, title) : null,
    ...(Array.isArray(body) ? body : [body]).filter(Boolean),
    actions ? h('div', { style: { marginTop: '20px' } }, actions) : null);

  // Bẫy tiêu điểm, cùng lý do như ui.sheet.
  const focusables = () =>
    Array.from(
      panel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
          'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((n) => n.getClientRects().length > 0);

  const onKey = (ev) => {
    if (ev.key === 'Escape') {
      close();
      return;
    }
    if (ev.key !== 'Tab') return;
    const list = focusables();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement;
    const inside = panel.contains(active);
    if (ev.shiftKey && (active === first || !inside)) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && (active === last || !inside)) {
      ev.preventDefault();
      first.focus();
    }
  };

  const scrim = h('div.scrim', {});
  scrim.addEventListener('click', close);
  wrap.appendChild(scrim);
  wrap.appendChild(panel);
  root.appendChild(wrap);
  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => focusables()[0]?.focus() || panel.querySelector('button')?.focus());
  return { close };
}

export function toast(message, { tone = '', iconName, ms = 2200 } = {}) {
  const root = host();
  const node = interactive(
    h(`div.toast${tone ? '.toast--' + tone : ''}`, { role: 'status', 'aria-live': 'polite' },
      iconName ? icon(iconName, 17) : null,
      h('span', {}, message))
  );
  root.appendChild(node);
  setTimeout(() => {
    node.style.transition = 'opacity 200ms, transform 200ms';
    node.style.opacity = '0';
    node.style.transform = 'translateX(-50%) translateY(6px)';
    setTimeout(() => node.remove(), 220);
  }, ms);
  return node;
}

/* ========================= Trạng thái & tiện ích ========================= */
export function empty({ iconName = 'sparkles', title, body, action }) {
  return h('div.empty', {},
    h('div.empty__art', {}, icon(iconName, 32)),
    h('h2.empty__title', {}, title),
    body ? h('p.muted', { style: { maxWidth: '30ch' } }, body) : null,
    action || null);
}

export function skeleton(kind = 'line', width) {
  const map = { line: 'skeleton skeleton--line', title: 'skeleton skeleton--title', short: 'skeleton skeleton--short', photo: 'skeleton skeleton--photo' };
  return h(`div.${(map[kind] || map.line).split(' ').join('.')}`, { style: width ? { width } : undefined, 'aria-hidden': 'true' });
}

export function spinner() {
  return h('span.spinner', { 'aria-hidden': 'true' });
}

export function callout({ tone = '', iconName, title, body }) {
  const chosen = iconName || (tone === 'warning' ? 'alert-triangle' : tone === 'danger' ? 'x-circle' : tone === 'success' ? 'check-circle' : 'info');
  return h(`div.callout${tone ? '.callout--' + tone : ''}`, {},
    icon(chosen, 18),
    h('div.grow', {}, title ? h('div.callout__title', {}, title) : null, body ? h('div', {}, body) : null));
}

export function toggle({ checked = false, onChange, label }) {
  const node = h('button.toggle', { type: 'button', role: 'switch', 'aria-checked': String(Boolean(checked)), 'aria-label': label });
  node.addEventListener('click', () => {
    const next = node.getAttribute('aria-checked') !== 'true';
    node.setAttribute('aria-checked', String(next));
    audio.select();
    onChange?.(next);
  });
  return node;
}

export function avatar(name, { large = false } = {}) {
  const initials = String(name || '?').trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();
  return h(`div.avatar${large ? '.avatar--lg' : ''}`, { 'aria-hidden': 'true' }, initials);
}

export function keyval(k, v, tone = '') {
  return h('div.keyval', {},
    h('span.keyval__k', {}, k),
    h('span.keyval__v', { style: tone ? { color: `var(--${tone})` } : undefined }, v));
}

export function divider(label) {
  return label ? h('div.divider.divider--label', {}, h('span.label', {}, label)) : h('hr.divider');
}

export function fab(iconName, { label, onClick } = {}) {
  const node = h('button.fab', { type: 'button', 'aria-label': label }, icon(iconName, 24));
  node.addEventListener('click', () => { audio.tap(); onClick?.(); });
  return node;
}

/* ============================== Cost meter =============================== */
export function costMeter({ compact = false } = {}) {
  const node = h('div.costmeter', { role: 'status', 'aria-live': 'off' },
    h('span.costmeter__dot'),
    h('span', {}, '0 API call')
  );
  const paint = (snap) => {
    const calls = snap.apiCalls;
    node.classList.toggle('costmeter--zero', calls === 0);
    const dot = node.querySelector('.costmeter__dot');
    dot.classList.toggle('costmeter__dot--firing', Boolean(snap.firingKind));
    const text = node.querySelector('span:last-child');
    text.textContent = compact
      ? `${calls} API`
      : calls === 0
        ? '0 API call · sinh bằng quy tắc'
        : `${calls} API call · VLM ${snap.totals.vlm} · LLM ${snap.totals.llm}`;
  };
  paint(cost.snapshot());
  const unsub = cost.subscribe(paint);
  node.__dispose = unsub;
  return node;
}

/* ========================= Đoạn văn đan xen ============================== */
/**
 * paragraphs: mảng các mảng token [{ type:'vi'|'en', text, wordId }]
 */
export function interleave(paragraphs, { onWordTap } = {}) {
  const wrap = h('div.interleave', {});
  paragraphs.forEach((tokens) => {
    const p = h('p', {});
    tokens.forEach((tok) => {
      if (tok.type === 'en') {
        const w = h('button.en', {
          type: 'button',
          'aria-expanded': 'false',
          'data-word': tok.text.toLowerCase(),
          title: `Xem nghĩa của "${tok.text}"`,
        }, tok.text);
        w.addEventListener('click', () => {
          audio.tap();
          onWordTap?.(tok, w);
        });
        p.appendChild(w);
      } else {
        p.appendChild(document.createTextNode(tok.text));
      }
    });
    wrap.appendChild(p);
  });
  return wrap;
}

/* ======================== Vòng đếm / thanh tỷ lệ ======================== */
export function barList(rows) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return h('div.cost-ledger', {},
    ...rows.map((r) =>
      h('div.cost-ledger__row', {},
        h('span', { style: { minWidth: '86px', fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' } }, r.label),
        h('div.cost-ledger__bar', {}, h('div.cost-ledger__fill', { style: { width: (r.value / max) * 100 + '%', background: r.color ? `var(--${r.color})` : undefined } })),
        h('span.cost-ledger__n', {}, String(r.value)))));
}

/** Lớp phủ hoạt ảnh nhẹ — tôn trọng reduced-motion. */
export function pulseOnce(node) {
  if (!node || prefersReducedMotion()) return node;
  node.animate?.([{ transform: 'scale(0.96)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
  return node;
}

export const ui = {
  setNav, setOverlayHost, clearOverlays,
  appBar, iconBtn, button, btnRow, card, sectionTitle,
  chip, chipRow, segmented, progress, progressSeg, ring,
  stat, statGrid, badge, list, listItem, wordRow, audioButton,
  photoFrame, bbox, viewfinder, sheet, modal, toast,
  empty, skeleton, spinner, callout, toggle, avatar, keyval, divider, fab,
  costMeter, interleave, barList, pulseOnce,
  ICON: icon,
};

export { icon };
