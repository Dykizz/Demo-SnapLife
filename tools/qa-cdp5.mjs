/* ============================================================================
   qa-cdp5.mjs — Vong 5: ngõ cụt, ban phim, tran ngang theo be ngang THAT,
   chu trang tren anh bia (chup anh + do diem), va bbox onTap.
   Owner: qa-verify. Pham vi ghi: tools/qa-*
   Chay: node tools/qa-cdp5.mjs
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
  const { proc, ver } = await launch({ port: 9417 });
  log('Chromium: ' + ver.Browser);
  const cdp = await new CDP(ver.webSocketDebuggerUrl).connect();
  const page = await openPage(cdp, 'about:blank');
  try {
    await U5(cdp);
    await V5(cdp);
    await Y5(cdp, page);
    await N5(cdp);
    await X5(cdp);
  } catch (e) {
    log('!! LOI: ' + (e && e.stack || e));
    R.push({ id: 'FATAL', title: 'loi', data: String(e && e.message || e) });
  }
  writeFileSync('tools/qa-cdp5-report.json', JSON.stringify(R, null, 2), 'utf8');
  log('');
  log('Da ghi tools/qa-cdp5-report.json');
  cdp.close();
  try { proc.kill(); } catch { /* ignore */ }
}

/* --------- U5: bam TUNG nut tren man khong co tabbar --------------------- */
async function U5(cdp) {
  const out = [];
  for (const id of ['splash', 'onboarding', 'capture']) {
    const p = await openPage(cdp, `${BASE}/index.html#/${id}`);
    await waitReady(cdp, p); await sleep(400);
    const btns = await evalIn(cdp, p, `Array.prototype.map.call(document.querySelectorAll('#screen button'),function(b){return {t:(b.innerText||'').replace(/\\s+/g,' ').trim().slice(0,30), a:b.getAttribute('aria-label')||''};})`);
    const rows = [];
    for (let i = 0; i < btns.length; i += 1) {
      const p2 = await openPage(cdp, `${BASE}/index.html#/${id}`);
      await waitReady(cdp, p2); await sleep(350);
      const before = await evalIn(cdp, p2, 'location.hash');
      await evalIn(cdp, p2, `(function(){var b=document.querySelectorAll('#screen button')[${i}];if(b)b.click();})()`);
      await sleep(2600);
      const after = await evalIn(cdp, p2, 'location.hash');
      rows.push({ i, nhan: btns[i].t || btns[i].a, hashTruoc: before, hashSau: after, coThoat: before !== after });
      await cdp.send('Target.closeTarget', { targetId: p2.targetId });
    }
    const coLoiRa = rows.some((r) => r.coThoat);
    out.push({ man: id, soNut: btns.length, coLoiRa, chiTiet: rows });
    await cdp.send('Target.closeTarget', { targetId: p.targetId });
  }
  report('U5', 'Man khong co tabbar: bam tung nut xem co loi ra khong', out);
}

/* --------- V5: Tab + Enter tren trang sach co vao duoc luong chup? ------- */
async function V5(cdp) {
  const p = await openPage(cdp, `${BASE}/index.html#/home`);
  await waitReady(cdp, p); await sleep(400);
  await evalIn(cdp, p, "if(document.activeElement)document.activeElement.blur()");
  let found = null;
  const order = [];
  for (let i = 0; i < 30; i += 1) {
    await typeKey(cdp, p, 'Tab', 'Tab', 9);
    const s = await evalIn(cdp, p, `(function(){var a=document.activeElement;if(!a)return null;
      return {tag:a.tagName, t:(a.innerText||'').replace(/\\s+/g,' ').trim().slice(0,34), inApp:!!a.closest('#screen'), label:a.getAttribute('aria-label')||''};})()`);
    if (!s) break;
    order.push(s.tag + (s.inApp ? '[app]' : '[shell]') + ':' + (s.label || s.t).slice(0, 22));
    if (s.inApp && /Ch\u1ee5p/.test(s.t + s.label)) { found = { sauNBaoTab: i + 1, ...s }; break; }
  }
  let afterEnter = null;
  if (found) {
    await typeKey(cdp, p, 'Enter', 'Enter', 13);
    await sleep(900);
    afterEnter = await evalIn(cdp, p, '({hash:location.hash, ready:document.documentElement.dataset.ready})');
  }
  report('V5', 'Chi Tab + Enter: co kich hoat duoc the "Chụp ảnh" tren trang chu?', {
    timThay: found, thuTuTab: order.slice(0, 12), sauEnter: afterEnter,
  });
  await cdp.send('Target.closeTarget', { targetId: p.targetId });
}

