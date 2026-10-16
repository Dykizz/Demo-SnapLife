/* ============================================================================
   qa-cdp2.mjs — Vong 2: sua cac loi PHUONG PHAP cua vong 1 + dao sau vao cac
   ket qua dang ngo. Owner: qa-verify. Pham vi ghi: tools/qa-*
   Chay: node tools/qa-cdp2.mjs
   ========================================================================== */

import { launch, CDP, openPage, evalIn, goto, waitReady, setViewport, clearViewport,
         setReducedMotion, typeKey, sleep, BASE, IDS } from './qa-cdp-lib.mjs';
import { writeFileSync } from 'node:fs';

const R = [];
const log = (...a) => console.log(...a);
function report(id, title, data) {
  R.push({ id, title, data });
  log('');
  log('===== [' + id + '] ' + title + ' =====');
  log(JSON.stringify(data, null, 1));
}

const ONLY = process.argv.slice(2);
const want = (name) => ONLY.length === 0 || ONLY.includes(name);

async function main() {
  const { proc, ver, port } = await launch({ port: 9412 });
  log('Chromium: ' + ver.Browser);
  const cdp = await new CDP(ver.webSocketDebuggerUrl).connect();
  const page = await openPage(cdp, 'about:blank');
  try {
    if (want('H2')) await H2(cdp, page);
    if (want('I2')) await I2(cdp, page);
    if (want('J2')) await J2(cdp, page);
    if (want('K2')) await K2(cdp, page);
    if (want('O2')) await O2(cdp, page);
    if (want('P2')) await P2(cdp, page);
    if (want('E2')) await E2(cdp, page);
    if (want('A2')) await A2(cdp, page);
    if (want('T2')) await T2(cdp, page);
  } catch (e) {
    log('!! LOI: ' + (e && e.stack || e));
    R.push({ id: 'FATAL', title: 'loi', data: String(e && e.message || e) });
  }
  // N2 can trinh duyet sach (khong cache) nen chay rieng
  if (want('N2')) { try { await N2(cdp); } catch (e) { log('!! N2 loi: ' + e.message); } }
  if (want('R2')) { try { await R2(cdp); } catch (e) { log('!! R2 loi: ' + e.message); } }

  writeFileSync('tools/qa-cdp2-report.json', JSON.stringify(R, null, 2), 'utf8');
  log('');
  log('Da ghi tools/qa-cdp2-report.json');
  cdp.close();
  try { proc.kill(); } catch { /* ignore */ }
}

