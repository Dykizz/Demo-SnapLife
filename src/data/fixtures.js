/* ============================================================================
   SnapLife AI — Nội dung & trạng thái khởi tạo của demo
   Owner: Lead.  Chữ nghĩa ở đây lấy từ chính pitch deck để demo khớp câu chuyện.
   ========================================================================== */

import { words } from './words.js';
import { photos } from './photos.js';

export const TEAM = ['Phùng Phú Tài', 'Nguyễn Thành Đức', 'Nguyễn Hồng Sơn', 'Ngô Đức Huy'];

export const user = {
  name: 'Phú Tài',
  handle: '@phutai',
  goal: 'Giữ được nhịp học mỗi sáng trước khi vào việc',
  cefr: 'B1',
  cefrProgress: 0.62,
  cefrNext: 'B2',
  streak: 12,
  bestStreak: 18,
  wordsKnown: 348,
  wordsLearning: 46,
  wordsNew: 22,
  minutesToday: 14,
  minutesWeek: 96,
  goalMinutes: 20,
  xp: 2140,
  level: 7,
  joinedDays: 96,
  lastPlacement: '3 tuần trước',
  interests: ['coffee', 'city', 'weather', 'music'],
};

/* --------------------------- Câu động viên mỗi ngày ---------------------- */
/* Slide 07: sắc thái thấp nhận câu GHI NHẬN, không cổ vũ sáo rỗng.           */
export const moods = [
  { id: 'low', label: 'Rất thấp', face: 'cloud', hint: 'Một ngày dài' },
  { id: 'down', label: 'Hơi xuống', face: 'cloud-off', hint: 'Chưa vào guồng' },
  { id: 'ok', label: 'Bình thường', face: 'minus', hint: 'Vừa đủ' },
  { id: 'up', label: 'Khá tốt', face: 'sun', hint: 'Có năng lượng' },
  { id: 'great', label: 'Rất tốt', face: 'sparkles', hint: 'Đang sung' },
];

export const dailySentences = {
  low: [
    { id: 'low-1', en: 'You made it through today.', vi: 'Hôm nay bạn đã đi hết một ngày rồi.', tone: 'acknowledge' },
    { id: 'low-2', en: 'Rest is part of the work.', vi: 'Nghỉ ngơi cũng là một phần của việc học.', tone: 'acknowledge' },
    { id: 'low-3', en: 'Some days, showing up is enough.', vi: 'Có những ngày, chỉ cần có mặt là đủ.', tone: 'acknowledge' },
  ],
  down: [
    { id: 'down-1', en: 'Slow progress is still progress.', vi: 'Đi chậm vẫn là đang đi.', tone: 'acknowledge' },
    { id: 'down-2', en: 'You do not have to catch up today.', vi: 'Hôm nay bạn không cần phải đuổi kịp ai cả.', tone: 'acknowledge' },
    { id: 'down-3', en: 'One small thing is enough for today.', vi: 'Một việc nhỏ thôi là đủ cho hôm nay.', tone: 'acknowledge' },
  ],
  ok: [
    { id: 'ok-1', en: 'Steady beats fast.', vi: 'Đều đặn thắng nhanh chóng.', tone: 'encourage' },
    { id: 'ok-2', en: 'Ten quiet minutes count.', vi: 'Mười phút yên tĩnh cũng được tính.', tone: 'encourage' },
    { id: 'ok-3', en: 'Keep the streak warm.', vi: 'Giữ cho chuỗi ngày còn ấm.', tone: 'encourage' },
  ],
  up: [
    { id: 'up-1', en: 'Good days are for building.', vi: 'Ngày tốt là để xây nền.', tone: 'encourage' },
    { id: 'up-2', en: 'You are ahead of yesterday.', vi: 'Bạn đang hơn chính mình hôm qua.', tone: 'encourage' },
    { id: 'up-3', en: 'Momentum looks good on you.', vi: 'Đà này hợp với bạn đấy.', tone: 'encourage' },
  ],
  great: [
    { id: 'great-1', en: 'Ride it while it lasts.', vi: 'Cứ tận dụng lúc còn sung.', tone: 'encourage' },
    { id: 'great-2', en: 'Today is a long-session day.', vi: 'Hôm nay là ngày học phiên dài.', tone: 'encourage' },
    { id: 'great-3', en: 'This is what a good habit feels like.', vi: 'Thói quen tốt có cảm giác như thế này.', tone: 'encourage' },
  ],
};

