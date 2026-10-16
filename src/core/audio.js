/* ============================================================================
   SnapLife AI — Âm thanh: phát âm (TTS) + phản hồi đúng/sai
   Owner: Lead.
   Mọi lời gọi đều "an toàn": nếu trình duyệt không có TTS, ta vẫn phát hoạt ảnh
   và trả về một handle có onEnd, để UI không bao giờ bị treo.
   ========================================================================== */

let ctx = null;
let muted = false;
let currentUtterance = null;

function audioContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

function tone(freq, duration, { type = 'sine', gain = 0.06, delay = 0 } = {}) {
  if (muted) return;
  const ac = audioContext();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0, t0);
  amp.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const audio = {
  get muted() {
    return muted;
  },

  setMuted(value) {
    muted = Boolean(value);
    if (muted) audio.stopSpeaking();
  },

  /* --- Phản hồi tương tác ------------------------------------------------ */
  tap() {
    tone(340, 0.06, { type: 'triangle', gain: 0.035 });
  },
  select() {
    tone(520, 0.07, { type: 'triangle', gain: 0.04 });
  },
  correct() {
    tone(660, 0.1, { type: 'sine', gain: 0.05 });
    tone(880, 0.16, { type: 'sine', gain: 0.045, delay: 0.09 });
  },
  wrong() {
    tone(220, 0.16, { type: 'sawtooth', gain: 0.035 });
    tone(165, 0.2, { type: 'sawtooth', gain: 0.03, delay: 0.1 });
  },
  chime() {
    tone(523.25, 0.22, { type: 'sine', gain: 0.045 });
    tone(659.25, 0.26, { type: 'sine', gain: 0.04, delay: 0.1 });
    tone(783.99, 0.34, { type: 'sine', gain: 0.035, delay: 0.2 });
  },
  recordStart() {
    tone(440, 0.09, { type: 'square', gain: 0.03 });
    tone(587, 0.09, { type: 'square', gain: 0.03, delay: 0.08 });
  },

  /* --- Phát âm ----------------------------------------------------------- */
  /**
   * speak('commute', { lang: 'en-US', onStart, onEnd })
   * Trả về { stop(), promise } — luôn kết thúc, kể cả khi không có TTS.
   */
  speak(text, opts = {}) {
    const {
      lang = 'en-US',
      rate = 0.92,
      pitch = 1,
      onStart,
      onEnd,
      fallbackMs = null,
      simulated = false,
    } = opts;

    let finished = false;
    let timer = null;
    let stopped = false;
    let resolveDone;
    // `handle` phải được khai báo ở phạm vi hàm, không phải trong từng nhánh:
    // `finish()` bên dưới cần đọc nó để gỡ currentUtterance. Khai báo trong nhánh
    // sẽ khiến finish() ném ReferenceError, làm onEnd và promise không bao giờ chạy.
    let handle = null;
    const promise = new Promise((res) => {
      resolveDone = res;
    });

    const finish = () => {
      if (finished) return;
      finished = true;
      if (timer) clearTimeout(timer);
      if (currentUtterance && currentUtterance.__handle === handle) currentUtterance = null;
      if (typeof onEnd === 'function') onEnd();
      resolveDone();
    };

    if (typeof onStart === 'function') {
      // Báo bắt đầu ngay để UI phản hồi tức thì (perceived performance).
      try {
        onStart();
      } catch (err) {
        console.error(err);
      }
    }

    const synthetic =
      simulated || typeof window.speechSynthesis === 'undefined' || muted;
    const guessed = fallbackMs ?? Math.min(4200, Math.max(700, String(text).length * 78));

    if (synthetic) {
      timer = setTimeout(finish, guessed * (1 / rate));
      handle = {
        stop() {
          stopped = true;
          finish();
        },
        get stopped() {
          return stopped;
        },
        promise,
      };
      return handle;
    }

    try {
      window.speechSynthesis.cancel();
      const Utter = window.SpeechSynthesisUtterance;
      if (!Utter) throw new Error('trình duyệt không có SpeechSynthesisUtterance');
      const utter = new Utter();
      utter.text = String(text);
      utter.lang = lang;
      utter.rate = rate;
      utter.pitch = pitch;
      utter.onend = finish;
      utter.onerror = finish;
      // Lưới an toàn: vài trình duyệt không bắn onend (nhất là khi không có voice).
      timer = setTimeout(finish, guessed * 2.4 + 1200);
      handle = {
        stop() {
          stopped = true;
          try {
            window.speechSynthesis.cancel();
          } catch {
            /* bỏ qua */
          }
          finish();
        },
        get stopped() {
          return stopped;
        },
        promise,
      };
      utter.__handle = handle;
      currentUtterance = utter;
      window.speechSynthesis.speak(utter);
      return handle;
    } catch {
      timer = setTimeout(finish, guessed);
      handle = {
        stop() {
          finish();
        },
        get stopped() {
          return stopped;
        },
        promise,
      };
      return handle;
    }
  },

  stopSpeaking() {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* bỏ qua */
    }
    if (currentUtterance) currentUtterance = null;
  },

  get speaking() {
    return Boolean(currentUtterance) || Boolean(window.speechSynthesis?.speaking);
  },

  hasTts() {
    return typeof window.speechSynthesis !== 'undefined' && !muted;
  },
};

/** Nhịp ngắn tiện dụng cho hoạt ảnh chờ. */
export const wait = (ms) => new Promise((res) => setTimeout(res, ms));
