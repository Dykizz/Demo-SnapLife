/* ============================================================================
   qa-cdp4.mjs — Vong 4: sua cac phep thu vong 1-2 lam SAI (cache font, theme,
   sequencing) + do chu de len anh. Owner: qa-verify. Pham vi ghi: tools/qa-*
   Chay: node tools/qa-cdp4.mjs
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
  const { proc, ver } = await launch({ port: 9415 });
  log('Chromium: ' + ver.Browser);
  const cdp = await new CDP(ver.webSocketDebuggerUrl).connect();
  const page = await openPage(cdp, 'about:blank');
  try {
    await H4(cdp, page);
    await T4(cdp, page);
    await O4(cdp, page);
    await M4(cdp, page);
    await BB4(cdp, page);
    await F4(cdp, page);
  } catch (e) {
    log('!! LOI: ' + (e && e.stack || e));
    R.push({ id: 'FATAL', title: 'loi', data: String(e && e.message || e) });
  }
  try { await N4(cdp); } catch (e) { log('!! N4 loi: ' + e.message); }
  try { await R4(cdp); } catch (e) { log('!! R4 loi: ' + e.message); }
  writeFileSync('tools/qa-cdp4-report.json', JSON.stringify(R, null, 2), 'utf8');
  log('');
  log('Da ghi tools/qa-cdp4-report.json');
  cdp.close();
  try { proc.kill(); } catch { /* ignore */ }
}

/* --------- H4: sheet ro ri — bam rail THAT + co che man moi khong? --------- */
async function H4(cdp, page) {
  await goto(cdp, page, `${BASE}/index.html#/reader`, { settle: 350 });
  const opened = await evalIn(cdp, page, `(function(){var t=document.querySelector('#screen .en');if(!t)return null;t.click();return t.innerText.trim();})()`);
  await sleep(500);
  // Chon mot muc rail CO THAT (nhan cua rail = tieu de man hinh, khong phai nhan tab)
  const railBox = await evalIn(cdp, page, `(function(){var items=document.querySelectorAll('#rail-body .rail__item');
    for(var i=0;i<items.length;i++){var t=items[i].innerText.replace(/\\s+/g,' ');
      if(/H\\u1ed3 s\\u01a1 t\\u1ef1 c\\u1eadp nh\\u1eadt/.test(t)){var b=items[i].getBoundingClientRect();
        return {x:Math.round(b.left+b.width/2),y:Math.round(b.top+b.height/2),label:t.trim().slice(0,40)};}}
    return null;})()`);
  let afterRail = null;
  if (railBox) {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: railBox.x, y: railBox.y, button: 'left', clickCount: 1 }, page.sid);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: railBox.x, y: railBox.y, button: 'left', clickCount: 1 }, page.sid);
    await sleep(800);
    afterRail = await evalIn(cdp, page, `(function(){var host=document.querySelector('#screen');
      var scr=host.getBoundingClientRect();
      var probe=[];
      var bs=host.querySelectorAll('button');
      for(var i=0;i<bs.length&&probe.length<4;i++){var b=bs[i].getBoundingClientRect();
        if(b.width<4||b.height<4)continue;
        var hit=document.elementFromPoint(Math.round(b.left+b.width/2),Math.round(b.top+b.height/2));
        probe.push({nut:(bs[i].innerText||bs[i].getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim().slice(0,24),
          biChe: !(hit===bs[i]||bs[i].contains(hit)), phuTrach:hit?((hit.className||'').toString().slice(0,26)||hit.tagName):null});}
      return {hash:location.hash, sheetCon:!!document.querySelector('#overlay .sheet'), scrimCon:!!document.querySelector('#overlay .scrim'),
        overlayChildren:document.querySelector('#overlay').children.length, nutTrongManMoi:probe};})()`);
  }
  report('H4', 'Sheet dang mo + bam rail that: man moi co bi overlay che khong?', {
    moBang: opened, railItem: railBox, sauKhiBamRail: afterRail,
  });
}

