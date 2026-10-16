/* ============================================================================
   NHÓM E · progress — Hồ sơ tự cập nhật
   Deck slide 11 + PLAN luồng 5. Màn này phải chứng minh sản phẩm có chiều sâu
   dữ liệu: CEFR, lịch streak 5 tuần, phân bố từ theo CEFR, vòng đời SRS,
   số liệu trạng thái, thời gian học.

   Nguyên tắc biểu đồ: KHÔNG truyền đạt chỉ bằng màu — mỗi biểu đồ đều kèm số
   và nhãn chữ; ô heatmap in thẳng số phút.
   ========================================================================== */

import { h } from '../../core/dom.js';
import { ui } from '../../core/ui.js';
import { block, legendRow, whyLine, noteList } from './shared.js';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default {
  id: 'progress',
  title: 'Hồ sơ tự cập nhật',
  group: 'e-progress',
  chrome: 'tabbar',
  tab: 'progress',
  api: [],
  notes: [
    'Số liệu tài khoản (streak, tổng từ đã thuộc, phút học) lấy từ ctx.data.user; các biểu đồ vẽ trên đúng bộ từ trong ctx.store.words nên khi bạn xoá dữ liệu học, biểu đồ về 0 thay vì hiển thị số cũ.',
    'Heatmap 5 tuần × 7 ngày in thẳng số phút trong từng ô và có bảng chú giải theo khoảng phút — người mù màu vẫn đọc được toàn bộ thông tin.',
    'Phân bố CEFR và histogram SRS đều hiện số kèm nhãn ("đã thuộc 2/6", "5 từ") chứ không dựa vào độ đậm của thanh.',
    'Phút học tuần này so với mục tiêu tuần (goalMinutes × 7) để thấy ngay còn thiếu bao nhiêu, thay vì chỉ báo một con số rời.',
  ],

  render(ctx) {
    const { data, store, nav } = ctx;
    const user = data.user || {};
    const words = store.get('words', []) || [];

    const cal = data.streakCalendar({ weeks: 5 });          // 35 ô
    const dist = data.cefrDistribution(words);              // A1..C1
    const stageHist = data.stageHistogram(words);           // 5 giai đoạn SRS
    const st = data.statusCounts(words);

    const pctToNext = Math.round((user.cefrProgress || 0) * 100);
    const weeklyGoal = (user.goalMinutes || 20) * 7;

    /* ------------------------------ Heatmap ------------------------------- */
    const maxMin = Math.max(1, ...cal.map((c) => c.minutes));
    const totalMin = cal.reduce((a, c) => a + c.minutes, 0);
    const doneDays = cal.filter((c) => c.done).length;
    const t1 = Math.max(1, Math.ceil(maxMin / 3));
    const t2 = Math.max(t1 + 1, Math.ceil((maxMin * 2) / 3));
    const level = (m) => (!m ? 0 : m <= t1 ? 1 : m <= t2 ? 2 : 3);

    const heatGrid = h('div.e-heatgrid', {},
      ...WEEKDAYS.map((d) => h('span.e-heat__wd.mono', {}, d)),
      ...cal.map((c, i) => h(`div.e-heat.e-heat--${level(c.minutes)}`, {
        role: 'img',
        'aria-label': c.done
          ? `Ngày ${i + 1} trong 35 ngày: học ${c.minutes} phút`
          : `Ngày ${i + 1} trong 35 ngày: không học`,
      }, c.minutes ? h('span.e-heat__n.mono', {}, String(c.minutes)) : null)));

    const heatLegend = h('div.e-heatlegend', {},
      h('span.e-heatlegend__item', {}, h('span.e-swatch.e-swatch--0', { 'aria-hidden': 'true' }), 'không học'),
      h('span.e-heatlegend__item', {}, h('span.e-swatch.e-swatch--1', { 'aria-hidden': 'true' }), `1–${t1} phút`),
      h('span.e-heatlegend__item', {}, h('span.e-swatch.e-swatch--2', { 'aria-hidden': 'true' }), `${t1 + 1}–${t2} phút`),
      h('span.e-heatlegend__item', {}, h('span.e-swatch.e-swatch--3', { 'aria-hidden': 'true' }), `${t2 + 1}–${maxMin} phút`));

    /* --------------------------- Phân bố CEFR ----------------------------- */
    const maxTotal = Math.max(1, ...dist.map((d) => d.total));
    const distRows = dist.map((d) => {
      const totalPct = Math.max(d.total ? 8 : 3, Math.round((d.total / maxTotal) * 100));
      const knownPct = d.total ? Math.round((d.known / d.total) * 100) : 0;
      return h('div.e-dist__row', {},
        h('span.e-dist__lv.mono', {}, d.level),
        h('div.e-dist__col', {},
          h(`div.e-dist__track${d.total ? '' : '.is-empty'}`, { style: { width: totalPct + '%' } },
            d.total ? h('div.e-dist__fill', { style: { width: knownPct + '%' } }) : null),
          h('span.e-dist__meta', {}, d.total
            ? `đã thuộc ${d.known}/${d.total} từ · còn ${d.total - d.known}`
            : 'chưa có từ nào ở mức này')),
        h('span.e-dist__n.mono', {}, String(d.total)));
    });

    /* ------------------------------ Trạng thái ---------------------------- */
    const statusTotal = Math.max(1, st.known + st.learning + st.new);
    const segWidth = (n) => Math.round((n / statusTotal) * 100) + '%';

    /* --------------------------------- View ------------------------------- */
    const screenHead = h('div.e-screenhead', {},
      h('span.label', {}, 'Hồ sơ tự cập nhật'),
      h('h1.h1', {}, 'Tiến độ học của bạn'),
      h('p.lede', {}, `${user.name} · ${user.wordsKnown} từ đã thuộc · chuỗi ${user.streak} ngày`));

    const hero = h('section.e-hero', {},
      ui.ring({
        value: pctToNext,
        max: 100,
        size: 112,
        thickness: 10,
        variant: 'success',
        label: `Trình độ ${user.cefr}: đã đi ${pctToNext}% chặng tới ${user.cefrNext}`,
        center: h('div.e-hero__center', {},
          h('span.e-hero__lv', {}, user.cefr),
          h('span.e-hero__pct.mono', {}, `${pctToNext}%`)),
      }),
      h('div.grow', {},
        h('span.label', {}, 'Trình độ hiện tại'),
        h('h2.e-hero__next', {}, `${user.cefr} → ${user.cefrNext}`),
        h('p.e-hero__sub', {}, `Còn ${100 - pctToNext}% chặng đường tới ${user.cefrNext}. Hồ sơ tự điều chỉnh sau mỗi phiên ôn, không cần bạn nhập gì.`),
        h('p.e-hero__meta.mono', {}, `test gần nhất: ${user.lastPlacement}`)));

    const kpis = ui.statGrid([
      { label: 'Chuỗi ngày', value: String(user.streak), sub: `Kỷ lục ${user.bestStreak} ngày` },
      { label: 'Từ đã thuộc', value: String(user.wordsKnown), sub: `${user.wordsLearning} từ đang học` },
      { label: 'Phút tuần này', value: String(user.minutesWeek), sub: `Hôm nay ${user.minutesToday}/${user.goalMinutes} phút` },
      { label: 'Cấp độ', value: String(user.level), sub: `${Number(user.xp || 0).toLocaleString('vi-VN')} XP` },
    ]);

    const wordsCount = words.length;
    const emptyNote = wordsCount === 0
      ? ui.callout({
          tone: 'warning',
          iconName: 'info',
          title: 'Bộ từ đang trống',
          body: 'Bạn vừa xoá dữ liệu học trên máy. Các biểu đồ dưới đây đang ở mức 0 — chụp một tấm ảnh hoặc đặt lại dữ liệu demo để có số liệu.',
        })
      : null;

    return h('div.screen.e-screen.e-progress', {},
      h('div.screen__body', {},
        screenHead,
        hero,
        kpis,
        emptyNote,

        block({
          kicker: 'Chuỗi ngày',
          title: 'Lịch học 5 tuần',
          meta: `${doneDays}/35 ngày có học · tổng ${totalMin} phút`,
          children: [heatGrid, heatLegend, whyLine('Mỗi ô in số phút học của ngày đó; ô trống nghĩa là không học. Không cần phân biệt bằng màu.')],
        }),

        block({
          kicker: 'Từ vựng',
          title: 'Phân bố theo trình độ CEFR',
          meta: `Vẽ trên ${wordsCount} từ trong bộ từ trên máy · tổng tài khoản ${user.wordsKnown} từ`,
          children: [
            ...distRows,
            h('div.e-chartlegend', {},
              h('span.e-chartlegend__item', {}, 'Thanh dài = số từ ở mức đó'),
              h('span.e-chartlegend__item', {}, 'Phần đậm = đã thuộc')),
            noteList([`${st.known} từ đã thuộc trên ${wordsCount} từ của bộ từ demo.`]),
          ],
          why: 'Có đủ 5 mức A1–C1 kể cả mức 0 từ, để không mức nào bị ẩn khỏi người học.',
        }),

        block({
          kicker: 'Vòng đời ghi nhớ',
          title: 'Từ đang ở giai đoạn nào (SRS)',
          meta: 'Sinh bằng thuật toán SM-2, chạy trên máy — 0 API call',
          children: [
            ui.barList(stageHist.map((n, i) => ({
              label: data.stageName(i),
              value: n,
              color: i >= 3 ? 'success' : 'primary',
            }))),
            h('p.e-chartnote', {}, 'Số bên phải mỗi dòng là số từ ở giai đoạn đó; nhãn giai đoạn nằm bên trái.'),
          ],
        }),

        block({
          kicker: 'Trạng thái bộ từ',
          title: 'Đã thuộc · đang học · từ mới',
          meta: `${wordsCount} từ trong bộ từ trên máy`,
          children: [
            h('div.e-prop', { role: 'img', 'aria-label': `Đã thuộc ${st.known}, đang học ${st.learning}, từ mới ${st.new}` },
              h('div.e-prop__seg.e-prop__seg--known', { style: { width: segWidth(st.known) } }),
              h('div.e-prop__seg.e-prop__seg--learning', { style: { width: segWidth(st.learning) } }),
              h('div.e-prop__seg.e-prop__seg--new', { style: { width: segWidth(st.new) } })),
            legendRow({ label: 'Đã thuộc', value: st.known, cls: 'e-legend__dot--known' }),
            legendRow({ label: 'Đang học', value: st.learning, cls: 'e-legend__dot--learning' }),
            legendRow({ label: 'Từ mới', value: st.new, cls: 'e-legend__dot--new' }),
            ui.callout({
              tone: st.due ? 'warning' : 'success',
              iconName: 'list-checks',
              title: `${st.due} từ đến hạn ôn hôm nay`,
              body: 'Phiên ôn sinh bằng quy tắc từ chính bộ từ này — phần đắt nhất của sản phẩm vẫn miễn phí.',
            }),
            ui.button({
              label: 'Vào ôn tập',
              icon: 'arrow-right',
              variant: 'secondary',
              block: true,
              onClick: () => nav.go('review-hub'),
            }),
          ],
        }),

        block({
          kicker: 'Thời gian',
          title: 'Tuần này so với mục tiêu',
          meta: `${user.minutesWeek}/${weeklyGoal} phút · mục tiêu ${user.goalMinutes} phút mỗi ngày`,
          children: [
            ui.progress({
              value: Math.min(user.minutesWeek, weeklyGoal),
              max: weeklyGoal,
              variant: 'success',
              label: `Tuần này ${user.minutesWeek} trên ${weeklyGoal} phút`,
            }),
            ui.keyval('Hôm nay', `${user.minutesToday}/${user.goalMinutes} phút`),
            ui.keyval('Tuần này', `${user.minutesWeek}/${weeklyGoal} phút`),
            ui.keyval('Cấp độ', `Cấp ${user.level} · ${Number(user.xp || 0).toLocaleString('vi-VN')} XP`),
            ui.keyval('Đồng hành cùng SnapLife', `${user.joinedDays} ngày`),
          ],
        }),

        whyLine('Số ở phần tài khoản (streak, tổng từ) là số tích luỹ; biểu đồ vẽ trên đúng bộ từ đang có trên máy này.'),
      ),
      h('div.screen__cta', {},
        ui.button({
          label: 'Làm lại test 3 phút',
          icon: 'target',
          block: true,
          onClick: () => nav.go('placement'),
        })));
  },
};