/* --------- H2: sheet ro ri sang man khac — co bam duoc that khong? --------- */
async function H2(cdp, page) {
  await goto(cdp, page, `${BASE}/index.html#/reader`, { settle: 350 });
  const opened = await evalIn(cdp, page, `(function(){var t=document.querySelector('#screen .en');if(!t)return null;t.click();return t.innerText.trim();})()`);
  await sleep(450);
  const before = await evalIn(cdp, page, `(function(){var w=document.querySelector('#overlay .sheet');
    var sc=document.querySelector('#overlay .scrim');
    return {hasSheet:!!w, hasScrim:!!sc,
      scrimRect: sc?{t:Math.round(sc.getBoundingClientRect().top),l:Math.round(sc.getBoundingClientRect().left),w:Math.round(sc.getBoundingClientRect().width),h:Math.round(sc.getBoundingClientRect().height)}:null,
      overlayZ: getComputedStyle(document.querySelector('#overlay')).zIndex,
      focusInsideSheet: !!(document.activeElement&&document.activeElement.closest('.sheet'))};})()`);

  // (a) bam rail (nam NGOAI khung dien thoai -> scrim khong che duoc) bang chuot that
  const railBox = await evalIn(cdp, page, `(function(){var items=document.querySelectorAll('#rail-body .rail__item');
    for(var i=0;i<items.length;i++){if(/Ti\\u1ebfn \\u0111\\u1ed9/.test(items[i].innerText)){var b=items[i].getBoundingClientRect();
      return {x:Math.round(b.left+b.width/2),y:Math.round(b.top+b.height/2),label:items[i].innerText.trim().slice(0,30)};}}
    return null;})()`);
  let afterRail = null;
  if (railBox) {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: railBox.x, y: railBox.y, button: 'left', clickCount: 1 }, page.sid);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: railBox.x, y: railBox.y, button: 'left', clickCount: 1 }, page.sid);
    await sleep(700);
    afterRail = await evalIn(cdp, page, `(function(){var host=document.querySelector('#screen');
      var scr=host.getBoundingClientRect();
      var cx=Math.round(scr.left+scr.width/2), cy=Math.round(scr.top+120);
      var hit=document.elementFromPoint(cx,cy);
      var btn=host.querySelector('button');
      var bb=btn?btn.getBoundingClientRect():null;
      var hitOnBtn=null;
      if(bb){var h2=document.elementFromPoint(Math.round(bb.left+bb.width/2),Math.round(bb.top+bb.height/2));hitOnBtn=h2?((h2.className||'').toString().slice(0,30)||h2.tagName):null;}
      return {hash:location.hash, sheetStillOpen:!!document.querySelector('#overlay .sheet'),
        scrimStillThere:!!document.querySelector('#overlay .scrim'),
        topElementAtScreenCentre:hit?((hit.className||'').toString().slice(0,34)||hit.tagName):null,
        topElementOnFirstButton:hitOnBtn,
        screenTextStartsWith:host.innerText.replace(/\\s+/g,' ').slice(0,60)};})()`);
  }

  // (b) phim mui ten khi sheet dang mo (shortcut demo) co doi man khong
  await goto(cdp, page, `${BASE}/index.html#/reader`, { settle: 300 });
  await evalIn(cdp, page, `(function(){var t=document.querySelector('#screen .en');if(t)t.click();})()`);
  await sleep(400);
  const beforeArrow = await evalIn(cdp, page, `(function(){return {hash:location.hash, sheet:!!document.querySelector('.sheet')};})()`);
  await typeKey(cdp, page, 'ArrowRight', 'ArrowRight', 39);
  await sleep(600);
  const afterArrow = await evalIn(cdp, page, `(function(){return {hash:location.hash, sheet:!!document.querySelector('.sheet'), scrim:!!document.querySelector('.scrim')};})()`);

  // (c) Esc co don sach khong
  await typeKey(cdp, page, 'Escape', 'Escape', 27);
  await sleep(350);
  const afterEsc = await evalIn(cdp, page, `(function(){return {sheet:!!document.querySelector('.sheet'), scrim:!!document.querySelector('.scrim'), overlayChildren:document.querySelector('#overlay').children.length};})()`);

  report('H2', 'Sheet mo roi doi man: co that su bam duoc va co che man moi khong?', {
    openedWord: opened, stateWithSheet: before, railClick: railBox, afterRailClick: afterRail,
    arrowKey: { before: beforeArrow, after: afterArrow }, afterEsc,
    ketLuan: 'Neu sheetStillOpen=true sau khi doi man qua rail thi overlay khong duoc don khi router.render()',
  });
}

/* --------- I2: co khoa tieu diem trong dialog khong (aria-modal=true)? ------ */
async function I2(cdp, page) {
  await goto(cdp, page, `${BASE}/index.html#/reader`, { settle: 300 });
  await evalIn(cdp, page, `(function(){var t=document.querySelector('#screen .en');if(t)t.click();})()`);
  await sleep(450);
  const stops = [];
  for (let i = 0; i < 25; i += 1) {
    await typeKey(cdp, page, 'Tab', 'Tab', 9);
    const s = await evalIn(cdp, page, `(function(){var a=document.activeElement;if(!a)return null;
      return {inSheet:!!a.closest('.sheet'), tag:a.tagName, label:(a.getAttribute('aria-label')||a.innerText||'').replace(/\\s+/g,' ').trim().slice(0,28), inApp:!!a.closest('#screen')};})()`);
    stops.push(s);
  }
  const escaped = stops.filter((s) => s && !s.inSheet);
  report('I2', 'Dialog co aria-modal="true" nhung Tab co thoat ra ngoai khong?', {
    totalStops: stops.length,
    stopsInsideDialog: stops.filter((s) => s && s.inSheet).length,
    stopsOutsideDialog: escaped.length,
    firstEscapes: escaped.slice(0, 6),
  });
}

