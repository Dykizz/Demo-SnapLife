/* ============================================================================
   onboarding — 3 slide: vấn đề → giải pháp 3 bước → quyền riêng tư & xin quyền
   Owner: screens-onboard.  chrome 'none', api [].
   ========================================================================== */

import { h, clear } from '../../core/dom.js';
import { ui, icon } from '../../core/ui.js';

export default {
  id: 'onboarding',
  title: 'Onboarding 3 bước',
  group: 'a-onboarding',
  chrome: 'none',
  api: [],

  notes: [
    'Slide 1 nói thẳng cái đau (tốn tiền, tốn thời gian, chóng chán) trước khi bán giải pháp. Người học không thiếu quyết tâm — họ thiếu phương pháp gắn với chính mình.',
    'Slide 2 dùng đúng ba bước đã có trên pitch deck, đánh số to để mắt bám được nhịp: gợi ý từ → đọc đan xen → ôn đa dạng.',
    'Slide 3 là lợi thế cạnh tranh chứ không phải trang pháp lý, nên được đặt ngang hàng hai slide kia: mỗi quyền đi kèm một câu LÝ DO cụ thể, không xin quyền trống.',
    'Nút "Bỏ qua" luôn hiện ở góc trên để không ai bị nhốt trong luồng nhập môn — demo cho giám khảo cần đường thoát.',
  ],

  render(ctx) {
    const slides = ctx.data.onboardingSlides;
    let index = Math.max(0, Math.min(Number(ctx.store.get('onboarding.slide', 0)) || 0, slides.length - 1));

    const stepLabel = h('span.label');
    const dots = h('div.a-onb__dots');
    const stage = h('div.a-onb__stage');
    const footer = h('div.a-onb__nav');

    /* ---------------------------- Xin quyền ------------------------------- */
    const permissionRow = (perm) => {
      const key = perm.icon === 'camera' ? 'camera' : 'mic';
      const art = h('span.a-onb__perm-art', {}, icon(perm.icon, 19));
      const slot = h('div.a-onb__perm-slot');
      const paintSlot = () => {
        clear(slot);
        if (ctx.store.get(`onboarding.permissions.${key}`, false)) {
          slot.appendChild(ui.badge('Đã bật', 'success', 'check'));
          return;
        }
        slot.appendChild(ui.button({
          label: 'Cho phép',
          variant: 'soft',
          size: 'sm',
          onClick: () => {
            ctx.store.set(`onboarding.permissions.${key}`, true);
            paintSlot();
            ui.toast(`Đã bật quyền ${perm.label.toLowerCase()}`, { tone: 'success', iconName: perm.icon });
          },
        }));
      };
      paintSlot();
      return h('div.a-onb__perm', {}, art,
        h('div.grow', {},
          h('div.a-onb__perm-label', {}, perm.label),
          h('div.a-onb__perm-why', {}, perm.why)),
        slot);
    };

    /* ---------------------------- Nội dung slide -------------------------- */
    const renderSlide = (slide) => {
      const head = h('div.a-onb__head', {},
        h('span.a-onb__kicker', {}, h('span.label', {}, slide.kicker)),
        h('h1.a-onb__title', {}, slide.title),
        h('p.a-onb__lead', {}, slide.body));

      if (slide.id === 'problem') {
        return h('div.a-onb__slide', {}, head,
          h('div.a-onb__bullets', {},
            ...slide.bullets.map((b) => h('div.a-onb__bullet', {},
              h('span.a-onb__bullet-art', {}, icon(b.icon, 19)),
              h('div.grow', {},
                h('div.a-onb__bullet-title', {}, b.title),
                h('div.a-onb__bullet-text', {}, b.text))))),
          slide.note
            ? ui.callout({ iconName: 'info', title: 'Điều đáng chú ý', body: slide.note })
            : null);
      }

      if (slide.id === 'solution') {
        return h('div.a-onb__slide', {}, head,
          h('div.a-steps', {},
            ...slide.steps.map((s) => h('div.a-step', {},
              h('span.a-step__num.mono', {}, String(s.n)),
              h('div.grow', {},
                h('div.a-step__title', {}, s.title),
                h('div.a-step__text', {}, s.text))))));
      }

      return h('div.a-onb__slide', {}, head,
        h('div.a-onb__facts', {},
          ...slide.facts.map((f) => h('div.a-onb__fact', {},
            h('span.a-onb__fact-art', {}, icon(f.icon, 18)),
            h('span.grow.a-onb__fact-label', {}, f.label),
            h('span.mono.a-onb__fact-value', {}, f.value)))),
        ui.callout({
          tone: 'success',
          iconName: 'shield',
          title: 'Không dùng ảnh và giọng nói của bạn để huấn luyện mô hình',
          body: 'Đây là lợi thế cạnh tranh của SnapLife AI, không phải một dòng chôn trong trang điều khoản.',
        }),
        h('div.a-onb__perms', {},
          ui.sectionTitle('App sẽ xin đúng hai quyền'),
          h('p.note', {}, 'Mỗi quyền chỉ được dùng cho một việc, và bạn có thể từ chối rồi bật lại sau.'),
          h('div.stack.stack--tight', {}, ...slide.permissions.map(permissionRow))));
    };

    /* ------------------------------ Điều hướng --------------------------- */
    const goNext = () => {
      if (index < slides.length - 1) {
        index += 1;
        paint();
        return;
      }
      ctx.store.set('onboarding.done', true);
      ctx.nav.go('placement');
    };

    const paint = () => {
      ctx.store.set('onboarding.slide', index);

      clear(stage);
      stage.appendChild(renderSlide(slides[index]));
      stage.classList.remove('anim-enter');
      if (!ctx.gallery) {
        // Buộc chạy lại animation vào màn hình cho từng slide.
        void stage.offsetWidth;
        stage.classList.add('anim-enter');
      }

      clear(dots);
      slides.forEach((s, i) => dots.appendChild(
        h(`span.a-onb__dot${i === index ? '.a-onb__dot--on' : ''}`, { 'aria-hidden': 'true' })));
      stepLabel.textContent = `Bước ${index + 1}/${slides.length}`;

      clear(footer);
      footer.appendChild(ui.iconBtn('chevron-left', {
        label: 'Bước trước',
        variant: 'solid',
        disabled: index === 0,
        onClick: () => {
          if (index === 0) return;
          index -= 1;
          paint();
        },
      }));
      footer.appendChild(h('div.grow', {}, ui.button({
        label: index === slides.length - 1 ? 'Làm test xếp trình độ' : 'Tiếp tục',
        iconRight: 'arrow-right',
        block: true,
        onClick: goNext,
      })));
    };

    const node = h('div.screen.a-onb', {},
      h('div.screen__body.a-onb__body', {},
        h('div.a-onb__top', {},
          h('div.a-onb__brandmark', { 'aria-hidden': 'true' }, icon('camera', 18)),
          h('span.a-onb__wordmark', {}, 'SnapLife AI'),
          h('span.grow'),
          ui.button({
            label: 'Bỏ qua',
            variant: 'ghost',
            size: 'sm',
            onClick: () => ctx.nav.go('home', {}, { replace: true }),
          })),
        h('div.a-onb__progress', {}, stepLabel, dots),
        stage,
        footer));

    paint();
    return node;
  },
};
