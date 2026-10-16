/* ============================================================================
   qa-cdp3.mjs — Vong 3: doi chieu noi dung deck + cac bat bien tai lieu
   Owner: qa-verify. Pham vi ghi: tools/qa-*
   Chay: node tools/qa-cdp3.mjs
   ========================================================================== */

import { launch, CDP, openPage, evalIn, goto, waitReady, setViewport, clearViewport, typeKey, sleep, BASE, IDS } from './qa-cdp-lib.mjs';
import { writeFileSync } from 'node:fs';

const R = [];
const log = (...a) => console.log(...a);
function report(id, title, data) {
  R.push({ id, title, data });
  log('');
  log('===== [' + id + '] ' + title + ' =====');
  log(JSON.stringify(data, null, 1));
}

async function main() {
  const { proc, ver } = await launch({ port: 9414 });
  log('Chromium: ' + ver.Browser);
  const cdp = await new CDP(ver.webSocketDebuggerUrl).connect();
  const page = await openPage(cdp, 'about:blank');
  try {
    await C3(cdp, page);
    await D3(cdp, page);
    await S3(cdp, page);
    await P3(cdp, page);
    await R3(cdp, page);
    await U3(cdp, page);
    await V3(cdp, page);
    await W3(cdp, page);
  } catch (e) {
    log('!! LOI: ' + (e && e.stack || e));
    R.push({ id: 'FATAL', title: 'loi', data: String(e && e.message || e) });
  }
  writeFileSync('tools/qa-cdp3-report.json', JSON.stringify(R, null, 2), 'utf8');
  log('');
  log('Da ghi tools/qa-cdp3-report.json');
  cdp.close();
  try { proc.kill(); } catch { /* ignore */ }
}

/* ---- C3: noi dung deck co xuat hien tren man hinh nao khong? -------------- */
async function C3(cdp, page) {
  const phrases = [
    ['01 · Vấn đề', ['Tốn kém chi phí', 'Tốn thời gian', 'Khó nhớ', 'bỏ cuộc'], null],
    ['02 · Giải pháp', ['Gợi ý từ', 'Đọc truyện đan xen', 'Ôn tập đa dạng', '15–20%'], null],
    ['03 · Điểm nhấn 1', ['Mỗi vùng khoanh sinh', 'thẻ từ', 'CEFR'], null],
    ['04 · Điểm nhấn 2', ['Kể lại một ngày', 'Gõ từ hoặc chủ đề'], null],
    ['05 · Điểm nhấn 3', ['very like', 'really like', 'make', 'makes', 'Nhờ AI chỉnh'], null],
    ['06 · Điểm nhấn 4', ['You made it through today', 'sắc thái'], null],
    ['07 · Ôn tập 5 dạng', ['Cloze', 'Ghép cặp', 'Flashcard', 'Chạm ảnh', 'Đọc tương tác'], null],
    ['08 · Công nghệ', ['nén', 'tải lên', 'VLM', 'Bbox', 'quy tắc', 'phân tầng'], null],
    ['09 · Tiết kiệm', ['0 API call', 'tiết kiệm', 'gọi AI'], null],
    ['10 · So sánh', ['Duolingo', 'Memrise', 'Anki', 'so sánh'], null],
    ['11 · Lộ trình & Kết', ['Story Chain', 'lớp học', 'Roadmap', 'Nhật', 'Hàn'], null],
  ];
  const targets = IDS.concat(['reader?story=ceramic-cup', 'reader?word=mug',
    'speaking?state=recording', 'speaking?state=corrected', 'worddetail?word=downpour']);
  const screenText = {};
  const inspectorText = {};
  for (const id of targets) {
    await goto(cdp, page, `${BASE}/index.html#/${id}`, { settle: 130 });
    screenText[id] = (await evalIn(cdp, page, "(document.querySelector('#screen').innerText||'')")).replace(/\s+/g, ' ');
    inspectorText[id] = (await evalIn(cdp, page, "(document.querySelector('#inspector-body').innerText||'')")).replace(/\s+/g, ' ');
  }
  const rows = phrases.map(([slide, keys]) => {
    const found = {};
    const onlyInspector = {};
    for (const k of keys) {
      const where = Object.keys(screenText).filter((s) => screenText[s].includes(k));
      found[k] = where;
      onlyInspector[k] = Object.keys(inspectorText).filter((s) => !where.includes(s) && inspectorText[s].includes(k)).slice(0, 6);
    }
    const anyMissing = keys.filter((k) => found[k].length === 0);
    return { slide, keys: found, chuCoTrongInspector: onlyInspector, khongXuatHienODau: anyMissing };
  });
  report('C3', 'Doi chieu noi dung tung muc deck voi text THAT cua 20 man hinh', {
    ghiChu: 'CHI tim trong #screen (khong tron bang inspector). Man nao chi co chu trong inspector thi ghi o cot chuCoTrongInspector.',
    soManXet: targets.length,
    rows,
  });
}

