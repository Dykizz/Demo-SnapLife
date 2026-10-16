/* ============================================================================
   Màn reader — "Đoạn văn đan xen"  (deck slide 05)
   Owner: screens-story.

   Đây là màn hình phải đẹp nhất của demo. Nguyên tắc thiết kế:
   · Ảnh của người học là BÌA, không phải thumbnail phụ.
   · Đoạn văn đọc như trang tạp chí: một cột chữ rộng, font đọc 19px/1.8,
     tiêu đề display, từ tiếng Anh nổi màu cam và chạm được.
   · KHÔNG liệt kê từ thành danh sách — từ sống trong câu.
   · Tỉ lệ % tiếng Anh hiển thị là số THẬT tính từ chữ (story.ratio).
   ========================================================================== */

import { h } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';
import { formatTime, fill, sentenceAround, emphasise } from './shared.js';

function buildPlayer(ctx, story, article) {
  const paragraphs = article ? Array.from(article.children) : [];
  const total = Math.max(1, Number(story.audioSeconds) || 1);
  // Nhịp đọc chia theo độ dài từng đoạn, cộng lại ĐÚNG BẰNG story.audioSeconds:
  // đồng hồ hiển thị 1:08 thì thanh tiến độ cũng chạy hết trong 1:08.
  const weights = paragraphs.map((p) => Math.max(1, p.textContent.trim().length));
  const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
  const paraMs = (index) => Math.max(1500, (weights[index] / weightSum) * total * 1000);
  const card = h('div.cs-player.card', {});
  const btn = h('button.cs-player__btn', {
    type: 'button',
    'aria-label': 'Phát audio đoạn văn',
    'aria-pressed': 'false',
  }, icon('play', 22));
  const bar = ui.progress({ value: 0, max: total, label: `Tiến độ audio ${formatTime(total)}` });
  const barFill = bar.querySelector('.progress__bar');
  const now = h('span.mono.cs-player__time', {}, '0:00');
  const end = h('span.mono.cs-player__time', {}, formatTime(total));

  let shown = 0; // % đã phát
  let target = 0; // % của đoạn đang đọc
  let tick = null;
  let handle = null;
  let paraTimer = null;
  let live = false;

  const paint = () => {
    barFill.style.width = shown + '%';
    bar.setAttribute('aria-valuenow', String(Math.round(shown)));
    now.textContent = formatTime((shown / 100) * total);
    btn.setAttribute('aria-valuetext', `${Math.round(shown)} phần trăm`);
  };

  const highlight = (index) => {
    paragraphs.forEach((p, i) => p.classList.toggle('cs-para--on', i === index));
  };

  const stopTick = () => {
    if (tick) clearInterval(tick);
    tick = null;
  };
  const stopPara = () => {
    if (paraTimer) clearTimeout(paraTimer);
    paraTimer = null;
  };
  const stopHandle = () => {
    if (handle && !handle.stopped) handle.stop();
    handle = null;
  };

  const stop = ({ reset = false } = {}) => {
    live = false;
    stopTick();
    stopPara();
    stopHandle();
    highlight(-1);
    btn.dataset.playing = 'false';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Phát audio đoạn văn');
    fill(btn, icon('play', 22));
    if (reset) {
      shown = 0;
      target = 0;
      paint();
    }
  };

  const step = () => {
    if (!live) return;
    if (shown < target) {
      shown = Math.min(target, shown + Math.max(0.7, (target - shown) * 0.16));
      paint();
    }
    if (shown >= 100) stop({ reset: false });
  };

  /**
   * Đọc lần lượt từng đoạn: tô sáng đoạn đang đọc, đẩy tiến độ theo độ dài đoạn.
   * Nhịp đọc do CHÍNH màn hình giữ (cộng lại đúng bằng story.audioSeconds) nên
   * mọi trình duyệt đều giống nhau; `ctx.audio.speak` chỉ lo phần tiếng đọc.
   */
  const readFrom = (index) => {
    if (!live) return;
    if (index >= paragraphs.length) {
      shown = 100;
      paint();
      stop({ reset: false });
      return;
    }
    highlight(index);
    target = ((index + 1) / paragraphs.length) * 100;
    const text = paragraphs[index].textContent.trim();

    handle = ctx.audio.speak(text, { lang: 'vi-VN', rate: 0.98 });
    paraTimer = setTimeout(() => {
      stopPara();
      readFrom(index + 1);
    }, paraMs(index));
  };

  btn.addEventListener('click', () => {
    if (live) {
      stop({ reset: false });
      return;
    }
    if (shown >= 100) shown = 0;
    const startIndex = Math.min(
      paragraphs.length - 1,
      Math.floor((shown / 100) * paragraphs.length + 0.001)
    );
    live = true;
    btn.dataset.playing = 'true';
    btn.setAttribute('aria-pressed', 'true');
    btn.setAttribute('aria-label', 'Tạm dừng audio đoạn văn');
    fill(btn, icon('pause', 22));
    target = shown;
    paint();
    tick = setInterval(step, 180);
    if (!paragraphs.length) {
      // Không có đoạn nào để đọc thì vẫn đóng tiến trình cho đúng nhịp.
      setTimeout(() => { shown = 100; paint(); stop({ reset: false }); }, 1200);
      return;
    }
    readFrom(Math.max(0, startIndex));
  });

  card.appendChild(btn);
  card.appendChild(h('div.grow.cs-player__body', {},
    bar,
    h('div.row.row--between.cs-player__meta', {}, now, end)));
  card.appendChild(ui.badge('audio lưu sẵn', 'success', 'check'));

  ctx.onCleanup(() => stop({ reset: false }));
  return card;
}

