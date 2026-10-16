/* ============================================================================
   Màn compose — "Kể lại một ngày"  (đầu vào của luồng deck slide 05)
   Owner: screens-story.

   Deck cho hai cách nhập liệu, nên người dùng CHỌN bằng segmented thay vì
   nhồi cả hai vào một form dài:
     1. Kể lại một ngày  → textarea + đính ảnh từ thư viện ảnh của chính họ.
     2. Gõ từ / chủ đề   → nhập từ (có gợi ý nghĩa) + chọn chủ đề quan tâm.
   Cả hai đường đều dẫn tới đúng một hành động: "Viết lại thành đoạn đan xen".
   ========================================================================== */

import { h } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';
import { fill } from './shared.js';

const MODES = [
  { value: 'retell', label: 'Kể lại một ngày' },
  { value: 'words', label: 'Gõ từ / chủ đề' },
];

export default {
  id: 'compose',
  title: 'Kể lại một ngày',
  group: 'c-story',
  chrome: 'appbar',
  api: [],
  notes: [
    'Hai cách kể chuyện được tách bằng segmented để người học luôn biết mình đang ở đường nhập nào; form dài một cột sẽ khiến họ bỏ dở.',
    'Màn này KHÔNG tốn API: soạn và chọn là việc của người dùng. Chi phí 1 LLM chỉ rơi vào lúc đoạn văn được sinh ở màn đọc — đúng luận điểm "gọi AI một lần".',
    'Ảnh đính kèm được chọn từ chính thư viện ảnh của người học, nên đoạn đan xen luôn có ngữ cảnh thật để bám vào.',
    'Trình độ đích hiển thị thẳng (B1) vì đó là căn cứ chọn từ của AI — người học cần biết vì sao đoạn văn khó hay dễ như vậy.',
  ],
  render(ctx) {
    const user = ctx.data.user;
    const draftKey = 'story.draft';

    let mode = ctx.store.get('story.mode', 'retell');
    let draft = ctx.store.get(draftKey, '') || ctx.data.userStoryDraft;
    let photoId = ctx.store.get('story.photoId', 'rainy-street');
    let sampleTopics = (ctx.store.get('story.sampleTopicList', []) || []).slice();
    let topicIds = (ctx.store.get('story.topicIds', []) || []).slice();
    let pickedWords = (ctx.store.get('story.pickedWords', []) || []).slice();

    if (!sampleTopics.length) sampleTopics = ctx.data.sampleTopics.slice(0, 2);
    if (!topicIds.length) topicIds = ['coffee', 'city'];

    const panel = h('div.cs-compose__panel', {});
    const ctaHost = h('div.cs-compose__cta', {});
    let generating = false;

    const persist = () => ctx.store.set({
      'story.mode': mode,
      [draftKey]: draft,
      'story.photoId': photoId,
      'story.sampleTopicList': sampleTopics.slice(),
      'story.topicIds': topicIds.slice(),
      'story.pickedWords': pickedWords.slice(),
    });

    /* ------------------------------ Hai lối vào ------------------------------ */
    function retellPanel() {
      const ta = h('textarea.cs-textarea', {
        rows: 5,
        value: draft,
        placeholder: 'Hôm nay của bạn thế nào? Một câu cũng đủ.',
        'aria-label': 'Kể lại một ngày của bạn',
        spellcheck: 'false',
      });
      const counter = h('span.mono.cs-count-chars', {}, `${draft.trim().length} ký tự`);
      ta.addEventListener('input', () => {
        draft = ta.value;
        counter.textContent = `${draft.trim().length} ký tự`;
        persist();
      });

      const photoRow = h('div.cs-photos', { role: 'group', 'aria-label': 'Chọn ảnh đính kèm' });
      ctx.data.photoLibrary.forEach((p) => {
        const btn = h('button.cs-photo', {
          type: 'button',
          'aria-pressed': String(p.id === photoId),
          'aria-label': `Đính ảnh: ${p.caption}`,
        }, h('img', { src: p.src, alt: '', loading: 'lazy', decoding: 'async' }));
        btn.addEventListener('click', () => {
          photoId = p.id;
          photoRow.querySelectorAll('.cs-photo').forEach((n) => n.setAttribute('aria-pressed', 'false'));
          btn.setAttribute('aria-pressed', 'true');
          caption.textContent = p.caption;
          persist();
        });
        photoRow.appendChild(btn);
      });
      const caption = h('p.cs-photos__caption.muted-2', {},
        ctx.data.photoLibrary.find((p) => p.id === photoId)?.caption || 'Chưa chọn ảnh');

      return h('div.stack', {},
        h('div', {},
          ui.sectionTitle('Bạn kể', ui.button({
            label: 'Dùng đoạn mẫu',
            variant: 'ghost',
            size: 'sm',
            icon: 'wand',
            onClick: () => {
              draft = ctx.data.userStoryDraft;
              ta.value = draft;
              counter.textContent = `${draft.trim().length} ký tự`;
              persist();
              ui.toast('Đã điền đoạn kể mẫu', { iconName: 'wand' });
            },
          })),
          ta,
          h('div.row.row--between.cs-textarea__foot', {},
            counter,
            h('span.muted-2.cs-textarea__hint', {}, 'Không cần đúng ngữ pháp'))),

        h('div', {},
          ui.sectionTitle('Chủ đề trong câu chuyện'),
          ui.chipRow(ctx.data.sampleTopics.map((label) => ui.chip({
            label,
            selected: sampleTopics.includes(label),
            onClick: (on) => {
              sampleTopics = on
                ? [...sampleTopics, label]
                : sampleTopics.filter((t) => t !== label);
              persist();
              renderPanel();
            },
          })))),

        h('div', {},
          ui.sectionTitle('Đính ảnh của bạn', ui.badge(`${ctx.data.photoLibrary.length} ảnh`, 'outline', 'image')),
          photoRow,
          caption));
    }

    function wordsPanel() {
      const chosen = h('div.chip-row.cs-picked', {});
      const suggested = h('div.cs-suggest', {});
      const input = h('input.cs-input', {
        type: 'search',
        placeholder: 'Ví dụ: commute, ritual, balcony…',
        'aria-label': 'Gõ từ tiếng Anh bạn muốn dùng',
        autocomplete: 'off',
      });

      const paintChosen = () => {
        fill(chosen, ...(pickedWords.length
          ? pickedWords.map((w) => ui.chip({
              label: w.en,
              selected: true,
              onClick: () => {
                pickedWords = pickedWords.filter((x) => x.en !== w.en);
                persist();
                paintChosen();
              },
            }))
          : [h('span.muted-2.cs-picked__empty', {}, 'Chưa chọn từ nào — AI sẽ tự chọn theo chủ đề.')]));
      };

      const paintSuggest = (query) => {
        const q = String(query || '').trim().toLowerCase();
        const pool = ctx.data.words
          .filter((w) => !pickedWords.some((p) => p.en === w.en))
          .filter((w) => !q || w.en.toLowerCase().includes(q) || w.vi.toLowerCase().includes(q))
          .slice(0, q ? 5 : 4);
        fill(suggested,
          suggestedTitle(q, pool.length),
          ...(pool.length
            ? pool.map((w) => ui.listItem({
                title: `${w.en} · ${w.vi}`,
                sub: `/${w.ipa}/ · ${w.pos} · CEFR ${w.cefr}`,
                trail: false,
                onClick: () => {
                  if (!pickedWords.some((p) => p.en === w.en)) {
                    pickedWords = [...pickedWords, { en: w.en, vi: w.vi }];
                    persist();
                    paintChosen();
                    paintSuggest(input.value);
                  }
                },
              }))
            : [ui.callout({
                iconName: 'info',
                title: 'Không có từ nào khớp',
                body: 'Bạn vẫn có thể chọn chủ đề bên dưới — AI sẽ tự chọn từ theo trình độ.',
              })]));
      };

      const suggestedTitle = (q, n) => h('div.row.row--between.cs-suggest__head', {},
        h('span.label', {}, q ? `Gợi ý cho "${q}"` : 'Từ nên học tiếp'),
        ui.badge(`${n} từ`, 'outline'));

      input.addEventListener('input', () => paintSuggest(input.value));
      paintChosen();
      paintSuggest('');

      return h('div.stack', {},
        h('div', {},
          ui.sectionTitle('Từ bạn muốn dùng', ui.badge('chạm để chọn', 'outline', 'plus')),
          input,
          chosen),
        h('div', {}, suggested),
        h('div', {},
          ui.sectionTitle('Chủ đề quan tâm', ui.badge(`${topicIds.length} đã chọn`, 'primary', 'target')),
          ui.chipRow(ctx.data.topics.map((t) => ui.chip({
            label: t.label,
            icon: t.icon,
            size: 'sm',
            selected: topicIds.includes(t.id),
            onClick: (on) => {
              topicIds = on ? [...topicIds, t.id] : topicIds.filter((id) => id !== t.id);
              persist();
              renderPanel();
            },
          })))));
    }

    function renderPanel() {
      panel.dataset.mode = mode;
      fill(panel, mode === 'retell' ? retellPanel() : wordsPanel());
      paintCta();
    }

    /* --------------------------------- CTA --------------------------------- */
    function paintCta() {
      if (generating) {
        fill(ctaHost,
          h('div.card.cs-writing', { role: 'status', 'aria-live': 'polite' },
            h('div.row', {}, ui.spinner(), h('strong', {}, 'Đang viết lại thành đoạn đan xen…')),
            h('p.muted.cs-writing__sub', {},
              `Chọn từ vựng ở trình độ ${user.cefr}, đan vào câu tiếng Việt của bạn, rồi tạo audio.`),
            ui.skeleton('line'),
            ui.skeleton('line'),
            ui.skeleton('short'),
            h('p.mono.cs-writing__cost', {}, '1 LLM · chỉ gọi một lần cho câu chuyện này')));
        return;
      }

      fill(ctaHost,
        ui.button({
          label: 'Viết lại thành đoạn đan xen',
          icon: 'sparkles',
          block: true,
          onClick: submit,
        }),
        h('p.cs-compose__note.muted-2', {},
          mode === 'retell'
            ? 'AI giữ nguyên câu chuyện của bạn, chỉ đan thêm từ tiếng Anh theo trình độ.'
            : 'AI dựng một đoạn ngắn quanh những từ và chủ đề bạn chọn.'));
    }

    function submit() {
      if (generating) return;
      const hasWords = pickedWords.length > 0 || topicIds.length > 0;
      const hasStory = draft.trim().length >= 8;
      if (mode === 'retell' && !hasStory) {
        ui.toast('Bạn kể thêm một câu nữa nhé — đoạn văn cần chút ngữ cảnh', { tone: 'danger', iconName: 'info' });
        return;
      }
      if (mode === 'words' && !hasWords) {
        ui.toast('Chọn ít nhất một từ hoặc một chủ đề', { tone: 'danger', iconName: 'info' });
        return;
      }

      persist();
      generating = true;
      paintCta();
      // Màn này không tiêu API. Lời gọi LLM được khai báo ở màn reader —
      // nên Cost Meter chỉ nhảy đúng một lần, tại lúc đoạn văn xuất hiện.
      if (ctx.gallery) {
        ui.toast('Trong thư viện tĩnh, nút chuyển màn bị tắt. Mở index.html để đi hết luồng.', { iconName: 'info' });
        return;
      }
      setTimeout(() => {
        generating = false;
        paintCta();
        ctx.nav.go('reader');
      }, 1400);
    }

    const modeSeg = ui.segmented({
      options: MODES,
      value: mode,
      ariaLabel: 'Cách kể câu chuyện',
      onChange: (value) => {
        mode = value;
        persist();
        modeSeg.setValue(value);
        renderPanel();
      },
    });

    renderPanel();

    return h('div.screen', {},
      ui.appBar({
        title: 'Kể lại một ngày',
        sub: `${ctx.data.user.name} · trình độ ${user.cefr}`,
        back: true,
      }),
      h('div.screen__body', { class: 'cs-compose' },
        modeSeg,
        panel,
        ui.callout({
          tone: 'success',
          iconName: 'lock',
          title: 'Không dùng ảnh và giọng nói để huấn luyện mô hình',
          body: 'Ảnh được nén ngay trên máy bạn. Mỗi câu chuyện chỉ gọi mô hình một lần, rồi từ vựng và audio được lưu lại để tái sử dụng.',
        }),
        ctaHost,
        ui.button({
          label: 'Mở truyện đã lưu',
          icon: 'book-open',
          variant: 'secondary',
          block: true,
          onClick: () => ctx.nav.go('stories'),
        })));
  },
};