/* --------- T4: 1 vung <-> 1 the tu tren trang THAI SACH ------------------- */
async function T4(cdp, page) {
  const p = await openPage(cdp, `${BASE}/index.html#/home`);
  await waitReady(cdp, p);
  await goto(cdp, p, `${BASE}/index.html#/regions`, { settle: 350 });
  const r = await evalIn(cdp, p, `(function(){
    var boxes=Array.prototype.slice.call(document.querySelectorAll('#screen .bbox'));
    var cards=Array.prototype.slice.call(document.querySelectorAll('#screen section.b-wordcard'));
    var boxText=boxes.map(function(b){return (b.innerText||'').replace(/^\\d+\\.\\s*/,'').trim();});
    var cardText=cards.map(function(c){var e=c.querySelector('.b-wordcard__en');return e?e.innerText.trim():null;});
    var removed=(window.__SNAPLIFE__.store.state.capture||{}).removed;
    return {boxes:boxes.length, cards:cards.length, boxText:boxText, cardText:cardText, removed:removed,
      oneToOne: boxes.length===cards.length && boxText.every(function(t,i){return t===cardText[i];}),
      cta:(function(){var bs=document.querySelectorAll('#screen button');for(var i=0;i<bs.length;i++){var t=bs[i].innerText.replace(/\\s+/g,' ').trim();if(/^H\\u1ecdc v\\u1edbi/.test(t))return t;}return null;})()};})()`);
  // bam vao vung thu 2 -> co nhay/highlight the tuong ung khong
  const jump = await evalIn(cdp, p, `(function(){var b=document.querySelectorAll('#screen .bbox')[1];if(!b)return null;
    var key=b.dataset.key;var before=document.querySelector('#screen').scrollTop;b.click();
    return {key:key, scrollTopTruoc:before};})()`);
  await sleep(600);
  const afterJump = await evalIn(cdp, p, `(function(){var host=document.querySelector('#screen');
    var act=document.querySelector('#screen section.b-wordcard.is-active,#screen section.b-wordcard.is-focus,#screen section.b-wordcard.is-selected,#screen section.b-wordcard[aria-current]');
    return {scrollTopSau:host.scrollTop, coTheDuocDanhDau:!!act, clsTheDanhDau:act?act.className:null};})()`);
  report('T4', 'regions TRANG THAI SACH: 1 vung ↔ 1 the tu + bam vung', { bang: r, bamVung: jump, sauKhiBam: afterJump });
}

/* --------- O4: trinh tu chi phi speaking (lam dung thu tu) ---------------- */
async function O4(cdp, page) {
  await goto(cdp, page, `${BASE}/index.html#/home`);
  await evalIn(cdp, page, '__SNAPLIFE__.cost.reset()');
  await goto(cdp, page, `${BASE}/index.html#/speaking`, { settle: 250 });
  const vaoMan = await evalIn(cdp, page, '__SNAPLIFE__.cost.snapshot()');
  const nutManDau = await evalIn(cdp, page, `Array.prototype.map.call(document.querySelectorAll('#screen button'),function(b){return {t:(b.innerText||'').replace(/\\s+/g,' ').trim().slice(0,28),a:b.getAttribute('aria-label')||''};})`);
  // bam mic -> ghi am -> recorded
  await evalIn(cdp, page, `(function(){var b=document.querySelector('#screen .cs-mic');if(b)b.click();})()`);
  await sleep(1400);
  const sauMic = await evalIn(cdp, page, '__SNAPLIFE__.cost.snapshot()');
  // bam "Nho AI chinh lai"
  const b1 = await evalIn(cdp, page, `(function(){var bs=document.querySelectorAll('#screen button');
    for(var i=0;i<bs.length;i++){if(/Nh\\u1edd AI ch\\u1ec9nh l\\u1ea1i/.test(bs[i].innerText||'')){bs[i].click();return bs[i].innerText.trim();}}return null;})()`);
  await sleep(1600);
  const sauChinh1 = await evalIn(cdp, page, '__SNAPLIFE__.cost.snapshot()');
  const nhan2 = await evalIn(cdp, page, `Array.prototype.map.call(document.querySelectorAll('#screen button'),function(b){return (b.innerText||'').replace(/\\s+/g,' ').trim().slice(0,28);}).filter(Boolean)`);
  // bam "Nho AI chinh lan nua"
  const b2 = await evalIn(cdp, page, `(function(){var bs=document.querySelectorAll('#screen button');
    for(var i=0;i<bs.length;i++){if(/ch\\u1ec9nh l\\u1ea7n n\\u1eefa/i.test(bs[i].innerText||'')){bs[i].click();return bs[i].innerText.trim();}}return null;})()`);
  await sleep(1600);
  const sauChinh2 = await evalIn(cdp, page, '__SNAPLIFE__.cost.snapshot()');
  report('O4', 'Cost Meter cua speaking theo dung trinh tu nguoi dung', {
    vaoMan_chuaBamGi: { llm: vaoMan.totals.llm, ledger: vaoMan.ledger.map((l) => l.key || l.label), nut: nutManDau },
    sauKhiBamMic: { llm: sauMic.totals.llm },
    sauChinhLan1: { nut: b1, llm: sauChinh1.totals.llm, ledger: sauChinh1.ledger.map((l) => l.key || l.label) },
    nhanNutSauLan1: nhan2,
    sauChinhLanNua: { nut: b2, llm: sauChinh2.totals.llm, ledger: sauChinh2.ledger.map((l) => l.key || l.label) },
  });
}

