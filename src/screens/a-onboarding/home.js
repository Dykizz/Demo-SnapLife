/* ============================================================================
   home — Hôm nay: chuỗi ngày, câu hôm nay, 3 hành động, chọn độ dài phiên
   Owner: screens-onboard.  chrome 'tabbar', tab 'home', api [].
   Màn hình được nhìn nhiều nhất — mọi con số đọc thật từ ctx.data.
   ========================================================================== */

import { h, clear } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';

const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function greetingFor(hour) {
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 14) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export default {
  id: 'home',
  title: 'Hôm nay',
  group: 'a-onboarding',
  chrome: 'tabbar',
  tab: 'home',
  api: [],

  notes: [
    'Trang chủ trả lời đúng một câu hỏi: "Hôm nay tôi làm gì?". Thứ tự cố định là bạn đang ở đâu (chuỗi ngày, phút, số từ) → một câu tiếng Anh kèm nghĩa Việt → ba hành động → chọn độ dài phiên.',
    '"Chụp ảnh" được làm to hơn hai thẻ còn lại vì đó là khoảnh khắc wow của sản phẩm; Kể chuyện và Ôn tập nằm cạnh nhau ở hàng dưới để mắt không phải so sánh ba thứ ngang hàng nhau.',
    'Mọi con số ở đây đọc trực tiếp từ ctx.data.user và ctx.data.dueWords(), không có số nào viết cứng — đổi dữ liệu demo là màn hình đổi theo, không cần sửa code.',
    'Câu hôm nay luôn có nghĩa tiếng Việt ngay dưới và một nút nghe: một câu động viên không kèm nghĩa thì chỉ là câu tiếng Anh trang trí.',
  ],

  render(ctx) {
    const user = ctx.data.user;
    const now = new Date();
    const dateLabel = `${WEEKDAYS[now.getDay()]}, ${now.getDate()}/${now.getMonth() + 1}`;
    const shortName = String(user.name).trim().split(/\s+/).slice(-1)[0];
    const due = ctx.data.dueWords();
    const dueCount = due.length;
    const remaining = Math.max(0, user.goalMinutes - user.minutesToday);

    /* --------------------------- Chọn độ dài phiên ------------------------ */
    const lengths = ctx.data.sessionLengths;
    let lengthValue = Number(ctx.store.get('review.length', 10)) || 10;

    const sessionHint = h('p.a-session__hint');
    const sessionCta = h('div');
    const seg = ui.segmented({
      options: lengths.map((l) => ({ value: l.value, label: l.label, hint: l.hint })),
      value: lengthValue,
      ariaLabel: 'Độ dài phiên ôn',
      onChange: (value) => {
        lengthValue = Number(value);
        ctx.store.set('review.length', lengthValue);
        paintSession();
      },
    });

    function paintSession() {
      const cfg = lengths.find((l) => l.value === lengthValue) || lengths[1];
      sessionHint.textContent = `${cfg.items} thẻ · ${cfg.hint}`;
      clear(sessionCta);
      sessionCta.appendChild(ui.button({
        label: `Bắt đầu phiên ${cfg.label}`,
        icon: 'play',
        block: true,
        onClick: () => ctx.nav.go('review-hub'),
      }));
    }

    /* ------------------------------ Câu hôm nay --------------------------- */
    const mood = ctx.store.get('daily.mood', null) || 'ok';
    const sentenceBank = ctx.data.dailySentences[mood] || ctx.data.dailySentences.ok;
    let sentence = sentenceBank.find((s) => s.id === ctx.store.get('daily.sentenceId', null)) || sentenceBank[0];

    const sentenceEn = h('p.a-sentence__en', {}, sentence.en);
    const sentenceVi = h('p.a-sentence__vi', {}, sentence.vi);
    const audioSlot = h('span.a-sentence__audio');

    function paintAudio() {
      clear(audioSlot);
      audioSlot.appendChild(ui.audioButton({
        text: sentence.en,
        wide: true,
        label: `Nghe câu: ${sentence.en}`,
      }));
    }

    function changeSentence() {
      const i = sentenceBank.findIndex((s) => s.id === sentence.id);
      sentence = sentenceBank[(i + 1) % sentenceBank.length];
      ctx.store.set('daily.sentenceId', sentence.id);
      sentenceEn.textContent = sentence.en;
      sentenceVi.textContent = sentence.vi;
      paintAudio();
    }

    paintAudio();

    /* ------------------------------- Hành động ---------------------------- */
    const actionCard = ({ iconName, title, text, meta, feature = false, onClick }) => ui.card({
      className: `a-action${feature ? ' a-action--feature' : ''}`,
      ariaLabel: `${title}. ${text}`,
      children: [
        h('span.a-action__art', {}, icon(iconName, feature ? 24 : 20)),
        h('div.grow', {},
          h('div.a-action__title', {}, title),
          h('div.a-action__text', {}, text),
          h('div.a-action__meta.mono', {}, meta)),
        h('span.a-action__go', { 'aria-hidden': 'true' }, icon('chevron-right', feature ? 20 : 17)),
      ],
      onClick,
    });

    /* --------------------------------- Dựng ------------------------------- */
    const node = h('div.screen.a-home', {},
      ui.appBar({
        title: `${greetingFor(now.getHours())}, ${shortName}`,
        sub: `${dateLabel} · Chuỗi ${user.streak} ngày`,
        actions: [ui.iconBtn('user', { label: 'Hồ sơ của bạn', onClick: () => ctx.nav.go('profile') })],
      }),

      h('div.screen__body', {},
        /* 1 · Bạn đang ở đâu ------------------------------------------------- */
        ui.card({ pad: 'lg', className: 'a-hero', children: [
          h('div.a-hero__top', {},
            ui.ring({
              value: user.minutesToday,
              max: user.goalMinutes,
              size: 94,
              thickness: 9,
              variant: remaining === 0 ? 'success' : '',
              label: `${user.minutesToday} trên ${user.goalMinutes} phút mục tiêu hôm nay`,
              center: h('div.a-hero__ringtext', {},
                h('span.a-hero__ringnum', {}, String(user.minutesToday)),
                h('span.a-hero__ringunit.mono', {}, `/ ${user.goalMinutes} phút`)),
            }),
            h('div.grow.a-hero__stats', {},
              h('div.a-mini.a-mini--flame', {},
                h('span.a-mini__art', {}, icon('flame', 18)),
                h('div.grow', {},
                  h('div.a-mini__num', {}, `${user.streak} ngày`),
                  h('div.a-mini__label', {}, 'liên tiếp giữ nhịp'),
                  h('div.a-mini__sub.mono', {}, `Kỷ lục ${user.bestStreak} ngày`))),
              h('div.a-mini.a-mini--words', {},
                h('span.a-mini__art', {}, icon('book-open', 18)),
                h('div.grow', {},
                  h('div.a-mini__num', {}, `${user.wordsKnown} từ`),
                  h('div.a-mini__label', {}, 'đã thuộc'),
                  h('div.a-mini__sub.mono', {}, `Đang học ${user.wordsLearning} · mới ${user.wordsNew}`))))),
          h('p.a-hero__hint', {}, remaining === 0
            ? `Bạn đã chạm mục tiêu ${user.goalMinutes} phút hôm nay. Giữ nguyên nhịp này là đủ.`
            : `Còn ${remaining} phút nữa là đủ mục tiêu ${user.goalMinutes} phút hôm nay.`),
        ] }),

        /* 2 · Câu hôm nay ---------------------------------------------------- */
        h('div', {},
          ui.sectionTitle('Câu hôm nay', ui.button({
            label: 'Theo tâm trạng',
            variant: 'ghost',
            size: 'sm',
            icon: 'heart',
            onClick: () => ctx.nav.go('diary'),
          })),
          ui.card({ pad: 'lg', className: 'a-sentence', children: [
            h('div.row.row--between', {},
              h('span.label', {}, 'Chọn từ kho câu động viên'),
              ui.badge('0 API call', 'success', 'zap')),
            sentenceEn,
            sentenceVi,
            h('div.a-sentence__foot', {},
              audioSlot,
              h('span.grow'),
              ui.button({
                label: 'Câu khác',
                variant: 'secondary',
                size: 'sm',
                icon: 'refresh',
                onClick: changeSentence,
              })),
          ] })),

        /* 3 · Ba hành động chính --------------------------------------------- */
        h('div', {},
          ui.sectionTitle('Bắt đầu học', ui.badge('cá nhân hoá theo bạn', 'outline', 'sparkles')),
          h('div.a-actions', {},
            actionCard({
              iconName: 'camera',
              title: 'Chụp ảnh',
              text: 'Chụp thứ đang ở trước mặt — AI khoanh vùng và sinh thẻ từ.',
              meta: 'VLM 1×/ảnh',
              feature: true,
              onClick: () => ctx.nav.go('capture'),
            }),
            // Hai thẻ phụ viết cùng lượng chữ (mô tả 2 dòng) nên cao bằng nhau
            // bằng chính nội dung — không cần grid kéo giãn.
            actionCard({
              iconName: 'pencil',
              title: 'Kể chuyện',
              text: 'Đoạn đan xen đúng trình độ.',
              meta: 'LLM 1×/truyện',
              onClick: () => ctx.nav.go('compose'),
            }),
            actionCard({
              iconName: 'list-checks',
              title: 'Ôn tập',
              text: dueCount
                ? `${dueCount} từ đến hạn, 5 dạng bài.`
                : 'Hôm nay không còn từ đến hạn.',
              meta: '0 API call',
              onClick: () => ctx.nav.go('review-hub'),
            }))),

        /* 4 · Phiên ôn hôm nay ---------------------------------------------- */
        h('div', {},
          ui.sectionTitle('Phiên ôn hôm nay', ui.badge(
            dueCount ? `${dueCount} từ đến hạn` : 'đã hết từ đến hạn',
            dueCount ? 'primary' : 'success',
            'layers'
          )),
          ui.card({ pad: 'lg', className: 'a-session', children: dueCount === 0
            ? [ui.empty({
                iconName: 'check-circle',
                title: 'Hôm nay không còn từ đến hạn',
                body: 'Chuỗi ngày vẫn giữ được bằng một đoạn đọc ngắn, hoặc chụp thêm một tấm ảnh mới.',
                action: ui.button({
                  label: 'Đọc một đoạn mới',
                  variant: 'secondary',
                  icon: 'book-open',
                  onClick: () => ctx.nav.go('reader'),
                }),
              })]
            : [seg, sessionHint, sessionCta] })),
      ));

    paintSession();
    return node;
  },
};