/* --------- J2: reduced-motion — do SAU KHI on dinh, va doc tung phan tu ---- */
async function J2(cdp, page) {
  const probe = `(function(){var root=getComputedStyle(document.documentElement);
    var host=document.querySelector('#screen');
    var anim=[],trans=0;
    var els=host.querySelectorAll('*');
    for(var i=0;i<els.length;i++){var cs=getComputedStyle(els[i]);
      var ad=parseFloat(cs.animationDuration)||0;var td=parseFloat(cs.transitionDuration)||0;
      if(cs.animationName!=='none')anim.push({cls:(els[i].className||'').toString().slice(0,28),name:cs.animationName,dur:ad,iter:cs.animationIterationCount});
      if(td>0.01)trans++;}
    var run=document.getAnimations().filter(function(a){return a.playState==='running';});
    return {dur:root.getPropertyValue('--dur').trim(),durSlow:root.getPropertyValue('--dur-slow').trim(),
      animDeclared:anim.length, animDetails:anim.slice(0,8), transitionsAbove1ms:trans,
      runningNow:run.length, runningAfterSettle:null, runningNames:run.slice(0,6).map(function(a){return a.animationName||'CSSTransition';})};})()`;
  const rows = [];
  const screens = ['home', 'speaking?state=recording', 'capture', 'splash', 'review-run'];
  await setReducedMotion(cdp, page, true);
  for (const s of screens) {
    await goto(cdp, page, `${BASE}/index.html#/${s}`, { settle: 300 });
    const immediate = await evalIn(cdp, page, probe);
    await sleep(1200);
    const settled = await evalIn(cdp, page, `(function(){var run=document.getAnimations().filter(function(a){return a.playState==='running';});
      return {runningAfterSettle:run.length, names:run.slice(0,6).map(function(a){return a.animationName||'CSSTransition';})};})()`);
    rows.push({ screen: s, immediate, settled });
  }
  await setReducedMotion(cdp, page, false);
  report('J2', 'reduced-motion (do lai sau 1.2s de transition 1ms ket thuc)', { rows });
}

/* --------- K2: tran ngang — co phai scroller ngang co y do khong? --------- */
async function K2(cdp, page) {
  const probe = `(function(){var host=document.querySelector('#screen');var scr=host.getBoundingClientRect();
    var bad=[];
    var all=host.querySelectorAll('*');
    for(var i=0;i<all.length;i++){var el=all[i];var b=el.getBoundingClientRect();
      if(b.width<2||b.height<2)continue;
      if(b.right<=scr.right+1.5&&b.left>=scr.left-1.5)continue;
      // tim to tien cuon ngang
      var p=el.parentElement,inScroller=false;
      while(p&&p!==host.parentElement){var ox=getComputedStyle(p).overflowX;
        if(ox==='auto'||ox==='scroll'||ox==='hidden'){inScroller=true;break;}p=p.parentElement;}
      bad.push({t:el.tagName+'.'+((el.className||'').toString().slice(0,24)),l:Math.round(b.left),r:Math.round(b.right),
        rig:Math.round(scr.right), over:Math.round(b.right-scr.right), inScroller:inScroller});}
    return {offenders:bad, hostOverflow:host.scrollWidth-host.clientWidth, docOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};})()`;
  const out = [];
  for (const [w, h] of [[375, 812], [1440, 900]]) {
    await setViewport(cdp, page, w, h, w < 800);
    const rows = [];
    for (const id of IDS) {
      await goto(cdp, page, `${BASE}/index.html#/${id}`, { settle: 120 });
      const r = await evalIn(cdp, page, probe);
      rows.push({ id, ...r });
    }
    out.push({
      width: w,
      realOverflow: rows.filter((r) => r.offenders.some((o) => !o.inScroller)).map((r) => ({ id: r.id, items: r.offenders.filter((o) => !o.inScroller) })),
      insideScroller: rows.filter((r) => r.offenders.length && r.offenders.every((o) => o.inScroller)).map((r) => r.id),
      docOverflowAll: rows.filter((r) => r.docOverflow > 1).map((r) => r.id),
    });
  }
  await clearViewport(cdp, page);
  report('K2', 'Tran ngang: phan biet scroller ngang co y do vs tran that', { out });
}