/* --------- M4: be ngang trang (khung dien thoai co co dinh khong?) -------- */
async function M4(cdp, page) {
  const out = [];
  for (const w of [320, 375, 390, 768, 1024, 1440]) {
    await setViewport(cdp, page, w, 800, w < 800);
    await goto(cdp, page, `${BASE}/index.html#/home`, { settle: 250 });
    const r = await evalIn(cdp, page, `(function(){var d=document.querySelector('#device');var r=d.getBoundingClientRect();
      return {deviceW:Math.round(r.width), deviceLeft:Math.round(r.left), docScrollW:document.documentElement.scrollWidth,
        docClientW:document.documentElement.clientWidth, tranTrang:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        appScreenW:Math.round(document.querySelector('#screen').getBoundingClientRect().width)};})()`);
    out.push({ viewport: w, ...r });
  }
  await clearViewport(cdp, page);
  report('M4', 'Be ngang that cua khung dien thoai theo viewport (kiem tra "responsive 375→1440")', {
    ghiChu: 'tranTrang > 0 nghia la ca trang bi cuon ngang.',
    rows: out,
  });
}

/* --------- BB4: chu de len ANH — co chip nen hay nam truc tiep? ----------- */
async function BB4(cdp, page) {
  const out = [];
  for (const id of ['capture', 'regions', 'reader', 'compose']) {
    await goto(cdp, page, `${BASE}/index.html#/${id}`, { settle: 300 });
    const r = await evalIn(cdp, page, `(function(){
      var media=document.querySelectorAll('#screen .photo-frame, #screen .viewfinder, #screen .cs-photo, #screen .c-viewfinder');
      if(!media.length)return {khongCoAnh:true};
      var found=[];
      for(var m=0;m<media.length;m++){
        var root=media[m];
        var els=root.querySelectorAll('*');
        for(var i=0;i<els.length;i++){
          var el=els[i];
          if(el.children.length)continue;
          var txt=(el.innerText||'').trim();
          if(!txt)continue;
          var cs=getComputedStyle(el);
          var bg=cs.backgroundColor;
          var alpha=(bg.match(/rgba?\\(([^)]+)\\)/)||[])[1];
          var a=alpha?(alpha.split(',')[3]!==undefined?parseFloat(alpha.split(',')[3]):1):0;
          found.push({cls:(el.className||'').toString().slice(0,26), text:txt.slice(0,26), color:cs.color,
            background:bg, alphaNen:a, backdrop:cs.backdropFilter||'none'});
          if(found.length>8)break;
        }
        if(found.length>8)break;
      }
      return {soKhoiAnh:media.length, chuTrenAnh:found};})()`);
    out.push({ id, ...r });
  }
  report('BB4', 'Chu nam DE LEN ANH: co nen chip mo hay nam truc tiep tren pixel anh?', {
    ghiChu: 'alphaNen=0 nghia la chu nam truc tiep tren anh (khong the bao dam tuong phan); alphaNen>0 la chip co nen.',
    rows: out,
  });
}

