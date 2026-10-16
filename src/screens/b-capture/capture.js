/* ============================================================================
   Màn hình 06 · capture — Khung ngắm camera + 4 bước kiến trúc (deck tr.04)

   Khoảnh khắc wow bắt đầu ở đây: người dùng chụp ảnh của chính mình.
   Màn này phải kể được câu chuyện kiến trúc ngay trên màn hình:
     01 nén tại client → 02 VLM gọi 1 lần → 03 lưu vào bộ từ → 04 rule engine.
   Owner: screens-capture  |  phạm vi ghi: src/screens/b-capture/**
   ========================================================================== */

import { h, clear } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';

const DEFAULT_PHOTO = 'morning-desk';

const TIPS = [
  { icon: 'sun', label: 'Đủ sáng, tránh ngược sáng' },
  { icon: 'target', label: 'Cách 30–50 cm' },
  { icon: 'crop', label: 'Mỗi đồ vật một vùng' },
];

export default {
  id: 'capture',
  title: 'Chụp ngữ cảnh',
  group: 'b-capture',
  chrome: 'none',
  immersive: true,
  api: [{ key: 'vlm:morning-desk', kind: 'vlm', label: 'Nhận diện ảnh & Bbox', n: 1 }],
  notes: [
    'Khung ngắm vuông 1:1 đúng bằng tỉ lệ ảnh 900×900, nên toạ độ % của bbox ở màn "Khoanh vùng" khớp tuyệt đối — không có sai số do tỉ lệ khung.',
    'Bốn bước kiến trúc nằm ngay dưới khung ngắm để ban giám khảo thấy "nén tại máy → 1 call VLM → lưu DB → rule engine" ngay lúc bấm chụp, chứ không phải nghe thuyết trình.',
    'Số liệu nén lấy từ ctx.data.compressInfo() nên đổi ảnh trong Thư viện là số liệu đổi theo, không phải chữ chết.',
    'Cụm nút đáy giữ bố cục camera: Thư viện · Chụp · Flash. Nút chụp 76px, hai nút phụ 52px, đều có aria-label cho trình đọc màn hình.',
  ],

  render(ctx) {
    const data = ctx.data;
    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };
    ctx.onCleanup(() => {
      timers.forEach(clearTimeout);
      timers.length = 0;
    });

    let photo = data.photoById(ctx.store.get('capture.photoId', DEFAULT_PHOTO)) || data.photoById(DEFAULT_PHOTO);
    let info = data.compressInfo(photo.id);

    /* ----------------------------- Khung ngắm ----------------------------- */
    const vf = ui.viewfinder({
      src: photo.src,
      alt: photo.alt,
      guide: false,
      grid: true,
      children: [
        h('div.viewfinder__scan'),
        h('div.b-cam__corner.b-cam__corner--tl'),
        h('div.b-cam__corner.b-cam__corner--tr'),
        h('div.b-cam__corner.b-cam__corner--bl'),
        h('div.b-cam__corner.b-cam__corner--br'),
      ],
    });

    /* Hai nhãn này nằm trên lớp stage (không nằm trong .viewfinder) và tự mang
       nền --overlay-chip của mình, nên chữ không bao giờ phụ thuộc vào độ sáng
       của ảnh chụp — nhìn vẫn như lớp phủ camera nhưng tương phản luôn đạt. */
    const badges = h(
      'div.b-cam__badges',
      {},
      h('div.b-cam__badge', {}, icon('scan', 13), ' 1:1 · 900 × 900'),
      h('div.b-cam__badge.b-cam__badge--right', {}, icon('check-circle', 13), ' Khung đã khớp')
    );

    /* --------------------- Lớp phủ "đang xử lý" khi chụp ------------------- */
    const busy = h(
      'div.b-cam__busy',
      { hidden: true, role: 'status', 'aria-live': 'polite', 'aria-label': 'Tiến trình xử lý ảnh' },
      h('div.b-cam__busybox', {},
        h('div.row', {}, ui.spinner(), h('span.label', {}, 'Đang xử lý')),
        h('div.b-cam__busytitle', {}, ''),
        h('div.b-cam__busynote', {}, ''),
        ui.progress({ value: 28, label: 'Tiến trình nén và nhận diện' }))
    );

    const setBusy = (title, note, pct) => {
      busy.hidden = false;
      busy.querySelector('.b-cam__busytitle').textContent = title;
      busy.querySelector('.b-cam__busynote').textContent = note;
      const bar = busy.querySelector('.progress__bar');
      const track = busy.querySelector('.progress');
      if (bar) bar.style.width = pct + '%';
      if (track) track.setAttribute('aria-valuenow', String(pct));
    };

    /* ------------------------------ App bar ------------------------------- */
    const bar = ui.appBar({
      title: 'Chụp ngữ cảnh',
      sub: `${photo.caption} · ${photo.takenAt}`,
      close: true,
      overlay: true,
      bordered: false,
    });

    const stepsHost = h('div.b-steps');
    const dockNote = h('div.b-cam__docknote');

    const paintMeta = () => {
      info = data.compressInfo(photo.id);
      const img = vf.querySelector('img');
      img.src = photo.src;
      img.alt = photo.alt;
      const sub = bar.querySelector('.appbar__sub');
      if (sub) sub.textContent = `${photo.caption} · ${photo.takenAt}`;

      clear(stepsHost);
      const steps = [
        { n: '01', icon: 'zap', title: 'Nén ngay trên máy', value: `${info.from} → ${info.to}`, note: `Nhẹ hơn ${info.ratio}% · ảnh gốc không rời khỏi máy bạn` },
        { n: '02', icon: 'sparkles', title: 'VLM gọi đúng một lần', value: '1 call / ảnh', note: `${(photo.regions || []).length} vùng khoanh trả về trong cùng một lượt gọi` },
        { n: '03', icon: 'layers', title: 'Lưu vào bộ từ của bạn', value: '0 call', note: 'Ảnh, vùng khoanh và thẻ từ nằm trong máy' },
        { n: '04', icon: 'list-checks', title: 'Rule engine sinh bài tập', value: '0 call', note: 'Cloze, ghép cặp, flashcard tính bằng quy tắc' },
      ];
      steps.forEach((s) => {
        stepsHost.appendChild(
          h('div.b-step', {},
            h('span.b-step__n.mono', {}, s.n),
            h('div.b-step__body', {},
              h('div.row', { style: { gap: '6px' } }, icon(s.icon, 15), h('span.b-step__t', {}, s.title)),
              h('div.b-step__note', {}, s.note)),
            h('span.b-step__v', {}, s.value))
        );
      });

      clear(dockNote);
      dockNote.appendChild(icon('info', 13));
      dockNote.appendChild(
        h('span', {}, ` Lần chụp này sẽ tốn đúng 1 API call · ${info.from} → ${info.to}`)
      );
    };

    /* --------------------------- Chọn ảnh có sẵn --------------------------- */
    function pickPhoto(id) {
      photo = data.photoById(id) || photo;
      ctx.store.set('capture.photoId', photo.id);
      // Đổi ảnh thì màn Khoanh vùng phải nạp lại vùng của ảnh mới.
      ctx.store.set('capture.initPhotoId', null);
      paintMeta();
      ui.toast(`Đã chọn: ${photo.caption}`, { iconName: 'image' });
    }

    function openLibrary() {
      const tiles = data.photoLibrary.map((p) => {
        const item = data.photoById(p.id);
        const n = (item.regions || []).length;
        const btn = h(
          'button.b-lib__item',
          {
            type: 'button',
            'aria-label': `Chọn ảnh: ${p.caption}. ${n ? `${n} vùng gợi ý sẵn` : 'chưa có vùng gợi ý'}`,
            'aria-current': p.id === photo.id ? 'true' : undefined,
          },
          h('span.b-lib__thumb', {}, h('img', { src: p.src, alt: '', loading: 'lazy', decoding: 'async' })),
          h('span.b-lib__cap', {}, p.caption),
          h('span.b-lib__meta.mono', {}, n ? `${n} vùng gợi ý` : 'chưa có vùng')
        );
        btn.addEventListener('click', () => {
          pickPhoto(p.id);
          sheet.close();
        });
        return btn;
      });

      const sheet = ui.sheet({
        title: 'Thư viện ảnh',
        sub: `${data.photoLibrary.length} ảnh gần đây · ảnh của chính bạn`,
        body: [h('div.b-lib', {}, ...tiles)],
      });
    }

    /* ------------------------------- Chụp --------------------------------- */
    function shoot() {
      if (ctx.gallery) {
        ui.toast('Thư viện tĩnh: mở index.html để chạy luồng chụp thật', { iconName: 'info' });
        return;
      }
      const ci = data.compressInfo(photo.id);
      ctx.store.set('capture', {
        ...(ctx.store.get('capture', {}) || {}),
        photoId: photo.id,
        initPhotoId: photo.id,
        stage: 'compressing',
        regions: (photo.regions || []).map((r) => ({ ...r })),
        removed: [],
        userRegions: [],
      });

      setBusy('Đang nén ngay trên máy…', `Ảnh gốc ${ci.from} vẫn nằm trên máy bạn`, 26);
      later(() => setBusy(`${ci.from} → ${ci.to}`, `Nhẹ hơn ${ci.ratio}% · chưa gửi đi đâu cả`, 58), 620);
      later(() => setBusy('VLM nhận diện vùng…', 'Gọi mô hình đúng một lần cho cả ảnh', 84), 1320);
      later(() => {
        ctx.store.set('capture.stage', 'done');
        ctx.nav.go('regions');
      }, 1950);
    }

    /* ---------------------------- Nút đèn flash --------------------------- */
    let flashOn = Boolean(ctx.store.get('capture.flash', false));
    const flashBtn = h('button.b-cam__flash', { type: 'button' });
    const paintFlash = () => {
      clear(flashBtn);
      flashBtn.setAttribute('aria-pressed', String(flashOn));
      flashBtn.setAttribute('aria-label', flashOn ? 'Tắt đèn flash' : 'Bật đèn flash');
      flashBtn.appendChild(icon(flashOn ? 'sun' : 'zap', 20));
    };
    paintFlash();
    flashBtn.addEventListener('click', () => {
      flashOn = !flashOn;
      ctx.store.set('capture.flash', flashOn);
      paintFlash();
      ui.toast(flashOn ? 'Đèn flash: bật' : 'Đèn flash: tắt', { iconName: flashOn ? 'sun' : 'zap' });
    });

    const shutter = h(
      'button.b-shutter',
      { type: 'button', 'aria-label': 'Chụp ảnh và nhận diện từ vựng' },
      h('span.b-shutter__ring'),
      h('span.b-shutter__dot')
    );
    shutter.addEventListener('click', shoot);

    paintMeta();

    return h(
      'div.screen.b-screen.b-cam',
      {},
      bar,
      h('div.b-cam__stage', {}, vf, badges, busy),
      h('div.screen__body.b-cam__body', {},
        ui.callout({
          iconName: 'target',
          title: 'Mẹo chụp',
          body: 'Đủ sáng, cách 30–50 cm, mỗi đồ vật nằm gọn trong khung. Ảnh càng rõ thì vùng khoanh AI trả về càng khớp.',
        }),
        h('div.b-tips', {}, ...TIPS.map((t) => h('span.b-tip', {}, icon(t.icon, 15), t.label))),
        ui.card({
          pad: 'lg',
          children: [
            ui.sectionTitle('Đường đi của một tấm ảnh'),
            stepsHost,
            h('p.note.b-muted-note', {}, 'Ảnh được nén và xử lý trên máy; chỉ một lượt gọi mô hình cho mỗi tấm ảnh.'),
          ],
        }),
        ui.callout({
          iconName: 'shield',
          title: 'Ảnh là của bạn',
          body: 'SnapLife không dùng ảnh và giọng nói của bạn để huấn luyện mô hình.',
        })
      ),
      h('div.b-cam__dock', {},
        dockNote,
        h('div.b-cam__dockrow', {},
          ui.button({ label: 'Thư viện', icon: 'image', variant: 'secondary', onClick: openLibrary }),
          shutter,
          flashBtn)
      )
    );
  },
};