/* ------------------------------- Chủ đề ---------------------------------- */
export const topics = [
  { id: 'coffee', label: 'Cà phê & quán', icon: 'coffee', words: 24 },
  { id: 'home', label: 'Nhà & góc làm việc', icon: 'home', words: 31 },
  { id: 'city', label: 'Thành phố & đi lại', icon: 'map', words: 38 },
  { id: 'weather', label: 'Thời tiết', icon: 'cloud-off', words: 19 },
  { id: 'work', label: 'Công việc', icon: 'clipboard', words: 27 },
  { id: 'music', label: 'Âm nhạc & tai nghe', icon: 'headphones', words: 16 },
  { id: 'study', label: 'Học tập', icon: 'book-open', words: 22 },
  { id: 'nature', label: 'Thiên nhiên', icon: 'compass', words: 25 },
  { id: 'art', label: 'Gốm & thủ công', icon: 'palette', words: 12 },
  { id: 'health', label: 'Sức khoẻ & giấc ngủ', icon: 'activity', words: 21 },
  { id: 'travel', label: 'Du lịch', icon: 'globe', words: 29 },
  { id: 'food', label: 'Đồ ăn', icon: 'gift', words: 18 },
];

/* --------------------------- Test xếp trình độ --------------------------- */
export const placementQuestions = [
  { id: 'q1', level: 'A1', q: 'Từ nào gần nghĩa nhất với "tired"?', options: ['sleepy', 'angry', 'hungry', 'quick'], answer: 0, note: 'Từ vựng cơ bản về trạng thái cơ thể.' },
  { id: 'q2', level: 'A2', q: 'She ___ to work by bus every day.', options: ['commute', 'commutes', 'commuting', 'commuted'], answer: 1, note: 'Thì hiện tại đơn, ngôi thứ ba số ít.' },
  { id: 'q3', level: 'A2', q: 'Take an ___ — it looks like rain.', options: ['umbrella', 'awning', 'puddle', 'drizzle'], answer: 0, note: 'Danh từ đếm được + mạo từ "an".' },
  { id: 'q4', level: 'B1', q: 'It was only a ___ , so we kept walking.', options: ['downpour', 'drizzle', 'storm', 'flood'], answer: 1, note: 'Phân biệt mức độ mưa.' },
  { id: 'q5', level: 'B1', q: 'Chọn câu tự nhiên nhất:', options: ['I very like this cup.', 'I really like this cup.', 'I like very this cup.', 'I am like this cup very.'], answer: 1, note: 'Lỗi kinh điển của người học Việt.' },
  { id: 'q6', level: 'B2', q: 'The street was ___ with people rushing home.', options: ['crowded', 'crowding', 'crowd', 'crowds'], answer: 0, note: 'Tính từ sau "was".' },
  { id: 'q7', level: 'B2', q: '___ is a noun meaning "a place giving protection".', options: ['Shelter', 'Awning', 'Windowsill', 'Balcony'], answer: 0, note: 'Định nghĩa bằng tiếng Anh ở trình độ B2.' },
  { id: 'q8', level: 'C1', q: 'The smell of rain ___ in the stairwell long after the storm.', options: ['lingered', 'lingers', 'lingering', 'linger'], answer: 0, note: 'Thì quá khứ đơn trong tự sự.' },
];