/* --------- F4: reset store truoc khi kiem loi khai "0 API khi on tap" ----- */
async function F4(cdp, page) {
  const p = await openPage(cdp, `${BASE}/index.html#/review-hub`);
  await waitReady(cdp, p);
  await sleep(400);
  const steps = [];
  steps.push({ buoc: 'vao review-hub', snap: await evalIn(cdp, p, '__SNAPLIFE__.cost.snapshot()') });
  await evalIn(cdp, p, '__SNAPLIFE__.cost.reset()');
  steps.push({ buoc: 'reset', snap: await evalIn(cdp, p, '__SNAPLIFE__.cost.snapshot()') });
  // chon 20 phut + bat dau
  await evalIn(cdp, p, `(function(){var bs=document.querySelectorAll('#screen button');
    for(var i=0;i<bs.length;i++){if(bs[i].innerText.replace(/\\s+/g,' ').trim()==='20 ph\\u00fat'){bs[i].click();return;}}})()`);
  await sleep(300);
  await evalIn(cdp, p, `(function(){var bs=document.querySelectorAll('#screen button');
    for(var i=0;i<bs.length;i++){if(/^B\\u1eaft \\u0111\\u1ea7u/.test(bs[i].innerText.trim())){bs[i].click();return;}}})()`);
  await waitReady(cdp, p); await sleep(600);
  steps.push({ buoc: 'vao review-run', snap: await evalIn(cdp, p, '__SNAPLIFE__.cost.snapshot()') });
  // tra loi 3 cau
  const answered = [];
  for (let i = 0; i < 3; i += 1) {
    const t = await evalIn(cdp, p, `(function(){var bs=document.querySelectorAll('#screen button');
      for(var i=0;i<bs.length;i++){var x=(bs[i].innerText||'').replace(/\\s+/g,' ').trim();
        if(!x)continue;
        if(/^(Ti\\u1ebfp|C\\u00e2u ti\\u1ebfp|Quay l\\u1ea1i|K\\u1ebft th\\u00fac|B\\u1ecf qua|Xem k\\u1ebft qu\\u1ea3|\\u0110\\u1ecdc|Gh\\u00e9p)/.test(x))continue;
        if(bs[i].offsetParent===null)continue;
        bs[i].click();return x.slice(0,28);}
      return null;})()`);
    answered.push(t);
    await sleep(700);
  }
  steps.push({ buoc: 'sau khi tra loi 3 cau', snap: await evalIn(cdp, p, '__SNAPLIFE__.cost.snapshot()') });
  report('F4', 'Trang thai sach: chon 20 phut -> tra loi 3 cau -> API call co tang khong?', {
    cauDaBam: answered,
    tienDo: steps.map((s) => ({ buoc: s.buoc, apiCalls: s.snap.apiCalls, vlm: s.snap.totals.vlm, llm: s.snap.totals.llm, rule: s.snap.totals.rule })),
  });
}