function openWordSheet(ctx, tok, node, story, onSeen) {
  const w = ctx.data.wordByEn(tok.text);
  const body = [];
  const closeRef = { current: null };
  // aria-expanded = "từ này đang mở nghĩa"; đóng sheet thì trả về false.
  if (node) node.setAttribute('aria-expanded', 'true');

  body.push(h('div.row.row--between.cs-sheet__top', {},
    h('span.mono.cs-sheet__ipa', {}, w && w.ipa ? `/${w.ipa}/` : `/${String(tok.text).toLowerCase()}/`),
    ui.audioButton({ text: w ? w.en : tok.text, label: `Nghe ${tok.text}` })));

  body.push(h('p.cs-sheet__vi', {}, w ? w.vi : 'Từ này chưa có trong bộ từ demo — nghĩa dưới đây suy ra từ ngữ cảnh câu bạn đang đọc.'));

  if (w) {
    body.push(h('div.row.row--wrap.cs-sheet__badges', {},
      ui.badge(w.pos || 'từ', 'outline'),
      ui.badge(`CEFR ${w.cefr}`, 'primary'),
      ui.badge(ctx.data.stageName(w.srs.stage), w.status === 'known' ? 'success' : 'info')));
    body.push(ui.divider('Câu ví dụ'));
    body.push(h('p.cs-sheet__ex.read', {}, w.example));
    body.push(h('p.cs-sheet__exvi', {}, w.exampleVi));
  } else {
    body.push(ui.callout({
      iconName: 'sparkles',
      title: 'Vẫn nghe được ngay',
      body: 'Bấm nút loa để nghe phát âm, rồi thêm vào bộ từ nếu bạn muốn giữ lại.',
    }));
  }

  const paragraph = node.parentElement ? node.parentElement.textContent : '';
  body.push(ui.divider('Trong đoạn của bạn'));
  body.push(h('p.cs-sheet__ctx.read', {}, ...emphasise(sentenceAround(paragraph, tok.text), tok.text)));

  const add = ui.button({
    label: 'Thêm vào bộ từ',
    icon: 'plus',
    variant: 'primary',
    onClick: () => {
      ctx.store.push('story.addedWords', { en: tok.text, storyId: story.id });
      add.disabled = true;
      add.textContent = 'Đã thêm vào bộ từ';
      ui.toast(`Đã thêm "${tok.text}" vào bộ từ — ôn lại sau 1 ngày`, { tone: 'success', iconName: 'check-circle' });
    },
  });

  const sheet = ui.sheet({
    title: w ? w.en : tok.text,
    sub: w ? `${w.pos} · ${w.cefr} · ${ctx.data.stageName(w.srs.stage)}` : 'chưa có trong từ điển demo',
    body,
    actions: ui.btnRow(add, ui.button({
      label: 'Đóng',
      variant: 'secondary',
      onClick: () => closeRef.current?.close(),
    })),
    ariaLabel: `Nghĩa của ${tok.text}`,
    onClose: () => {
      node.setAttribute('aria-expanded', 'false');
      onSeen?.();
    },
  });
  closeRef.current = sheet;
  return sheet;
}

