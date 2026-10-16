/* ============================================================================
   NHÓM E · profile — Hồ sơ & Quyền riêng tư
   Deck slide 11. Cam kết "không huấn luyện trên ảnh và giọng nói của người học"
   là LỢI THẾ CẠNH TRANH nên nằm ngay đầu màn hình, nói to, không chôn ở cuối.
   ========================================================================== */

import { h } from '../../core/dom.js';
import { ui } from '../../core/ui.js';
import { audio } from '../../core/audio.js';
import { block, iconOf, noteList, whyLine } from './shared.js';

export default {
  id: 'profile',
  title: 'Hồ sơ & Quyền riêng tư',
  group: 'e-progress',
  chrome: 'appbar',
  api: [],
  notes: [
    'Cam kết dữ liệu đặt ngay sau phần nhận diện, trước mọi cài đặt: slide 11 xem đây là lợi thế cạnh tranh, không phải trang pháp lý.',
    'Công tắc "huấn luyện trên dữ liệu người học" hiển thị đang tắt và KHÔNG bật được: bấm vào sẽ mở modal giải thích cam kết, không im lặng đổi trạng thái.',
    'Mọi thay đổi đều ghi vào ctx.store.profile nên đóng màn hình mở lại vẫn giữ nguyên; riêng công tắc âm thanh còn đồng bộ với bộ phát âm dùng chung.',
    'Có cả hai chiều của quyền dữ liệu: tải dữ liệu về (JSON thật) và xoá dữ liệu học trên máy — hành động xoá thật sự làm sạch bộ từ, không chỉ hiện thông báo.',
  ],

  render(ctx) {
    const ic = iconOf(ctx);
    const { data, store, nav, cost } = ctx;
    const user = data.user || {};
    const profile = store.get('profile', {}) || {};
    const compress = data.compressInfo ? data.compressInfo('morning-desk') : { from: '2.4 MB', to: '380 KB', ratio: 84 };

    /* --------------------------- Hàng cài đặt ----------------------------- */
    function setRow({ iconName, title, sub, control, className = '' }) {
      return h(`div.e-setrow${className ? '.' + className : ''}`, {},
        h('span.e-setrow__icon', {}, ic(iconName, 20)),
        h('div.grow', {},
          h('div.e-setrow__title', {}, title),
          sub ? h('p.e-setrow__sub', {}, sub) : null),
        control);
    }

    function rowToggle({ key, iconName, title, sub, checked, apply }) {
      const node = ui.toggle({
        checked,
        label: `${title} — ${checked ? 'đang bật' : 'đang tắt'}`,
        onChange: (next) => {
          store.set(`profile.${key}`, next);
          node.setAttribute('aria-label', `${title} — ${next ? 'đang bật' : 'đang tắt'}`);
          if (apply) apply(next);
          ui.toast(`${title}: ${next ? 'đã bật' : 'đã tắt'}`, { iconName: next ? 'check-circle' : 'minus' });
        },
      });
      return setRow({ iconName, title, sub, control: node });
    }

    /* ------------------- Công tắc bị khoá: trainOnData --------------------- */
    let lockedToggle = null;
    function openCommitModal() {
      const modal = ui.modal({
        title: 'Vì sao không bật được mục này',
        body: [
          h('p.read', {}, 'Ảnh và giọng nói của bạn không được đưa vào tập huấn luyện mô hình. Đây là cam kết ở tầng kiến trúc, không phải một cài đặt ai đó có thể bật lên.'),
          noteList([
            'Mỗi ảnh chỉ gọi mô hình thị giác đúng một lần để nhận diện, rồi kết quả trả về máy bạn.',
            `Ảnh được nén ngay trên máy trước khi tải lên: ${compress.from} → ${compress.to} ở ảnh mẫu.`,
            'Bản ghi âm luyện nói chỉ dùng để chỉnh lại câu của chính bạn trong phiên đó.',
            'Muốn dừng chia sẻ dữ liệu? Mục “Dữ liệu của bạn” bên dưới có nút tải và xoá.',
          ]),
          ui.callout({
            tone: 'success',
            iconName: 'shield',
            title: 'Không có công tắc bật lại',
            body: 'Chúng tôi không để sự riêng tư của bạn phụ thuộc vào một lần bấm nhầm.',
          }),
        ],
        actions: ui.button({ label: 'Đã hiểu', block: true, onClick: () => modal.close() }),
      });
    }

    lockedToggle = ui.toggle({
      checked: false,
      label: 'Huấn luyện trên dữ liệu người học — đang tắt, bấm để xem cam kết',
      onChange: () => {
        lockedToggle.setAttribute('aria-checked', 'false');
        openCommitModal();
      },
    });
    lockedToggle.classList.add('toggle--locked');
    lockedToggle.setAttribute('aria-disabled', 'true');

    const lockRow = h('div.e-lock', {},
      setRow({
        iconName: 'lock',
        title: 'Dùng ảnh và giọng nói để huấn luyện mô hình',
        sub: 'Cam kết của sản phẩm — không phải tuỳ chọn người dùng',
        control: h('div.row', { style: { gap: '8px' } }, ui.badge('đang tắt', 'outline', 'lock'), lockedToggle),
        className: 'e-setrow--locked',
      }),
      ui.callout({
        tone: 'success',
        iconName: 'shield',
        title: 'Mặc định tắt, và không có đường bật',
        body: 'Bấm vào công tắc để xem SnapLife dùng ảnh và giọng nói của bạn như thế nào. Trạng thái này là cam kết, không phải bản mặc định có thể đổi.',
      }));

    /* -------------------------- Minh bạch chi phí -------------------------- */
    const meter = ui.costMeter({ compact: true });
    if (typeof meter.__dispose === 'function') ctx.onCleanup(meter.__dispose);

    function openLedger() {
      const snap = cost.snapshot();
      const sheet = ui.sheet({
        title: 'Sổ chi phí AI của phiên demo',
        sub: `${snap.apiCalls} API call · ${snap.totals.rule} việc sinh bằng quy tắc`,
        body: snap.ledger.length
          ? [
              ui.barList([
                { label: 'VLM', value: snap.totals.vlm, color: 'primary' },
                { label: 'LLM', value: snap.totals.llm, color: 'primary' },
                { label: 'Quy tắc', value: snap.totals.rule, color: 'success' },
                { label: 'TTS', value: snap.totals.tts, color: 'info' },
              ]),
              ui.divider('Từng lời gọi'),
              ui.list(snap.ledger.map((e) => ui.listItem({
                title: e.label || e.kind,
                sub: `${e.kind} · ${e.n}×`,
                meta: new Date(e.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                trail: false,
              }))),
            ]
          : [ui.empty({
              iconName: 'zap',
              title: 'Chưa có lời gọi AI nào',
              body: 'Mở màn Chụp ảnh để thấy bộ đếm tăng đúng một lần cho mỗi ảnh, rồi đứng yên khi ôn tập.',
            })],
        actions: ui.button({ label: 'Đóng', variant: 'secondary', block: true, onClick: () => sheet.close() }),
      });
    }

    /* ---------------------------- Dữ liệu của bạn -------------------------- */
    function exportData() {
      const payload = {
        app: 'SnapLife AI',
        exportedAt: new Date().toISOString(),
        user,
        profile: store.get('profile', {}),
        daily: store.get('daily', {}),
        words: store.get('words', []),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: 'snaplife-du-lieu-cua-toi.json', style: { display: 'none' } });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      ui.toast('Đã tạo tệp dữ liệu của bạn (JSON)', { tone: 'success', iconName: 'download' });
    }

    function performDelete() {
      store.set({
        words: [],
        'daily.history': [],
        'daily.savedAt': null,
        'daily.mood': null,
        'daily.sentenceId': null,
        'profile.deletedAt': Date.now(),
      });
      ui.toast('Đã xoá bộ từ và lịch sử học trên máy này', { tone: 'success', iconName: 'trash' });
      nav.replace('profile');
    }

    function confirmDelete() {
      const modal = ui.modal({
        title: 'Xoá dữ liệu học trên máy này?',
        body: [
          h('p.muted', {}, 'Thao tác này xoá ngay trên thiết bị của bạn:'),
          noteList([
            `Bộ từ đang học (${(store.get('words', []) || []).length} từ) và toàn bộ tiến độ SRS.`,
            'Lịch sử nhật ký sắc thái và câu đã chọn.',
          ]),
          ui.callout({
            tone: 'info',
            iconName: 'info',
            title: 'Không xoá dữ liệu tài khoản',
            body: 'Streak và tổng số từ tích luỹ vẫn giữ, vì chúng không nằm trên máy này. Ảnh và truyện trong phiên demo cũng được giữ để bạn xem lại luồng.',
          }),
          whyLine('Bấm “Đặt lại dữ liệu demo” ở cột phải để khôi phục mọi thứ sau khi xoá.'),
        ],
        actions: ui.btnRow(
          ui.button({ label: 'Giữ lại', variant: 'secondary', onClick: () => modal.close() }),
          ui.button({ label: 'Xoá dữ liệu', icon: 'trash', variant: 'danger', onClick: () => { modal.close(); performDelete(); } })),
      });
    }

    /* --------------------------------- View -------------------------------- */
    const deletedAt = store.get('profile.deletedAt', null);
    const team = data.TEAM || [];

    return h('div.screen.e-screen.e-profile', {},
      ui.appBar({
        title: 'Hồ sơ & Quyền riêng tư',
        sub: user.handle || user.name,
        back: true,
      }),
      h('div.screen__body', {},

        h('section.e-hero.e-hero--id', {},
          ui.avatar(user.name, { large: true }),
          h('div.grow', {},
            h('h1.e-hero__name', {}, user.name),
            h('p.e-hero__sub', {}, user.goal || ''),
            h('div.row.row--wrap', { style: { marginTop: '8px', gap: '6px' } },
              ui.badge(`CEFR ${user.cefr}`, 'primary'),
              ui.badge(`Cấp ${user.level}`, 'outline'),
              ui.badge(`${user.joinedDays} ngày`, 'outline')))),

        block({
          kicker: 'Cam kết · slide 11',
          title: 'Không dùng ảnh và giọng nói của người học để huấn luyện mô hình',
          meta: 'Đây là lợi thế cạnh tranh của SnapLife AI, không phải trang pháp lý ở cuối ứng dụng.',
          className: 'e-block--privacy',
          children: [
            h('div.e-priv', {},
              h('div.e-priv__card', {},
                h('span.e-priv__icon', {}, ic('image', 20)),
                h('span.e-priv__label', {}, 'Ảnh của bạn'),
                h('span.e-priv__value', {}, 'Không dùng để huấn luyện')),
              h('div.e-priv__card', {},
                h('span.e-priv__icon', {}, ic('mic', 20)),
                h('span.e-priv__label', {}, 'Giọng nói'),
                h('span.e-priv__value', {}, 'Không dùng để huấn luyện')),
              h('div.e-priv__card', {},
                h('span.e-priv__icon', {}, ic('users', 20)),
                h('span.e-priv__label', {}, 'Bán cho bên thứ ba'),
                h('span.e-priv__value', {}, 'Không'))),
            ui.callout({
              tone: 'success',
              iconName: 'shield',
              title: 'Cam kết kiểm chứng được bằng chính bộ đếm chi phí',
              body: 'Một ảnh chỉ gọi mô hình thị giác đúng một lần; ảnh được nén ngay trên máy trước khi rời thiết bị. Toàn bộ phiên ôn tập chạy bằng quy tắc nên không có dữ liệu nào đi ra ngoài.',
            }),
            h('div', {},
              ui.keyval('Ảnh nén ngay trên máy', `${compress.from} → ${compress.to}`),
              ui.keyval('Gọi mô hình thị giác', '1 lần cho mỗi ảnh'),
              ui.keyval('Huấn luyện trên dữ liệu của bạn', 'Không')),
          ],
          why: 'Chúng tôi nói thẳng cam kết này ngay đầu hồ sơ, trước mọi công tắc cài đặt.',
        }),

        block({
          kicker: 'Cài đặt',
          title: 'Nhắc nhở, âm thanh, dữ liệu ẩn danh',
          meta: 'Mọi thay đổi được lưu trong phiên demo và giữ nguyên khi quay lại màn này.',
          children: [
            rowToggle({
              key: 'reminders',
              iconName: 'clock',
              title: 'Nhắc học mỗi ngày',
              sub: `Một thông báo ngắn vào khung giờ bạn hay học · mục tiêu ${user.goalMinutes} phút`,
              checked: Boolean(profile.reminders),
            }),
            rowToggle({
              key: 'sound',
              iconName: 'headphones',
              title: 'Âm thanh phát âm',
              sub: 'Tiếng đọc của câu và của từ, phát khi bạn bấm nút nghe',
              checked: !audio.muted,
              apply: (next) => audio.setMuted(!next),
            }),
            rowToggle({
              key: 'telemetry',
              iconName: 'activity',
              title: 'Gửi thống kê lỗi ẩn danh',
              sub: 'Chỉ mã lỗi và phiên bản máy · không kèm ảnh, không kèm giọng nói. Mặc định tắt.',
              checked: Boolean(profile.telemetry),
            }),
            lockRow,
          ],
        }),

        block({
          kicker: 'Mục tiêu',
          title: 'Mỗi ngày học bao lâu?',
          meta: 'Phiên ôn được chia theo đúng độ dài này.',
          children: [
            ui.segmented({
              options: [
                { value: 10, label: '10 phút', hint: 'Ngày bận' },
                { value: 20, label: '20 phút', hint: 'Phiên chuẩn' },
                { value: 30, label: '30 phút', hint: 'Ngày có đà' },
              ],
              value: profile.dailyGoal || 20,
              ariaLabel: 'Mục tiêu phút học mỗi ngày',
              onChange: (v) => {
                store.set('profile.dailyGoal', Number(v));
                ui.toast(`Mục tiêu mỗi ngày: ${v} phút`, { iconName: 'clock' });
              },
            }),
          ],
        }),

        block({
          kicker: 'Minh bạch',
          title: 'Bạn trả cho AI bao nhiêu?',
          meta: 'Sổ chi phí của phiên demo — chỉ tăng khi thật sự gọi mô hình.',
          children: [
            h('div.row.row--between', {}, meter, h('span.e-chartnote', {}, 'VLM 1×/ảnh · LLM 1×/câu chuyện · ôn tập 0')),
            h('div', {},
              ui.keyval('Nhận diện ảnh (VLM)', `${cost.snapshot().totals.vlm} lần`),
              ui.keyval('Viết đoạn đan xen (LLM)', `${cost.snapshot().totals.llm} lần`),
              ui.keyval('Sinh bài tập bằng quy tắc', `${cost.snapshot().totals.rule} việc · miễn phí`)),
            ui.button({
              label: 'Xem sổ chi phí',
              icon: 'file-text',
              variant: 'secondary',
              block: true,
              onClick: openLedger,
            }),
          ],
        }),

        block({
          kicker: 'Dữ liệu của bạn',
          title: 'Tải về hoặc xoá bất kỳ lúc nào',
          meta: deletedAt
            ? `Dữ liệu học trên máy đã được xoá lúc ${new Date(deletedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
            : 'Không giữ bản sao ẩn nào ngoài những gì bạn thấy ở đây.',
          children: [
            ui.btnRow(
              ui.button({ label: 'Tải dữ liệu', icon: 'download', variant: 'secondary', onClick: exportData }),
              ui.button({ label: 'Xoá dữ liệu', icon: 'trash', variant: 'danger', onClick: confirmDelete })),
            deletedAt
              ? ui.callout({
                  tone: 'warning',
                  iconName: 'trash',
                  title: 'Bộ từ và lịch sử nhật ký đang trống',
                  body: 'Bấm “Đặt lại dữ liệu demo” ở cột phải để khôi phục dữ liệu mẫu trước khi trình diễn tiếp.',
                })
              : null,
          ],
          why: 'Nút tải xuất ra tệp JSON thật; nút xoá mở hộp thoại xác nhận rồi thực sự làm sạch bộ từ trên máy.',
        }),

        block({
          kicker: 'Đội thực hiện',
          title: 'Prompt and Chill',
          meta: 'SnapLife AI — bản demo dựng cho vòng pitching.',
          children: [ui.list(team.map((name) => ui.listItem({ title: name, icon: 'user', trail: false })))],
        }),

        whyLine('Quyền riêng tư ở đây là cam kết thiết kế: xem được, tải được, xoá được — không cần gửi yêu cầu cho ai.'),
      ));
  },
};
