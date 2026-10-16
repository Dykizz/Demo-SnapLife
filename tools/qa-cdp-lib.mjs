/* ============================================================================
   qa-cdp-lib.mjs — CDP client toi gian cho QA doc lap (SnapLife AI)
   Owner: qa-verify.  Pham vi ghi: tools/qa-*
   Khong phu thuoc thu vien ngoai: Node 22 co san global WebSocket + fetch.
   File nay CO TINH thuan ASCII.
   ========================================================================== */

import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function chromePath() {
  return join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'chromium-1243', 'chrome-win64', 'chrome.exe');
}

/** Mo Chromium headless voi remote debugging, cho toi khi /json/version tra loi. */
export async function launch({ port = 9411 } = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'qa-chrome-'));
  const args = [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + profile,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=520,920',
    'about:blank',
  ];
  const proc = spawn(chromePath(), args, { stdio: 'ignore' });
  let ver = null;
  for (let i = 0; i < 120; i += 1) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) {
        ver = await r.json();
        break;
      }
    } catch {
      /* chua mo */
    }
    await sleep(150);
  }
  if (!ver) {
    try { proc.kill(); } catch { /* ignore */ }
    throw new Error('Khong mo duoc DevTools tren cong ' + port);
  }
  return { proc, ver, port, profile };
}

export class CDP {
  constructor(url) {
    this.url = url;
    this.seq = 0;
    this.pending = new Map();
    this.handlers = new Map();
    this.dead = false;
  }

  async connect() {
    this.ws = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = () => reject(new Error('WebSocket loi: ' + this.url));
    });
    this.ws.onmessage = (ev) => this._onMessage(ev.data);
    this.ws.onclose = () => { this.dead = true; };
    return this;
  }

  _onMessage(data) {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }
    if (msg.id && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.method + ' -> ' + msg.error.message));
      else resolve(msg.result);
      return;
    }
    if (msg.method) {
      const list = this.handlers.get(msg.method);
      if (list) for (const fn of list) fn(msg.params, msg.sessionId);
    }
  }

  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }

  send(method, params = {}, sessionId) {
    if (this.dead) return Promise.reject(new Error('CDP da dong'));
    const id = ++this.seq;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('CDP timeout: ' + method));
        }
      }, 45000);
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(timer); resolve(v); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      });
      this.ws.send(JSON.stringify(payload));
    });
  }

  close() { try { this.ws.close(); } catch { /* ignore */ } }
}

/** Mo mot page target moi va tra ve phien {targetId, sid}. */
export async function openPage(cdp, url = 'about:blank') {
  const { targetId } = await cdp.send('Target.createTarget', { url });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const page = { targetId, sid: sessionId, errors: [], logs: [] };
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Log.enable', {}, sessionId);
  await cdp.send('Network.enable', {}, sessionId);
  cdp.on('Runtime.exceptionThrown', (p, s) => {
    if (s !== sessionId) return;
    const d = p.exceptionDetails || {};
    page.errors.push(String((d.exception && d.exception.description) || d.text || 'unknown').slice(0, 240));
  });
  cdp.on('Runtime.consoleAPICalled', (p, s) => {
    if (s !== sessionId) return;
    if (p.type === 'error' || p.type === 'warning') {
      page.errors.push('console.' + p.type + ': ' + p.args.map((a) => a.value ?? a.description ?? a.type).join(' ').slice(0, 240));
    }
  });
  cdp.on('Log.entryAdded', (p, s) => {
    if (s !== sessionId) return;
    const e = p.entry || {};
    if (e.level === 'error') page.logs.push(String(e.text || '').slice(0, 240));
  });
  return page;
}

export async function evalIn(cdp, page, expression, { awaitPromise = true } = {}) {
  const r = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise,
    userGesture: true,
  }, page.sid);
  if (r.exceptionDetails) {
    const d = r.exceptionDetails;
    throw new Error('JS loi: ' + ((d.exception && d.exception.description) || d.text));
  }
  return r.result ? r.result.value : undefined;
}

export async function waitReady(cdp, page, timeout = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try {
      const ok = await evalIn(cdp, page, "document.documentElement.dataset.ready === 'true'");
      if (ok === true) return true;
    } catch {
      /* dang tai lai */
    }
    await sleep(120);
  }
  return false;
}

/** Dieu huong: ho tro ca doi hash (khong co load event) lan doi URL day du. */
export async function goto(cdp, page, url, { settle = 200 } = {}) {
  const cur = await evalIn(cdp, page, 'location.href').catch(() => 'about:blank');
  const curBase = String(cur).split('#')[0];
  const urlBase = url.split('#')[0];
  const hash = url.includes('#') ? url.slice(url.indexOf('#')) : '';
  if (curBase === urlBase && hash) {
    await evalIn(cdp, page, 'location.hash = ' + JSON.stringify(hash));
    await sleep(90);
  } else {
    await cdp.send('Page.navigate', { url }, page.sid);
    await sleep(90);
    const t0 = Date.now();
    while (Date.now() - t0 < 20000) {
      const rs = await evalIn(cdp, page, 'document.readyState').catch(() => 'loading');
      if (rs === 'complete') break;
      await sleep(80);
    }
  }
  await waitReady(cdp, page);
  await sleep(settle);
}

export async function setViewport(cdp, page, width, height, mobile = true) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile,
    screenWidth: width, screenHeight: height,
  }, page.sid);
}

export async function clearViewport(cdp, page) {
  await cdp.send('Emulation.clearDeviceMetricsOverride', {}, page.sid);
}

export async function setReducedMotion(cdp, page, reduce) {
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  }, page.sid);
}

export async function blockUrls(cdp, page, patterns) {
  await cdp.send('Network.setBlockedURLs', { urls: patterns }, page.sid);
}

export async function typeKey(cdp, page, key, code, vk, extra = {}) {
  const base = { key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, ...extra };
  await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...base }, page.sid);
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base }, page.sid);
  await sleep(30);
}

export async function insertText(cdp, page, text) {
  await cdp.send('Input.insertText', { text }, page.sid);
  await sleep(80);
}

export const BASE = 'http://127.0.0.1:8137';
export const IDS = ['splash', 'onboarding', 'placement', 'topics', 'home',
  'capture', 'regions', 'wordlist', 'worddetail',
  'compose', 'reader', 'speaking', 'stories',
  'review-hub', 'review-run', 'review-summary',
  'diary', 'progress', 'profile', 'system-states'];