/* --------- Y5: bam vao vung khoanh co nhay toi the tu khong? ------------- */
async function Y5(cdp, page) {
  const p = await openPage(cdp, `${BASE}/index.html#/home`);
  await waitReady(cdp, p);
  await goto(cdp, p, `${BASE}/index.html#/regions`, { settle: 400 });
  const before = await evalIn(cdp, p, `(function(){var c=document.querySelectorAll('#screen section.b-wordcard')[1];
    var r=c?c.getBoundingClientRect():null;var host=document.querySelector('#screen');
    return {scrollTop:host.scrollTop, cardTop:r?Math.round(r.top):null, focused:document.querySelectorAll('#screen .bbox.is-focused').length};})()`);
  await evalIn(cdp, p, `(function(){var b=document.querySelectorAll('#screen .bbox')[1];if(b)b.click();})()`);
  await sleep(900);
  const after = await evalIn(cdp, p, `(function(){var c=document.querySelectorAll('#screen section.b-wordcard')[1];
    var r=c?c.getBoundingClientRect():null;var host=document.querySelector('#screen');
    var f=document.querySelector('#screen .bbox.is-focused');
    return {scrollTop:host.scrollTop, cardTop:r?Math.round(r.top):null,
      bboxDuocDanhDau:f?f.dataset.key:null, soTheCoClassFocus:document.querySelectorAll('#screen section.b-wordcard.is-focused, #screen section.b-wordcard.is-active').length};})()`);
  report('Y5', 'regions: bam vao vung khoanh co nhay toi the tu (.is-focused / scroll)?', { truoc: before, sau: after });
  await cdp.send('Target.closeTarget', { targetId: p.targetId });
}

/* --------- N5: tran ngang cua #screen theo be ngang that ----------------- */
async function N5(cdp) {
  const p = await openPage(cdp, 'about:blank');
  const out = [];
  for (const w of [320, 375, 390, 768, 1024, 1440]) {
    await setViewport(cdp, p, w, 800, w < 800);
    const rows = [];
    for (const id of IDS) {
      await goto(cdp, p, `${BASE}/index.html#/${id}`, { settle: 100 });
      const r = await evalIn(cdp, p, `(function(){var h=document.querySelector('#screen');
        var sc=${'`'}"(function(){var list=[document.querySelector('#screen')].concat(Array.prototype.slice.call(document.querySelectorAll('#screen *')));for(var i=0;i<list.length;i++){var el=list[i];if(el&&el.scrollHeight-el.clientHeight>4)return el;}return document.querySelector('#screen');})()"${'`'};
        return {appW:Math.round(h.getBoundingClientRect().width), ovf:h.scrollWidth-h.clientWidth,
          docOvf:document.documentElement.scrollWidth-document.documentElement.clientWidth, scrollW:sc?sc.scrollWidth:0, clientW:sc?sc.clientWidth:0};})()`);
      rows.push({ id, ...r });
    }
    out.push({ viewport: w, appWidth: rows[0].appW,
      manTranNgang: rows.filter((r) => r.ovf > 1 || r.docOvf > 1).map((r) => r.id + '(screen=' + r.ovf + ',doc=' + r.docOvf + ')') });
  }
  await clearViewport(cdp, p);
  report('N5', 'Tran ngang cua vung app o 320/375/390/768/1024/1440 (20 man/lan)', out);
  await cdp.send('Target.closeTarget', { targetId: p.targetId });
}

/* --------- X5: chup anh bia reader de do tuong phan chu trang ------------ */
async function X5(cdp) {
  const p = await openPage(cdp, 'about:blank');
  await setViewport(cdp, p, 520, 920, false);
  const shots = [];
  for (const [hash, tag] of [['#/reader?story=today', 'today'], ['#/reader?story=ceramic-cup', 'ceramic-cup']]) {
    await goto(cdp, p, BASE + '/index.html' + hash, { settle: 500 });
    await sleep(900);
    const info = await evalIn(cdp, p, `(function(){var out=[];
      ['.cs-cover__kicker','.cs-cover__caption','.cs-cover__title','.cs-cover'].forEach(function(sel){
        var e=document.querySelector('#screen '+sel);if(!e)return;var r=e.getBoundingClientRect();var cs=getComputedStyle(e);
        out.push({sel:sel, text:(e.innerText||'').replace(/\\s+/g,' ').slice(0,44), color:cs.color, bg:cs.backgroundColor,
          fontSize:cs.fontSize, fontWeight:cs.fontWeight,
          x:Math.round(r.left), y:Math.round(r.top), w:Math.round(r.width), h:Math.round(r.height)});});
      var img=document.querySelector('#screen .cs-cover img, #screen .photo-frame img');
      return {elements:out, anh:img?img.getAttribute('src'):null, dpr:window.devicePixelRatio};})()`);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' }, p.sid);
    const file = `tools/qa-reader-cover-${tag}.png`;
    writeFileSync(file, Buffer.from(shot.data, 'base64'));
    shots.push({ hash, tag, file, ...info });
  }
  report('X5', 'Anh bia reader: chu trang nam truc tiep tren anh (de do diem)', { shots });
  await cdp.send('Target.closeTarget', { targetId: p.targetId });
}

main().catch((e) => { console.error('FATAL: ' + (e && e.stack || e)); process.exit(1); });
