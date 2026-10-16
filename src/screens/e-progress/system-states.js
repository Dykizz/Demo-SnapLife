/* ============================================================================
   NHÓM E · system-states — Trưng bày 4 trạng thái hệ thống
   Rỗng · Đang tải · Lỗi · Offline (tất cả trong CÙNG một màn hình, vì registry
   chỉ có một id 'system-states').

   Mục đích khi demo: ban giám khảo thấy sản phẩm đã nghĩ tới đường xấu, và mỗi
   trạng thái đều nói rõ VIỆC GÌ VẪN LÀM ĐƯỢC, không chỉ báo lỗi.
   ========================================================================== */

import { h } from '../../core/dom.js';
import { ui } from '../../core/ui.js';
import { block, noteList, whyLine } from './shared.js';

export default {
  id: 'system-states',
  title: 'Trạng thái hệ thống',
  group: 'e-progress',
  chrome: 'appbar',
  api: [],
  notes: [
    'Bốn trạng thái nằm chung một màn để khi pitching chỉ cần mở đúng một id và cuộn: rỗng → đang tải → lỗi → offline, giống thứ tự thời gian người dùng gặp.',
    'Khối offline nói rõ câu chốt của kiến trúc: vẫn ôn tập được vì bài tập sinh bằng quy tắc và audio đã cache — mất mạng không lấy đi phần học đã có.',
    'Mỗi trạng thái đều có hành động tiếp theo (chụp ảnh đầu tiên, chụp lại, khoanh vùng thủ công, vào ôn tập) thay vì chỉ có chữ báo lỗi.',
    'Số liệu trong khối đang tải lấy từ ctx.data.compressInfo của ảnh mẫu, không phải con số bịa cho đẹp.',
  ],

  render(ctx) {
    const { data, nav } = ctx;
    const states = data.systemStates || {};
    const compress = data.compressInfo ? data.compressInfo('morning-desk') : { from: '2.4 MB', to: '380 KB', ratio: 84 };
    const err = states.error || { title: 'Không đọc được ảnh này', body: '' };
    const offline = states.offline || { title: 'Không có kết nối', body: '' };
    const rateLimited = states['rate-limited'] || null;

    /** Một khối trạng thái: đầu mục có số + nhãn, thân là khung thiết bị thu nhỏ. */
    function stateBlock({ n, name, when, tag, children, why }) {
      return h('section.e-block.e-state', {},
        h('div.e-state__head', {},
          h('span.e-state__n.mono', { 'aria-hidden': 'true' }, String(n).padStart(2, '0')),
          h('div.grow', {},
            h('span.label', {}, `Trạng thái ${n} · ${name}`),
            h('h2.e-block__title', {}, when))),
        h('div.e-state__frame', {},
          h('div.e-state__bar', {},
            h('span.e-state__dot', { 'aria-hidden': 'true' }),
            h('span.e-state__tag.mono', {}, tag)),
          h('div.e-state__body', {}, ...children)),
        why ? whyLine(why) : null);
    }

    /* ------------------------------- 1 · Rỗng ------------------------------ */
    const emptyState = stateBlock({
      n: 1,
      name: 'Rỗng',
      when: 'Bộ từ chưa có gì',
      tag: '#/wordlist · 0 từ',
      why: 'Trạng thái rỗng phải chỉ ra bước tiếp theo, không chỉ nói “không có dữ liệu”.',
      children: [
        ui.empty({
          iconName: 'notebook',
          title: 'Bộ từ của bạn đang trống',
          body: 'Chụp một tấm ảnh quanh bạn, hoặc kể lại một ngày — hệ thống tạo từ đầu tiên trong vài giây.',
          action: ui.button({
            label: 'Chụp ảnh đầu tiên',
            icon: 'camera',
            onClick: () => nav.go('capture'),
          }),
        }),
      ],
    });

    /* ----------------------------- 2 · Đang tải ---------------------------- */
    const loadingState = stateBlock({
      n: 2,
      name: 'Đang tải',
      when: 'Đang nén ảnh và nhận diện',
      tag: '#/capture · VLM 1 lần cho ảnh này',
      why: 'Nói rõ đang làm gì và đang nén từ bao nhiêu xuống bao nhiêu, để người dùng không bấm lại và không nghĩ app treo.',
      children: [
        h('div.row', {}, ui.spinner(), h('span.e-state__inline', {}, 'Đang nén ảnh ngay trên máy bạn…')),
        h('div.e-state__skeleton', {},
          ui.skeleton('title'),
          ui.skeleton('line'),
          ui.skeleton('line', '82%'),
          ui.skeleton('short')),
        ui.skeleton('photo'),
        h('div', {},
          ui.keyval('Nén tại client', `${compress.from} → ${compress.to}`),
          ui.keyval('Gọi mô hình thị giác', '1 lần cho mỗi ảnh'),
          ui.keyval('Lần gọi thứ hai', 'Không có — kết quả được lưu lại')),
      ],
    });

    /* -------------------------------- 3 · Lỗi ------------------------------ */
    const errorState = stateBlock({
      n: 3,
      name: 'Lỗi',
      when: 'Không đọc được ảnh',
      tag: '#/capture · ảnh mờ hoặc quá tối',
      why: 'Mỗi lỗi kèm hai lối thoát cụ thể (chụp lại hoặc tự khoanh vùng), không để người dùng bế tắc.',
      children: [
        ui.callout({ tone: 'danger', iconName: 'alert-triangle', title: err.title, body: err.body }),
        noteList([
          'Chụp lại ở nơi đủ sáng, giữ máy cách vật khoảng 30–40 cm.',
          'Hoặc tự khoanh vùng trên ảnh — từ do bạn khoanh luôn được ưu tiên hơn từ AI gợi ý.',
        ]),
        h('div', {},
          ui.keyval('Vùng nhận diện được', '0/1 vùng đủ tin cậy'),
          ui.keyval('Chi phí đã dùng', '1 VLM call — không tính lại cho ảnh này')),
        ui.btnRow(
          ui.button({ label: 'Chụp lại', icon: 'camera', variant: 'secondary', onClick: () => nav.go('capture') }),
          ui.button({ label: 'Khoanh vùng tay', icon: 'crop', onClick: () => nav.go('regions') })),
      ],
    });

    /* ------------------------------ 4 · Offline ---------------------------- */
    const offlineState = stateBlock({
      n: 4,
      name: 'Offline',
      when: 'Mất kết nối',
      tag: '#/review-run · phiên ôn vẫn chạy',
      why: 'Đây là lợi thế kiến trúc: phần học cốt lõi không phụ thuộc mạng, nên mất mạng không phá vỡ thói quen học.',
      children: [
        ui.callout({ tone: 'warning', iconName: 'wifi-off', title: offline.title, body: offline.body }),
        h('p.e-state__claim', {}, 'Vẫn ôn tập được vì bài tập sinh bằng quy tắc và audio đã cache.'),
        h('div', {},
          ui.keyval('Phiên ôn tập', 'Vẫn chạy — sinh bằng quy tắc, 0 API call'),
          ui.keyval('Audio phát âm', 'Vẫn nghe — đã cache trên máy'),
          ui.keyval('Chụp ảnh mới', 'Xếp hàng chờ, tự gửi khi có mạng trở lại')),
        ui.btnRow(
          ui.button({ label: 'Vào ôn tập', icon: 'list-checks', onClick: () => nav.go('review-hub') }),
          ui.button({ label: 'Xem bộ từ', icon: 'layers', variant: 'secondary', onClick: () => nav.go('wordlist') })),
      ],
    });

    return h('div.screen.e-screen.e-states', {},
      ui.appBar({
        title: 'Trạng thái hệ thống',
        sub: 'Bốn đường xấu đã được thiết kế',
        back: true,
      }),
      h('div.screen__body', {},
        h('p.lede', {}, 'Sản phẩm không chỉ có đường hạnh phúc. Bốn trạng thái dưới đây đều có hình hài, câu chữ và hành động tiếp theo — xem được ngay trên một màn hình.'),

        emptyState,
        loadingState,
        errorState,
        offlineState,

        block({
          kicker: 'Biến thể',
          title: 'Khi hệ thống quá tải',
          meta: rateLimited ? rateLimited.title : 'Đang có nhiều người dùng cùng lúc',
          children: [
            ui.callout({
              tone: 'info',
              iconName: 'activity',
              title: rateLimited ? rateLimited.title : 'Đang có nhiều người dùng cùng lúc',
              body: rateLimited ? rateLimited.body : 'Hệ thống tạm hoãn việc gọi mô hình.',
            }),
            h('div.row.row--wrap', { style: { gap: '6px' } },
              ui.badge('Cùng nguyên tắc', 'outline', 'info'),
              ui.badge('Nói rõ việc vẫn làm được', 'outline', 'check')),
          ],
        }),

        block({
          kicker: 'Nguyên tắc',
          title: 'Cách nhóm E viết trạng thái xấu',
          children: [
            noteList([
              'Nói chuyện gì vẫn làm được trước, rồi mới nói chuyện bị chặn.',
              'Mỗi trạng thái có đúng một hành động chính, không bày ba lựa chọn mơ hồ.',
              'Không dùng emoji, không dùng chữ “Oops” — người học đang mệt thì câu chữ phải điềm tĩnh.',
            ]),
          ],
        }),

        whyLine('Bốn khối này dùng lại đúng component của sản phẩm: ui.empty, ui.skeleton, ui.spinner, ui.callout — trạng thái xấu không phải màn hình riêng ai viết vội.'),
      ));
  },
};
