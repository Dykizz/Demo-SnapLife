/* ============================================================================
   Màn hình 08 · wordlist — Bộ từ của tôi (lọc CEFR / trạng thái / sắp xếp)

   Chrome là 'appbar' (không phải 'tabbar'): wordlist nằm ngoài 5 tab của shell,
   nên điều hướng trong màn được làm bằng nút ở app bar + CTA cuối màn.
   Toàn bộ lọc/sắp xếp chạy tại máy: api: [] — 0 API call.
   Owner: screens-capture  |  phạm vi ghi: src/screens/b-capture/**
   ========================================================================== */

import { h, clear } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';
import { wordMatches } from './_shared.js';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'learning', label: 'Đang học' },
  { id: 'new', label: 'Từ mới' },
  { id: 'known', label: 'Đã thuộc' },
  { id: 'due', label: 'Đến hạn' },
];

const SORTS = [
  { value: 'recent', label: 'Mới nhất' },
  { value: 'az', label: 'A–Z' },
  { value: 'cefr', label: 'CEFR' },
  { value: 'due', label: 'Sắp quên' },
];

export default {
  id: 'wordlist',
  title: 'Bộ từ của tôi',
  group: 'b-capture',
  chrome: 'tabbar',
  tab: 'capture',
  api: [],
  notes: [
    'Mọi thứ trên màn này chạy ngay trên máy: tìm kiếm, lọc CEFR, lọc trạng thái, sắp xếp — nên phần chi phí ở cột phải luôn là 0 API call.',
    'Ô tìm kiếm bỏ dấu tiếng Việt khi so khớp, gõ "cai ca" vẫn ra "cái ca" — người Việt gõ không dấu là chuyện thường.',
    'Bốn cách sắp xếp có chủ đích: "Sắp quên" xếp theo số ngày tới hạn để người học biết từ nào cần gặp lại trước, chứ không chỉ xếp theo bảng chữ cái.',
    'Lọc ra rỗng thì hiện trạng thái rỗng có nút xoá bộ lọc, không để người dùng nhìn vào khoảng trắng rồi tưởng app lỗi.',
  ],

  render(ctx) {
    const data = ctx.data;
    // Đọc từ store để trạng thái "đã thuộc" ở màn thẻ từ lan sang đây ngay.
    const all = ctx.store.get('words', data.words) || data.words;

    let query = '';
    let cefr = 'all';
    let status = 'all';
    let sort = 'recent';

    const bar = ui.appBar({
      title: 'Bộ từ của tôi',
      sub: '',
      back: true,
      actions: [
        ui.iconBtn('camera', { label: 'Chụp thêm từ mới', onClick: () => ctx.nav.go('capture') }),
        ui.iconBtn('list-checks', { label: 'Mở phiên ôn tập', onClick: () => ctx.nav.go('review-hub') }),
      ],
    });
    const subNode = bar.querySelector('.appbar__sub');

    const searchInput = h('input.b-search__input', {
      type: 'search',
      placeholder: 'Tìm "mug" hoặc "cái ca"…',
      'aria-label': 'Tìm từ theo tiếng Anh, nghĩa tiếng Việt hoặc phiên âm',
      autocomplete: 'off',
    });

    const cefrHost = h('div.stack.stack--tight');
    const statusHost = h('div.stack.stack--tight');
    const sortHost = h('div');
    const countNode = h('span.label', {});
    const listHost = h('div');

    const filtered = () => {
      let list = all.filter((w) => wordMatches(w, query));
      if (cefr !== 'all') list = list.filter((w) => w.cefr === cefr);
      if (status === 'due') list = list.filter((w) => w.srs.dueInDays <= 0);
      else if (status !== 'all') list = list.filter((w) => w.status === status);

      const order = data.CEFR_ORDER;
      if (sort === 'az') list = list.slice().sort((a, b) => a.en.localeCompare(b.en));
      else if (sort === 'cefr') {
        list = list
          .slice()
          .sort((a, b) => order.indexOf(a.cefr) - order.indexOf(b.cefr) || a.en.localeCompare(b.en));
      } else if (sort === 'due') {
        list = list.slice().sort((a, b) => a.srs.dueInDays - b.srs.dueInDays || a.en.localeCompare(b.en));
      }
      return list;
    };

    function paintCounts() {
      const counts = data.statusCounts(all);
      clear(cefrHost);
      cefrHost.appendChild(h('span.label', {}, 'Trình độ CEFR'));
      cefrHost.appendChild(
        ui.chipRow([
          ui.chip({
            label: `Tất cả · ${all.length}`,
            selected: cefr === 'all',
            onClick: () => { cefr = 'all'; paint(); },
          }),
          ...data.CEFR_ORDER.map((level) => {
            const n = all.filter((w) => w.cefr === level).length;
            return ui.chip({
              label: `${level} · ${n}`,
              selected: cefr === level,
              onClick: () => { cefr = level; paint(); },
            });
          }),
        ])
      );

      clear(statusHost);
      statusHost.appendChild(h('span.label', {}, 'Trạng thái ghi nhớ'));
      statusHost.appendChild(
        ui.chipRow(
          STATUS_FILTERS.map((f) =>
            ui.chip({
              label: `${f.label}${f.id === 'all' ? ` · ${all.length}` : ` · ${counts[f.id] ?? 0}`}`,
              selected: status === f.id,
              onClick: () => { status = f.id; paint(); },
            })
          )
        )
      );

      clear(sortHost);
      sortHost.appendChild(
        h('div.b-sort', {},
          h('div.row.row--between', {},
            h('span.label', {}, 'Sắp xếp'),
            h('span.mono.b-wordlist__hint', {}, 'chạy trên máy · 0 API call')),
          ui.segmented({
            ariaLabel: 'Sắp xếp bộ từ',
            value: sort,
            options: SORTS,
            onChange: (value) => { sort = value; paint(); },
          })
        )
      );
    }

    function paintList() {
      const list = filtered();
      const counts = data.statusCounts(all);
      clear(listHost);
      clear(countNode);
      countNode.textContent = `${list.length} / ${all.length} từ`;

      if (subNode) subNode.textContent = `${all.length} từ · ${counts.due} đến hạn hôm nay`;

      if (!list.length) {
        listHost.appendChild(
          ui.empty({
            iconName: 'search',
            title: 'Không tìm thấy từ nào',
            body: 'Thử bỏ bớt bộ lọc hoặc đổi từ khoá. Bộ từ của bạn vẫn còn nguyên.',
            action: ui.button({
              label: 'Xoá bộ lọc',
              icon: 'rotate-ccw',
              variant: 'secondary',
              onClick: () => {
                query = '';
                cefr = 'all';
                status = 'all';
                sort = 'recent';
                searchInput.value = '';
                paint();
              },
            }),
          })
        );
        return;
      }

      listHost.appendChild(
        ui.list(
          list.map((w) =>
            ui.wordRow({
              word: w,
              cefr: true,
              onClick: () => ctx.nav.go('worddetail', { word: w.id }),
            })
          )
        )
      );
    }

    function paint() {
      paintCounts();
      paintList();
    }

    searchInput.addEventListener('input', () => {
      query = searchInput.value;
      paintList();
    });

    const summary = ui.card({
      className: 'card--quiet',
      children: [
        ui.keyval('Tổng số từ', String(all.length)),
        ui.keyval('Đến hạn hôm nay', String(data.statusCounts(all).due)),
        ui.keyval('Đã thuộc', String(data.statusCounts(all).known)),
      ],
    });

    paint();

    /* Hai wrapper CHỈ để dựng bố cục desktop (styles/screens-b.css): cột lọc bên
       trái dính theo cuộn + danh sách từ hai cột bên phải. Ở bề rộng hẹp chúng
       là `display: contents`, nên .screen__body vẫn thấy đúng tám khối con như
       trước — cùng thứ tự, cùng khoảng cách, bố cục điện thoại không đổi. */
    const filters = h('div.b-wordlist__filters', {},
      h('div.b-search', {}, icon('search', 18), searchInput, ui.iconBtn('x', {
        label: 'Xoá từ khoá tìm kiếm',
        variant: 'quiet',
        onClick: () => { searchInput.value = ''; query = ''; paintList(); searchInput.focus(); },
      })),
      summary,
      cefrHost,
      statusHost,
      sortHost);

    const results = h('div.b-wordlist__results', {},
      h('div.row.row--between.b-wordlist__count', {}, countNode, h('span.label', {}, 'chạm để mở thẻ từ')),
      listHost,
      ui.callout({
        tone: 'success',
        iconName: 'zap',
        title: 'Lọc và sắp xếp không tốn API call',
        body: 'Bộ từ nằm trong máy bạn. Chỉ khi chụp ảnh hoặc viết lại câu chuyện thì SnapLife mới gọi mô hình.',
      }));

    return h(
      'div.screen.b-screen.b-wordlist',
      {},
      bar,
      h('div.screen__body', {}, filters, results)
    );
  },
};
