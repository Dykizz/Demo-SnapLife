/* ============================================================================
   SnapLife AI — Store trạng thái demo
   Owner: Lead.  Trạng thái nằm trong bộ nhớ; chỉ ghi nhớ theme giữa các lần tải.
   ========================================================================== */

const THEME_KEY = 'snaplife.theme';

function deepClone(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(deepClone);
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = deepClone(v);
  return out;
}

function readPath(obj, path) {
  if (!path) return obj;
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc === null || acc === undefined ? undefined : acc[key]), obj);
}

function writePath(obj, path, value) {
  const keys = String(path).split('.');
  let cursor = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (typeof cursor[key] !== 'object' || cursor[key] === null) cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]] = value;
}

export function createStore(initialState) {
  const initial = deepClone(initialState);
  let state = deepClone(initialState);
  const subscribers = new Set();

  const store = {
    get state() {
      return state;
    },

    get(path, fallback) {
      const value = readPath(state, path);
      return value === undefined ? fallback : value;
    },

    /** set('user.cefr', 'B2')  |  set({ 'user.cefr': 'B2', 'session.length': 20 }) */
    set(pathOrMap, value) {
      if (typeof pathOrMap === 'object' && pathOrMap !== null) {
        for (const [k, v] of Object.entries(pathOrMap)) writePath(state, k, v);
      } else {
        writePath(state, pathOrMap, value);
      }
      store.notify({ type: 'set', path: pathOrMap });
      return store;
    },

    /** Cập nhật bằng hàm, tránh phải nhớ đường dẫn dài. */
    update(fn) {
      fn(state);
      store.notify({ type: 'update' });
      return store;
    },

    push(path, ...items) {
      const list = readPath(state, path);
      if (Array.isArray(list)) list.push(...items);
      store.notify({ type: 'push', path });
      return store;
    },

    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },

    notify(meta = {}) {
      for (const fn of subscribers) {
        try {
          fn(state, meta);
        } catch (err) {
          console.error('[store] subscriber lỗi:', err);
        }
      }
    },

    reset() {
      state = deepClone(initial);
      store.notify({ type: 'reset' });
      return store;
    },
  };

  return store;
}

/* ---- Ghi nhớ theme (chỉ một thứ duy nhất cần nhớ giữa các lần tải) ------- */
/*
 * Mặc định là LIGHT, không phải theo hệ điều hành.
 * Lý do: "Warm Editorial" được thiết kế cho nền giấy kem — đó là ấn tượng đầu tiên
 * của sản phẩm. Người dùng vẫn tự chuyển được bằng nút mặt trời/mặt trăng hoặc
 * phím T, và lựa chọn đó được nhớ lại cho lần sau.
 */
export function loadSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* localStorage có thể bị chặn — bỏ qua */
  }
  return 'light';
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* bỏ qua */
  }
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  saveTheme(theme);
}
