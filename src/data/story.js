/* ============================================================================
   SnapLife AI — Đoạn văn đan xen Việt–Anh
   Owner: Lead.
   Cú pháp: **từ tiếng Anh** được đánh dấu giữa văn bản tiếng Việt.
   `parseStory` biến chuỗi thô thành token để UI render và bắt sự kiện chạm.
   ========================================================================== */

/**
 * @typedef {{ type: 'vi'|'en', text: string }} Token
 */

/** Tách chuỗi thô thành mảng đoạn, mỗi đoạn là mảng token. */
export function parseStory(raw) {
  return String(raw)
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph
        .trim()
        .split(/(\*\*[^*]+\*\*)/g)
        .filter((chunk) => chunk.length > 0)
        .map((chunk) => {
          const isEn = /^\*\*[^*]+\*\*$/.test(chunk);
          return isEn
            ? { type: 'en', text: chunk.slice(2, -2) }
            : { type: 'vi', text: chunk };
        })
        .filter((tok) => tok.text.length > 0)
    );
}

/** Tỉ lệ token tiếng Anh — deck nói 15–20%, màn hình hiển thị con số thật. */
export function englishRatio(paragraphs) {
  let en = 0;
  let total = 0;
  for (const para of paragraphs) {
    for (const tok of para) {
      const n = tok.text.trim().split(/\s+/).filter(Boolean).length;
      total += n;
      if (tok.type === 'en') en += n;
    }
  }
  return total === 0 ? 0 : Math.round((en / total) * 100);
}

export function collectEnglishWords(paragraphs) {
  const set = [];
  for (const para of paragraphs) {
    for (const tok of para) if (tok.type === 'en' && !set.includes(tok.text)) set.push(tok.text);
  }
  return set;
}

/* --------------------------- Đoạn văn hôm nay --------------------------- */
/* Mật độ từ tiếng Anh được đo thật bằng englishRatio() và hiển thị lên màn reader,
   nên văn bản phải giữ đúng lời hứa 15–20% của deck — không phải nhãn in cứng. */
const TODAY_RAW = `
Sáng nay bước ra khỏi nhà, trời đổ một cơn **downpour** bất chợt. Phố đang **rush hour** nên rất **crowded**. Mình vội tìm chỗ **shelter** dưới **awning**, rồi đứng ngắm dòng người **commute** trong hối hả.

Vỉa hè biến thành những **puddle** phản chiếu ánh đèn. Ai cũng cầm **umbrella**, trông **soaked** và **groggy**. Không khí **humid** đến mức mình nghe được mùi mưa. Mưa chỉ còn là **drizzle**, mình **sip** một ngụm cà phê, và mọi thứ **faded** dần.

Về đến nhà, mình mở **notebook** ghi lại vài dòng. Chiếc **mug** đặt trên **windowsill**, lớp **ceramic** mát lạnh, vệt **glaze** chảy mềm. Ngoài **balcony**, tiếng mưa **linger** rất lâu. Chỉ là một **ritual** nhỏ thôi, mà ngày hôm đó nhẹ hẳn.

Sáng hôm sau, mình đeo **headphones** ngồi lại chỗ cũ. Cơn **downpour** đã đi qua, chỉ còn phố **crowded** của một ngày mới. Mình mở **notebook**, viết thêm vài từ, rồi **sip** cà phê. **Commute** hôm nay nhẹ hơn. Một **ritual** nhỏ, lặp lại mỗi sáng.
`.trim();

/* ---------------------- Đoạn văn mẫu cho màn "kể chuyện" ----------------- */
export const userStoryDraft = `Hôm nay mình dậy sớm, pha cà phê rồi ngồi cạnh cửa sổ. Trời mưa từ đêm nên phố vắng hơn mọi ngày. Mình đọc được mấy trang sách trước khi bắt đầu làm việc.`;

export const sampleTopics = [
  'Buổi sáng của tôi',
  'Trời mưa',
  'Cà phê',
  'Đi làm',
  'Góc làm việc',
];

/* ------------------------------ Truyện đã lưu ---------------------------- */
export const stories = [
  {
    id: 'today',
    title: 'Cơn mưa buổi sáng',
    date: 'Hôm nay',
    badge: 'Mới',
    cefr: 'B1',
    photoId: 'rainy-street',
    audioSeconds: 68,
    raw: TODAY_RAW,
  },
  {
    id: 'ceramic-cup',
    title: 'Chiếc ca ở phiên chợ gốm',
    date: 'Hôm qua',
    badge: '',
    cefr: 'B1',
    photoId: 'ceramic-cup',
    audioSeconds: 54,
    raw: `
Chiều qua mình ghé phiên chợ gốm cuối phố. Người bán bảo chiếc **mug** này làm bằng tay, nên lớp **glaze** không đều. Mình **sip** thử trà trong chiếc **ceramic** mới, nghe tiếng phố **crowded** ngoài kia, và thấy **groggy** vì cả ngày **commute**.

Mình thích cách lớp **glaze** mát khi chạm vào, và cách ánh sáng chiều **faded** phản chiếu trên **windowsill**. Ngoài **balcony**, mưa **drizzle** bắt đầu rơi. Mình pha cà phê trong **mug**, đeo **headphones**, và để mọi thứ **linger** thêm một lúc.

Tối đó mình ngồi im trên **balcony** với cuốn **notebook**. Không khí **humid**, vệt **glaze** trên ca vẫn còn ướt. Chỉ là một **ritual** nhỏ, nhưng ngày hôm đó **faded** đi rất nhẹ. Mình **sip** nốt ngụm trà cuối và **linger** thêm vài phút.
`.trim(),
  },
];

export const storyById = (id) => stories.find((s) => s.id === id) || stories[0];

/** Truyện đã phân tích sẵn — đối tượng mà màn reader dùng trực tiếp. */
export function hydrateStory(story) {
  const paragraphs = parseStory(story.raw);
  return {
    ...story,
    paragraphs,
    ratio: englishRatio(paragraphs),
    englishWords: collectEnglishWords(paragraphs),
  };
}

/** Người dùng nói gì / AI chỉnh lại gì (đúng ví dụ ở slide 06 của deck). */
export const speakingSample = {
  photoId: 'ceramic-cup',
  prompt: 'Nói một câu về chiếc ca trong ảnh của bạn',
  seconds: 6,
  transcript: 'I very like this cup because it make me happy every morning.',
  corrected: 'I really like this cup because it makes me happy every morning.',
  notes: [
    { from: 'very like', to: 'really like', why: '"very" không đi trực tiếp với động từ. Người bản ngữ dùng "really like", hoặc "like … very much".' },
    { from: 'make', to: 'makes', why: 'Chủ ngữ "it" là ngôi thứ ba số ít nên động từ phải thêm -s.' },
  ],
  newWords: [
    { id: 'groggy', en: 'groggy', note: 'bạn vừa dùng trong câu nói' },
    { id: 'ritual', en: 'ritual', note: 'có trong ngữ cảnh bạn kể' },
  ],
  score: { fluency: 72, grammar: 60, natural: 68 },
};
