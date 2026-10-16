import fs from 'node:fs';

const file = process.argv[2] || 'tools/_e-1440.html';
const html = fs.readFileSync(file, 'utf8');
const m = html.match(/<pre id="report-json"[^>]*>([\s\S]*?)<\/pre>/);
if (!m) { console.log('không có report-json'); process.exit(0); }
const dec = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const data = JSON.parse(dec(m[1]));
const mine = ['diary', 'progress', 'profile', 'compare', 'system-states'];

const byKind = {};
const byScreen = {};
data.issues.forEach((i) => {
  byKind[i.kind] = (byKind[i.kind] || 0) + 1;
  byScreen[i.screen] = (byScreen[i.screen] || 0) + 1;
});
console.log(`tổng issues: ${data.issues.length}`);
console.log('theo loại :', JSON.stringify(byKind));
console.log('theo màn  :', JSON.stringify(byScreen));
console.log('');
console.log('--- nhóm E: bề rộng nội dung + số cột ---');
data.perScreen.filter((s) => mine.includes(s.id)).forEach((s) => {
  const r = s.rsv || {};
  console.log(`${s.id.padEnd(15)} content=${String(r.contentWidth).padStart(5)}px  widestText=${String(r.widestText).padStart(5)}px  maxCols=${r.maxCols}  issues=${s.issues}`);
});
console.log('');
console.log('--- issue của nhóm E (nếu có) ---');
const mi = data.issues.filter((i) => mine.includes(i.screen));
if (!mi.length) console.log('(không có)');
mi.forEach((i) => console.log(`[${i.severity}·${i.theme || 'all'}] ${i.screen} · ${i.kind} · ${i.where}\n    ${i.detail}`));
console.log('');
console.log('--- issue của màn khác (ai còn nợ) ---');
data.issues.filter((i) => !mine.includes(i.screen)).slice(0, 8)
  .forEach((i) => console.log(`[${i.severity}] ${i.screen} · ${i.kind} · ${i.where} · ${String(i.detail).slice(0, 90)}`));
