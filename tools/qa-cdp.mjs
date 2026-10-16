/* ============================================================================
   qa-cdp.mjs — Bo kiem thu DOC LAP cho demo SnapLife AI (dieu khien Chromium qua CDP)
   Owner: qa-verify.  Pham vi ghi: tools/qa-*
   Chay:  node tools/qa-cdp.mjs  [ten-test ...]
   Ket qua JSON: tools/qa-cdp-report.json

   Vi sao khong dung lai tools/audit.html: audit do Lead viet va chi kiem nhung gi
   Lead da nghi toi. File nay dieu khien trinh duyet o tang thap hon (Emulation,
   Input.dispatchKeyEvent, Network.setBlockedURLs, history that) de tim loi ma
   audit khong the bat.
   ========================================================================== */

import { launch, CDP, openPage, evalIn, goto, waitReady, setViewport, clearViewport,
         setReducedMotion, blockUrls, typeKey, insertText, sleep, BASE, IDS } from './qa-cdp-lib.mjs';
import { writeFileSync } from 'node:fs';

const R = [];
const log = (...a) => console.log(...a);
function report(id, title, data, note) {
  R.push({ id, title, data, note: note || null });
  log('');
  log('===== [' + id + '] ' + title + ' =====');
  log(JSON.stringify(data, null, 1));
  if (note) log('NOTE: ' + note);
}

const ONLY = process.argv.slice(2);