/* --------------------------- 5 dạng bài ôn tập --------------------------- */
export const reviewTypes = [
  { id: 'read', name: 'Đọc tương tác', icon: 'book-open', desc: 'Chạm từ trong đoạn văn để nghe và xem nghĩa.' },
  { id: 'cloze', name: 'Cloze điền khuyết', icon: 'edit', desc: 'Điền từ đúng vào chỗ trống trong câu.' },
  { id: 'tapimg', name: 'Chạm ảnh', icon: 'target', desc: 'Chọn đúng đồ vật trong ảnh của bạn.' },
  { id: 'match', name: 'Ghép cặp', icon: 'link', desc: 'Nối từ với nghĩa tương ứng.' },
  { id: 'srs', name: 'Flashcard SRS', icon: 'layers', desc: 'Lặp lại ngắt quãng theo thuật toán SM-2.' },
];

export const sessionLengths = [
  { value: 2, label: '2 phút', hint: 'Khi chỉ có một khoảng thật ngắn', items: 4 },
  { value: 10, label: '10 phút', hint: 'Phiên chuẩn mỗi ngày', items: 10 },
  { value: 20, label: '20 phút', hint: 'Khi bạn đang có đà', items: 18 },
];

/* --------------------------- Câu cho dạng cloze -------------------------- */
export const clozeBank = [
  { wordId: 'mug', sentence: 'I drink coffee from my favourite ___ every morning.', vi: 'Sáng nào mình cũng uống cà phê bằng chiếc ca yêu thích.' },
  { wordId: 'commute', sentence: 'I ___ to work by bus every day.', vi: 'Tôi đi lại bằng xe buýt đến chỗ làm mỗi ngày.' },
  { wordId: 'downpour', sentence: 'We got caught in a sudden ___ on the way home.', vi: 'Chúng mình bị kẹt trong một trận mưa như trút trên đường về.' },
  { wordId: 'shelter', sentence: 'We waited under a shop ___ until the rain stopped.', vi: 'Chúng mình đợi dưới mái hiên cửa hàng cho tới khi tạnh mưa.' },
  { wordId: 'puddle', sentence: 'The children jumped over every ___ on the pavement.', vi: 'Bọn trẻ nhảy qua từng vũng nước trên vỉa hè.' },
  { wordId: 'humid', sentence: 'Summer here is hot and ___.', vi: 'Mùa hè ở đây nóng và ẩm.' },
  { wordId: 'groggy', sentence: 'I felt ___ until my second coffee.', vi: 'Mình lờ đờ mãi cho tới khi uống xong ly cà phê thứ hai.' },
  { wordId: 'ritual', sentence: 'Making coffee is my morning ___.', vi: 'Pha cà phê là nghi thức nhỏ mỗi sáng của mình.' },
];

/* ------------------------- Nội dung onboarding --------------------------- */
export const onboardingSlides = [
  {
    id: 'problem',
    kicker: 'Vấn đề',
    title: 'Học từ vựng đang ngốn thời gian, tiền bạc — rồi bạn bỏ cuộc',
    body: 'Gia sư và app trả phí tốn hàng trăm nghìn mỗi tháng. Mỗi ngày mất hàng giờ tự tra từ và tự soạn flashcard. Danh sách từ thì chung chung, xa rời cuộc sống.',
    bullets: [
      { icon: 'gift', title: 'Tốn kém', text: 'Trả phí tháng này qua tháng khác' },
      { icon: 'clock', title: 'Tốn thời gian', text: 'Tự tra từ, tự soạn thẻ' },
      { icon: 'heart', title: 'Chóng chán', text: 'Ôn mãi một dạng bài, từ không liên quan tới mình' },
    ],
    note: 'Người học không thiếu quyết tâm — họ thiếu một phương pháp gắn với chính mình.',
  },
  {
    id: 'solution',
    kicker: 'Giải pháp',
    title: 'Đưa tiếng Anh vào đúng ngữ cảnh sống của bạn',
    body: 'Ba bước khép kín, một lần chụp ảnh hoặc một chủ đề — phần còn lại AI lo.',
    steps: [
      { n: 1, title: 'Gợi ý từ', text: 'AI chọn từ theo trình độ CEFR A1–C1 và sở thích, đối chiếu từ điển chuẩn.' },
      { n: 2, title: 'Đọc truyện đan xen', text: 'AI viết đoạn tiếng Việt lồng 15–20% từ tiếng Anh, kèm audio.' },
      { n: 3, title: 'Ôn tập đa dạng', text: 'Từ vựng chuyển thành nhiều dạng bài, chọn theo 2 / 10 / 20 phút.' },
    ],
  },
  {
    id: 'privacy',
    kicker: 'Quyền riêng tư',
    title: 'Ảnh và giọng nói của bạn không dùng để huấn luyện mô hình',
    body: 'Ảnh được nén ngay trên máy bạn trước khi tải lên. Mỗi ảnh chỉ gọi mô hình thị giác đúng một lần, rồi từ vựng và audio được lưu lại để tái sử dụng.',
    facts: [
      { icon: 'lock', label: 'Nén ảnh tại client', value: 'Trước khi rời máy bạn' },
      { icon: 'zap', label: 'Gọi VLM', value: '1 lần cho mỗi ảnh' },
      { icon: 'shield', label: 'Huấn luyện mô hình', value: 'Không dùng dữ liệu của bạn' },
    ],
    permissions: [
      { icon: 'camera', label: 'Camera', why: 'Để chụp ngữ cảnh quanh bạn' },
      { icon: 'mic', label: 'Micrô', why: 'Để luyện nói và chỉnh cách diễn đạt' },
    ],
  },
];

