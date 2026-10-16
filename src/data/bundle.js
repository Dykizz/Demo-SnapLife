/* ============================================================================
   SnapLife AI — Gói dữ liệu dùng chung cho mọi harness
   Owner: Lead.

   Vì sao có file này: trước đây `index.html` (src/app.js), `gallery.html`
   (src/gallery.js) và `tools/audit.js` mỗi nơi tự ghép một gói dữ liệu — và
   chúng lệch nhau (app.js thiếu `storyById`). Một nguồn duy nhất thì không
   thể lệch nữa.
   ========================================================================== */

import * as fixtures from './fixtures.js';
import * as words from './words.js';
import * as photos from './photos.js';
import * as story from './story.js';
import * as logic from './logic.js';

export const data = {
  ...fixtures,
  ...words,
  ...photos,
  ...logic,
  ...story,
  // Bí danh cho gọn ở chỗ gọi màn hình.
  story: story,
  stories: story.stories,
  hydrateStory: story.hydrateStory,
  storyById: story.storyById,
  parseStory: story.parseStory,
  englishRatio: story.englishRatio,
  collectEnglishWords: story.collectEnglishWords,
  speakingSample: story.speakingSample,
  userStoryDraft: story.userStoryDraft,
  sampleTopics: story.sampleTopics,
};

export default data;