export default {
  id: 'reader',
  title: 'Đoạn đan xen',
  group: 'c-story',
  chrome: 'tabbar',
  tab: 'reader',
  api: [{ key: 'llm:today', kind: 'llm', label: 'Viết đoạn đan xen', n: 1 }],
  notes: [
    'Ảnh của người học được đẩy lên thành BÌA (tỉ lệ 4:5) thay vì thumbnail: ngữ cảnh là nhân vật chính, không phải minh hoạ phụ.',
    'Từ tiếng Anh sống trong câu — chạm để nghe; không có danh sách từ nào trên màn này, vì danh sách sẽ biến trải nghiệm đọc thành bài tập.',
    'Con số phần trăm tiếng Anh là số thật tính từ chữ của đoạn (story.ratio), không phải nhãn "15–20%" in cứng. Đổi truyện là con số đổi theo.',
    'Trình phát đọc theo từng đoạn và tô sáng đoạn đang đọc, nên audio và chữ khớp nhau; mọi timer đều được dừng qua onCleanup.',
  ],
  render(ctx) {
    const requested = ctx.params.story || 'today';
    let story;
    let fallbackNote = null;

    try {
      const found = ctx.data.storyById(requested);
      story = ctx.data.hydrateStory(found);
      if (!found || found.id !== requested) {
        fallbackNote = `Không thấy truyện "${requested}" — đang mở truyện gần nhất.`;
      }
    } catch (err) {
      return h('div.screen', {},
        ui.appBar({ title: 'Đoạn đan xen', back: true }),
        h('div.screen__body', {},
          ui.empty({
            iconName: 'alert-triangle',
            title: 'Chưa dựng được đoạn đọc',
            body: String(err && err.message ? err.message : err),
            action: ui.button({ label: 'Về truyện đã lưu', onClick: () => ctx.nav.go('stories') }),
          })));
    }

    const photo = ctx.data.photoById(story.photoId);
    const totalWords = story.englishWords.length;
    const seen = new Set(
      (ctx.store.get('story.seen', []) || [])
        .filter((item) => item && item.storyId === story.id)
        .map((item) => item.en.toLowerCase())
    );

    const countValue = h('span.cs-count__value', {}, `${seen.size}/${totalWords}`);
    const countBar = ui.progress({ value: seen.size, max: Math.max(1, totalWords), variant: 'success', thin: true, label: 'Số từ đã chạm trong đoạn' });

    const article = ui.interleave(story.paragraphs, {
      onWordTap: (tok, node) => {
        node.classList.add('cs-en--seen');
        if (!seen.has(String(tok.text).toLowerCase())) {
          seen.add(String(tok.text).toLowerCase());
          countValue.textContent = `${seen.size}/${totalWords}`;
          countBar.setAttribute('aria-valuenow', String(seen.size));
          countBar.querySelector('.progress__bar').style.width = (seen.size / Math.max(1, totalWords)) * 100 + '%';
        }
        ctx.store.set('story.seen', [
          ...(ctx.store.get('story.seen', []) || []).filter((item) => !(item && item.storyId === story.id && item.en.toLowerCase() === String(tok.text).toLowerCase())),
          { storyId: story.id, en: tok.text },
        ]);
        ctx.store.set('story.activeWord', tok.text);
        openWordSheet(ctx, tok, node, story);
      },
    });

    // Đánh dấu sẵn những từ đã chạm ở lần đọc trước — người học thấy mình đang tiến bộ.
    article.querySelectorAll('.en').forEach((btn) => {
      if (seen.has(String(btn.dataset.word || '').toLowerCase())) {
        btn.classList.add('cs-en--seen');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    // Deep link chia sẻ tới một từ: #/reader?story=today&word=mug
    if (ctx.params.word) {
      const wanted = String(ctx.params.word).toLowerCase();
      const target = Array.from(article.querySelectorAll('.en'))
        .find((btn) => String(btn.dataset.word || '') === wanted);
      if (target) requestAnimationFrame(() => target.click());
    }

    const saveBtn = ui.iconBtn('bookmark', {
      label: 'Lưu đoạn này vào nhật ký',
      onClick: () => {
        ctx.store.push('story.addedWords', { storyId: story.id, saved: true });
        ui.toast('Đã lưu vào nhật ký học của bạn', { tone: 'success', iconName: 'bookmark-check' });
      },
    });

    const cta = ui.button({
      label: 'Luyện nói với đoạn này',
      icon: 'mic',
      block: true,
      onClick: () => ctx.nav.go('speaking'),
    });

    return h('div.screen', {},
      ui.appBar({
        title: 'Đoạn đan xen',
        sub: `${story.date} · trình độ ${story.cefr}`,
        back: true,
        actions: [saveBtn],
      }),
      h('div.screen__body', { class: 'cs-reader' },
        fallbackNote ? ui.callout({ tone: 'warning', iconName: 'info', title: 'Truyện không tồn tại', body: fallbackNote }) : null,

        // ------------------------------- Bìa -------------------------------
        ui.photoFrame({
          src: photo.src,
          alt: photo.alt,
          ratio: 'square',
          className: 'cs-cover',
          children: [
            h('div.cs-cover__scrim', { 'aria-hidden': 'true' }),
            h('div.cs-cover__meta', {},
              h('span.cs-cover__kicker', {}, `Truyện của ${ctx.data.user.name}`),
              h('span.cs-cover__caption', {}, photo.caption)),
            h('span.cs-cover__ratio', {},
              icon('sparkles', 13),
              `${story.ratio}% tiếng Anh`),
          ],
        }),

        // ------------------------------ Tiêu đề ----------------------------
        h('header.cs-head', {},
          h('h1.cs-head__title', {}, story.title),
          h('p.cs-head__lede', {},
            `AI viết lại câu chuyện của bạn và đan ${totalWords} từ tiếng Anh đúng trình độ ${story.cefr}.`),
          h('div.row.row--wrap.cs-head__tags', {},
            ui.badge(`CEFR ${story.cefr}`, 'primary', 'graduation-cap'),
            ui.badge(`${story.ratio}% tiếng Anh`, 'outline'),
            ui.badge(`${story.paragraphs.length} đoạn`, 'outline'),
            ui.badge(formatTime(story.audioSeconds), 'outline', 'headphones'))),

        // ------------------------------ Audio ------------------------------
        buildPlayer(ctx, story, article),

        // ---------------------------- Bộ đếm từ ----------------------------
        h('section.cs-count', {},
          h('div.row.row--between.cs-count__head', {},
            h('div', {},
              h('span.label', {}, 'Từ mới trong đoạn'),
              h('p.cs-count__hint', {}, 'Chạm vào từ màu cam để nghe và xem nghĩa')),
            countValue),
          countBar),

        // ------------------------------ Bài đọc ----------------------------
        h('article.cs-article', { 'aria-label': `Đoạn đan xen: ${story.title}` }, article),

        ui.callout({
          tone: 'success',
          iconName: 'zap',
          title: 'Đoạn này đã tốn đúng 1 lời gọi AI',
          body: 'Audio và nghĩa của từng từ được lưu lại, nên mở lại truyện hay ôn tập đều không tính thêm API.',
        }),

        h('div.cs-reader__actions', {},
          cta,
          ui.btnRow(
            ui.button({
              label: 'Truyện khác',
              icon: 'book-open',
              variant: 'secondary',
              onClick: () => ctx.nav.go('stories'),
            }),
            ui.button({
              label: 'Kể chuyện mới',
              icon: 'pencil',
              variant: 'ghost',
              onClick: () => ctx.nav.go('compose'),
            })))));
  },
};