/* --------------------------- Trạng thái hệ thống ------------------------- */
export const systemStates = {
  offline: {
    title: 'Không có kết nối',
    body: 'Bạn vẫn ôn tập được: bài tập sinh bằng quy tắc và audio đã được lưu sẵn trên máy. Việc chụp ảnh mới sẽ chờ khi có mạng.',
  },
  error: {
    title: 'Không đọc được ảnh này',
    body: 'Ảnh có thể bị mờ hoặc quá tối. Thử chụp lại ở nơi đủ sáng, hoặc khoanh vùng thủ công.',
  },
  'rate-limited': {
    title: 'Đang có nhiều người dùng cùng lúc',
    body: 'Hệ thống tạm hoãn việc gọi mô hình. Bạn có thể tiếp tục ôn tập — phần này không tốn API.',
  },
};

/** Trạng thái khởi tạo của demo — mọi màn hình đọc/ghi vào đây. */
export function createInitialState() {
  return {
    theme: 'light',
    route: { id: 'home', params: {} },
    onboarding: { done: false, slide: 0, permissions: { camera: false, mic: false } },
    placement: { started: false, index: 0, answers: [], result: null },
    interests: [...user.interests],
    words: words.map((w) => ({ ...w, srs: { ...w.srs } })),
    photos: photos.map((p) => ({ ...p, regions: p.regions.map((r) => ({ ...r })) })),
    capture: {
      photoId: 'morning-desk',
      stage: 'idle', // idle | compressing | analysing | done
      regions: photos[0].regions.map((r) => ({ ...r })),
      removed: [],
      userRegions: [],
      manualWord: '',
    },
    story: {
      id: 'today',
      generated: false,
      playing: false,
      progress: 0,
      activeWord: null,
      draft: '',
      topicIds: ['coffee', 'city'],
      photoIds: ['rainy-street'],
      addedWords: [],
    },
    speaking: {
      state: 'idle', // idle | recording | recorded | correcting | corrected
      seconds: 0,
      transcript: '',
      corrected: '',
      replayed: 0,
      saved: false,
    },
    daily: { mood: null, sentenceId: null, history: ['ok', 'up', 'ok', 'great', 'down', 'ok', 'up'] },
    review: {
      length: 10,
      types: ['read', 'cloze', 'tapimg', 'match', 'srs'],
      queue: [],
      index: 0,
      answered: 0,
      correct: 0,
      results: [],
      finished: false,
      startedAt: null,
    },
    profile: {
      reminders: true,
      sound: true,
      telemetry: false,
      trainOnData: false,
      dailyGoal: 20,
    },
    ui: { hud: true, focus: false },
  };
}
