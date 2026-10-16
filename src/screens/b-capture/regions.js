/* ============================================================================
   Màn hình 07 · regions — Khoanh vùng & thẻ từ  (ĐIỂM QUYẾT ĐỊNH của deck tr.04)

   Nguyên tắc bất di bất dịch: MỘT VÙNG KHOANH = ĐÚNG MỘT TỪ.
   Ảnh luôn được render trong khung VUÔNG 1:1 để toạ độ % khớp 1:1 với ảnh 900×900.
   Vùng của người dùng tự khoanh luôn được ưu tiên hơn vùng AI gợi ý.
   Owner: screens-capture  |  phạm vi ghi: src/screens/b-capture/**
   ========================================================================== */

import { h, clear, prefersReducedMotion } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';
import { cefrTone, statusMeta, wordMatches, overlapArea } from './_shared.js';

const DEFAULT_PHOTO = 'morning-desk';
const DEFAULT_PHOTO_LABEL = 'bàn cà phê buổi sáng';

/* Chỗ trống thử lần lượt khi cần đặt vùng mới (theo % của khung vuông). */
const FREE_SPOTS = [
  { x: 8, y: 8 },
  { x: 62, y: 8 },
  { x: 8, y: 36 },
  { x: 60, y: 40 },
  { x: 32, y: 44 },
];

/* Từ hợp với cảnh bàn cà phê buổi sáng — gợi ý đầu tiên khi tự khoanh thêm. */
const PREFERRED_WORDS = ['sip', 'groggy', 'ritual', 'windowsill', 'ceramic', 'commute', 'drizzle'];