/* --------- N4: web font khi mat mang — do be rong CHU that (Range) -------- */
async function N4(cdp) {
  const fresh = await launch({ port: 9416 });
  const cdp2 = await new CDP(fresh.ver.webSocketDebuggerUrl).connect();
  const measure = `(function(){
    function intrinsic(el){if(!el)return null;var r=document.createRange();r.selectNodeContents(el);var b=r.getBoundingClientRect();
      return Math.round(b.width*10)/10;}
    var h=document.querySelector('#screen h1')||document.querySelector('#screen .h1')||document.querySelector('#screen .h2');
    var lab=document.querySelector('#screen .label');
    var faces=[];document.fonts.forEach(function(f){faces.push(f.family+':'+f.status);});
    return {fontsSize:document.fonts.size, faces:faces,
      titleText:h?h.innerText.slice(0,30):null, titleIntrinsicW:intrinsic(h),
      titleFamily:h?getComputedStyle(h).fontFamily.split(',')[0]:null, labelIntrinsicW:intrinsic(lab),
      ready:document.documentElement.dataset.ready, boot:document.documentElement.getAttribute('data-boot-errors'),
      docH:document.documentElement.scrollHeight};})()`;
  // (a) co mang, cache tat
  const pa = await openPage(cdp2, 'about:blank');
  await cdp2.send('Network.setCacheDisabled', { cacheDisabled: true }, pa.sid);
  await goto(cdp2, pa, `${BASE}/index.html#/home`, { settle: 600 });
  await sleep(2000);
  const withNet = await evalIn(cdp2, pa, measure);
  // (b) chan CDN font, cache tat
  const pb = await openPage(cdp2, 'about:blank');
  await cdp2.send('Network.setCacheDisabled', { cacheDisabled: true }, pb.sid);
  await cdp2.send('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] }, pb.sid);
  await goto(cdp2, pb, `${BASE}/index.html#/home`, { settle: 600 });
  await sleep(2000);
  const noNet = await evalIn(cdp2, pb, measure);
  const reqs = await evalIn(cdp2, pb, `performance.getEntriesByType('resource').filter(function(r){return /fonts\\.(googleapis|gstatic)/.test(r.name);}).map(function(r){return {u:r.name.slice(0,72), transferSize:r.transferSize, duration:Math.round(r.duration), failed:r.transferSize===0};})`);
  report('N4', 'Mat mang: web font co tai duoc khong, va do rong CHU that thay doi bao nhieu?', {
    coMang: withNet, chanCdn: noNet,
    chenhLechBeRongChuTieuDe: (withNet.titleIntrinsicW !== null && noNet.titleIntrinsicW !== null) ? Math.round((noNet.titleIntrinsicW - withNet.titleIntrinsicW) * 10) / 10 : null,
    chenhLechChieuCaoTrang: noNet.docH - withNet.docH,
    requestBiChan: reqs,
  });
  cdp2.close();
  try { fresh.proc.kill(); } catch { /* ignore */ }
}

/* --------- R4: theme toi bang RELOAD THAT (khong doi attribute) ----------- */
async function R4(cdp) {
  const p = await openPage(cdp, 'about:blank');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, p.sid);
  await goto(cdp, p, `${BASE}/index.html#/home`, { settle: 400 });
  await evalIn(cdp, p, "localStorage.setItem('snaplife.theme','dark')");
  await cdp.send('Page.reload', { ignoreCache: false }, p.sid);
  await sleep(400);
  await waitReady(cdp, p);
  await sleep(600);
  const rows = [];
  for (const id of IDS) {
    await goto(cdp, p, `${BASE}/index.html#/${id}`, { settle: 140 });
    const r = await evalIn(cdp, p, `(function(){
      function lum(c){var m=String(c).match(/[\\d.]+/g);if(!m||m.length<3)return null;
        var a=m.slice(0,3).map(function(v){v=+v/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
        return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2];}
      function ratio(f,b){var l1=lum(f),l2=lum(b);if(l1===null||l2===null)return null;
        var hi=Math.max(l1,l2),lo=Math.min(l1,l2);return Math.round(((hi+0.05)/(lo+0.05))*100)/100;}
      var root=getComputedStyle(document.documentElement);
      var host=document.querySelector('#screen');
      var app=document.querySelector('#app');
      var bgApp=getComputedStyle(app).backgroundColor;
      var samples=[];
      var els=host.querySelectorAll('.label,.muted,.muted-2,.h1,.h2,.h3,.read,.b-wordcard__vi,.wordrow__vi,.a-splash__team');
      for(var i=0;i<els.length&&samples.length<4;i++){var e=els[i];var cs=getComputedStyle(e);
        var own=cs.backgroundColor;var a=(String(own).match(/rgba?\\(([^)]+)\\)/)||[])[1];
        var alpha=a?(a.split(',')[3]!==undefined?parseFloat(a.split(',')[3]):1):0;
        samples.push({cls:(e.className||'').toString().slice(0,22), color:cs.color, fontSize:cs.fontSize,
          nenRieng: alpha>0.5?own:null, nenDungDeTinh: alpha>0.5?own:bgApp,
          contrast: ratio(cs.color, alpha>0.5?own:bgApp)});}
      return {theme:document.documentElement.dataset.theme, paperToken:root.getPropertyValue('--paper').trim(),
        inkToken:root.getPropertyValue('--ink').trim(), bodyBg:getComputedStyle(document.body).backgroundColor, appBg:bgApp,
        ready:document.documentElement.dataset.ready, boot:document.documentElement.getAttribute('data-boot-errors'),
        overflowX:host.scrollWidth-host.clientWidth, samples:samples};})()`);
    rows.push({ id, ...r });
  }
  const dangSai = rows.filter((r) => r.theme !== 'dark' || r.paperToken.toLowerCase() !== '#16120e');
  report('R4', 'Theme toi: RELOAD that voi localStorage dark, ca 20 man', {
    soManSaiTheme: dangSai.map((r) => `${r.id}(theme=${r.theme},paper=${r.paperToken})`),
    coLoiBoot: rows.filter((r) => r.boot).map((r) => r.id),
    tranNgang: rows.filter((r) => r.overflowX > 1).map((r) => r.id),
    mauMau: rows.slice(0, 5).map((r) => ({ id: r.id, theme: r.theme, paper: r.paperToken, ink: r.inkToken, bodyBg: r.bodyBg, appBg: r.appBg, samples: r.samples })),
    tatCaCacMan: rows.map((r) => ({ id: r.id, theme: r.theme, paper: r.paperToken })),
  });
  await cdp.send('Emulation.clearDeviceMetricsOverride', {}, p.sid);
}

main().catch((e) => { console.error('FATAL: ' + (e && e.stack || e)); process.exit(1); });
