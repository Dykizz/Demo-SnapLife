import fs from 'node:fs';

const widths = (process.argv[2] || '375,768,1024,1280,1500').split(',').map(Number);
const prefix = process.argv[3] || 'tools/_dk-';
const mine = ['diary', 'progress', 'profile', 'compare', 'system-states'];
const dec = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&amp;/g, '&');

const rows = [];
const summaries = [];

for (const w of widths) {
  const html = fs.readFileSync(`${prefix}${w}.html`, 'utf8');
  summaries.push({ w, summary: (html.match(/data-audit-summary="([^"]*)"/) || [])[1] || '(không có)' });
  const m = html.match(/<pre id="report-json"[^>]*>([\s\S]*?)<\/pre>/);
  if (!m) continue;
  const data = JSON.parse(dec(m[1]));
  for (const id of mine) {
    const s = data.perScreen.find((x) => x.id === id);
    if (!s) continue;
    const r = s.rsv || {};
    const warns = data.issues.filter((i) => i.screen === id).length;
    rows.push({
      w, id,
      content: r.contentWidth, body: r.bodyCols, max: r.maxCols,
      widestCh: r.widestCh, issues: s.issues + warns,
    });
  }
  // ghi lại các vi phạm của màn KHÁC để biết ai còn nợ
  const others = data.issues.filter((i) => !mine.includes(i.screen));
  if (others.length) {
    globalThis.__others = globalThis.__others || {};
    others.forEach((i) => {
      const k = `${i.screen} · ${i.kind}`;
      globalThis.__others[k] = (globalThis.__others[k] || 0) + 1;
    });
  }
}

console.log('bề rộng  màn hình        nội-dung  body  max  ký-tự/dòng  audit');
for (const r of rows) {
  const flag = r.issues === 0 ? 'sạch' : `${r.issues} vi phạm`;
  console.log(
    `${String(r.w).padStart(5)}   ${r.id.padEnd(15)} ${String(r.content + 'px').padStart(8)} ` +
    `${String(r.body).padStart(4)} ${String(r.max).padStart(4)} ${String(r.widestCh).padStart(9)}   ${flag}`
  );
}
console.log('');
console.log('data-audit-summary:');
summaries.forEach((s) => console.log(`${String(s.w).padStart(5)} : ${s.summary}`));
if (globalThis.__others) {
  console.log('');
  console.log('cảnh báo còn lại thuộc nhóm khác:', JSON.stringify(globalThis.__others));
}