/* --------- O2: chi phi AI cua speaking/compose — tinh luc nao? ------------- */
async function O2(cdp, page) {
  // (a) vao #/speaking (khong thao tac gi) xem da bi tinh tien chua
  await goto(cdp, page, `${BASE}/index.html#/home`);
  await evalIn(cdp, page, '__SNAPLIFE__.cost.reset()');
  const steps = [];
  steps.push({ buoc: 'reset, dang o home', snap: await evalIn(cdp, page, '__SNAPLIFE__.cost.snapshot()') });
  await goto(cdp, page, `${BASE}/index.html#/speaking`, { settle: 200 });
  steps.push({ buoc: 'vua vao #/speaking (chua bam gi)', snap: await evalIn(cdp, page, '__SNAPLIFE__.cost.snapshot()') });
  const s1 = steps[1].snap;

  // (b) bam "Nho AI chinh lai" lan 1
  const b1 = await evalIn(cdp, page, `(function(){var bs=document.querySelectorAll('#screen button');
    for(var i=0;i<bs.length;i++){if(/Nh\\u1edd AI ch\\u1ec9nh l\\u1ea1i/.test(bs[i].innerText||'')){bs[i].click();return bs[i].innerText.trim();}}
    return null;})()`);
  await sleep(1500);
  const s2 = await evalIn(cdp, page, '__SNAPLIFE__.cost.snapshot()');
  const labels2 = await evalIn(cdp, page, `Array.prototype.map.call(document.querySelectorAll('#screen button'),function(b){return b.innerText.replace(/\\s+/g,' ').trim().slice(0,30);})`);

  // (c) bam "Nho AI chinh lan nua"
  const b2 = await evalIn(cdp, page, `(function(){var bs=document.querySelectorAll('#screen button');
    for(var i=0;i<bs.length;i++){if(/ch\\u1ec9nh l\\u1ea7n n\\u1eefa/i.test(bs[i].innerText||'')){bs[i].click();return bs[i].innerText.trim();}}
    return null;})()`);
  await sleep(1500);
  const s3 = await evalIn(cdp, page, '__SNAPLIFE__.cost.snapshot()');

  // (d) vao thang deep link ?state=corrected (README quang cao) — co tinh tien khong
  await evalIn(cdp, page, '__SNAPLIFE__.cost.reset()');
  await goto(cdp, page, `${BASE}/index.html#/speaking?state=corrected`, { settle: 300 });
  const s4 = await evalIn(cdp, page, '__SNAPLIFE__.cost.snapshot()');

  // (e) vao thang #/reader — co tinh tien LLM khong
  await evalIn(cdp, page, '__SNAPLIFE__.cost.reset()');
  await goto(cdp, page, `${BASE}/index.html#/reader`, { settle: 300 });
  const s5 = await evalIn(cdp, page, '__SNAPLIFE__.cost.snapshot()');

  // (f) vao thang #/capture roi #/regions — VLM tinh o man nao
  await evalIn(cdp, page, '__SNAPLIFE__.cost.reset()');
  await goto(cdp, page, `${BASE}/index.html#/capture`, { settle: 250 });
  const capSnap = await evalIn(cdp, page, '__SNAPLIFE__.cost.snapshot()');
  await goto(cdp, page, `${BASE}/index.html#/regions`, { settle: 250 });
  const regSnap = await evalIn(cdp, page, '__SNAPLIFE__.cost.snapshot()');

  report('O2', 'Cost Meter tinh luc nao: vao man hay luc nguoi dung bam?', {
    speaking_vao_man: { vlm: s1.totals.vlm, llm: s1.totals.llm, ledger: s1.ledger.map((l) => l.key || l.label) },
    speaking_click_lan1: { button: b1, llm: s2.totals.llm, apiCalls: s2.apiCalls, labelsSauClick: labels2.slice(0, 12) },
    speaking_click_lan_nua: { button: b2, llm: s3.totals.llm, ledger: s3.ledger.map((l) => l.key || l.label) },
    deeplink_corrected_vao_man: { llm: s4.totals.llm, apiCalls: s4.apiCalls, ledger: s4.ledger.map((l) => l.key || l.label) },
    deeplink_reader_vao_man: { llm: s5.totals.llm, apiCalls: s5.apiCalls, ledger: s5.ledger.map((l) => l.key || l.label) },
    capture_roi_regions: { taiCapture: capSnap.totals.vlm, taiRegions: regSnap.totals.vlm },
  });
}