/* ---- D3: bat bien sac thai -> tone cau dong vien ------------------------- */
async function D3(cdp, page) {
  const data = await evalIn(cdp, page, `(function(){var d=window.__SNAPLIFE__.data;
    var out={moodsHans:d.moods.map(function(m){return m.id;}),sentences:{}};
    d.moods.forEach(function(m){var list=d.dailySentences[m.id]||[];out.sentences[m.id]=list.map(function(s){return {id:s.id,tone:s.tone,en:s.en};});});
    return out;})()`.replace('moodsHans', 'moods'));
  const moods = ['low', 'down', 'ok', 'up', 'great'];
  const viol = [];
  for (const m of moods) {
    const list = (data.sentences && data.sentences[m]) || [];
    const tones = [...new Set(list.map((s) => s.tone))];
    const expect = (m === 'low' || m === 'down') ? ['acknowledge'] : (m === 'up' || m === 'great') ? ['encourage'] : null;
    if (expect && tones.some((t) => !expect.includes(t))) viol.push({ mood: m, tones, expect });
  }
  // Kiem tren DOM man diary
  const dom = [];
  for (const m of moods) {
    await goto(cdp, page, `${BASE}/index.html#/diary`, { settle: 200 });
    const clicked = await evalIn(cdp, page, `(function(){var bs=document.querySelectorAll('#screen button');
      var t=${JSON.stringify(m)};
      var labels={low:'R\\u1ea5t th\\u1ea5p',down:'H\\u01a1i xu\\u1ed1ng',ok:'B\\u00ecnh th\\u01b0\\u1eddng',up:'Kh\\u00e1 t\\u1ed1t',great:'R\\u1ea5t t\\u1ed1t'};
      for(var i=0;i<bs.length;i++){if(bs[i].innerText.replace(/\\s+/g,' ').trim()===labels[t]){bs[i].click();return labels[t];}}
      return null;})()`);
    await sleep(400);
    const shown = await evalIn(cdp, page, `(function(){var host=document.querySelector('#screen');
      var t=(host.innerText||'').replace(/\\s+/g,' ');
      var pool=${JSON.stringify((data.sentences && data.sentences['__M__']) || [])}.map(function(s){return s.en;});
      return {cauEn: pool.filter(function(en){return t.indexOf(en)>=0;})};})()`.replace('__M__', m));
    dom.push({ mood: m, label: clicked, ...shown });
  }
  report('D3', 'Bat bien UX-FLOWS §5: sac thai thap CHI nhan cau "acknowledge", khong lan "encourage"', {
    tonesTheoMood: data.sentences, viPham: viol, dom: dom,
    ketLuan: viol.length ? 'CO VI PHAM' : 'khong vi pham',
  });
}

/* ---- S3: man system-states co du 4 trang thai khong? --------------------- */
async function S3(cdp, page) {
  await goto(cdp, page, `${BASE}/index.html#/system-states`, { settle: 350 });
  const r = await evalIn(cdp, page, `(function(){var host=document.querySelector('#screen');
    var t=host.innerText;
    return {skeleton:host.querySelectorAll('.skeleton').length, spinner:host.querySelectorAll('.spinner').length,
      empty:host.querySelectorAll('.empty').length, callout:host.querySelectorAll('.callout').length,
      coRong:/Ch\\u01b0a c\\u00f3|tr\\u1ed1ng/i.test(t), coDangTai:/\\u0110ang t\\u1ea3i|\\u0111ang t\\u1ea3i/i.test(t),
      coLoi:/L\\u1ed7i|kh\\u00f4ng \\u0111\\u1ecdc \\u0111\\u01b0\\u1ee3c/i.test(t), coOffline:/Offline|ngo\\u1ea1i tuy\\u1ebfn|m\\u1ea5t m\\u1ea1ng/i.test(t),
      headings:Array.prototype.map.call(host.querySelectorAll('h2,.section-title,.label'),function(e){return e.innerText.trim().slice(0,40);}).slice(0,10)};})()`);
  report('S3', 'Man system-states co trung bay du 4 trang thai?', r);
}

