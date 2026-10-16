/* ============================================================================
   qa-cdp7.mjs — #overlay / .scrim co bi cắt theo khung điện thoại không?
   Owner: qa-verify. Phạm vi ghi: tools/qa-*
   Câu hỏi: ở bề ngang desktop, một lớp .scrim inset:0 có tràn ra ngoài khung
   điện thoại và nuốt cú bấm vào rail (cột chọn màn hình) không?
   ========================================================================== */

import { launch, CDP, openPage, evalIn, goto, setViewport, sleep, BASE } from './qa-cdp-lib.mjs';
import { writeFileSync } from 'node:fs';

async function main() {
  const { proc, ver } = await launch({ port: 9419 });
  const cdp = await new CDP(ver.webSocketDebuggerUrl).connect();
  const p = await openPage(cdp, 'about:blank');
  const out = [];
  for (const [w, h] of [[1440, 900], [1024, 800], [390, 844]]) {
    await setViewport(cdp, p, w, h, w < 800);
    await goto(cdp, p, `${BASE}/index.html#/reader`, { settle: 500 });
    const before = await evalIn(cdp, p, `(function(){
      function R(sel){var e=document.querySelector(sel);if(!e)return null;var r=e.getBoundingClientRect();
        return {sel:sel, l:Math.round(r.left), t:Math.round(r.top), w:Math.round(r.width), h:Math.round(r.height),
          ov:getComputedStyle(e).overflow, pos:getComputedStyle(e).position};}
      return {viewport:[innerWidth,innerHeight], device:R('.device'), app:R('#app'), overlay:R('#overlay'), screen:R('#screen')};})()`);
    await evalIn(cdp, p, `(function(){var t=document.querySelector('#screen .en');if(t)t.click();})()`);
    await sleep(450);
    const withSheet = await evalIn(cdp, p, `(function(){
      function R(sel){var e=document.querySelector(sel);if(!e)return null;var r=e.getBoundingClientRect();
        return {sel:sel, l:Math.round(r.left), t:Math.round(r.top), w:Math.round(r.width), h:Math.round(r.height),
          ov:getComputedStyle(e).overflow, pos:getComputedStyle(e).position};}
      var scr=document.querySelector('.scrim');
      var app=document.querySelector('#app').getBoundingClientRect();
      var s=scr?scr.getBoundingClientRect():null;
      var railProbe=null;
      var item=document.querySelector('#rail-body .rail__item');
      if(item){item.scrollIntoView({block:'center'});var b=item.getBoundingClientRect();
        var x=Math.round(b.left+b.width/2),y=Math.round(b.top+b.height/2);
        var hit=document.elementFromPoint(x,y);
        railProbe={muc:item.innerText.replace(/\\s+/g,' ').trim().slice(0,24), x:x, y:y,
          topElement:hit?((hit.className||'').toString().slice(0,30)||hit.tagName):null,
          biScrimNuot: !!(hit&&hit.classList&&hit.classList.contains('scrim'))};}
      var overlay=document.querySelector('#overlay').getBoundingClientRect();
      var scrimOverflow=null;
      if(s){scrimOverflow={traiPhai:(s.right>app.right+1)||(s.left<app.left-1), trenDuoi:(s.bottom>app.bottom+1)||(s.top<app.top-1),
        lechTrai:Math.round(app.left-s.left), lechPhai:Math.round(s.right-app.right),
        overlayLechTrai:Math.round(app.left-overlay.left), overlayLechPhai:Math.round(overlay.right-app.right)};}
      return {app:R('#app'), overlay:R('#overlay'), scrim: s?{l:Math.round(s.left),t:Math.round(s.top),w:Math.round(s.width),h:Math.round(s.height)}:null,
        scrimTranRaNgoaiApp:scrimOverflow, railProbe:railProbe};})()`);
    out.push({ viewport: [w, h], truocKhiMoSheet: before, sauKhiMoSheet: withSheet });
  }
  console.log(JSON.stringify(out, null, 1));
  writeFileSync('tools/qa-cdp7-report.json', JSON.stringify(out, null, 2), 'utf8');
  cdp.close();
  try { proc.kill(); } catch { /* ignore */ }
}

main().catch((e) => { console.error('FATAL: ' + (e && e.stack || e)); process.exit(1); });
