/* qa-buttons.mjs — Dem nut CHI CO ICON ma thieu aria-label tren 20 man.
   Owner: qa-verify. Pham vi ghi: tools/qa-*
   Dung de kiem chung khang dinh trong docs/QA-REPORT.md §4.4. */
import { launch, CDP, openPage, evalIn, goto, sleep, BASE, IDS } from './qa-cdp-lib.mjs';
import { writeFileSync } from 'node:fs';

async function main() {
  const { proc, ver } = await launch({ port: 9422 });
  const cdp = await new CDP(ver.webSocketDebuggerUrl).connect();
  const p = await openPage(cdp, 'about:blank');
  const rows = [];
  for (const id of IDS) {
    await goto(cdp, p, `${BASE}/index.html#/${id}`, { settle: 110 });
    const r = await evalIn(cdp, p, `(function(){var host=document.querySelector('#screen');
      var all=host.querySelectorAll('button');var noName=[];
      for(var i=0;i<all.length;i++){var b=all[i];
        var hasText=(b.innerText||'').trim().length>0;
        var hasLabel=(b.getAttribute('aria-label')||'').trim().length>0;
        var hasTitle=(b.getAttribute('title')||'').trim().length>0;
        if(!hasText&&!hasLabel&&!hasTitle)noName.push((b.className||'').toString().slice(0,30));}
      return {buttons:all.length, noName:noName};})()`);
    rows.push({ id, ...r });
  }
  const total = rows.reduce((a, r) => a + r.buttons, 0);
  const bad = rows.filter((r) => r.noName.length);
  console.log(JSON.stringify({ tongNut: total, soManCoNutThieuTen: bad.length, chiTiet: bad, bang: rows }, null, 1));
  writeFileSync('tools/qa-buttons-report.json', JSON.stringify({ tongNut: total, soManCoNutThieuTen: bad.length, chiTiet: bad, bang: rows }, null, 2), 'utf8');
  cdp.close();
  try { proc.kill(); } catch { /* ignore */ }
}
main().catch((e) => { console.error('FATAL: ' + (e && e.stack || e)); process.exit(1); });
