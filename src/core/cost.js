/* ============================================================================
   SnapLife AI — Cost Meter
   Owner: Lead.
   Mục đích: biến luận điểm kiến trúc của deck (tr.9–10) thành thứ NHÌN THẤY ĐƯỢC.
   "Gọi AI một lần rồi tái sử dụng" — nên bộ đếm này chỉ tăng khi thật sự có
   một lời gọi mô hình, và đứng yên (0) trong toàn bộ luồng ôn tập.
   ========================================================================== */

export const COST_KINDS = {
  vlm: { label: 'VLM · nhận diện ảnh', unit: 'lần/ảnh', color: 'primary' },
  llm: { label: 'LLM · viết đoạn đan xen', unit: 'lần/câu', color: 'primary' },
  rule: { label: 'Rule engine · sinh bài tập', unit: 'miễn phí', color: 'success' },
  tts: { label: 'TTS · tổng hợp giọng đọc', unit: 'có cache', color: 'info' },
};

function createCostMeter() {
  const totals = { vlm: 0, llm: 0, rule: 0, tts: 0 };
  const ledger = []; // { key, kind, label, n, at }
  const seen = new Set(); // khoá idempotent: 1 ảnh chỉ gọi VLM đúng 1 lần
  const subscribers = new Set();
  let current = { id: null, api: [], zero: false };
  let firingTimer = null;
  let firingKind = null;

  const notify = () => {
    for (const fn of subscribers) {
      try {
        fn(api.snapshot());
      } catch (err) {
        console.error('[cost] subscriber lỗi:', err);
      }
    }
  };

  const flash = (kind) => {
    firingKind = kind;
    notify();
    clearTimeout(firingTimer);
    firingTimer = setTimeout(() => {
      firingKind = null;
      notify();
    }, 900);
  };

  const api = {
    get totals() {
      return { ...totals };
    },
    get ledger() {
      return ledger.slice();
    },
    /** Số lời gọi AI thật sự (rule engine không tính là API call). */
    get apiCalls() {
      return totals.vlm + totals.llm + totals.tts;
    },
    get firingKind() {
      return firingKind;
    },
    get currentScreen() {
      return current;
    },

    /**
     * Ghi nhận một lời gọi AI. Idempotent theo `key`:
     * "1 ảnh chỉ gọi VLM một lần" — vào lại màn hình không cộng thêm.
     */
    declare({ key, kind, label, n = 1 }) {
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      totals[kind] = (totals[kind] || 0) + n;
      ledger.push({ key, kind, label, n, at: Date.now() });
      flash(kind);
      notify();
      return true;
    },

    /** Ghi nhận lời gọi KHÔNG idempotent (ví dụ người dùng chủ động gọi lại). */
    log({ kind, label, n = 1 }) {
      totals[kind] = (totals[kind] || 0) + n;
      ledger.push({ kind, label, n, at: Date.now() });
      flash(kind);
      notify();
      return api;
    },

    /** Ghi nhận việc sinh nội dung bằng quy tắc — 0 chi phí API. */
    ruleWork(label) {
      totals.rule += 1;
      ledger.push({ kind: 'rule', label, n: 1, at: Date.now() });
      notify();
      return api;
    },

    /**
     * Gọi khi router vào một màn hình.
     * `declared` là mảng { key, kind, label, n } mà màn hình tự khai báo.
     */
    enterScreen(id, declared = []) {
      for (const item of declared) api.declare(item);
      current = {
        id,
        api: declared.slice(),
        zero: declared.length === 0,
      };
      notify();
      return api;
    },

    /** Chứng minh "0 API call" cho một luồng (dùng ở màn tổng kết phiên). */
    zeroProof() {
      return {
        calls: api.apiCalls,
        rule: totals.rule,
        text: api.apiCalls === 0 ? '0 API call' : `${api.apiCalls} API call`,
      };
    },

    reset() {
      totals.vlm = 0;
      totals.llm = 0;
      totals.rule = 0;
      totals.tts = 0;
      ledger.length = 0;
      seen.clear();
      current = { id: null, api: [], zero: false };
      notify();
      return api;
    },

    snapshot() {
      return {
        totals: { ...totals },
        ledger: ledger.slice(),
        apiCalls: totals.vlm + totals.llm + totals.tts,
        firingKind,
        current,
      };
    },

    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };

  return api;
}

export const cost = createCostMeter();