/* --------- P2: bbox hien thi vs toa do trong store (ghep theo thu tu) ------ */
async function P2(cdp, page) {
  await goto(cdp, page, `${BASE}/index.html#/regions`, { settle: 350 });
  const out = await evalIn(cdp, page, `(function(){
    var host=document.querySelector('#screen');
    var boxes=Array.prototype.slice.call(host.querySelectorAll('.bbox'));
    var cards=Array.prototype.slice.call(host.querySelectorAll('section.b-wordcard'));
    var st=window.__SNAPLIFE__.store.state.capture||{};
    var regs=st.regions||[];
    var img=host.querySelector('.photo-frame img')||host.querySelector('.photo-frame');
    var ir=img?img.getBoundingClientRect():null;
    var checks=[];
    for(var i=0;i<boxes.length;i++){
      var b=boxes[i].getBoundingClientRect();
      var r=regs[i];
      if(!r||!ir)continue;
      var ex={l:ir.left+ir.width*(r.x/100),t:ir.top+ir.height*(r.y/100),w:ir.width*(r.w/100),h:ir.height*(r.h/100)};
      checks.push({i:i, key:boxes[i].dataset.key, wordId:r.wordId,
        dLeft:Math.round((b.left-ex.l)*10)/10, dTop:Math.round((b.top-ex.t)*10)/10,
        dWidth:Math.round((b.width-ex.w)*10)/10, dHeight:Math.round((b.height-ex.h)*10)/10});
    }
    return {photoRect: ir?{w:Math.round(ir.width),h:Math.round(ir.height),ratio:Math.round(ir.width/ir.height*100)/100}:null,
      boxCount:boxes.length, cardCount:cards.length, regionCount:regs.length,
      boxLabels:boxes.map(function(b){return (b.innerText||'').replace(/\\s+/g,' ').trim().slice(0,16);}),
      cardLabelKey:cards.map(function(c){return c.dataset.key;}),
      cardEn:cards.map(function(c){var e=c.querySelector('.b-wordcard__en');return e?e.innerText.trim():null;}),
      cardCoordText:cards.map(function(c){var e=c.querySelector('.b-wordcard__coord');return e?e.innerText.trim():null;}),
      storeCoords:regs.map(function(r){return 'x '+Math.round(r.x)+'% y '+Math.round(r.y)+'% '+Math.round(r.w)+'x'+Math.round(r.h)+'%';}),
      geometryDeltas:checks};})()`);
  report('P2', 'regions: so vung vs so the tu; bbox DOM vs toa do % trong store', out);
}