async function main() {
  const { proc, ver, port } = await launch({ port: 9411 });
  log('Chromium: ' + ver.Browser + '  (devtools port ' + port + ')');
  const cdp = await new CDP(ver.webSocketDebuggerUrl).connect();

  // Mot page "song" dung cho cac test dieu huong; tao page moi khi can lich su sach.
  const page = await openPage(cdp, 'about:blank');

  const want = (name) => ONLY.length === 0 || ONLY.includes(name);

  try {
    if (want('A')) await testA(cdp, page);
    if (want('B')) await testB(cdp, page);
    if (want('C')) await testC(cdp, page);
    if (want('D')) await testD(cdp, page);
    if (want('E')) await testE(cdp, page);
    if (want('F')) await testF(cdp);
    if (want('G')) await testG(cdp, page);
    if (want('H')) await testH(cdp, page);
    if (want('I')) await testI(cdp, page);
    if (want('J')) await testJ(cdp, page);
    if (want('K')) await testK(cdp, page);
    if (want('L')) await testL(cdp, page);
    if (want('M')) await testM(cdp, page);
    if (want('N')) await testN(cdp);
    if (want('O')) await testO(cdp, page);
    if (want('P')) await testP(cdp, page);
    if (want('Q')) await testQ(cdp, page);
    if (want('S')) await testS(cdp);
  } catch (err) {
    log('!! LOI KHONG LUONG TRUOC: ' + (err && err.stack ? err.stack : err));
    R.push({ id: 'FATAL', title: 'loi khong luong truoc', data: String(err && err.message || err) });
  }

  writeFileSync('tools/qa-cdp-report.json', JSON.stringify(R, null, 2), 'utf8');
  log('');
  log('Da ghi tools/qa-cdp-report.json (' + R.length + ' muc)');
  cdp.close();
  try { proc.kill(); } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ helpers */

const SCR_ID = "(function(){var h=location.hash.replace('#/','');return h.split('?')[0]||'home';})()";

function screenMetaExpr() {
  return `(function(){
    var s=window.__SNAPLIFE__;
    var id=${SCR_ID};
    var scr=s?s.screens.filter(function(x){return x.id===id;})[0]:null;
    var host=document.querySelector('#screen');
    var tb=document.querySelector('#tabbar');
    var focs=host.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
    var btns=host.querySelectorAll('button');
    var noName=0;
    for(var i=0;i<btns.length;i++){var b=btns[i];if(!(b.innerText||'').trim()&&!b.getAttribute('aria-label'))noName++;}
    var imgs=host.querySelectorAll('img'); var broken=0;
    for(var j=0;j<imgs.length;j++){if(imgs[j].complete&&imgs[j].naturalWidth===0)broken++;}
    return {
      id: id,
      title: document.title,
      ready: document.documentElement.dataset.ready==='true',
      bootErrors: document.documentElement.getAttribute('data-boot-errors'),
      placeholder: !!(scr&&scr.placeholder),
      chrome: scr?scr.chrome:null,
      api: (scr&&scr.api)||[],
      nodes: host.querySelectorAll('*').length,
      textLen: (host.innerText||'').length,
      notes: document.querySelectorAll('#inspector-body .note-list li').length,
      tabbarVisible: getComputedStyle(tb).display!=='none',
      hasEmpty: !!host.querySelector('.empty'),
      hasSkeleton: !!host.querySelector('.skeleton'),
      hasSpinner: !!host.querySelector('.spinner'),
      overflowX: host.scrollWidth-host.clientWidth,
      docOverflowX: document.documentElement.scrollWidth-document.documentElement.clientWidth,
      focusables: focs.length,
      buttonsNoName: noName,
      imgs: imgs.length,
      brokenImgs: broken
    };
  })()`;
}

async function meta(cdp, page) { return evalIn(cdp, page, screenMetaExpr()); }

async function cost(cdp, page) { return evalIn(cdp, page, 'window.__SNAPLIFE__.cost.snapshot()'); }

async function storeState(cdp, page) { return evalIn(cdp, page, 'JSON.parse(JSON.stringify(window.__SNAPLIFE__.store.state))'); }

/** Tim phan tu cuon duoc trong #screen. */
const SCROLLER = `(function(){var list=[document.querySelector('#screen')].concat(Array.prototype.slice.call(document.querySelectorAll('#screen *')));
  for(var i=0;i<list.length;i++){var el=list[i];if(!el)continue;if(el.scrollHeight-el.clientHeight>4)return el;}
  return document.querySelector('#screen');})()`;

function clickByTextExpr(re) {
  return `(function(){
    var re=${re};
    var els=Array.prototype.slice.call(document.querySelectorAll('#screen button, #screen a, #screen [role="button"], #screen label'));
    for(var i=0;i<els.length;i++){var t=(els[i].innerText||'').replace(/\\s+/g,' ').trim();if(re.test(t)){els[i].click();return t.slice(0,60);}}
    return null;
  })()`;
}

async function clickByText(cdp, page, reLiteral) {
  return evalIn(cdp, page, clickByTextExpr(reLiteral));
}

/* ------------------------------------------------------------------ TEST A */
async function testA(cdp, page) {
  const rows = [];
  for (const id of IDS) {
    page.errors.length = 0;
    await goto(cdp, page, `${BASE}/index.html#/${id}`);
    const m = await meta(cdp, page);
    m.consoleErrors = page.errors.slice(0, 5);
    rows.push(m);
  }
  const bad = rows.filter((r) => !r.ready || r.bootErrors || r.placeholder || r.overflowX > 1 || r.consoleErrors.length || r.brokenImgs);
  report('A', 'Deep link 20/20 man hinh (do bang CDP, khong dung audit.html)', {
    total: rows.length,
    ready: rows.filter((r) => r.ready).length,
    placeholder: rows.filter((r) => r.placeholder).length,
    withBootErrors: rows.filter((r) => r.bootErrors).length,
    withConsoleErrors: rows.filter((r) => r.consoleErrors.length).length,
    withOverflowX: rows.filter((r) => r.overflowX > 1).length,
    brokenImgs: rows.reduce((a, r) => a + r.brokenImgs, 0),
    nodes: rows.map((r) => `${r.id}:${r.nodes}`).join(' '),
    textLen: rows.map((r) => `${r.id}:${r.textLen}`).join(' '),
    notes: rows.map((r) => `${r.id}:${r.notes}`).join(' '),
    tabbarVisible: rows.filter((r) => r.tabbarVisible).map((r) => r.id).join(','),
    apiDeclared: rows.filter((r) => r.api.length).map((r) => `${r.id}=${r.api.map((a) => a.key).join('+')}`).join(', '),
    worst: bad.map((r) => ({ id: r.id, ready: r.ready, boot: r.bootErrors, placeholder: r.placeholder, ovf: r.overflowX, err: r.consoleErrors })),
  });
}

/* ------------------------------------------------------------------ TEST B */
async function testB(cdp, page) {
  await goto(cdp, page, `${BASE}/index.html#/khong-ton-tai-xyz`);
  const m = await meta(cdp, page);
  const txt = await evalIn(cdp, page, "document.querySelector('#screen').innerText.slice(0,180)");
  report('B', 'Deep link toi man hinh KHONG ton tai', { meta: m, text: txt });
}

/* ------------------------------------------------------------------ TEST C */
async function testC(cdp, page) {
  const cases = [
    ['#/reader', 'mac dinh'],
    ['#/reader?story=ceramic-cup', 'truyen 2'],
    ['#/reader?story=khong-co', 'truyen KHONG co'],
    ['#/reader?word=mug', 'sheet tu mug'],
    ['#/speaking?state=recording', 'dang ghi am'],
    ['#/speaking?state=corrected', 'da sua xong'],
    ['#/speaking?state=bay-ba', 'state KHONG hop le'],
    ['#/worddetail?word=downpour', 'tu downpour'],
    ['#/worddetail?word=khong-co', 'tu KHONG co'],
    ['#/wordlist?filter=zzz', 'tham so la'],
  ];
  const out = [];
  for (const [hash, label] of cases) {
    page.errors.length = 0;
    await goto(cdp, page, BASE + '/index.html' + hash);
    const m = await meta(cdp, page);
    const txt = await evalIn(cdp, page, "(document.querySelector('#screen').innerText||'').replace(/\\s+/g,' ').slice(0,150)");
    out.push({
      hash, label, ready: m.ready, boot: m.bootErrors, nodes: m.nodes, textLen: m.textLen,
      overflowX: m.overflowX, hasEmpty: m.hasEmpty, errors: page.errors.slice(0, 3), text: txt,
    });
  }
  report('C', 'Deep link co tham so (hop le + KHONG hop le)', { cases: out });
}

/* ------------------------------------------------------------------ TEST D */
async function testD(cdp, page) {
  await goto(cdp, page, `${BASE}/index.html#/wordlist`);
  const before = await evalIn(cdp, page, SCROLLER + `;(function(){var el=document.querySelector('#screen');
    return {rows: el.querySelectorAll('.wordrow,.listitem,li').length, text: el.innerText.length};})()`);
  const inputs = await evalIn(cdp, page, `(function(){var l=document.querySelectorAll('#screen input,#screen [contenteditable="true"]');
    return Array.prototype.map.call(l,function(i){return {tag:i.tagName,type:i.type||'',ph:i.placeholder||'',label:i.getAttribute('aria-label')||''};});})()`);
  // Go vao o tim kiem dau tien
  const focused = await evalIn(cdp, page, `(function(){var i=document.querySelector('#screen input');
    if(!i)return null;i.focus();return i.placeholder||i.type;})()`);
  if (focused !== null) {
    await insertText(cdp, page, 'zzzqqq');
    await sleep(400);
  }
  const after = await evalIn(cdp, page, `(function(){var el=document.querySelector('#screen');
    return {rows: el.querySelectorAll('.wordrow,.listitem,li').length, hasEmpty: !!el.querySelector('.empty'),
      text: (el.innerText||'').replace(/\\s+/g,' ').slice(0,220)};})()`);
  report('D', 'wordlist: loc tu khoa khong ra ket qua -> trang thai rong', { inputs, focused, before, after });
}

/* ------------------------------------------------------------------ TEST E */
async function testE(cdp, page) {
  // E1: chon 20 phut o home -> sang man khac -> ve home
  await goto(cdp, page, `${BASE}/index.html#/home`);
  const st0 = await storeState(cdp, page);
  const clicked = await clickByText(cdp, page, '/20\\s*ph/');
  await sleep(300);
  const st1 = await storeState(cdp, page);
  await goto(cdp, page, `${BASE}/index.html#/progress`);
  await goto(cdp, page, `${BASE}/index.html#/home`);
  const st2 = await storeState(cdp, page);
  const selectedAfter = await evalIn(cdp, page, `(function(){var els=document.querySelectorAll('#screen .segmented button,#screen [role="radio"],#screen [aria-pressed="true"],#screen .chip--selected');
    return Array.prototype.map.call(els,function(e){return (e.innerText||'').replace(/\\s+/g,' ').trim().slice(0,24);});})()`);
  const e1 = {
    clickedText: clicked,
    reviewLengthBefore: st0.review && st0.review.length,
    reviewLengthAfterClick: st1.review && st1.review.length,
    reviewLengthAfterRoundTrip: st2.review && st2.review.length,
    persisted: JSON.stringify(st1.review) === JSON.stringify(st2.review),
    selectedVisualAfter: selectedAfter,
  };

  // E2: regions -> bo 1 tu -> sang wordlist -> quay lai regions
  await goto(cdp, page, `${BASE}/index.html#/regions`);
  const r0 = await evalIn(cdp, page, `(function(){var el=document.querySelector('#screen');
    return {bbox: el.querySelectorAll('.bbox').length, bboxKeys: Array.prototype.map.call(el.querySelectorAll('.bbox'),function(b){return b.dataset.key||'';}),
      kept: (window.__SNAPLIFE__.store.state.capture||{}).removed};})()`);
  // bam vao mot vung bbox de bat/tat
  const toggled = await evalIn(cdp, page, `(function(){var b=document.querySelectorAll('#screen .bbox')[0];if(!b)return null;b.click();return b.dataset.key||'?';})()`);
  await sleep(350);
  const r1 = await evalIn(cdp, page, `(function(){return {removed:(window.__SNAPLIFE__.store.state.capture||{}).removed,
    bboxOff: document.querySelectorAll('#screen .bbox--off, #screen .bbox[data-state="off"]').length};})()`);
  await goto(cdp, page, `${BASE}/index.html#/wordlist`);
  await goto(cdp, page, `${BASE}/index.html#/regions`);
  const r2 = await evalIn(cdp, page, `(function(){return {removed:(window.__SNAPLIFE__.store.state.capture||{}).removed,
    bboxOff: document.querySelectorAll('#screen .bbox--off, #screen .bbox[data-state="off"]').length,
    bbox: document.querySelectorAll('#screen .bbox').length};})()`);
  const e2 = { initial: r0, toggledKey: toggled, afterToggle: r1, afterRoundTrip: r2, persisted: JSON.stringify(r1.removed) === JSON.stringify(r2.removed) };
  report('E', 'Du lieu co duoc GIU khi doi man roi quay lai?', { home_session_length: e1, regions_removed: e2 });
}

/* ------------------------------------------------------------------ TEST F */
async function testF(cdp) {
  // F1: back/forward trong cung mot tab
  const p1 = await openPage(cdp, `${BASE}/index.html#/home`);
  await waitReady(cdp, p1); await sleep(300);
  await goto(cdp, p1, `${BASE}/index.html#/capture`);
  await goto(cdp, p1, `${BASE}/index.html#/regions`);
  const seq = [{ step: 'start', hash: await evalIn(cdp, p1, 'location.hash'), len: await evalIn(cdp, p1, 'history.length') }];
  await evalIn(cdp, p1, 'history.back()'); await sleep(600);
  seq.push({ step: 'back', hash: await evalIn(cdp, p1, 'location.hash') });
  await evalIn(cdp, p1, 'history.forward()'); await sleep(600);
  seq.push({ step: 'forward', hash: await evalIn(cdp, p1, 'location.hash') });
  await evalIn(cdp, p1, 'history.back()'); await sleep(600);
  await evalIn(cdp, p1, 'history.back()'); await sleep(700);
  seq.push({ step: 'back x2 (ve man dau)', hash: await evalIn(cdp, p1, 'location.hash'), href: await evalIn(cdp, p1, 'location.href'), bodyLen: await evalIn(cdp, p1, 'document.body.innerText.length') });

  // F2: deep link thang vao man co nut back roi bam nut back
  const p2 = await openPage(cdp, `${BASE}/index.html#/worddetail?word=downpour`);
  await waitReady(cdp, p2); await sleep(400);
  const len2 = await evalIn(cdp, p2, 'history.length');
  const backInfo = await evalIn(cdp, p2, `(function(){var b=document.querySelector('#screen .appbar button');
    if(!b)return {found:false};return {found:true, label:b.getAttribute('aria-label')||'', cls:(b.className||'').toString()};})()`);
  const clicked = await evalIn(cdp, p2, `(function(){var bs=document.querySelectorAll('#screen .appbar button');
    for(var i=0;i<bs.length;i++){if(bs[i].getAttribute('aria-label')&&/quay|back|tr\\u1edf/i.test(bs[i].getAttribute('aria-label'))){bs[i].click();return bs[i].getAttribute('aria-label');}}
    return null;})()`);
  await sleep(900);
  const afterBack = {
    href: await evalIn(cdp, p2, 'location.href'),
    hash: await evalIn(cdp, p2, 'location.hash'),
    bodyText: await evalIn(cdp, p2, 'document.body.innerText.slice(0,120)'),
    appStillThere: await evalIn(cdp, p2, "!!document.querySelector('#screen')"),
  };

  // F3: bam back khi dang o man dau tien (deep link #/home trong tab moi)
  const p3 = await openPage(cdp, `${BASE}/index.html#/home`);
  await waitReady(cdp, p3); await sleep(300);
  const len3 = await evalIn(cdp, p3, 'history.length');
  const r3 = await evalIn(cdp, p3, `(function(){try{window.__SNAPLIFE__.router.back();return 'called';}catch(e){return 'throw: '+e.message;}})()`);
  await sleep(800);
  const afterP3 = { href: await evalIn(cdp, p3, 'location.href'), appStillThere: await evalIn(cdp, p3, "!!document.querySelector('#screen')") };

  report('F', 'Dieu huong back/forward cua trinh duyet (history that)', {
    sameTab_back_forward: seq,
    deeplink_then_appbar_back: { historyLength: len2, backInfo, clicked, afterBack },
    back_at_first_screen: { historyLength: len3, call: r3, after: afterP3 },
  });
}

/* ------------------------------------------------------------------ TEST G */
async function testG(cdp, page) {
  await goto(cdp, page, `${BASE}/index.html#/home`);
  page.errors.length = 0;
  const n0 = await evalIn(cdp, page, "document.querySelector('#screen').querySelectorAll('*').length");
  // mo cung man hai lan lien tiep bang rail (router.go replace -> render lai)
  await evalIn(cdp, page, `(function(){var items=document.querySelectorAll('#rail-body .rail__item');
    for(var i=0;i<items.length;i++){if(/H\\u00f4m nay/.test(items[i].innerText)){items[i].click();items[i].click();return true;}}
    return false;})()`);
  await sleep(400);
  const n1 = await evalIn(cdp, page, "document.querySelector('#screen').querySelectorAll('*').length");
  // doi hash bang tay ve cung gia tri
  await evalIn(cdp, page, "location.hash='#/home'");
  await sleep(300);
  const n2 = await evalIn(cdp, page, "document.querySelector('#screen').querySelectorAll('*').length");
  report('G', 'Mo cung mot man lien tiep: co chong node / loi khong?', {
    nodesFirst: n0, nodesAfterDoubleRailClick: n1, nodesAfterSameHash: n2,
    consoleErrors: page.errors.slice(0, 4),
    hostChildren: await evalIn(cdp, page, "document.querySelector('#screen').children.length"),
    appScreens: await evalIn(cdp, page, "document.querySelectorAll('#screen .screen').length"),
  });
}

/* ------------------------------------------------------------------ TEST H */
async function testH(cdp, page) {
  await goto(cdp, page, `${BASE}/index.html#/reader`);
  // mo sheet bang cach cham mot tu tieng Anh
  const opened = await evalIn(cdp, page, `(function(){var t=document.querySelector('#screen .en');
    if(!t)return null;t.click();return (t.innerText||'').trim();})()`);
  await sleep(450);
  const withSheet = await evalIn(cdp, page, `(function(){return {overlayChildren: document.querySelector('#overlay').children.length,
    scrim: !!document.querySelector('.scrim,.sheet'), bodyText: document.querySelector('#screen').innerText.length};})()`);
  // doi man khi sheet dang mo (bang tab bar)
  await evalIn(cdp, page, `(function(){var t=document.querySelectorAll('#tabbar .tab');
    if(!t.length)return null;t[3].click();return t[3].getAttribute('aria-label');})()`);
  await sleep(600);
  const afterNav = await evalIn(cdp, page, `(function(){return {hash: location.hash,
    overlayChildren: document.querySelector('#overlay').children.length,
    sheetLeft: !!document.querySelector('.sheet'), scrimLeft: !!document.querySelector('.scrim')};})()`);
  const escClosed = await evalIn(cdp, page, `(function(){return {hash:location.hash, sheet:!!document.querySelector('.sheet')};})()`);
  await evalIn(cdp, page, "location.hash='#/reader'"); await sleep(300);
  await evalIn(cdp, page, `(function(){var t=document.querySelector('#screen .en');if(t)t.click();})()`);
  await sleep(350);
  await typeKey(cdp, page, 'Escape', 'Escape', 27);
  await sleep(300);
  const afterEsc = await evalIn(cdp, page, `(function(){return {sheet:!!document.querySelector('.sheet'), overlayChildren:document.querySelector('#overlay').children.length};})()`);
  report('H', 'Sheet dang mo roi doi man / nhan Esc', { openedWord: opened, withSheet, afterNav, escClosed, afterEsc });
}

/* ------------------------------------------------------------------ TEST I */
async function testI(cdp, page) {
  const sig = `(function(){var a=document.activeElement;if(!a)return null;var b=a.getBoundingClientRect();var cs=getComputedStyle(a);
    return {sig:(a.tagName+'.'+((a.className||'').toString().slice(0,26))+'['+(a.getAttribute('aria-label')||a.innerText||'').replace(/\\s+/g,' ').trim().slice(0,26)+']'),
      w:Math.round(b.width),h:Math.round(b.height), vis:cs.visibility, op:cs.opacity, disp:cs.display,
      inScreen:!!a.closest('#screen'), srOnly:!!a.closest('.sr-only')};})()`;
  const out = [];
  for (const id of ['home', 'wordlist', 'review-run', 'profile', 'regions']) {
    await goto(cdp, page, `${BASE}/index.html#/${id}`);
    await evalIn(cdp, page, 'document.body.focus();document.activeElement && document.activeElement.blur && document.activeElement.blur();');
    const seen = [];
    let stuck = 0;
    let last = '';
    for (let i = 0; i < 70; i += 1) {
      await typeKey(cdp, page, 'Tab', 'Tab', 9);
      const s = await evalIn(cdp, page, sig);
      if (!s) break;
      if (s.sig === last) { stuck += 1; if (stuck > 4) break; } else { stuck = 0; }
      last = s.sig;
      seen.push(s);
    }
    const uniq = [...new Set(seen.map((s) => s.sig))];
    const invisible = seen.filter((s) => (s.w < 1 || s.h < 1) || s.vis === 'hidden' || s.op === '0' || s.disp === 'none' || s.srOnly);
    const totalFocusables = await evalIn(cdp, page, `(function(){var host=document.querySelector('#screen');
      var all=host.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
      var vis=0;for(var i=0;i<all.length;i++){var b=all[i].getBoundingClientRect();if(b.width>1&&b.height>1)vis++;}
      return {all:all.length, visible:vis};})()`);
    out.push({ screen: id, tabPresses: seen.length, uniqueStops: uniq.length, stuckAtEnd: stuck > 4,
      invisibleFocusStops: invisible.length, invisibleExamples: invisible.slice(0, 3).map((s) => s.sig),
      reachedInsideApp: uniq.filter((s) => seen.find((x) => x.sig === s && x.inScreen)).length,
      focusables: totalFocusables,
      first5: seen.slice(0, 5).map((s) => s.sig + (s.inScreen ? ' [inApp]' : ' [shell]')) });
  }
  report('I', 'Phim Tab di het man hinh? Focus co ket / vo hinh khong?', { screens: out });
}

/* ------------------------------------------------------------------ TEST J */
async function testJ(cdp, page) {
  const probe = `(function(){var root=getComputedStyle(document.documentElement);
    var els=document.querySelectorAll('#screen *');var anim=0,trans=0,maxDur=0,animNames=[];
    for(var i=0;i<els.length;i++){var cs=getComputedStyle(els[i]);var ad=parseFloat(cs.animationDuration)||0;var td=parseFloat(cs.transitionDuration)||0;
      if(cs.animationName!=='none'&&ad>0.01){anim++;maxDur=Math.max(maxDur,ad);if(animNames.length<5)animNames.push(cs.animationName+'@'+ad+'s');}
      if(td>0.01){trans++;maxDur=Math.max(maxDur,td);}}
    var running=document.getAnimations().filter(function(a){return a.playState==='running';});
    return {dur:root.getPropertyValue('--dur').trim(),durSlow:root.getPropertyValue('--dur-slow').trim(),
      elementsAnimating:anim, elementsTransitioning:trans, maxDuration:maxDur, animNames:animNames,
      runningAnimations:running.length, runningNames:running.slice(0,5).map(function(a){return (a.animationName||a.constructor.name);})};})()`;
  const rows = [];
  await goto(cdp, page, `${BASE}/index.html#/home`);
  rows.push({ screen: 'home', mode: 'no-preference', p: await evalIn(cdp, page, probe) });
  await setReducedMotion(cdp, page, true);
  await goto(cdp, page, `${BASE}/index.html#/home`);
  rows.push({ screen: 'home', mode: 'reduce', p: await evalIn(cdp, page, probe) });
  await goto(cdp, page, `${BASE}/index.html#/speaking?state=recording`);
  rows.push({ screen: 'speaking:recording', mode: 'reduce', p: await evalIn(cdp, page, probe) });
  await goto(cdp, page, `${BASE}/index.html#/splash`);
  rows.push({ screen: 'splash', mode: 'reduce', p: await evalIn(cdp, page, probe) });
  await goto(cdp, page, `${BASE}/index.html#/capture`);
  rows.push({ screen: 'capture', mode: 'reduce', p: await evalIn(cdp, page, probe) });
  await setReducedMotion(cdp, page, false);
  report('J', 'prefers-reduced-motion: con chuyen dong nao khong?', {
    note: 'Do lai bang cach RENDER MOI duoi che do reduce (Emulation.setEmulatedMedia), khong doi class tren DOM da render.',
    rows,
  });
}

/* ------------------------------------------------------------------ TEST K */
async function testK(cdp, page) {
  const ovf = `(function(){var host=document.querySelector('#screen');var scr=host.getBoundingClientRect();
    var list=[];var all=host.querySelectorAll('*');
    for(var i=0;i<all.length;i++){var el=all[i];var b=el.getBoundingClientRect();
      if(b.width<2||b.height<2)continue;
      if(b.right>scr.right+1.5||b.left<scr.left-1.5){list.push({t:el.tagName+'.'+((el.className||'').toString().slice(0,26)),l:Math.round(b.left),r:Math.round(b.right)});}
      if(list.length>8)break;}
    return {hostOverflow:host.scrollWidth-host.clientWidth, docOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      scr:[Math.round(scr.left),Math.round(scr.right)], offenders:list};})()`;
  const out = [];
  for (const [w, h] of [[375, 812], [1440, 900]]) {
    await setViewport(cdp, page, w, h, w < 800);
    const rows = [];
    for (const id of IDS) {
      await goto(cdp, page, `${BASE}/index.html#/${id}`, { settle: 150 });
      const r = await evalIn(cdp, page, ovf);
      rows.push({ id, ...r });
    }
    out.push({ width: w, height: h, offendersHost: rows.filter((r) => r.hostOverflow > 1).map((r) => r.id + ':' + r.hostOverflow),
      offendersDoc: rows.filter((r) => r.docOverflow > 1).map((r) => r.id + ':' + r.docOverflow),
      offenderSample: rows.filter((r) => r.offenders.length).slice(0, 6).map((r) => ({ id: r.id, items: r.offenders })) });
  }
  await clearViewport(cdp, page);
  report('K', 'Tran ngang o 375px va 1440px (ca 20 man)', { results: out });
}

/* ------------------------------------------------------------------ TEST L */
async function testL(cdp, page) {
  await setViewport(cdp, page, 375, 812, true);
  const occl = `(function(){var sc=${SCROLLER};
    sc.scrollTop=sc.scrollHeight;
    var host=document.querySelector('#screen');var scr=host.getBoundingClientRect();
    var tb=document.querySelector('#tabbar');var tbVisible=getComputedStyle(tb).display!=='none';var tbr=tb.getBoundingClientRect();
    var out=[];var els=host.querySelectorAll('button,a[href],input,select,textarea');
    for(var i=0;i<els.length;i++){var el=els[i];var b=el.getBoundingClientRect();
      if(b.width<2||b.height<2)continue;
      var cx=Math.round(b.left+b.width/2),cy=Math.round(b.top+b.height/2);
      if(cx<scr.left||cx>scr.right||cy<scr.top||cy>scr.bottom)continue;
      var hit=document.elementFromPoint(cx,cy);if(!hit)continue;
      if(hit!==el&&!el.contains(hit)&&!hit.contains(el)){out.push({el:(el.innerText||el.getAttribute('aria-label')||el.tagName).replace(/\\s+/g,' ').trim().slice(0,28),
        by:(hit.className||'').toString().slice(0,34)||hit.tagName});}}
    return {maxScroll: sc.scrollHeight-sc.clientHeight, scrolledTo: sc.scrollTop,
      tabbarVisible: tbVisible, tabbarTop: Math.round(tbr.top), screenBottom: Math.round(scr.bottom), occluded: out};})()`;
  const rows = [];
  for (const id of ['home', 'wordlist', 'review-run', 'reader', 'progress', 'diary', 'system-states', 'regions', 'speaking', 'profile']) {
    await goto(cdp, page, `${BASE}/index.html#/${id}`, { settle: 200 });
    rows.push({ id, ...(await evalIn(cdp, page, occl)) });
  }
  await clearViewport(cdp, page);
  report('L', 'Cuon xuong cuoi man: co bi tab bar / overlay che khong?', {
    note: 'elementFromPoint tai tam tung nut -> neu tra ve phan tu khac thi nut bi che.',
    screens: rows.map((r) => ({ id: r.id, maxScroll: r.maxScroll, tabbar: r.tabbarVisible, occludedCount: r.occluded.length, occluded: r.occluded })),
  });
}

/* ------------------------------------------------------------------ TEST M */
async function testM(cdp, page) {
  // Trinh duyet zoom 200% lam viewport CSS con 1/2 be ngang (proxy: 390/2 = 195)
  await setViewport(cdp, page, 195, 420, true);
  const rows = [];
  const ovf = `(function(){var h=document.querySelector('#screen');return {ovf:h.scrollWidth-h.clientWidth, doc:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    textLines:(document.querySelector('#screen').innerText||'').length};})()`;
  for (const id of IDS) {
    await goto(cdp, page, `${BASE}/index.html#/${id}`, { settle: 120 });
    rows.push({ id, ...(await evalIn(cdp, page, ovf)) });
  }
  await clearViewport(cdp, page);
  report('M', 'Zoom 200% (proxy: viewport 195px): man nao tran ngang?', {
    note: 'Emulation.setDeviceMetricsOverride width=195 = viewport CSS khi zoom 200% tren khung 390. Khong phai zoom that cua trinh duyet.',
    offenders: rows.filter((r) => r.ovf > 1 || r.doc > 1).map((r) => `${r.id}: host=${r.ovf} doc=${r.doc}`),
    checked: rows.length,
  });
}

/* ------------------------------------------------------------------ TEST N */
async function testN(cdp) {
  // N1: co internet (binh thuong)
  const p1 = await openPage(cdp, `${BASE}/index.html#/home`);
  await waitReady(cdp, p1); await sleep(1200);
  const n1 = await evalIn(cdp, p1, `(function(){var h=document.querySelector('.h1,.h2,h1,h2')||document.querySelector('#screen h2');
    var r=h?h.getBoundingClientRect():null;
    return {fontsStatus:document.fonts.status, fontsSize:document.fonts.size,
      calistoga:document.fonts.check('20px Calistoga'), inter:document.fonts.check('15px Inter'),
      newsreader:document.fonts.check('19px Newsreader'), mono:document.fonts.check('12px "JetBrains Mono"'),
      hFont:h?getComputedStyle(h).fontFamily:null, hWidth:r?Math.round(r.width):null, hText:h?h.innerText.slice(0,40):null};})()`);
  // N2: chan CDN font (mo phong "mat mang tai hoi truong")
  const p2 = await openPage(cdp, 'about:blank');
  await blockUrls(cdp, p2, ['*fonts.googleapis.com*', '*fonts.gstatic.com*']);
  await goto(cdp, p2, `${BASE}/index.html#/home`, { settle: 500 });
  await sleep(1200);
  const n2 = await evalIn(cdp, p2, `(function(){var h=document.querySelector('.h1,.h2,h1,h2')||document.querySelector('#screen h2');
    var r=h?h.getBoundingClientRect():null;
    return {fontsStatus:document.fonts.status, fontsSize:document.fonts.size,
      calistoga:document.fonts.check('20px Calistoga'), inter:document.fonts.check('15px Inter'),
      hFont:h?getComputedStyle(h).fontFamily:null, hWidth:r?Math.round(r.width):null, hText:h?h.innerText.slice(0,40):null,
      ready:document.documentElement.dataset.ready, bootErrors:document.documentElement.getAttribute('data-boot-errors'),
      docHeight:document.documentElement.scrollHeight};})()`);
  const n1h = await evalIn(cdp, p1, 'document.documentElement.scrollHeight');
  report('N', 'Web font Google CDN: neu mat mang khi demo thi sao?', {
    withInternet: n1, withCdnBlocked: n2,
    docHeightWithFonts: n1h, docHeightWithoutFonts: n2.docHeight,
    widthDelta: (n1.hWidth !== null && n2.hWidth !== null) ? n2.hWidth - n1.hWidth : null,
    note: 'Chan *fonts.googleapis.com* + *fonts.gstatic.com* = mo phong hoi truong khong co internet nhung server tinh van chay.',
  });
}

/* ------------------------------------------------------------------ TEST O */
async function testO(cdp, page) {
  const out = {};

  // O1: "VLM chi goi 1 lan cho moi anh" — vao #/capture roi #/regions nhieu lan
  await goto(cdp, page, `${BASE}/index.html#/home`);
  await evalIn(cdp, page, 'window.__SNAPLIFE__.cost.reset()');
  const c0 = await cost(cdp, page);
  for (let i = 0; i < 4; i += 1) {
    await goto(cdp, page, `${BASE}/index.html#/capture`, { settle: 120 });
    await goto(cdp, page, `${BASE}/index.html#/regions`, { settle: 120 });
  }
  const c1 = await cost(cdp, page);
  out.vlm_idempotent = { after0: c0.totals.vlm, after4RoundTrips: c1.totals.vlm, pass: c1.totals.vlm === 1,
    ledger: c1.ledger.map((l) => l.key || l.label).slice(0, 8) };

  // O2: "0 API call khi on tap" — tra loi mot cau trong review-run
  await evalIn(cdp, page, 'window.__SNAPLIFE__.cost.reset()');
  await goto(cdp, page, `${BASE}/index.html#/review-run`);
  const before = await cost(cdp, page);
  const answered = await evalIn(cdp, page, `(function(){
    var els=document.querySelectorAll('#screen button');
    for(var i=0;i<els.length;i++){var t=(els[i].innerText||'').replace(/\\s+/g,' ').trim();
      if(t && !/^(Tiep|Ti\\u1ebfp|Quay|Back|K\\u1ebft th\\u00fac|Tho\\u00e1t|\\u0110\\u00f3ng)/.test(t) && els[i].offsetParent!==null){els[i].click();return t.slice(0,40);}}
    return null;})()`);
  await sleep(500);
  const after = await cost(cdp, page);
  out.review_zero_api = { answeredText: answered, apiCallsBefore: before.apiCalls, apiCallsAfter: after.apiCalls,
    vlm: after.totals.vlm, llm: after.totals.llm, rule: after.totals.rule, pass: after.apiCalls === before.apiCalls };

  // O3: LLM +1 khi compose -> reader, va khong cong lai khi quay ve
  await evalIn(cdp, page, 'window.__SNAPLIFE__.cost.reset()');
  await goto(cdp, page, `${BASE}/index.html#/compose`, { settle: 150 });
  const cl = [];
  for (const btn of ['viết lại', 'viết', 'tạo', 'tiếp tục']) {
    const ok = await clickByText(cdp, page, '/' + btn + '/i');
    await sleep(450);
    cl.push([btn, ok, (await cost(cdp, page)).totals.llm]);
  }
  const cRead = await evalIn(cdp, page, 'window.__SNAPLIFE__.cost.snapshot()');
  await goto(cdp, page, `${BASE}/index.html#/reader`, { settle: 200 });
  const cReader = await cost(cdp, page);
  await goto(cdp, page, `${BASE}/index.html#/compose`, { settle: 200 });
  await goto(cdp, page, `${BASE}/index.html#/reader`, { settle: 200 });
  const cReader2 = await cost(cdp, page);
  out.llm_reader = { clicks: cl, afterComposeClicks: cRead.totals.llm, afterReader: cReader.totals.llm, afterRoundTrip: cReader2.totals.llm,
    ledger: cReader2.ledger.map((l) => l.key || l.label) };

  // O4: speaking — bam "Nho AI chinh lai" hai lan thi phai +2
  await evalIn(cdp, page, 'window.__SNAPLIFE__.cost.reset()');
  await goto(cdp, page, `${BASE}/index.html#/speaking?state=recorded`, { settle: 250 });
  const s1 = await cost(cdp, page);
  const click1 = await clickByText(cdp, page, '/ch\\u1ec9nh l\\u1ea1i/i');
  await sleep(700);
  const s2 = await cost(cdp, page);
  const click2 = await clickByText(cdp, page, '/ch\\u1ec9nh l\\u1ea1i/i');
  await sleep(700);
  const s3 = await cost(cdp, page);
  out.speaking_second_call = { click1, click2, llm0: s1.totals.llm, llm1: s2.totals.llm, llm2: s3.totals.llm,
    pass: s3.totals.llm > s2.totals.llm && s2.totals.llm > s1.totals.llm, ledger: s3.ledger.map((l) => l.key || l.label) };

  // O5: cac man khai bao api:[] thi khong duoc cong gi
  const zero = {};
  for (const id of ['home', 'wordlist', 'worddetail?word=mug', 'progress', 'profile', 'review-hub', 'review-summary', 'reviews-x']) {
    await goto(cdp, page, `${BASE}/index.html#/${id}`, { settle: 120 });
    const c = await cost(cdp, page);
    zero[id] = c.apiCalls;
  }
  out.zero_screens_after_vlm_llm = zero;

  report('O', 'Kiem cheo loi khai ve chi phi AI', out);
}

/* ------------------------------------------------------------------ TEST P */
async function testP(cdp, page) {
  await goto(cdp, page, `${BASE}/index.html#/regions`, { settle: 300 });
  const data = await evalIn(cdp, page, `(function(){
    var host=document.querySelector('#screen');
    var boxes=Array.prototype.slice.call(host.querySelectorAll('.bbox'));
    var st=window.__SNAPLIFE__.store.state.capture||{};
    var regions=(st.regions||[]).concat(st.userRegions||[]);
    var D=window.__SNAPLIFE__.data;
    var out={boxCount:boxes.length, storeRegions:regions.length,
      regionKeys:regions.map(function(r){return r.key;}),
      boxKeys:boxes.map(function(b){return b.dataset.key||null;}),
      wordCards:host.querySelectorAll('.wordrow,.wordcard,.wcard').length};
    // 1 vung = 1 tu? so sanh wordId / en trong store voi so the tu hien ra
    out.wordIds=regions.map(function(r){return r.wordId||r.en||null;});
    out.dupWordIds=out.wordIds.filter(function(v,i){return v&&out.wordIds.indexOf(v)!==i;});
    // bbox hien thi co khop regionFor() khong
    var photo=document.querySelector('#screen .photo-frame img, #screen .photo-frame');
    out.photoFound=!!photo;
    out.checks=[];
    var img=document.querySelector('#screen .photo-frame img')||document.querySelector('#screen .photo-frame');
    if(img){var ir=img.getBoundingClientRect();
      for(var i=0;i<boxes.length;i++){
        var b=boxes[i];var key=b.dataset.key;
        var r=regions.filter(function(x){return x.key===key;})[0];
        if(!r)continue;
        var br=b.getBoundingClientRect();
        var ex={left:ir.left+ir.width*(r.x/100),top:ir.top+ir.height*(r.y/100),width:ir.width*(r.w/100),height:ir.height*(r.h/100)};
        out.checks.push({key:key,
          dxLeft:Math.round((br.left-ex.left)*10)/10, dyTop:Math.round((br.top-ex.top)*10)/10,
          dWidth:Math.round((br.width-ex.width)*10)/10, dHeight:Math.round((br.height-ex.height)*10)/10,
          regionForWord: r.wordId? (D.regionFor(r.wordId, st.photoId||'morning-desk')? 'ok':'null') : 'n/a'});
      }}
    // moi vung co dung 1 the tu tuong ung khong
    out.labelsPerBox=boxes.map(function(b){return (b.innerText||'').replace(/\\s+/g,' ').trim().slice(0,18);});
    return out;})()`);
  report('P', 'regions: moi vung dung 1 tu? bbox co nam tren dung toa do regionFor()?', data);
}

/* ------------------------------------------------------------------ TEST Q */
async function testQ(cdp, page) {
  const rows = [];
  for (const hash of ['#/reader', '#/reader?story=ceramic-cup']) {
    await goto(cdp, page, BASE + '/index.html' + hash, { settle: 350 });
    const r = await evalIn(cdp, page, `(function(){var host=document.querySelector('#screen');
      var txt=(host.innerText||'');
      var m=txt.match(/(\\d{1,2}(?:[.,]\\d)?)\\s*%/);
      var st=window.__SNAPLIFE__.store.state;
      return {hash:location.hash, shownRatio: m?m[0]:null,
        allPercents:(txt.match(/\\d{1,2}(?:[.,]\\d)?\\s*%/g)||[]).slice(0,6),
        storeStoryId: st.story && (st.story.activeId||st.story.id),
        enTokens: host.querySelectorAll('.en').length};})()`);
    rows.push(r);
  }
  report('Q', 'Ti le tieng Anh hien tren #/reader co phai so that?', {
    rows, scriptSays: 'check_story_ratio.py: ceramic-cup 16.8%, TODAY_RAW 17.0%',
  });
}

/* ------------------------------------------------------------------ TEST S */
async function testS(cdp) {
  // Moi nut bam mot lan tren vai man: co phan hoi khong (doi DOM / toast / doi man)?
  const screens = ['home', 'wordlist', 'review-hub', 'diary'];
  const out = [];
  for (const id of screens) {
    const p = await openPage(cdp, `${BASE}/index.html#/${id}`);
    await waitReady(cdp, p); await sleep(350);
    const labels = await evalIn(cdp, p, `(function(){var b=document.querySelectorAll('#screen button');
      return Array.prototype.map.call(b,function(x,i){return {i:i,t:(x.innerText||'').replace(/\\s+/g,' ').trim().slice(0,34),a:x.getAttribute('aria-label')||'',dis:x.disabled};}).filter(function(x){return x.t||x.a;});})()`);
    const res = [];
    for (const item of labels.slice(0, 10)) {
      const p2 = await openPage(cdp, `${BASE}/index.html#/${id}`);
      await waitReady(cdp, p2); await sleep(250);
      const before = await evalIn(cdp, p2, `(function(){return {html:document.querySelector('#screen').innerHTML.length, hash:location.hash,
        toasts:document.querySelectorAll('.toast').length, overlay:document.querySelector('#overlay').children.length};})()`);
      await evalIn(cdp, p2, `(function(){var b=document.querySelectorAll('#screen button')[${item.i}];if(b)b.click();})()`);
      await sleep(500);
      const after = await evalIn(cdp, p2, `(function(){return {html:document.querySelector('#screen').innerHTML.length, hash:location.hash,
        toasts:document.querySelectorAll('.toast').length, overlay:document.querySelector('#overlay').children.length,
        boot:document.documentElement.getAttribute('data-boot-errors')};})()`);
      const changed = before.html !== after.html || before.hash !== after.hash || after.toasts > before.toasts || after.overlay !== before.overlay;
      res.push({ label: item.t || item.a, changed, hashMoved: before.hash !== after.hash, toast: after.toasts > before.toasts,
        overlayOpened: after.overlay > before.overlay, boot: after.boot });
      await cdp.send('Target.closeTarget', { targetId: p2.targetId });
    }
    out.push({ screen: id, buttonCount: labels.length, tested: res.length, noResponse: res.filter((r) => !r.changed), results: res });
    await cdp.send('Target.closeTarget', { targetId: p.targetId });
  }
  report('S', 'Bam moi nut mot lan: nut nao KHONG co phan hoi nao?', { screens: out });
}

main().catch((e) => { console.error('FATAL: ' + (e && e.stack || e)); process.exit(1); });
