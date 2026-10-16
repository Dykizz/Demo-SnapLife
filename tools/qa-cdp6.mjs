/* ============================================================================
   qa-cdp6.mjs — Kiem tra 1 cau hoi duy nhat: o be ngang desktop (rail hien),
   nguoi trinh dien bam vao rail khi sheet dang mo thi sheet co di theo khong?
   Owner: qa-verify. Pham vi ghi: tools/qa-*
   ========================================================================== */

import { launch, CDP, openPage, evalIn, goto, waitReady, setViewport, sleep, BASE } from './qa-cdp-lib.mjs';
import { writeFileSync } from 'node:fs';

const OUT = [];
const log = (...a) => console.log(...a);

async function main() {
  const { proc, ver } = await launch({ port: 9418 });
  const cdp = await new CDP(ver.webSocketDebuggerUrl).connect();
  const p = await openPage(cdp, 'about:blank');
  await setViewport(cdp, p, 1440, 900, false);
  await goto(cdp, p, `${BASE}/index.html#/reader`, { settle: 600 });
  const railVisible = await evalIn(cdp, p, `(function(){var r=document.querySelector('#rail');var cs=getComputedStyle(r);
    return {display:cs.display, w:Math.round(r.getBoundingClientRect().width), items:document.querySelectorAll('#rail-body .rail__item').length};})()`);
  const opened = await evalIn(cdp, p, `(function(){var t=document.querySelector('#screen .en');if(!t)return null;t.click();return t.innerText.trim();})()`);
  await sleep(500);
  const st1 = await evalIn(cdp, p, `(function(){return {hash:location.hash, sheet:!!document.querySelector('#overlay .sheet'), scrim:!!document.querySelector('#overlay .scrim')};})()`);
  const target = await evalIn(cdp, p, `(function(){var items=document.querySelectorAll('#rail-body .rail__item');
    for(var i=0;i<items.length;i++){var t=items[i].innerText.replace(/\\s+/g,' ');
      if(/H\\u00f4m nay/.test(t)){items[i].scrollIntoView({block:'center'});var b=items[i].getBoundingClientRect();
        return {x:Math.round(b.left+b.width/2),y:Math.round(b.top+b.height/2),label:t.trim().slice(0,40)};}}
    return null;})()`);
  let after = null;
  if (target) {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: target.x, y: target.y }, p.sid);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 1 }, p.sid);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1 }, p.sid);
    await sleep(900);
    after = await evalIn(cdp, p, `(function(){var host=document.querySelector('#screen');
      var bs=host.querySelectorAll('button, a[href], input');var hit=[];var topmost=0;
      for(var i=0;i<bs.length&&hit.length<5;i++){var b=bs[i].getBoundingClientRect();
        if(b.width<4||b.height<4)continue;
        var h=document.elementFromPoint(Math.round(b.left+b.width/2),Math.round(b.top+b.height/2));
        var covered=!(h===bs[i]||bs[i].contains(h));
        if(covered)topmost++;
        hit.push({nut:(bs[i].innerText||bs[i].getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim().slice(0,22),
          biChe:covered, phuTrach:h?((h.className||'').toString().slice(0,24)||h.tagName):null});}
      return {hash:location.hash, sheetCon:!!document.querySelector('#overlay .sheet'),
        scrimCon:!!document.querySelector('#overlay .scrim'), overlayChildren:document.querySelector('#overlay').children.length,
        soNutBiChe:topmost, chiTiet:hit};})()`);
  }
  OUT.push({ rail: railVisible, moBang: opened, truocKhiBamRail: st1, mucRail: target, sauKhiBamRail: after });
  log(JSON.stringify(OUT, null, 1));
  writeFileSync('tools/qa-cdp6-report.json', JSON.stringify(OUT, null, 2), 'utf8');
  cdp.close();
  try { proc.kill(); } catch { /* ignore */ }
}

main().catch((e) => { console.error('FATAL: ' + (e && e.stack || e)); process.exit(1); });
