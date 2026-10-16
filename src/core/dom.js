/* ============================================================================
   SnapLife AI — DOM helper (hyperscript nhỏ, không phụ thuộc thư viện)
   Owner: Lead.  Dùng chung cho mọi màn hình.
   ========================================================================== */

const SVG_NS = 'http://www.w3.org/2000/svg';

const SVG_TAGS = new Set([
  'svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'defs', 'use', 'symbol', 'clipPath', 'mask', 'pattern',
  'linearGradient', 'radialGradient', 'stop', 'filter', 'feGaussianBlur',
  'feColorMatrix', 'feOffset', 'feMerge', 'feMergeNode',
]);

/** Thuộc tính SVG phải giữ nguyên camelCase, không đổi sang kebab-case. */
const KEEP_CAMEL = new Set([
  'viewBox', 'preserveAspectRatio', 'patternUnits', 'patternContentUnits',
  'gradientUnits', 'gradientTransform', 'clipPathUnits', 'maskUnits', 'maskContentUnits',
  'refX', 'refY', 'markerWidth', 'markerHeight', 'markerUnits', 'textLength',
  'lengthAdjust', 'baseFrequency', 'numOctaves', 'stdDeviation', 'stopColor',
  'stopOpacity', 'startOffset', 'pathLength', 'dominantBaseline', 'textAnchor',
]);

function parseTag(tag) {
  const parts = String(tag).split(/(?=[.#])/);
  let name = 'div';
  if (parts[0] && !/^[.#]/.test(parts[0])) name = parts.shift();
  const classes = [];
  let id = null;
  for (const p of parts) {
    if (!p) continue;
    if (p[0] === '#') id = p.slice(1);
    else if (p[0] === '.') classes.push(p.slice(1));
  }
  return { name, classes, id };
}

function attrName(key) {
  if (KEEP_CAMEL.has(key)) return key;
  if (key.startsWith('aria') || key.startsWith('data')) {
    return key.startsWith('aria') && /[A-Z]/.test(key.slice(4))
      ? 'aria-' + key.slice(4).replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
      : key;
  }
  return key.includes('-') ? key : key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
}

function append(node, kid) {
  if (kid === null || kid === undefined || kid === false || kid === true) return;
  if (Array.isArray(kid)) {
    for (const k of kid) append(node, k);
    return;
  }
  if (kid instanceof Node) {
    node.appendChild(kid);
    return;
  }
  node.appendChild(document.createTextNode(String(kid)));
}

/**
 * h('div.card.row', { onClick, style, dataset, class }, ...children)
 * Hỗ trợ cú pháp rút gọn: 'button.btn.btn--primary', 'span#id', 'svg'
 */
export function h(tag, props, ...kids) {
  const { name, classes, id } = parseTag(tag);
  const isSvg = SVG_TAGS.has(name);
  const node = isSvg
    ? document.createElementNS(SVG_NS, name)
    : document.createElement(name);

  if (id) node.id = id;

  if (props && typeof props === 'object' && !(props instanceof Node) && !Array.isArray(props)) {
    const extra = props.class ?? props.className;
    if (extra) {
      if (Array.isArray(extra)) classes.push(...extra.filter(Boolean));
      else classes.push(...String(extra).split(/\s+/).filter(Boolean));
    }
    for (const [key, value] of Object.entries(props)) {
      if (key === 'class' || key === 'className') continue;
      if (value === null || value === undefined || value === false) continue;
      if (key === 'style' && typeof value === 'object') {
        Object.assign(node.style, value);
        continue;
      }
      if (key === 'dataset' && typeof value === 'object') {
        for (const [dk, dv] of Object.entries(value)) {
          if (dv !== null && dv !== undefined) node.dataset[dk] = String(dv);
        }
        continue;
      }
      if (key === 'html') {
        node.innerHTML = String(value);
        continue;
      }
      if (key === 'text') {
        node.textContent = String(value);
        continue;
      }
      if (key === 'ref' && typeof value === 'function') {
        value(node);
        continue;
      }
      if (key.startsWith('on') && key.length > 2 && typeof value === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
        continue;
      }
      if ((key === 'value' || key === 'checked' || key === 'disabled' || key === 'selected')
          && key in node) {
        node[key] = value;
        continue;
      }
      const attr = attrName(key);
      if (value === true) node.setAttribute(attr, '');
      else node.setAttribute(attr, String(value));
    }
  } else if (props !== null && props !== undefined) {
    append(node, props);
  }

  for (const kid of kids) append(node, kid);

  if (classes.length) node.setAttribute('class', classes.join(' '));
  return node;
}

/** Dựng DOM từ chuỗi HTML (giữ đúng namespace cho <svg>). */
export function fromHTML(markup) {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(markup).trim();
  return tpl.content;
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function mount(parent, ...kids) {
  clear(parent);
  for (const kid of kids) append(parent, kid);
  return parent;
}

export function on(target, type, handler, opts) {
  target.addEventListener(type, handler, opts);
  return () => target.removeEventListener(type, handler, opts);
}

/** Gắn hiệu ứng vào màn hình theo nhịp (tự tắt khi prefers-reduced-motion). */
export function animateIn(node) {
  if (!node) return node;
  node.classList.add('anim-enter');
  return node;
}

export function stagger(container) {
  if (container) container.classList.add('anim-stagger');
  return container;
}

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