/* --------- E2: bo tung tu roi kiem nut CTA + luu trang thai ---------------- */
async function E2(cdp, page) {
  await goto(cdp, page, `${BASE}/index.html#/regions`, { settle: 320 });
  const cta = await evalIn(cdp, page, `(function(){var bs=document.querySelectorAll('#screen button');
    for(var i=0;i<bs.length;i++){var t=(bs[i].innerText||'').replace(/\\s+/g,' ').trim();if(/^H\\u1ecdc v\\u1edbi|Ch\\u01b0a gi\\u1eef/.test(t))return {label:t,disabled:bs[i].disabled};}return null;})()`);
  const legend0 = await evalIn(cdp, page, `(function(){var l=document.querySelector('#screen .label');var els=document.querySelectorAll('#screen .label');
    for(var i=0;i<els.length;i++){if(/\\u0111ang gi\\u1eef/.test(els[i].innerText))return els[i].innerText.trim();}return null;})()`);
  // bam "Bo" trong tung the
  const dropped = [];
  for (let i = 0; i < 5; i += 1) {
    const r = await evalIn(cdp, page, `(function(){var cards=document.querySelectorAll('#screen section.b-wordcard');
      var cardsArr=Array.prototype.slice.call(cards);
      for(var i=0;i<cardsArr.length;i++){
        var bs=cardsArr[i].querySelectorAll('button');
        for(var j=0;j<bs.length;j++){if(bs[j].innerText.trim()==='B\\u1ecf'){bs[j].click();return cardsArr[i].getAttribute('aria-label');}}}
      return null;})()`);
    dropped.push(r);
    await sleep(320);
    if (!r) break;
  }
  const afterAll = await evalIn(cdp, page, `(function(){var bs=document.querySelectorAll('#screen button');
    var out=null;for(var i=0;i<bs.length;i++){var t=(bs[i].innerText||'').replace(/\\s+/g,' ').trim();if(/^H\\u1ecdc v\\u1edbi|Ch\\u01b0a gi\\u1eef/.test(t))out={label:t,disabled:bs[i].disabled};}
    var host=document.querySelector('#screen');
    return {cta:out, cardsLeft:host.querySelectorAll('section.b-wordcard').length,
      restoreRows:host.querySelectorAll('.b-restore').length,
      removed:(window.__SNAPLIFE__.store.state.capture||{}).removed,
      reasonText: (host.innerText.match(/Gi\\u1eef l\\u1ea1i \\u00edt nh\\u1ea5t[^\\n]*/)||[null])[0]};})()`);
  // quay lai man khac roi ve
  await goto(cdp, page, `${BASE}/index.html#/wordlist`, { settle: 150 });
  await goto(cdp, page, `${BASE}/index.html#/regions`, { settle: 250 });
  const afterTrip = await evalIn(cdp, page, `(function(){var bs=document.querySelectorAll('#screen button');
    var out=null;for(var i=0;i<bs.length;i++){var t=(bs[i].innerText||'').replace(/\\s+/g,' ').trim();if(/^H\\u1ecdc v\\u1edbi|Ch\\u01b0a gi\\u1ef1|Ch\\u01b0a gi\\u1eef/.test(t))out={label:t,disabled:bs[i].disabled};}
    return {cta:out, cardsLeft:document.querySelectorAll('#screen section.b-wordcard').length,
      restoreRows:document.querySelectorAll('#screen .b-restore').length,
      removed:(window.__SNAPLIFE__.store.state.capture||{}).removed};})()`);
  report('E2', 'regions: Bo het tu -> CTA co disable + ly do? Trang thai co giu qua man khac?', {
    ctaBanDau: cta, legendBanDau: legend0, daBamBo: dropped, sauKhiBoHet: afterAll, sauKhiQuayLai: afterTrip,
  });
}

/* --------- A2: hop dong chrome: tabbar theo BUILD-SPEC §5 ------------------ */
async function A2(cdp, page) {
  const rows = [];
  for (const id of IDS) {
    await goto(cdp, page, `${BASE}/index.html#/${id}`, { settle: 110 });
    const r = await evalIn(cdp, page, `(function(){var s=window.__SNAPLIFE__;var h=location.hash.replace('#/','').split('?')[0]||'home';
      var scr=s.screens.filter(function(x){return x.id===h;})[0];
      return {chrome:scr?scr.chrome:null, tabbar:getComputedStyle(document.querySelector('#tabbar')).display!=='none'};})()`);
    rows.push({ id, ...r });
  }
  const expectedTabbar = ['home', 'wordlist', 'reader', 'stories', 'review-hub', 'progress'];
  const mismatch = rows.filter((r) => expectedTabbar.includes(r.id) !== r.tabbar);
  report('A2', 'Chrome/tabbar co khop BUILD-SPEC §5 khong?', {
    expectedTabbarScreens: expectedTabbar,
    actualTabbarScreens: rows.filter((r) => r.tabbar).map((r) => r.id),
    mismatches: mismatch.map((r) => `${r.id}: chrome=${r.chrome} tabbar=${r.tabbar}`),
  });
}