/* ---- P3: cong tac "huan luyen tren du lieu nguoi dung" ------------------- */
async function P3(cdp, page) {
  await goto(cdp, page, `${BASE}/index.html#/profile`, { settle: 300 });
  const r = await evalIn(cdp, page, `(function(){var host=document.querySelector('#screen');
    var sw=host.querySelector('.toggle--locked')||host.querySelector('.toggle');
    var locks=host.querySelectorAll('.toggle--locked').length;
    var t=host.innerText;
    return {coCamKet:/huan luy\\u1ec7n|hu\\u1ea5n luy\\u1ec7n/i.test(t), camKetText:(t.match(/[^\\n]*hu\\u1ea5n luy\\u1ec7n[^\\n]*/i)||[null])[0],
      toggleLocked:locks, toggleAll:host.querySelectorAll('.toggle').length,
      switchValue: sw?sw.getAttribute('aria-checked'):null, switchDisabled: sw?(sw.disabled||sw.getAttribute('aria-disabled')):null,
      coNenClient:/tr\\u00ean m\\u00e1y|t\\u1ea1i client|n\\u00e9n/i.test(t), co1Lan:/m\\u1ed9t l\\u1ea7n/i.test(t)};})()`);
  report('P3', 'profile: cam ket quyen rieng tu co that va cong tac co bi khoa?', r);
}

/* ---- R3: review-hub 2/10/20 -> so cau; review-run xoay vong dang bai ------ */
async function R3(cdp, page) {
  await goto(cdp, page, `${BASE}/index.html#/review-hub`, { settle: 300 });
  const hub = [];
  for (const len of ['2', '10', '20']) {
    await goto(cdp, page, `${BASE}/index.html#/review-hub`, { settle: 200 });
    const clicked = await evalIn(cdp, page, `(function(){var bs=document.querySelectorAll('#screen button');
      for(var i=0;i<bs.length;i++){if(bs[i].innerText.replace(/\\s+/g,' ').trim()==='${len} ph\\u00fat'){bs[i].click();return true;}}
      return false;})()`);
    await sleep(350);
    const cta = await evalIn(cdp, page, `(function(){var bs=document.querySelectorAll('#screen button');
      for(var i=0;i<bs.length;i++){var t=bs[i].innerText.replace(/\\s+/g,' ').trim();if(/^B\\u1eaft \\u0111\\u1ea7u/.test(t))return {label:t,disabled:bs[i].disabled};}
      return null;})()`);
    hub.push({ chon: len + ' phút', clicked, cta });
  }
  // Xoay vong dang bai trong review-run
  await goto(cdp, page, `${BASE}/index.html#/review-hub`, { settle: 200 });
  await evalIn(cdp, page, `(function(){var bs=document.querySelectorAll('#screen button');
    for(var i=0;i<bs.length;i++){if(/^B\\u1eaft \\u0111\\u1ea7u/.test(bs[i].innerText.trim())){bs[i].click();return;}}})()`);
  await waitReady(cdp, page);
  await sleep(500);
  const types = [];
  for (let i = 0; i < 8; i += 1) {
    const r = await evalIn(cdp, page, `(function(){var host=document.querySelector('#screen');
      var t=host.innerText.replace(/\\s+/g,' ');
      var m=t.match(/(\\u0110\\u1ecdc t\\u01b0\\u01a1ng t\\u00e1c|Cloze \\u0111i\\u1ec1n khuy\\u1ebft|Ch\\u1ea1m \\u1ea3nh|Gh\\u00e9p c\\u1eb7p|Flashcard SRS)/);
      return m?m[0]:null;})()`);
    types.push(r);
    // tra loi: bam nut dap an dau tien khong phai nut dieu huong
    await evalIn(cdp, page, `(function(){var bs=document.querySelectorAll('#screen button');
      for(var i=0;i<bs.length;i++){var t=(bs[i].innerText||'').replace(/\\s+/g,' ').trim();
        if(!t)continue;
        if(/^(Ti\\u1ebfp|C\\u00e2u ti\\u1ebfp|Quay l\\u1ea1i|K\\u1ebft th\\u00fac|B\\u1ecf qua|Xem k\\u1ebft qu\\u1ea3)/.test(t))continue;
        if(bs[i].offsetParent===null)continue;
        bs[i].click();return t.slice(0,26);}
      return null;})()`);
    await sleep(650);
  }
  const consecutiveRepeat = types.filter((t, i) => i > 0 && t === types[i - 1]).length;
  report('R3', 'review-hub 2/10/20 phut -> so cau; review-run xoay vong 5 dang bai', {
    hub, typesTrongPhien: types, soLanLapLienTiep: consecutiveRepeat,
    ghiChu: 'UX-FLOWS §4 noi 2/10/20 phut = 4/10/18 cau va khong lap mot dang hai lan lien tiep.',
  });
}

