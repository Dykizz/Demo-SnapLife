/* qa-cdp8.mjs — Mo sheet co lam TRANG TU CUON khong (khung dien thoai cao hon viewport)?
   Owner: qa-verify. Pham vi ghi: tools/qa-*
*/
import { launch, CDP, openPage, evalIn, goto, setViewport, sleep, BASE } from './qa-cdp-lib.mjs';
import { writeFileSync } from 'node:fs';

async function main() {
  const { proc, ver } = await launch({ port: 9420 });
  const cdp = await new CDP(ver.webSocketDebuggerUrl).connect();
  const p = await openPage(cdp, 'about:blank');
  const out = [];
  for (const [w, h] of [[1440, 900], [1440, 720], [1280, 800], [390, 844]]) {
    await setViewport(cdp, p, w, h, w < 800);
    await goto(cdp, p, `${BASE}/index.html#/reader`, { settle: 500 });
    const before = await evalIn(cdp, p, `(function(){var d=document.querySelector('.device').getBoundingClientRect();
      return {scrollY:Math.round(window.scrollY), docH:document.documentElement.scrollHeight, viewH:innerHeight,
        deviceTop:Math.round(d.top), deviceBottom:Math.round(d.bottom), deviceFits:d.height<=innerHeight};})()`);
    await evalIn(cdp, p, `(function(){var t=document.querySelector('#screen .en');if(t)t.click();})()`);
    await sleep(600);
    const after = await evalIn(cdp, p, `(function(){var d=document.querySelector('.device').getBoundingClientRect();
      return {scrollY:Math.round(window.scrollY), deviceTop:Math.round(d.top), deviceBottom:Math.round(d.bottom),
        sheetOpen:!!document.querySelector('.sheet'), cardSheetTop:Math.round(document.querySelector('.sheet').getBoundingClientRect().top)};})()`);
    out.push({ viewport: [w, h], truoc: before, sau: after, biNhay: after.scrollY !== before.scrollY });
  }
  console.log(JSON.stringify(out, null, 1));
  writeFileSync('tools/qa-cdp8-report.json', JSON.stringify(out, null, 2), 'utf8');
  cdp.close();
  try { proc.kill(); } catch { /* ignore */ }
}
main().catch((e) => { console.error('FATAL: ' + (e && e.stack || e)); process.exit(1); });
