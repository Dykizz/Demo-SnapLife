/* ============================================================================
   Màn stories — "Truyện đã lưu"
   Owner: screens-story.

   Đây là kệ sách của người học: mỗi truyện là một tấm bìa nhỏ kèm 3 từ đáng
   chú ý nhất và con số thật của đoạn (tỉ lệ tiếng Anh, số từ, thời lượng audio).
   Mở lại truyện KHÔNG gọi mô hình — nên màn này khai báo api: [].
   ========================================================================== */

import { h } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';
import { formatTime, fill } from './shared.js';

export default {
  id: 'stories',
  title: 'Truyện đã lưu',
  group: 'c-story',
  chrome: 'tabbar',
  tab: 'reader',
  api: [],
  notes: [
    'Kệ truyện đọc như bìa tạp chí: ảnh của người học dẫn dắt, chữ chỉ xác nhận — để mở lại một truyện cũ vẫn thấy hứng thú.',
    'Mỗi thẻ cho thấy 3 từ đáng chú ý và con số thật của đoạn (tỉ lệ %, số từ, thời lượng), nên người học chọn được truyện theo mục tiêu.',
    'Có trạng thái rỗng thật: lần đầu dùng app chưa có truyện nào, màn hình mời kể ngay thay vì để kệ trống.',
    'Màn này 0 API call — đúng luận điểm "mở lại và ôn tập không tốn thêm lần gọi nào".',
  ],
  render(ctx) {
    const all = (ctx.data.stories || []).map((s) => ctx.data.hydrateStory(s));
    const forceEmpty = ctx.params.empty === '1';
    const empty = forceEmpty || all.length === 0;

    let filter = 'all';
    const listHost = h('div.cs-shelf', {});
    const chipsHost = h('div.cs-shelf__filters', {});

    const showList = () => {
      const items = filter === 'all' ? all : all.filter((s) => s.cefr === filter);

      if (empty) {
        fill(listHost, ui.empty({
          iconName: 'book-open',
          title: 'Kệ truyện đang trống',
          body: 'Kể một ngày của bạn, AI sẽ viết lại thành đoạn tiếng Việt đan từ tiếng Anh và lưu vào đây.',
          action: ui.button({
            label: 'Kể câu chuyện đầu tiên',
            icon: 'pencil',
            onClick: () => ctx.nav.go('compose'),
          }),
        }));
        return;
      }

      if (!items.length) {
        fill(listHost, ui.empty({
          iconName: 'filter',
          title: `Chưa có truyện ở trình độ ${filter}`,
          body: 'Thử xem tất cả truyện đã lưu.',
          action: ui.chip({ label: 'Xem tất cả', onClick: () => { filter = 'all'; showList(); paintChips(); } }),
        }));
        return;
      }

      fill(listHost, ...items.map((story) => {
        const photo = ctx.data.photoById(story.photoId);
        const preview = story.englishWords.slice(0, 3);
        const extra = story.englishWords.length - preview.length;

        const card = h('button.cs-story', {
          type: 'button',
          'aria-label': `Mở truyện ${story.title}, ${story.ratio} phần trăm tiếng Anh`,
        },
        h('span.cs-story__cover', {},
          h('img', { src: photo.src, alt: '', loading: 'lazy', decoding: 'async' }),
          h('span.cs-story__ratio', {}, `${story.ratio}%`)),
        h('span.grow.cs-story__body', {},
          h('span.cs-story__top', {},
            h('span.cs-story__title', {}, story.title),
            story.badge ? ui.badge(story.badge, 'primary') : ui.badge(story.cefr, 'outline')),
          h('span.cs-story__meta', {},
            `${story.date} · ${story.englishWords.length} từ tiếng Anh · ${formatTime(story.audioSeconds)} audio`),
          h('span.cs-story__words', {},
            ...preview.map((w) => h('span.cs-story__word', {}, w)),
            extra > 0 ? h('span.cs-story__more', {}, `+${extra}`) : null)),
        h('span.cs-story__go', {}, icon('chevron-right', 18)));

        card.addEventListener('click', () => ctx.nav.go('reader', { story: story.id }));
        return card;
      }));
    };

    const paintChips = () => {
      const levels = ['all', ...new Set(all.map((s) => s.cefr))];
      fill(chipsHost, ...levels.map((level) => ui.chip({
        label: level === 'all' ? 'Tất cả' : `CEFR ${level}`,
        size: 'sm',
        selected: filter === level,
        onClick: () => {
          filter = level;
          paintChips();
          showList();
        },
      })));
    };

    paintChips();
    showList();

    const totalWords = all.reduce((sum, s) => sum + s.englishWords.length, 0);
    const totalSeconds = all.reduce((sum, s) => sum + (s.audioSeconds || 0), 0);

    return h('div.screen', {},
      ui.appBar({
        title: 'Truyện đã lưu',
        sub: `${all.length} truyện · mở lại không tốn API`,
        back: true,
        actions: [ui.iconBtn('plus', {
          label: 'Kể câu chuyện mới',
          onClick: () => ctx.nav.go('compose'),
        })],
      }),
      h('div.screen__body', { class: 'cs-stories' },
        h('div.cs-stories__stats', {},
          ui.card({ className: 'card--quiet', children: ui.stat({ label: 'Truyện', value: String(all.length), sub: 'đã viết cho bạn' }) }),
          ui.card({ className: 'card--quiet', children: ui.stat({ label: 'Từ tiếng Anh', value: String(totalWords), sub: 'trong ngữ cảnh của bạn' }) }),
          ui.card({ className: 'card--quiet', children: ui.stat({ label: 'Audio', value: formatTime(totalSeconds), sub: 'lưu sẵn trên máy' }) })),

        empty ? null : chipsHost,
        listHost,

        ui.callout({
          tone: 'success',
          iconName: 'zap',
          title: 'Đọc lại và ôn tập: 0 API call',
          body: 'Đoạn văn, nghĩa từng từ và audio đều đã nằm trên máy bạn. Chỉ khi kể một câu chuyện mới mới có một lời gọi AI.',
        }),

        ui.button({
          label: 'Kể chuyện mới',
          icon: 'pencil',
          block: true,
          onClick: () => ctx.nav.go('compose'),
        })));
  },
};