/* ---- U3: man nao la NGO CUT (khong co cach roi man)? --------------------- */
async function U3(cdp, page) {
  const out = [];
  for (const id of IDS) {
    await goto(cdp, page, `${BASE}/index.html#/${id}`, { settle: 150 });
    const r = await evalIn(cdp, page, `(function(){var host=document.querySelector('#screen');
      var tb=document.querySelector('#tabbar');
      var hasTab=getComputedStyle(tb).display!=='none';
      var bs=host.querySelectorAll('button');
      var back=0;for(var i=0;i<bs.length;i++){var t=(bs[i].innerText||'').replace(/\\s+/g,' ').trim();var a=bs[i].getAttribute('aria-label')||'';
        if(/Quay l\\u1ea1i|back/i.test(t+a))back++;}
      var exits=host.querySelectorAll('a[href^="#/"]').length;
      return {tabbar:hasTab, backButtons:back, hashLinks:exits, buttons:bs.length};})()`);
    out.push({ id, ...r });
  }
  const dead = out.filter((r) => !r.tabbar && r.backButtons === 0 && r.hashLinks === 0);
  report('U3', 'Man nao khong co loi ra ro rang (khong tabbar, khong nut quay lai, khong link)?', {
    deadEnds: dead.map((r) => `${r.id} (buttons=${r.buttons})`), bang: out,
  });
}

/* ---- V3: chi dung ban phim de di het luong 1 ----------------------------- */
async function V3(cdp, page) {
  await goto(cdp, page, `${BASE}/index.html#/home`, { settle: 250 });
  await evalIn(cdp, page, "document.activeElement&&document.activeElement.blur&&document.activeElement.blur()");
  let reached = null;
  for (let i = 0; i < 40; i += 1) {
    await typeKey(cdp, page, 'Tab', 'Tab', 9);
    const s = await evalIn(cdp, page, `(function(){var a=document.activeElement;if(!a)return null;
      return {t:(a.innerText||'').replace(/\\s+/g,' ').trim().slice(0,40), inApp:!!a.closest('#screen')};})()`);
    if (s && s.inApp && /Ch\\u1ee5p \\u1ea3nh|Ch\\u1ee5p/.test(s.t)) { reached = { sauNBaoTab: i + 1, nhan: s.t }; break; }
  }
  let afterEnter = null;
  if (reached) {
    await typeKey(cdp, page, 'Enter', 'Enter', 13);
    await sleep(700);
    afterEnter = await evalIn(cdp, page, "({hash:location.hash, title:document.title})");
  } else {
    await typeKey(cdp, page, 'Enter', 'Enter', 13);
    await sleep(600);
    afterEnter = await evalIn(cdp, page, "({hash:location.hash, activeText:(document.activeElement.innerText||'').slice(0,40)})");
  }
  report('V3', 'Chi dung Tab + Enter co vao duoc luong chup anh khong?', { timThayCtaChupAnh: reached, sauEnter: afterEnter });
}

/* ---- W3: README/MASTER noi 88 cap tuong phan — con so that la bao nhieu? -- */
async function W3(cdp, page) {
  // Kiem nhanh bang chinh script cua Lead da chay o ngoai; o day chi ghi lai con so
  // hien thi trong giao dien (neu co) de doi chieu voi docs/README.
  await goto(cdp, page, `${BASE}/index.html#/home`, { settle: 200 });
  const r = await evalIn(cdp, page, `(function(){var s=window.__SNAPLIFE__;
    return {screens:s.screens.length, ids:s.screens.map(function(x){return x.id;}), missing:s.missing, loadErrors:s.errors,
      inspectorText:document.querySelector('#inspector-body').innerText.length};})()`);
  report('W3', 'So man hinh thuc te nap duoc', r);
}

main().catch((e) => { console.error('FATAL: ' + (e && e.stack || e)); process.exit(1); });