export default {
  id: 'regions',
  title: 'Khoanh vùng & thẻ từ',
  group: 'b-capture',
  chrome: 'appbar',
  api: [{ key: 'vlm:morning-desk', kind: 'vlm', label: 'Nhận diện ảnh & Bbox', n: 1 }],
  notes: [
    'Dùng cùng khoá chi phí với màn Chụp (vlm:morning-desk) nên đi từ Chụp sang đây bộ đếm vẫn là 1 — đây chính là bằng chứng "một ảnh gọi mô hình đúng một lần" của deck tr.09.',
    'Ảnh là nhân vật chính: khung vuông 1:1, tràn gần hết chiều ngang, ba vùng gợi ý nằm trên đúng ba đồ vật (ca gốm trái-dưới, tai nghe phải-giữa, cuốn sổ phải-dưới).',
    'Mỗi vùng sinh đúng một thẻ từ đầy đủ: từ · IPA (font mono) · CEFR · nghĩa Việt · ví dụ + bản dịch · nút nghe. Không vùng nào có nghĩa rỗng, nên không có thẻ từ trống.',
    'Vùng "Bỏ" chuyển sang nét đứt và thẻ chuyển thành dải mờ có nút Hoàn tác — người dùng không bao giờ mất dấu thứ mình vừa bỏ, và luôn phải giữ lại ít nhất một từ.',
    'Giữ/Bỏ là segmented hai trạng thái trên từng thẻ; vùng khoanh cũng bấm được để nhảy tới thẻ tương ứng, kéo để chỉnh, hoặc dùng phím mũi tên khi vùng đang có tiêu điểm.',
  ],

  render(ctx) {
    const data = ctx.data;
    const reduce = prefersReducedMotion();
    const words = ctx.store.get('words', data.words) || data.words;
    const wordOf = (id) => words.find((w) => w.id === id) || data.wordById(id) || null;

    /* ------------------------- Nạp trạng thái vùng ------------------------- */
    let st = ctx.store.get('capture', {}) || {};
    const photo = data.photoById(ctx.params.photo || st.photoId || DEFAULT_PHOTO);
    if (st.initPhotoId !== photo.id || !Array.isArray(st.regions)) {
      st = {
        ...st,
        photoId: photo.id,
        initPhotoId: photo.id,
        regions: (photo.regions || []).map((r) => ({ ...r })),
        removed: [],
        userRegions: [],
      };
      ctx.store.set('capture', st);
    }

    let regions = (st.regions || []).map((r, i) => ({ ...r, key: `ai-${i}` }));
    let userRegions = (st.userRegions || []).map((r, i) => ({
      ...r,
      key: r.key || `user-${i}`,
      source: 'user',
    }));
    let removed = Array.isArray(st.removed) ? st.removed.slice() : [];
    let focused = null;
    let userSeq = 0;

    const allRegions = () => [...regions, ...userRegions];
    const activeRegions = () => allRegions().filter((r) => !removed.includes(r.key));
    const isKept = (key) => !removed.includes(key);

    const persist = () => {
      ctx.store.set('capture.regions', regions.map(({ key, ...rest }) => rest));
      ctx.store.set('capture.removed', removed.slice());
      ctx.store.set('capture.userRegions', userRegions.map((r) => ({ ...r })));
    };

    /* ------------------------ Vùng mới: từ + vị trí ------------------------ */
    const nextFreeWord = () => {
      const used = new Set(activeRegions().map((r) => r.wordId));
      const preferred = PREFERRED_WORDS.map(wordOf).filter((w) => w && !used.has(w.id));
      return preferred[0] || words.find((w) => !used.has(w.id)) || null;
    };

    const freeSpot = (w = 26, hgt = 26) => {
      const taken = activeRegions();
      const fits = (cand) => taken.every((t) => overlapArea(cand, t) < 0.2 * cand.w * cand.h);
      const cand = FREE_SPOTS.map((p) => ({ x: p.x, y: p.y, w, h: hgt })).find(fits);
      return cand || { x: 30, y: 46, w, h: hgt };
    };

    /* -------------------------------- DOM --------------------------------- */
    const bar = ui.appBar({
      title: 'Khoanh vùng',
      sub: '',
      back: true,
      actions: [
        ui.iconBtn('plus', { label: 'Tự khoanh thêm một vùng', onClick: () => addUserRegion() }),
        ui.iconBtn('pencil', { label: 'Thêm từ bằng tay', onClick: () => openManualSheet() }),
      ],
    });
    const subNode = bar.querySelector('.appbar__sub');

    const headHost = h('div');
    const photoHost = h('div.b-regions__photo');
    const toolbarHost = h('div');
    const legendHost = h('div');
    const listHost = h('div.stack.stack--loose');
    const ctaHost = h('div.screen__cta');

    /* Ghi chú: không cần chặn phím mũi tên ở đây nữa. app.js đã bỏ qua phím
       điều hướng khi target nằm trong .bbox (kèm test hồi quy ở tools/flows.js),
       nên ArrowLeft/ArrowRight chỉ còn tác dụng dịch vùng khoanh. */

    const nodes = new Map(); // key → { box, card, coord }

    /* ---------------------------- Vẽ khung ảnh ---------------------------- */
    function paintPhoto() {
      clear(photoHost);
      nodes.forEach((n) => { n.box = null; });

      const boxes = allRegions().map((r, i) => {
        const w = wordOf(r.wordId);
        const kept = isKept(r.key);
        const isUser = r.source === 'user';
        const name = w ? w.en : r.wordId;
        const box = ui.bbox(r, {
          label: `${i + 1}. ${name}`,
          state: !kept ? 'off' : isUser ? 'user' : 'on',
          grip: kept,
          ariaLabel: `Vùng ${i + 1}: ${name}${kept ? '' : ' — đã bỏ'}. Kéo để di chuyển, dùng phím mũi tên để chỉnh vị trí.`,
          onTap: () => focusRegion(r.key),
          onChange: (next) => moveRegion(r.key, next),
        });
        box.dataset.key = r.key;
        const prev = nodes.get(r.key) || {};
        nodes.set(r.key, { ...prev, box });
        return box;
      });

      photoHost.appendChild(
        ui.photoFrame({
          src: photo.src,
          alt: photo.alt,
          ratio: 'square',
          className: 'b-regions__frame',
          children: boxes,
        })
      );
      if (focused) nodes.get(focused)?.box?.classList.add('is-focused');
    }

    /* ----------------------------- Thanh công cụ --------------------------- */
    function paintToolbar() {
      clear(toolbarHost);
      toolbarHost.appendChild(
        h('div.b-regions__tools', {},
          ui.button({
            label: 'Tự khoanh thêm',
            icon: 'plus',
            variant: 'soft',
            size: 'sm',
            onClick: () => addUserRegion(),
          }),
          ui.button({
            label: 'Thêm từ bằng tay',
            icon: 'pencil',
            variant: 'secondary',
            size: 'sm',
            onClick: () => openManualSheet(),
          })
        )
      );
    }

    /* -------------------------------- Chú giải ----------------------------- */
    function paintLegend() {
      clear(legendHost);
      const chips = allRegions().map((r, i) => {
        const w = wordOf(r.wordId);
        return ui.chip({
          label: `${i + 1} · ${w ? w.en : r.wordId}`,
          selected: isKept(r.key),
          onClick: () => {
            if (!isKept(r.key)) toggleKeep(r.key);
            else focusRegion(r.key);
          },
        });
      });
      legendHost.appendChild(
        h('div.stack.stack--tight', {},
          h('div.row.row--between', {},
            h('span.label', {}, `Vùng khoanh · ${activeRegions().length}/${allRegions().length} đang giữ`),
            h('span.badge.badge--primary', {}, 'VLM 1×')),
          ui.chipRow(chips, { scroller: true })
        )
      );
    }

    /* ------------------------------- Thẻ từ -------------------------------- */
    const coordText = (r) =>
      `x ${Math.round(r.x)}% · y ${Math.round(r.y)}% · ${Math.round(r.w)}×${Math.round(r.h)}%`;

    function wordCard(w, r, index) {
      const meta = statusMeta(w.status);
      const card = h(
        'section.b-wordcard.card',
        { 'data-key': r.key, 'aria-label': `Thẻ từ ${index + 1}: ${w.en}` },
        h('div.b-wordcard__top', {},
          h('div.grow', {},
            h('div.b-wordcard__en', {}, w.en),
            h('div.b-wordcard__ipa.mono', {}, `/${w.ipa}/`)),
          ui.audioButton({ text: w.en, label: `Nghe phát âm ${w.en}` })),
        h('div.b-wordcard__vi', {}, w.vi),
        h('div.b-wordcard__tags', {},
          ui.badge(w.cefr, cefrTone(w.cefr)),
          ui.badge(w.pos, 'outline'),
          ui.badge(
            r.source === 'user' ? 'Bạn tự khoanh' : `AI · ${Math.round((r.confidence || 0.9) * 100)}%`,
            r.source === 'user' ? 'success' : 'info'
          ),
          ui.badge(meta.label, meta.tone)),
        h('div.b-wordcard__ex', {},
          h('div.row.row--between', {},
            h('span.label', {}, 'Ví dụ'),
            ui.audioButton({ text: w.example, label: `Nghe câu ví dụ: ${w.example}` })),
          h('p.b-wordcard__ex-en', {}, w.example),
          h('p.b-wordcard__ex-vi', {}, w.exampleVi)),
        h('p.b-wordcard__coord.mono', {}, coordText(r)),
        h('div.b-wordcard__foot', {},
          ui.segmented({
            ariaLabel: `Giữ hay bỏ vùng của từ ${w.en}`,
            value: 'keep',
            options: [
              { value: 'keep', label: 'Giữ' },
              { value: 'drop', label: 'Bỏ' },
            ],
            onChange: (value) => {
              if (value === 'drop') toggleKeep(r.key);
            },
          }),
          ui.button({
            label: 'Mở thẻ từ',
            variant: 'ghost',
            size: 'sm',
            iconRight: 'arrow-right',
            onClick: () => ctx.nav.go('worddetail', { word: w.id }),
          }))
      );
      card.addEventListener('pointerenter', () => {
        nodes.get(r.key)?.box?.classList.add('is-hover');
      });
      card.addEventListener('pointerleave', () => {
        nodes.get(r.key)?.box?.classList.remove('is-hover');
      });
      return card;
    }

    function restoreRow(r, index) {
      const w = wordOf(r.wordId);
      return h(
        'div.b-restore',
        {},
        h('span.b-restore__n.mono', {}, String(index + 1)),
        h('div.grow', {},
          h('div.b-restore__en', {}, w ? w.en : r.wordId),
          h('div.b-restore__note', {}, w ? `Đã bỏ khỏi lượt học · ${w.vi}` : 'Đã bỏ khỏi lượt học')),
        ui.button({
          label: 'Hoàn tác',
          variant: 'secondary',
          size: 'sm',
          icon: 'rotate-ccw',
          onClick: () => toggleKeep(r.key),
        })
      );
    }

    function paintList() {
      clear(listHost);
      nodes.forEach((n) => { n.card = null; n.coord = null; });

      if (!allRegions().length) {
        listHost.appendChild(
          ui.empty({
            iconName: 'scan',
            title: 'Chưa có vùng khoanh nào',
            body: 'Ảnh này chưa có vùng gợi ý. Bấm "Tự khoanh thêm" để tự khoanh đồ vật đầu tiên, hoặc "Thêm từ bằng tay" để chọn từ trước.',
            action: ui.button({ label: 'Tự khoanh thêm', icon: 'plus', onClick: () => addUserRegion() }),
          })
        );
        return;
      }

      const kept = allRegions().filter((r) => isKept(r.key));
      const dropped = allRegions().filter((r) => !isKept(r.key));

      listHost.appendChild(
        ui.sectionTitle(`Thẻ từ theo từng vùng · ${kept.length} từ`, h('span.label', {}, 'IPA · CEFR · ví dụ · audio'))
      );

      kept.forEach((r) => {
        const w = wordOf(r.wordId);
        if (!w) return;
        const card = wordCard(w, r, allRegions().indexOf(r));
        const coord = card.querySelector('.b-wordcard__coord');
        nodes.set(r.key, { ...(nodes.get(r.key) || {}), card, coord });
        listHost.appendChild(card);
      });

      if (dropped.length) {
        listHost.appendChild(
          h('div.stack.stack--tight', {},
            h('span.label', {}, `Đã bỏ · ${dropped.length}`),
            ...dropped.map((r) => restoreRow(r, allRegions().indexOf(r))))
        );
      }

      if (!kept.length) {
        listHost.appendChild(
          ui.callout({
            tone: 'warning',
            iconName: 'alert-triangle',
            title: 'Đang bỏ hết từ',
            body: 'Giữ lại ít nhất một vùng để bắt đầu học.',
          })
        );
      }
    }

    /* ------------------------------ CTA cuối ------------------------------- */
    function paintCta() {
      clear(ctaHost);
      const n = activeRegions().length;
      ctaHost.appendChild(
        ui.button({
          label: n ? `Học với ${n} từ này` : 'Chưa giữ từ nào',
          icon: n ? 'arrow-right' : undefined,
          block: true,
          disabled: n === 0,
          onClick: () => ctx.nav.go('wordlist', { from: 'regions' }),
        })
      );
    }

    function paintHead() {
      clear(headHost);
      const active = activeRegions().length;
      if (subNode) subNode.textContent = `${photo.caption} · ${active} vùng · ${active} từ`;

      const noAiRegions = (photo.regions || []).length === 0;
      headHost.appendChild(
        ui.callout({
          iconName: noAiRegions ? 'info' : 'sparkles',
          title: noAiRegions ? 'Ảnh này chưa có vùng gợi ý' : 'Mỗi vùng khoanh = đúng một từ',
          body: noAiRegions
            ? h('div.stack.stack--tight', {},
                h('div', {}, 'AI chưa nhận ra đồ vật nào trong ảnh này. Bạn tự khoanh nhé — vùng bạn tự khoanh luôn được ưu tiên hơn vùng AI gợi ý.'),
                ui.button({
                  label: `Quay lại ảnh ${DEFAULT_PHOTO_LABEL}`,
                  variant: 'secondary',
                  size: 'sm',
                  icon: 'rotate-ccw',
                  onClick: () => {
                    ctx.store.set('capture.photoId', DEFAULT_PHOTO);
                    ctx.store.set('capture.initPhotoId', null);
                    ctx.nav.replace('regions');
                  },
                }))
            : 'AI trả về 3 vùng trong một lần gọi mô hình. Kéo vùng để chỉnh, hoặc chạm vào vùng để nhảy tới thẻ từ tương ứng.',
        })
      );
    }

    /* ------------------------------ Hành vi -------------------------------- */
    function paint() {
      paintHead();
      paintPhoto();
      paintToolbar();
      paintLegend();
      paintList();
      paintCta();
      if (focused) focusRegion(focused, false);
    }

    function focusRegion(key, scroll = true) {
      focused = key;
      nodes.forEach((n, k) => {
        n.box?.classList.toggle('is-focused', k === key);
        n.card?.classList.toggle('is-focused', k === key);
      });
      const target = nodes.get(key);
      if (scroll && target?.card) {
        target.card.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      }
    }

    function moveRegion(key, next) {
      const target = allRegions().find((r) => r.key === key);
      if (!target) return;
      Object.assign(target, { x: next.x, y: next.y, w: next.w, h: next.h });
      persist();
      const coord = nodes.get(key)?.coord;
      if (coord) coord.textContent = coordText(target);
    }

    function toggleKeep(key) {
      const target = allRegions().find((r) => r.key === key);
      if (!target) return;
      const w = wordOf(target.wordId);
      if (isKept(key)) {
        if (activeRegions().length <= 1) {
          ui.toast('Cần giữ ít nhất một từ để bắt đầu học', { tone: 'danger', iconName: 'alert-triangle' });
          return;
        }
        removed = [...removed, key];
        ui.toast(`Đã bỏ "${w ? w.en : target.wordId}" khỏi lượt học`, { iconName: 'x-circle' });
      } else {
        removed = removed.filter((k) => k !== key);
        ui.toast(`Đã giữ lại "${w ? w.en : target.wordId}"`, { tone: 'success', iconName: 'check-circle' });
      }
      persist();
      paint();
    }

    function addRegionFor(word, focusIt = true) {
      if (!word) {
        ui.toast('Bạn đã dùng hết từ trong kho', { tone: 'danger', iconName: 'alert-triangle' });
        return null;
      }
      userSeq += 1;
      const spot = freeSpot();
      const region = {
        key: `user-${Date.now()}-${userSeq}`,
        wordId: word.id,
        x: spot.x,
        y: spot.y,
        w: spot.w,
        h: spot.h,
        source: 'user',
      };
      userRegions = [...userRegions, region];
      removed = removed.filter((k) => k !== region.key);
      persist();
      paint();
      if (focusIt) focusRegion(region.key);
      return region;
    }

    function addUserRegion() {
      const word = nextFreeWord();
      const region = addRegionFor(word);
      if (!region) return;
      ui.toast(`Đã thêm vùng cho "${word.en}" — kéo cho khớp đồ vật nhé`, {
        tone: 'success',
        iconName: 'move-3d',
        ms: 3000,
      });
    }

    function openManualSheet() {
      const used = new Set(activeRegions().map((r) => r.wordId));
      let query = '';

      const input = h('input.b-search__input', {
        type: 'search',
        placeholder: 'Tìm "sip" hoặc "nhấp một ngụm"…',
        'aria-label': 'Tìm từ để thêm bằng tay',
        autocomplete: 'off',
      });
      const results = h('div.b-manual__results');
      const sheet = ui.sheet({
        title: 'Thêm từ bằng tay',
        sub: 'Chọn từ rồi kéo vùng cho khớp đồ vật trong ảnh',
        body: [h('div.b-search', {}, icon('search', 18), input), results],
      });

      const paintResults = () => {
        clear(results);
        const list = words.filter((w) => !used.has(w.id)).filter((w) => wordMatches(w, query));
        if (!list.length) {
          results.appendChild(
            ui.empty({
              iconName: 'search',
              title: 'Không còn từ nào khớp',
              body: 'Mọi từ khớp đều đã có vùng trên ảnh này, hoặc từ khoá chưa đúng.',
            })
          );
          return;
        }
        results.appendChild(
          ui.list(
            list.slice(0, 40).map((w) =>
              ui.listItem({
                title: w.en,
                sub: `/${w.ipa}/ · ${w.vi}`,
                meta: w.cefr,
                onClick: () => {
                  const region = addRegionFor(w);
                  sheet.close();
                  if (region) ui.toast(`Đã thêm "${w.en}" — kéo vùng cho khớp đồ vật`, { tone: 'success', iconName: 'move-3d' });
                },
              })
            )
          )
        );
      };

      input.addEventListener('input', () => {
        query = input.value;
        paintResults();
      });
      paintResults();
      setTimeout(() => input.focus(), 60);
    }

    /* ------------------------------- Dựng ---------------------------------- */
    paint();

    /* Hai wrapper CHỈ để dựng bố cục 2 cột ở bề rộng lớn (styles/screens-b.css):
       cột trái là ảnh + công cụ (dính theo cuộn), cột phải là danh sách thẻ từ.
       Ở bề rộng hẹp chúng được đặt `display: contents`, nên cây flex của
       .screen__body giữ nguyên đúng thứ tự và khoảng cách như trước — bố cục
       điện thoại không đổi một pixel. */
    const body = h('div.screen__body', {},
      h('div.b-regions__side', {}, headHost, photoHost, toolbarHost, legendHost),
      h('div.b-regions__main', {}, listHost, ctaHost));
    return h('div.screen.b-screen.b-regions', {}, bar, body);
  },
};