/* --------- T2: nut bam trong the tu co dieu huong dung khong -------------- */
async function T2(cdp, page) {
  // Kiem "moi vung = 1 the tu": so bbox == so the, va nhan tren bbox trung tu trong the
  await goto(cdp, page, `${BASE}/index.html#/regions`, { settle: 300 });
  const r = await evalIn(cdp, page, `(function(){
    var boxes=document.querySelectorAll('#screen .bbox');
    var cards=document.querySelectorAll('#screen section.b-wordcard');
    var boxText=Array.prototype.map.call(boxes,function(b){return (b.innerText||'').replace(/^\\d+\\.\\s*/,'').trim();});
    var cardText=Array.prototype.map.call(cards,function(c){var e=c.querySelector('.b-wordcard__en');return e?e.innerText.trim():null;});
    return {boxes:boxes.length, cards:cards.length, boxText:boxText, cardText:cardText,
      oneToOne: boxes.length===cards.length && boxText.every(function(t,i){return t===cardText[i];})};})()`);
  // bam vao mot vung -> co nhay toi the tuong ung khong
  const jump = await evalIn(cdp, page, `(function(){var b=document.querySelectorAll('#screen .bbox')[1];if(!b)return null;
    var key=b.dataset.key;b.click();
    var card=document.querySelector('#screen section.b-wordcard[data-key="'+key+'"]');
    var host=document.querySelector('#screen');
    var sb=host.scrollTop; var cr=card?card.getBoundingClientRect():null; var hr=host.getBoundingClientRect();
    return {key:key, scrollTop:sb, cardTop:cr?Math.round(cr.top-hr.top):null, highlighted: card?(card.className.indexOf('is-active')>=0||card.className.indexOf('is-focus')>=0):null};})()`);
  await sleep(500);
  const afterJump = await evalIn(cdp, page, `(function(){var w=document.querySelector('#screen section.b-wordcard.is-active,#screen section.b-wordcard.is-focus,#screen section.b-wordcard[aria-current]');
    return {activeCard:!!w, cls:w?w.className:null, scrollTop:document.querySelector('#screen').scrollTop};})()`);
  report('T2', 'regions: 1 vung ↔ 1 the tu, va bam vung co nhay toi the?', { oneToOne: r, jumpClick: jump, afterJump });
}

