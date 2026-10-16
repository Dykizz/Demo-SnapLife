/* ============================================================================
   SnapLife AI — Thư viện ảnh "của người dùng"
   Owner: Lead.
   Ảnh 1:1 (900×900) nên toạ độ % ánh xạ 1:1 lên khung hiển thị.
   Bbox dưới đây được suy ra bằng tools/detect_regions.py (mật độ cạnh) và
   đối chiếu với bố cục đã mô tả khi tạo ảnh — không phải số đoán bừa.
   Mỗi vùng = đúng một từ, đúng tinh thần slide 04 của deck.
   ========================================================================== */

export const photos = [
  {
    id: 'morning-desk',
    src: 'assets/photos/morning-desk.jpg',
    alt: 'Bàn cà phê buổi sáng: chiếc ca gốm, tai nghe và cuốn sổ',
    caption: 'Sáng nay, bàn làm việc cạnh cửa sổ',
    takenAt: 'Hôm nay · 07:42',
    regions: [
      { wordId: 'mug', x: 0, y: 61, w: 30, h: 28, source: 'ai', confidence: 0.96 },
      // `headphones` đã được siết lại theo số đo của nhóm B: vùng cũ 32×26% có mật
      // độ cạnh bên trong chỉ 0,70× trung bình ảnh (dễ ôm cả nền). Vùng 26×22% giữ
      // tâm trên blob mật độ mạnh nhất mà không lấn ra nền.
      { wordId: 'headphones', x: 55, y: 27, w: 26, h: 22, source: 'ai', confidence: 0.93 },
      { wordId: 'notebook', x: 45.5, y: 68, w: 34, h: 26, source: 'ai', confidence: 0.9 },
    ],
  },
  {
    id: 'rainy-street',
    src: 'assets/photos/rainy-street.jpg',
    alt: 'Phố mưa nhìn từ dưới mái hiên, người đi đường cầm ô',
    caption: 'Chiều qua, trú mưa trước hiên quán',
    takenAt: 'Hôm qua · 17:20',
    regions: [],
  },
  {
    id: 'ceramic-cup',
    src: 'assets/photos/ceramic-cup.jpg',
    alt: 'Chiếc ca gốm thủ công trên bệ cửa sổ',
    caption: 'Chiếc ca mới mua ở phiên chợ gốm',
    takenAt: 'Hôm qua · 09:05',
    regions: [],
  },
  {
    id: 'notebook-pen',
    src: 'assets/photos/notebook-pen.jpg',
    alt: 'Cuốn sổ mở trên bàn gỗ cùng bút máy và ly cà phê',
    caption: 'Bàn học buổi sáng',
    takenAt: '3 ngày trước',
    regions: [],
  },
  {
    id: 'balcony-plant',
    src: 'assets/photos/balcony-plant.jpg',
    alt: 'Ban công nhỏ với chậu cây và ghế xếp',
    caption: 'Góc ban công buổi chiều muộn',
    takenAt: '4 ngày trước',
    regions: [],
  },
];

export const photoById = (id) => photos.find((p) => p.id === id) || photos[0];

/** Vùng khoanh của một từ, tra theo wordId. */
export function regionFor(wordId, photoId = 'morning-desk') {
  const photo = photoById(photoId);
  return photo.regions.find((r) => r.wordId === wordId) || null;
}

export const photoLibrary = photos.map((p) => ({
  id: p.id,
  src: p.src,
  alt: p.alt,
  caption: p.caption,
  takenAt: p.takenAt,
}));
