/* ============================================================================
   SnapLife AI — Từ vựng demo
   Owner: Lead.  Một nguồn duy nhất để mọi màn hình dùng chung.
   Trường `en` trùng với từ được đánh dấu trong story để tra nghĩa khi chạm.
   ========================================================================== */

export const words = [
  {
    id: 'mug', en: 'mug', vi: 'cái ca (có quai)', ipa: 'mʌɡ', pos: 'danh từ', cefr: 'A2',
    example: 'I drink coffee from my favourite mug every morning.',
    exampleVi: 'Sáng nào mình cũng uống cà phê bằng chiếc ca yêu thích.',
    topics: ['coffee', 'home'], status: 'learning', addedAt: 'Hôm nay',
    srs: { stage: 2, reps: 4, lapses: 1, ease: 2.4, interval: 3, dueInDays: 1 },
  },
  {
    id: 'headphones', en: 'headphones', vi: 'tai nghe', ipa: 'ˈhed.fəʊnz', pos: 'danh từ', cefr: 'A2',
    example: 'I put on my headphones and watched the street go by.',
    exampleVi: 'Mình đeo tai nghe và ngắm phố trôi qua.',
    topics: ['music', 'tech'], status: 'learning', addedAt: 'Hôm nay',
    srs: { stage: 2, reps: 3, lapses: 0, ease: 2.5, interval: 2, dueInDays: 0 },
  },
  {
    id: 'notebook', en: 'notebook', vi: 'cuốn sổ', ipa: 'ˈnəʊt.bʊk', pos: 'danh từ', cefr: 'A2',
    example: 'She wrote the new words in her notebook.',
    exampleVi: 'Cô ấy viết những từ mới vào cuốn sổ.',
    topics: ['study'], status: 'known', addedAt: 'Hôm nay',
    srs: { stage: 3, reps: 7, lapses: 0, ease: 2.6, interval: 9, dueInDays: 5 },
  },
  {
    id: 'commute', en: 'commute', vi: 'đi lại thường xuyên (đi làm)', ipa: 'kəˈmjuːt', pos: 'động từ', cefr: 'B1',
    example: 'I commute to work by bus every day.',
    exampleVi: 'Tôi đi lại bằng xe buýt đến chỗ làm mỗi ngày.',
    topics: ['work', 'city'], status: 'learning', addedAt: 'Hôm qua',
    srs: { stage: 2, reps: 5, lapses: 2, ease: 2.3, interval: 3, dueInDays: 0 },
  },
  {
    id: 'downpour', en: 'downpour', vi: 'trận mưa như trút nước', ipa: 'ˈdaʊn.pɔːr', pos: 'danh từ', cefr: 'B2',
    example: 'We got caught in a sudden downpour on the way home.',
    exampleVi: 'Chúng mình bị kẹt trong một trận mưa như trút trên đường về.',
    topics: ['weather', 'city'], status: 'new', addedAt: 'Hôm qua',
    srs: { stage: 0, reps: 0, lapses: 0, ease: 2.5, interval: 0, dueInDays: 0 },
  },
  {
    id: 'shelter', en: 'shelter', vi: 'chỗ trú, nơi ẩn náu', ipa: 'ˈʃel.tər', pos: 'danh từ', cefr: 'B2',
    example: 'We waited for the rain to stop under a shop shelter.',
    exampleVi: 'Chúng mình đợi tạnh mưa dưới mái hiên của một cửa hàng.',
    topics: ['weather', 'city'], status: 'learning', addedAt: 'Hôm qua',
    srs: { stage: 1, reps: 2, lapses: 0, ease: 2.5, interval: 1, dueInDays: 1 },
  },
  {
    id: 'awning', en: 'awning', vi: 'mái hiên, mái che', ipa: 'ˈɔː.nɪŋ', pos: 'danh từ', cefr: 'B2',
    example: 'A striped awning kept the doorway dry.',
    exampleVi: 'Một mái hiên kẻ sọc giữ cho ô cửa khô ráo.',
    topics: ['city', 'home'], status: 'new', addedAt: 'Hôm qua',
    srs: { stage: 0, reps: 0, lapses: 0, ease: 2.5, interval: 0, dueInDays: 0 },
  },
  {
    id: 'drizzle', en: 'drizzle', vi: 'mưa phùn', ipa: 'ˈdrɪz.əl', pos: 'danh từ', cefr: 'B1',
    example: 'It was only a drizzle, so we kept walking.',
    exampleVi: 'Trời chỉ mưa phùn nên chúng mình cứ đi tiếp.',
    topics: ['weather'], status: 'learning', addedAt: 'Hôm qua',
    srs: { stage: 1, reps: 3, lapses: 1, ease: 2.4, interval: 1, dueInDays: 0 },
  },
  {
    id: 'puddle', en: 'puddle', vi: 'vũng nước', ipa: 'ˈpʌd.əl', pos: 'danh từ', cefr: 'B1',
    example: 'The children jumped over every puddle on the pavement.',
    exampleVi: 'Bọn trẻ nhảy qua từng vũng nước trên vỉa hè.',
    topics: ['weather', 'city'], status: 'known', addedAt: '4 ngày trước',
    srs: { stage: 3, reps: 6, lapses: 0, ease: 2.6, interval: 12, dueInDays: 7 },
  },
  {
    id: 'umbrella', en: 'umbrella', vi: 'cái ô, cái dù', ipa: 'ʌmˈbrel.ə', pos: 'danh từ', cefr: 'A1',
    example: 'Take an umbrella — it looks like rain.',
    exampleVi: 'Mang theo cái ô đi — trông như sắp mưa.',
    topics: ['weather'], status: 'known', addedAt: '5 ngày trước',
    srs: { stage: 4, reps: 9, lapses: 0, ease: 2.7, interval: 21, dueInDays: 14 },
  },
  {
    id: 'humid', en: 'humid', vi: 'ẩm ướt (thời tiết)', ipa: 'ˈhjuː.mɪd', pos: 'tính từ', cefr: 'B1',
    example: 'Summer here is hot and humid.',
    exampleVi: 'Mùa hè ở đây nóng và ẩm.',
    topics: ['weather'], status: 'learning', addedAt: '3 ngày trước',
    srs: { stage: 1, reps: 2, lapses: 1, ease: 2.3, interval: 1, dueInDays: 0 },
  },
  {
    id: 'rush hour', en: 'rush hour', vi: 'giờ cao điểm', ipa: 'ˈrʌʃ aʊər', pos: 'danh từ', cefr: 'B1',
    example: 'The metro is packed during rush hour.',
    exampleVi: 'Tàu điện chật kín người vào giờ cao điểm.',
    topics: ['city', 'work'], status: 'new', addedAt: 'Hôm qua',
    srs: { stage: 0, reps: 0, lapses: 0, ease: 2.5, interval: 0, dueInDays: 0 },
  },
  {
    id: 'windowsill', en: 'windowsill', vi: 'bệ cửa sổ', ipa: 'ˈwɪn.dəʊ.sɪl', pos: 'danh từ', cefr: 'B1',
    example: 'The cup stood on the windowsill, catching the light.',
    exampleVi: 'Chiếc ca đứng trên bệ cửa sổ, hứng ánh sáng.',
    topics: ['home'], status: 'new', addedAt: 'Hôm qua',
    srs: { stage: 0, reps: 0, lapses: 0, ease: 2.5, interval: 0, dueInDays: 0 },
  },
  {
    id: 'glaze', en: 'glaze', vi: 'lớp men (đồ gốm)', ipa: 'ɡleɪz', pos: 'danh từ', cefr: 'C1',
    example: 'The glaze on this bowl has a soft blue drip.',
    exampleVi: 'Lớp men trên chiếc bát này có vệt xanh chảy mềm mại.',
    topics: ['art'], status: 'new', addedAt: 'Hôm qua',
    srs: { stage: 0, reps: 0, lapses: 0, ease: 2.5, interval: 0, dueInDays: 0 },
  },
  {
    id: 'ceramic', en: 'ceramic', vi: 'đồ gốm, bằng gốm', ipa: 'səˈræm.ɪk', pos: 'tính từ', cefr: 'B2',
    example: 'She collects ceramic cups from every city she visits.',
    exampleVi: 'Cô ấy sưu tầm những chiếc ca gốm từ mỗi thành phố mình đi qua.',
    topics: ['art', 'home'], status: 'learning', addedAt: 'Hôm qua',
    srs: { stage: 1, reps: 1, lapses: 0, ease: 2.5, interval: 1, dueInDays: 2 },
  },
  {
    id: 'balcony', en: 'balcony', vi: 'ban công', ipa: 'ˈbæl.kə.ni', pos: 'danh từ', cefr: 'A2',
    example: 'I read on the balcony until the light faded.',
    exampleVi: 'Mình đọc sách ở ban công cho tới khi tắt nắng.',
    topics: ['home'], status: 'known', addedAt: '4 ngày trước',
    srs: { stage: 3, reps: 5, lapses: 0, ease: 2.6, interval: 10, dueInDays: 6 },
  },
  {
    id: 'crowded', en: 'crowded', vi: 'đông đúc, chật kín', ipa: 'ˈkraʊ.dɪd', pos: 'tính từ', cefr: 'A2',
    example: 'The street was crowded with people rushing home.',
    exampleVi: 'Con phố đông nghịt người vội vã về nhà.',
    topics: ['city'], status: 'learning', addedAt: 'Hôm qua',
    srs: { stage: 2, reps: 4, lapses: 1, ease: 2.4, interval: 3, dueInDays: 1 },
  },
  {
    id: 'faded', en: 'faded', vi: 'nhạt dần, phai đi', ipa: 'ˈfeɪ.dɪd', pos: 'tính từ', cefr: 'B1',
    example: 'The light faded and the street grew quiet.',
    exampleVi: 'Ánh sáng nhạt dần và con phố trở nên yên tĩnh.',
    topics: ['nature'], status: 'new', addedAt: '3 ngày trước',
    srs: { stage: 0, reps: 0, lapses: 0, ease: 2.5, interval: 0, dueInDays: 0 },
  },
  {
    id: 'sip', en: 'sip', vi: 'nhấp một ngụm', ipa: 'sɪp', pos: 'động từ', cefr: 'A2',
    example: 'He sipped his coffee and watched the rain.',
    exampleVi: 'Anh ấy nhấp một ngụm cà phê và ngắm mưa.',
    topics: ['coffee'], status: 'learning', addedAt: 'Hôm qua',
    srs: { stage: 1, reps: 2, lapses: 0, ease: 2.5, interval: 1, dueInDays: 1 },
  },
  {
    id: 'groggy', en: 'groggy', vi: 'lờ đờ, chưa tỉnh ngủ', ipa: 'ˈɡrɒɡ.i', pos: 'tính từ', cefr: 'B2',
    example: 'I felt groggy until my second coffee.',
    exampleVi: 'Mình lờ đờ mãi cho tới khi uống xong ly cà phê thứ hai.',
    topics: ['health'], status: 'new', addedAt: 'Hôm nay',
    srs: { stage: 0, reps: 0, lapses: 0, ease: 2.5, interval: 0, dueInDays: 0 },
  },
  {
    id: 'ritual', en: 'ritual', vi: 'thói quen, nghi thức nhỏ hằng ngày', ipa: 'ˈrɪtʃ.u.əl', pos: 'danh từ', cefr: 'B2',
    example: 'Making coffee is my morning ritual.',
    exampleVi: 'Pha cà phê là nghi thức nhỏ mỗi sáng của mình.',
    topics: ['coffee', 'home'], status: 'learning', addedAt: '2 ngày trước',
    srs: { stage: 2, reps: 3, lapses: 0, ease: 2.5, interval: 2, dueInDays: 0 },
  },
  {
    id: 'soaked', en: 'soaked', vi: 'ướt sũng', ipa: 'səʊkt', pos: 'tính từ', cefr: 'B1',
    example: 'My shoes were soaked by the time I got home.',
    exampleVi: 'Về tới nhà thì giày mình đã ướt sũng.',
    topics: ['weather'], status: 'new', addedAt: 'Hôm qua',
    srs: { stage: 0, reps: 0, lapses: 0, ease: 2.5, interval: 0, dueInDays: 0 },
  },
  {
    id: 'linger', en: 'linger', vi: 'níu lại, nấn ná', ipa: 'ˈlɪŋ.ɡər', pos: 'động từ', cefr: 'C1',
    example: 'The smell of rain lingered in the stairwell.',
    exampleVi: 'Mùi mưa còn nán lại nơi cầu thang.',
    topics: ['nature'], status: 'new', addedAt: 'Hôm nay',
    srs: { stage: 0, reps: 0, lapses: 0, ease: 2.5, interval: 0, dueInDays: 0 },
  },
];

export const wordByEn = (en) =>
  words.find((w) => w.en.toLowerCase() === String(en).toLowerCase().replace(/[^a-z\s]/g, '')) || null;

export const wordById = (id) => words.find((w) => w.id === id) || null;

/** Từ đến hạn ôn hôm nay (dùng cho phiên ôn tập). */
export const dueWords = () => words.filter((w) => w.srs.dueInDays <= 0);

export const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];
