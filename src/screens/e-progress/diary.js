/* ============================================================================
   NHÓM E · diary — Nhật ký sắc thái → câu tiếng Anh khớp tâm trạng
   Deck slide 07 + PLAN luồng 5.

   Quy tắc không được phá:
   · sắc thái thấp (low, down)  → câu tone 'acknowledge'  (GHI NHẬN)
   · sắc thái cao (ok, up, great) → câu tone 'encourage'  (ĐỘNG VIÊN)
   Hai kho tách hẳn nhau trong ctx.data.dailySentences, màn hình chỉ đọc theo mood.
   ========================================================================== */

import { h, clear } from '../../core/dom.js';
import { ui } from '../../core/ui.js';
import {
  iconOf, moodById, moodIconName, moodLevel, block, noteList, TONE_META, whyLine,
} from './shared.js';

export default {
  id: 'diary',
  title: 'Nhật ký sắc thái',
  group: 'e-progress',
  chrome: 'appbar',
  api: [],
  notes: [
    'Hai kho câu tách hẳn nhau: low/down chỉ chứa tone "acknowledge", ok/up/great chỉ chứa tone "encourage". Sắc thái thấp không bao giờ nhận câu cổ vũ sáo rỗng — đây là điểm khác biệt ở slide 07, không phải chi tiết nhỏ.',
    'Câu lấy từ kho có sẵn trên máy nên màn này khai báo 0 API call (BUILD-SPEC §8). Hệ thống chỉ gọi mô hình khi người dùng chủ động viết câu mới.',
    'Mỗi câu luôn kèm nghĩa tiếng Việt và nút nghe: người học cần hiểu câu mình vừa nhận, không chỉ đọc cho vui.',
    'Lịch sử 7 ngày hiển thị cả icon lẫn mức 1–5 nên không phải phân biệt sắc thái bằng màu; mức chọn cũng có 5 vạch đếm tương ứng.',
  ],

  render(ctx) {
    const { data, store } = ctx;
    const ic = iconOf(ctx);

    const moods = data.moods || [];
    const pool = data.dailySentences || {};
    const firstMood = moodById(moods, 'ok') || moods[0] || null;

    let history = (store.get('daily.history', []) || []).slice();
    const storedMoodId = store.get('daily.mood', null);
    const storedSentenceId = store.get('daily.sentenceId', null);
    const lastHistoryMood = moodById(moods, history[history.length - 1]);

    // Có nhật ký hôm qua → bắt đầu từ sắc thái đó; chưa có → mức trung tính.
    let moodId = moodById(moods, storedMoodId)
      ? storedMoodId
      : (lastHistoryMood ? lastHistoryMood.id : (firstMood ? firstMood.id : null));

    const listFor = (id) => pool[id] || [];
    const resolveSentence = (id, preferId) => {
      const list = listFor(id);
      return list.find((s) => s.id === preferId) || list[0] || null;
    };
    let sentence = resolveSentence(moodId, storedSentenceId);

    const moodHost = h('div.e-moods', { role: 'radiogroup', 'aria-label': 'Chọn sắc thái của bạn hôm nay' });
    const captionHost = h('div.e-mood-caption', { role: 'status' });
    const sentenceHost = h('div.e-sentence');
    const histHost = h('div.e-hist');
    const histCap = h('p.e-hist__cap');

    const labelOf = (id) => {
      const m = moodById(moods, id);
      return m ? m.label : '—';
    };
    const isSavedToday = () => Boolean(store.get('daily.savedAt'));

    function persist() {
      store.set({
        'daily.mood': moodId,
        'daily.sentenceId': sentence ? sentence.id : null,
      });
    }

    /* ------------------------------ Sắc thái ------------------------------ */
    function paintMoods() {
      clear(moodHost);
      moods.forEach((m, i) => {
        const on = m.id === moodId;
        const btn = h(`button.e-mood${on ? '.is-on' : ''}`, {
          type: 'button',
          role: 'radio',
          'aria-checked': String(on),
          'aria-label': `${m.label} — ${m.hint}`,
          dataset: { mood: m.id },
        },
        h('span.e-mood__icon', {}, ic(moodIconName(m), 22)),
        h('span.e-mood__face', {}, m.label),
        h('span.e-mood__bars', { 'aria-hidden': 'true' },
          ...[1, 2, 3, 4, 5].map((n) => h(`span.e-mood__bar${n <= i + 1 ? '.is-on' : ''}`))));
        btn.addEventListener('click', () => selectMood(m.id));
        moodHost.appendChild(btn);
      });
    }

    function selectMood(id) {
      const list = listFor(id);
      const sameList = sentence && list.some((s) => s.id === sentence.id);
      if (!sameList) sentence = list[0] || null;
      else if (list.length > 1) sentence = list[(list.indexOf(sentence) + 1) % list.length];
      moodId = id;
      persist();
      paint();
    }

    function nextSentence() {
      const list = listFor(moodId);
      if (list.length < 2) {
        ui.toast('Sắc thái này chỉ có một câu trong kho', { iconName: 'info' });
        return;
      }
      const i = list.findIndex((s) => sentence && s.id === sentence.id);
      sentence = list[(i + 1) % list.length];
      persist();
      paintSentence();
    }

    function paintCaption() {
      const m = moodById(moods, moodId);
      clear(captionHost);
      captionHost.append(
        h('span.e-mood-caption__lv.mono', {}, `mức ${moodLevel(moods, moodId)}/5`),
        h('span.grow', {}, m ? `${m.label} · ${m.hint}` : 'Chưa chọn sắc thái'),
        lastHistoryMood
          ? h('span.e-mood-caption__last.mono', {}, `nhật ký gần nhất: ${lastHistoryMood.label}`)
          : null);
    }

    /* -------------------------------- Câu --------------------------------- */
    function paintSentence() {
      clear(sentenceHost);
      if (!sentence) {
        sentenceHost.appendChild(ui.empty({
          iconName: 'message-circle',
          title: 'Kho câu đang trống',
          body: 'Sắc thái này chưa có câu nào trong kho dữ liệu.',
        }));
        return;
      }

      const tone = TONE_META[sentence.tone] || TONE_META.encourage;
      const saved = isSavedToday();

      sentenceHost.append(
        h('div.row.row--between', {},
          ui.badge(tone.badgeLabel, tone.tone, tone.icon),
          h('span.e-sentence__meta.mono', {}, `tone: ${sentence.tone}`)),
        h('p.e-sentence__en', {}, sentence.en),
        h('p.e-sentence__vi', {}, sentence.vi),
        h('p.e-sentence__meta.mono', {}, 'lấy từ kho có sẵn trên máy · 0 API call'),
        h('div.e-sentence__row', {},
          ui.audioButton({ text: sentence.en, label: `Nghe câu: ${sentence.en}`, wide: true }),
          ui.button({ label: 'Câu khác', icon: 'rotate-ccw', variant: 'secondary', onClick: nextSentence })),
        ui.callout({ tone: sentence.tone === 'acknowledge' ? 'info' : 'primary', iconName: tone.icon, title: tone.title, body: tone.why }),
        ui.button({
          label: saved ? 'Cập nhật sắc thái hôm nay' : 'Lưu vào nhật ký hôm nay',
          icon: saved ? 'check' : 'notebook',
          block: true,
          onClick: saveToday,
        }));
    }

    /* ------------------------------ Lịch sử -------------------------------- */
    function paintHistory() {
      clear(histHost);
      const shown = history.slice(-7);
      const saved = isSavedToday();

      shown.forEach((id, i) => {
        const m = moodById(moods, id);
        const isLast = i === shown.length - 1;
        const back = shown.length - 1 - i;
        const dayText = back === 0 ? (saved ? 'Hôm nay' : 'Hôm qua') : `−${back}`;
        histHost.appendChild(h('div.e-hist__cell', {
          role: 'img',
          'aria-label': `${back === 0 ? dayText : `${back} ngày trước`}: ${m ? `${m.label}, mức ${moodLevel(moods, id)} trên 5` : 'chưa ghi'}`,
        },
        h('span.e-hist__icon', {}, m ? ic(moodIconName(m), 18) : ic('minus', 18)),
        h('span.e-hist__lv.mono', {}, m ? String(moodLevel(moods, id)) : '–'),
        h('span.e-hist__day.mono', {}, dayText)));
      });

      histCap.textContent = history.length
        ? '7 ngày gần nhất, mới nhất bên phải · số 1–5 là mức sắc thái từ thấp tới cao'
        : 'Chưa có bản ghi nào trong nhật ký.';
    }

    function saveToday() {
      const hist = (store.get('daily.history', []) || []).slice();
      if (isSavedToday() && hist.length) hist[hist.length - 1] = moodId;
      else hist.push(moodId);
      history = hist;
      store.set({
        'daily.history': hist,
        'daily.savedAt': Date.now(),
        'daily.mood': moodId,
        'daily.sentenceId': sentence ? sentence.id : null,
      });
      paintHistory();
      paintSentence();
      ui.toast(`Đã ghi sắc thái hôm nay: ${labelOf(moodId)}`, { tone: 'success', iconName: 'notebook' });
    }

    function paint() {
      paintMoods();
      paintCaption();
      paintSentence();
      paintHistory();
    }

    const contextCallout = lastHistoryMood
      ? ui.callout({
          tone: 'primary',
          iconName: 'notebook',
          title: `Nhật ký gần nhất: ${lastHistoryMood.label}`,
          body: 'Đã phân loại sắc thái và chọn câu khớp tâm trạng. Hôm nay khác thì chọn lại — câu sẽ đổi theo.',
        })
      : ui.callout({
          tone: 'info',
          iconName: 'info',
          title: 'Chưa có nhật ký hôm qua',
          body: 'Không sao: hệ thống lấy câu động viên kế tiếp trong kho có sẵn, không gọi mô hình nào.',
        });

    paint();

    return h('div.screen.e-screen.e-diary', {},
      ui.appBar({
        title: 'Nhật ký sắc thái',
        sub: 'Mỗi ngày một câu, chọn theo sắc thái hôm qua',
        back: true,
      }),
      h('div.screen__body', {},
        contextCallout,
        block({
          kicker: 'Câu hôm nay',
          title: 'Hôm nay bạn thấy thế nào?',
          meta: 'Chọn một mức — câu tiếng Anh đổi theo đúng sắc thái đó.',
          children: [moodHost, captionHost],
          why: 'Năm mức đều có icon và vạch đếm riêng, nên sắc thái không bị truyền đạt chỉ bằng màu.',
        }),
        block({
          kicker: 'Câu của hôm nay',
          children: [sentenceHost],
        }),
        block({
          kicker: 'Lịch sử',
          title: '7 ngày gần nhất',
          children: [
            histHost,
            histCap,
            noteList([
              'Sắc thái thấp → câu GHI NHẬN: "You made it through today.", "Rest is part of the work."',
              'Sắc thái cao → câu ĐỘNG VIÊN: "Good days are for building.", "Ride it while it lasts."',
            ]),
          ],
        }),
        whyLine('Lưu sắc thái để hồ sơ tự cập nhật: hôm sau câu sẽ được chọn theo đúng tâm trạng bạn đã ghi.'),
      ));
  },
};