/* --------- N2: web font khi MAT MANG THAT (cache tat, profile sach) ------- */
async function N2(cdp) {
  const fresh = await launch({ port: 9413 });
  const cdp2 = await new CDP(fresh.ver.webSocketDebuggerUrl).connect();
  const p = await openPage(cdp2, 'about:blank');
  await cdp2.send('Network.setCacheDisabled', { cacheDisabled: true }, p.sid);
  await cdp2.send('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] }, p.sid);
  await goto(cdp2, p, `${BASE}/index.html#/home`, { settle: 500 });
  await sleep(1500);
  const blocked = await evalIn(cdp2, p, `(function(){
    var pick=function(sel){var e=document.querySelector(sel);if(!e)return null;var cs=getComputedStyle(e);
      return {sel:sel, text:(e.innerText||'').slice(0,34), fontFamily:cs.fontFamily, fontSize:cs.fontSize, w:Math.round(e.getBoundingClientRect().width)};};
    return {fontsStatus:document.fonts.status, fontsSize:document.fonts.size,
      checkCalistoga:document.fonts.check('20px Calistoga'), checkInter:document.fonts.check('15px Inter'),
      checkNewsreader:document.fonts.check('19px Newsreader'), checkMono:document.fonts.check('12px "JetBrains Mono"'),
      title:pick('#screen .h1')||pick('#screen h1')||pick('#screen .h2'),
      read:pick('#screen .read')||pick('#screen .interleave')||pick('#screen p'),
      ready:document.documentElement.dataset.ready, boot:document.documentElement.getAttribute('data-boot-errors'),
      docHeight:document.documentElement.scrollHeight,
      failedRequests: performance.getEntriesByType('resource').filter(function(r){return /fonts\\./.test(r.name);}).map(function(r){return {u:r.name.slice(0,60), size:r.transferSize, dur:Math.round(r.duration)};})};})()`);
  // so sanh voi khi co mang
  const p2 = await openPage(cdp2, 'about:blank');
  await cdp2.send('Network.setCacheDisabled', { cacheDisabled: true }, p2.sid);
  await goto(cdp2, p2, `${BASE}/index.html#/home`, { settle: 500 });
  await sleep(1500);
  const normal = await evalIn(cdp2, p2, `(function(){
    var pick=function(sel){var e=document.querySelector(sel);if(!e)return null;var cs=getComputedStyle(e);
      return {sel:sel, text:(e.innerText||'').slice(0,34), fontFamily:cs.fontFamily, fontSize:cs.fontSize, w:Math.round(e.getBoundingClientRect().width)};};
    return {fontsStatus:document.fonts.status, fontsSize:document.fonts.size,
      checkCalistoga:document.fonts.check('20px Calistoga'), checkInter:document.fonts.check('15px Inter'),
      checkNewsreader:document.fonts.check('19px Newsreader'), checkMono:document.fonts.check('12px "JetBrains Mono"'),
      title:pick('#screen .h1')||pick('#screen h1')||pick('#screen .h2'),
      read:pick('#screen .read')||pick('#screen .interleave')||pick('#screen p'),
      docHeight:document.documentElement.scrollHeight};})()`);
  report('N2', 'Mat mang THAT (cache tat + profile sach + chan CDN font)', {
    coMang: normal, chanCdn: blocked,
    titleWidthDelta: (normal.title && blocked.title) ? blocked.title.w - normal.title.w : null,
    docHeightDelta: blocked.docHeight - normal.docHeight,
  });
  cdp2.close();
  try { fresh.proc.kill(); } catch { /* ignore */ }
}

/* --------- R2: theme toi — render MOI trong theme toi + do tuong phan ----- */
async function R2(cdp) {
  const p = await openPage(cdp, `${BASE}/index.html#/home`);
  await waitReady(cdp, p); await sleep(400);
  await evalIn(cdp, p, "localStorage.setItem('snaplife.theme','dark')");
  const rows = [];
  for (const id of IDS) {
    await goto(cdp, p, `${BASE}/index.html#/${id}`, { settle: 130 });
    const r = await evalIn(cdp, p, `(function(){
      var cs=getComputedStyle(document.documentElement);
      var paper=cs.getPropertyValue('--paper').trim();
      var host=document.querySelector('#screen');
      function lum(c){var m=c.match(/\\d+/g);if(!m)return null;var a=m.slice(0,3).map(function(v){v=+v/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2];}
      function ratio(f,b){var l1=lum(f),l2=lum(b);if(l1===null||l2===null)return null;var hi=Math.max(l1,l2),lo=Math.min(l1,l2);return Math.round(((hi+0.05)/(lo+0.05))*100)/100;}
      var samples=[];
      var els=host.querySelectorAll('.h1,.h2,.h3,.label,.read,.muted,.muted-2,.b-wordcard__vi,.wordrow__vi');
      for(var i=0;i<els.length&&samples.length<6;i++){var e=els[i];var c=getComputedStyle(e);
        samples.push({cls:(e.className||'').toString().slice(0,20),color:c.color,fontSize:c.fontSize,
          contrastOnPaper: ratio(c.color, window.getComputedStyle(document.body).backgroundColor||'rgb(255,255,255)')});}
      var bodyBg=getComputedStyle(document.body).backgroundColor;
      return {theme:document.documentElement.dataset.theme, paperToken:paper, bodyBg:bodyBg,
        ready:document.documentElement.dataset.ready, boot:document.documentElement.getAttribute('data-boot-errors'),
        overflowX:host.scrollWidth-host.clientWidth, samples:samples};})()`);
    rows.push({ id, ...r });
  }
  const lightRef = await evalIn(cdp, p, `getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()`);
  report('R2', 'Theme toi: render MOI trong theme toi (localStorage + reload)', {
    paperTokenSauKhiDoiDark: lightRef,
    tatCa20ManDeuDark: rows.every((r) => r.theme === 'dark'),
    coLoiBoot: rows.filter((r) => r.boot).map((r) => r.id),
    tranNgang: rows.filter((r) => r.overflowX > 1).map((r) => r.id),
    mauMau: rows.slice(0, 4).map((r) => ({ id: r.id, paper: r.paperToken, bodyBg: r.bodyBg, samples: r.samples.slice(0, 3) })),
  });
  await evalIn(cdp, p, "localStorage.setItem('snaplife.theme','light')");
}

main().catch((e) => { console.error('FATAL: ' + (e && e.stack || e)); process.exit(1); });
