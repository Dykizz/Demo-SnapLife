/* qa-audio.mjs — Doi chieu TTS: headless Chromium co giong doc khong?
   Owner: qa-verify. Pham vi ghi: tools/qa-*
   Muc dich: phan "3 rui ro khi trinh dien" can so THAT, khong doan. */
import { launch, CDP, openPage, evalIn, goto, setViewport, sleep, BASE } from './qa-cdp-lib.mjs';
import { writeFileSync } from 'node:fs';

async function main() {
  const { proc, ver } = await launch({ port: 9421 });
  const cdp = await new CDP(ver.webSocketDebuggerUrl).connect();
  const p = await openPage(cdp, 'about:blank');
  await setViewport(cdp, p, 390, 844, true);
  await goto(cdp, p, `${BASE}/index.html#/reader`, { settle: 600 });
  const r = await evalIn(cdp, p, `(function(){
    var s=window.speechSynthesis;
    var info={coSpeechSynthesis:!!s, soGiong:s?s.getVoices().length:0,
      giong:s?s.getVoices().slice(0,6).map(function(v){return v.name+'/'+v.lang;}):[],
      audioCtx:typeof AudioContext, mediaDevices:!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia),
      userAgent:navigator.userAgent};
    return info;})()`);
  // bam nut audio xem co loi gi khong
  const clicked = await evalIn(cdp, p, `(function(){var b=document.querySelector('#screen .audio-btn');if(!b)return null;
    b.click();return {nhan:b.getAttribute('aria-label')||b.innerText.trim().slice(0,30)};})()`);
  await sleep(1200);
  const after = await evalIn(cdp, p, `(function(){var b=document.querySelector('#screen .audio-btn');
    return {boot:document.documentElement.getAttribute('data-boot-errors'), trangThaiNut:b?b.className:null,
      dangPhat:!!document.querySelector('#screen .audio-btn.is-playing, #screen .audio-btn--playing'),
      speaking:window.speechSynthesis?window.speechSynthesis.speaking:null,
      pending:window.speechSynthesis?window.speechSynthesis.pending:null};})()`);
  const out = { headless: r, nutAudio: clicked, sauKhiBam: after };
  console.log(JSON.stringify(out, null, 1));
  writeFileSync('tools/qa-audio-report.json', JSON.stringify(out, null, 2), 'utf8');
  cdp.close();
  try { proc.kill(); } catch { /* ignore */ }
}
main().catch((e) => { console.error('FATAL: ' + (e && e.stack || e)); process.exit(1); });
